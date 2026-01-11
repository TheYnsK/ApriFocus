const Todo = require('../models/Todo');
const User = require('../models/User');
const { createTodoSchema, updateTodoSchema } = require('../utils/validationSchemas');
const { z } = require('zod');
const logAction = require('../utils/logger');

const XP_RATES = { urgent: 50, important: 30, normal: 15, low: 5 };

// --- YARDIMCI: Alt Görevleri Akıllı Birleştir ---
const mergeSubtasks = (masterSubs, childSubs) => {
    const merged = masterSubs.map((mSub, index) => {
        const cSub = childSubs[index];
        if (cSub) {
            return {
                title: mSub.title, 
                isCompleted: cSub.isCompleted,
                _id: cSub._id 
            };
        }
        return mSub;
    });

    if (childSubs.length > masterSubs.length) {
        const extras = childSubs.slice(masterSubs.length);
        merged.push(...extras);
    }
    return merged;
};

// --- SENKRONİZASYON ---
const syncRoutineInstances = async (masterTodo, isCreation = false) => {
  if (!masterTodo.isRoutine || !masterTodo.dueDate) return;

  const masterDate = new Date(masterTodo.dueDate);
  
  if (isCreation) {
      masterTodo.originalDueDate = masterDate;
      await masterTodo.save();
  }

  const existingChildren = await Todo.find({ 
      masterRoutineId: masterTodo._id, 
      isMaster: false 
  });

  const childMap = new Map();
  existingChildren.forEach(child => {
      if(child.originalDueDate) {
          childMap.set(child.originalDueDate.toISOString().split('T')[0], child);
      }
  });

  const targetDates = [new Date(masterDate)];
  const year = masterDate.getFullYear();
  const month = masterDate.getMonth();
  let endDate;

  if (masterTodo.routineType === 'weekly') {
    const dayOfWeek = masterDate.getDay(); 
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endDate = new Date(masterDate);
    endDate.setDate(masterDate.getDate() + daysUntilSunday);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  }

  let cursor = new Date(masterDate);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= endDate) {
    if (masterTodo.routineType === 'monthly' && cursor.getMonth() !== month) break;
    if (masterTodo.routineDays && masterTodo.routineDays.includes(cursor.getDay())) {
        targetDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const processedIds = new Set();

  for (const dateVal of targetDates) {
      const dateKey = dateVal.toISOString().split('T')[0];
      const existingTask = childMap.get(dateKey);

      const newDateTime = new Date(dateVal);
      newDateTime.setHours(masterDate.getHours());
      newDateTime.setMinutes(masterDate.getMinutes());
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);

      if (existingTask) {
          processedIds.add(existingTask._id.toString());
          const mods = existingTask.modifiedFields || [];
          const updates = {};

          if(masterTodo.expireAt) updates.expireAt = masterTodo.expireAt;

          if (!mods.includes('content')) {
              updates.title = masterTodo.title;
              updates.description = masterTodo.description;
              updates.priority = masterTodo.priority;
              updates.imageUrl = masterTodo.imageUrl;
              updates.reminderTime = masterTodo.reminderTime;
          }

          if (!mods.includes('time')) {
              updates.dueDate = newDateTime; 
          }

          if (!mods.includes('subtasks_locked')) {
              updates.subtasks = mergeSubtasks(masterTodo.subtasks, existingTask.subtasks);
          }

          await Todo.findByIdAndUpdate(existingTask._id, updates);

      } else {
          const newTodo = new Todo({
              userId: masterTodo.userId,
              title: masterTodo.title,
              description: masterTodo.description,
              priority: masterTodo.priority,
              dueDate: newDateTime, 
              originalDueDate: newDateTime,
              imageUrl: masterTodo.imageUrl,
              isRoutine: true,
              isMaster: false, 
              masterRoutineId: masterTodo._id,
              reminderTime: masterTodo.reminderTime,
              subtasks: masterTodo.subtasks,
              routineType: masterTodo.routineType,
              isInstanceModified: false,
              modifiedFields: [],
              expireAt: masterTodo.expireAt
          });
          await newTodo.save();
      }
  }

  for (const child of existingChildren) {
      const isDateModified = child.modifiedFields?.includes('date') || child.isInstanceModified;
      if (!processedIds.has(child._id.toString()) && !isDateModified) {
          await Todo.findByIdAndDelete(child._id);
      }
  }
};

exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ 
        userId: req.user.id,
        isMaster: { $ne: true } 
    }).sort({ isPinned: -1, dueDate: 1 }).lean();
    
    const masters = await Todo.find({
        userId: req.user.id,
        isMaster: true
    }).lean();

    res.json([...todos, ...masters]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createTodo = async (req, res) => {
  try {
    const valData = createTodoSchema.parse(req.body);
    const parsedDueDate = valData.dueDate ? new Date(valData.dueDate) : null;
    const isRoutineBool = !!valData.isRoutine;

    if (parsedDueDate) {
        const now = new Date();
        if (parsedDueDate.getTime() < now.getTime() - 60000) { 
            return res.status(400).json({ message: "Geçmiş bir zamana görev oluşturulamaz!" });
        }
    }
    
    const currentUser = await User.findById(req.user.id);
    const userExpiration = currentUser?.expireAt || null;

    const newTodo = new Todo({
      userId: req.user.id,
      title: valData.title,
      description: valData.description,
      priority: valData.priority || 'normal',
      dueDate: parsedDueDate,
      originalDueDate: parsedDueDate,
      imageUrl: valData.imageUrl,
      reminderTime: valData.reminderTime || 0,
      subtasks: valData.subtasks || [],
      isRoutine: isRoutineBool,
      isMaster: isRoutineBool, 
      routineDays: isRoutineBool ? valData.routineDays || [] : [],
      routineType: valData.routineType || 'monthly',
      expireAt: userExpiration
    });

    const savedTodo = await newTodo.save();

    if (isRoutineBool && parsedDueDate) {
      await syncRoutineInstances(savedTodo, true);
    }

    res.status(201).json(savedTodo);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Validasyon Hatası", details: err.errors });
    res.status(500).json({ message: err.message });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const oldTodo = await Todo.findOne({ _id: todoId, userId: req.user.id });
    if (!oldTodo) return res.status(404).json({ message: 'Görev bulunamadı' });

    const updateData = { ...req.body };
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    if (updateData.dueDate) {
        const now = new Date();
        const oldDate = new Date(oldTodo.dueDate);
        const newDate = new Date(updateData.dueDate);

        if (oldDate.getTime() !== newDate.getTime() && newDate.getTime() < now.getTime() - 60000) {
             return res.status(400).json({ message: "Görevi geçmiş bir tarihe taşıyamazsınız." });
        }
    }

    if (!oldTodo.isMaster && oldTodo.isRoutine) {
        const mods = oldTodo.modifiedFields || [];
        if (updateData.dueDate) {
            const oldDate = new Date(oldTodo.dueDate);
            const newDate = new Date(updateData.dueDate);
            if (oldDate.getDate() !== newDate.getDate() || oldDate.getMonth() !== newDate.getMonth()) {
                if (!mods.includes('date')) mods.push('date');
                updateData.isInstanceModified = true; 
            }
        }
        if (updateData.title && updateData.title !== oldTodo.title) {
            if (!mods.includes('content')) mods.push('content');
        }
        updateData.modifiedFields = mods;
    }

    let xpChange = 0;
    const user = await User.findById(req.user.id);
    const currentXP = user.xp || 0; 
    
    const priority = updateData.priority || oldTodo.priority;
    const xpPerTask = XP_RATES[priority] || 15;

    if (req.body.status) {
        if (req.body.status === 'completed' && oldTodo.status !== 'completed') {
            if (oldTodo.isMaster) {
                const pendingChildrenCount = await Todo.countDocuments({ 
                    masterRoutineId: todoId, 
                    status: 'pending' 
                });
                xpChange += xpPerTask * (1 + pendingChildrenCount);
            } else {
                xpChange += xpPerTask;
            }
            updateData.xpGrantedAt = new Date();
        }
        else if (req.body.status !== 'completed' && oldTodo.status === 'completed') {
            if (oldTodo.isMaster) {
                const completedChildrenCount = await Todo.countDocuments({ 
                    masterRoutineId: todoId, 
                    status: 'completed'
                });
                xpChange -= xpPerTask * (1 + completedChildrenCount);
            } else {
                xpChange -= xpPerTask;
            }
            updateData.xpGrantedAt = null;
        }
    }

    if (xpChange !== 0) {
        const newTotalXP = Math.max(0, currentXP + xpChange);
        await User.findByIdAndUpdate(req.user.id, { xp: newTotalXP });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(todoId, updateData, { new: true });

    if (oldTodo.isMaster) {
        if (req.body.status) {
            await Todo.updateMany(
                { masterRoutineId: todoId },
                { status: req.body.status }
            );
        }
        await syncRoutineInstances(updatedTodo, false);
    }

    if (!oldTodo.isMaster && oldTodo.isRoutine && req.body.status) {
        const masterId = oldTodo.masterRoutineId;
        const allSiblings = await Todo.find({ masterRoutineId: masterId });
        const allCompleted = allSiblings.every(t => 
            (t._id.toString() === todoId ? req.body.status === 'completed' : t.status === 'completed')
        );
        await Todo.findByIdAndUpdate(masterId, { status: allCompleted ? 'completed' : 'pending' });
    }

    const finalUser = await User.findById(req.user.id);

    res.json({ 
        todo: updatedTodo, 
        userXP: finalUser.xp || 0,
        xpEarned: xpChange
    });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: "Görev bulunamadı." });

    const routineId = todo.masterRoutineId; 
    const isMaster = todo.isMaster;

    await Todo.findByIdAndDelete(req.params.id);

    if (routineId) {
        const remainingSiblings = await Todo.countDocuments({ masterRoutineId: routineId });
        if (remainingSiblings === 0) {
            await Todo.findByIdAndDelete(routineId);
        }
    }

    if (isMaster) {
        await Todo.deleteMany({ masterRoutineId: todo._id });
    }

    await logAction(req, "DELETE_TODO", `Görev silindi: ${todo.title}`);
    res.json({ message: "Görev silindi." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const todos = await Todo.find({ 
        userId: req.user.id, 
        isMaster: { $ne: true } 
    }).sort({ dueDate: 1 }).lean();
    res.json(todos);
  } catch (err) { res.status(500).json({ message: 'Takvim verisi alınamadı' }); }
};