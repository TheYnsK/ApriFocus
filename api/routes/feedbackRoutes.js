const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// Sadece giriş yapmış kullanıcılar gönderebilir
router.post('/', authMiddleware, feedbackController.sendFeedback);

module.exports = router;