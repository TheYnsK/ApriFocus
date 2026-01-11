const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Kullanıcı adı ve maili snapshot olarak tutuyoruz.
  // Kullanıcı silinse bile geri bildirimin kimden geldiği kaybolmasın.
  senderInfo: {
    username: String,
    email: String
  },
  subject: { 
    type: String, 
    required: [true, "Konu başlığı gereklidir."] 
  },
  message: { 
    type: String, 
    required: [true, "Mesaj içeriği gereklidir."] 
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'general'],
    default: 'general'
  },
  isRead: { 
    type: Boolean, 
    default: false // Admin okudu mu?
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);