const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'guest'], 
    default: 'user' 
  },
  // --- EKSİK OLAN XP ALANLARI EKLENDİ ---
  xp: { 
    type: Number, 
    default: 0 
  },
  level: {
    type: Number,
    default: 1
  },
  // --------------------------------------
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  avatar: { 
    type: String, 
    default: null
  },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  expireAt: { 
    type: Date, 
    default: null, 
    index: { expires: 0 } 
  },
  // --- YENİ EKLENENLER ---
  isBanned: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    default: "" // Sadece adminin göreceği notlar
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);