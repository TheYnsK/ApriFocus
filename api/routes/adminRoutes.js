const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/login', adminController.adminLogin);
router.get('/announcement', adminController.getActiveAnnouncement);

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getSystemLogs);
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/full', adminController.getUserFullData);
router.put('/users/:id/ban', adminController.toggleBan);

router.post('/announcement', adminController.createAnnouncement);
router.get('/feedbacks', adminController.getFeedbacks);
router.put('/feedbacks/:id/read', adminController.markFeedbackRead); // EKLE
router.delete('/feedbacks/:id', adminController.deleteFeedback); // EKLE

module.exports = router;