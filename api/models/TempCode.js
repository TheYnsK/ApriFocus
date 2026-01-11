const mongoose = require('mongoose');

const TempCodeSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true
  },
  code: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['REGISTER', 'FORGOT_PASSWORD'], 
    required: true 
  },
  // --- KESİN ÇÖZÜM: Kullanıcı Verilerini Tutacak Alan ---
  // Sadece REGISTER tipinde dolu olur.
  userData: {
    username: { type: String },
    password: { type: String } // Hashlenmiş şifre saklanır
  },
  
  // TTL (Time To Live): 2 Dakika sonra kendini imha eder
  expireAt: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '2m' } 
  }
}, { timestamps: true });

module.exports = mongoose.model('TempCode', TempCodeSchema);