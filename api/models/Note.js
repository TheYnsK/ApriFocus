const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    required: [true, "Not başlığı gereklidir."] 
  },
  content: { 
    type: String, 
    default: "" // React-Quill'den gelen HTML içeriği burada saklanacak
  },
  color: { 
    type: String, 
    default: "#ffffff" // Not kartının arka plan rengi (Pastel tonlar)
  },
  isPinned: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Kullanıcının notlarını hızlı çekmek için index
NoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);