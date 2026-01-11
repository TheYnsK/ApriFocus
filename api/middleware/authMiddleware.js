const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: "Erişim reddedildi. Token yok." });
    }

    const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;
    
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    req.user = decoded; 
    
    next();
  } catch (err) {
    console.error("Auth Middleware Hatası:", err.message);
    res.status(401).json({ message: "Geçersiz Token." });
  }
};