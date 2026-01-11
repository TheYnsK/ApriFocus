const Note = require('../models/Note');
const logAction = require('../utils/logger');

// Notları Getir
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
                            .sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Not Oluştur
exports.createNote = async (req, res) => {
  try {
    const { title, content, color, isPinned } = req.body;

    const newNote = new Note({
      userId: req.user.id,
      title,
      content,
      color,
      isPinned
    });

    await newNote.save();
    
    // LOGLAMA
    await logAction(req, "CREATE_NOTE", `Not Eklendi: ${title}`);

    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: "Not oluşturulamadı." });
  }
};

// Not Güncelle
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Not bulunamadı." });

    // LOGLAMA (Sadece önemli güncellemelerde log şişmesin diye başlık değişimi vs loglanabilir)
    // await logAction(req, "UPDATE_NOTE", `Not Güncellendi ID: ${note._id}`);

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Not Sil
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: "Not bulunamadı." });

    // LOGLAMA
    await logAction(req, "DELETE_NOTE", `Not Silindi: ${note.title}`);

    res.json({ message: "Not silindi." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};