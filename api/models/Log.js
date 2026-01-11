const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Misafir veya Sistem işlemleri için null olabilir
  },
  username: { 
    type: String, 
    default: "System" 
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guest', 'system'],
    default: 'user'
  },
  action: { 
    type: String, 
    required: true // Örn: "CREATE_NOTE", "DELETE_TODO", "LOGIN_SUCCESS"
  },
  details: { 
    type: String, // İsteğe bağlı detay (Örn: "Todo ID: 123 silindi")
    default: ""
  },
  ipAddress: { 
    type: String 
  },
  // TTL (Time To Live): 30 Gün sonra loglar otomatik silinir (DB şişmesin diye)
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '30d' } 
  }
});

module.exports = mongoose.model('Log', LogSchema);