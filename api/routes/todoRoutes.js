const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const auth = require('../middleware/authMiddleware'); // <-- BU ÇOK ÖNEMLİ

// Tüm Todo rotalarını 'auth' ile korumaya alıyoruz.
// Böylece controller içinde 'req.user' kullanabiliriz.
router.use(auth);

// --- GET İşlemleri ---
router.get('/', todoController.getTodos); // Listeyi Getir
router.get('/calendar', todoController.getCalendarEvents); // Takvim Verisi

// --- POST/PUT/DELETE İşlemleri ---
router.post('/', todoController.createTodo); // Yeni Görev
router.put('/:id', todoController.updateTodo); // Güncelle (Tamamla, Düzenle)
router.delete('/:id', todoController.deleteTodo); // Sil

module.exports = router;