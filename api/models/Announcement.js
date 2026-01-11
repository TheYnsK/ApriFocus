const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'danger'], 
    default: 'info' 
  },
  isActive: { type: Boolean, default: true }, // Yayında mı?
  createdBy: { type: String, default: "Admin" }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);