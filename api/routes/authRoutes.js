const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// İki Aşamalı Kayıt Sistemi
router.post('/register-request', authController.registerRequest); // Adım 1
router.post('/verify-register', authController.verifyRegister);   // Adım 2

// Giriş İşlemleri
router.post('/login', authController.login);
router.post('/guest-login', authController.guestLogin);

// Şifre Sıfırlama (YENİ)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Profil Güncelleme (Token Gerekli)
router.put('/update', auth, authController.updateUser);

module.exports = router;