const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Token authMiddleware'den zaten kontrol edildi ve req.user'a atandı
  // Biz sadece rolüne bakacağız.
  
  if (req.user && req.user.role === 'admin') {
    next(); // Geç, sen patronsun.
  } else {
    return res.status(403).json({ message: "Erişim reddedildi. Yönetici izni gerekli." });
  }
};