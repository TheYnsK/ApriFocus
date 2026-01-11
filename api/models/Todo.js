const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
});

const TodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: [true, 'Lütfen bir başlık giriniz'] },
  description: { type: String, default: "" },
  isRoutine: { type: Boolean, default: false },
  priority: { type: String, enum: ['urgent', 'important', 'normal', 'low'], default: 'normal' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
  imageUrl: { type: String, default: "" }, 
  dueDate: { type: Date, index: true },
  originalDueDate: { type: Date, index: true },
  isPinned: { type: Boolean, default: false },
  reminderTime: { type: Number, default: 0 },
  xpGrantedAt: { type: Date, default: null },
  subtasks: [SubtaskSchema],
  isMaster: { type: Boolean, default: false, index: true },
  routineType: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
  masterRoutineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
  routineDays: { type: [Number], default: [] },
  modifiedFields: { type: [String], default: [] },  
  isInstanceModified: { type: Boolean, default: false },
  expireAt: { type: Date, default: null, index: { expireAfterSeconds: 0 } }

}, { timestamps: true });

TodoSchema.index({ userId: 1, dueDate: 1 });
TodoSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Todo', TodoSchema);