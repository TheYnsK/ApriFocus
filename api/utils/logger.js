const Log = require('../models/Log');
const mongoose = require('mongoose');

const logAction = async (req, action, details = "") => {
  try {
    const user = req.user || {};
    const body = req.body || {};
    const headers = req.headers || {};
    const socket = req.socket || {};

    // ID'nin geçerli bir MongoDB ObjectId olup olmadığını kontrol et
    // admin_001 gibi değerler valid değildir, bu yüzden patlıyordu.
    let userId = null;
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      userId = user.id;
    }

    // Detaylı Kullanıcı Tanımlama
    const username = user.username ? `${user.username} (${user.email || 'Admin'})` : (body.email || "GUEST_USER");
    
    // Güvenli IP Çekme
    const ipAddress = headers['x-forwarded-for'] || socket.remoteAddress || '0.0.0.0';

    await Log.create({
      userId: userId, // Geçersizse null gider, hata vermez
      username,
      action,
      details: `${details} | Device: ${headers['user-agent']?.slice(0, 50) || 'Unknown'}`,
      ipAddress,
      role: user.role || 'guest'
    });
  } catch (err) {
    // Loglama hatası ana akışı bozmasın
    console.error("Log error (Handled):", err.message);
  }
};

module.exports = logAction;