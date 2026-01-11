const User = require('../models/User');
const Todo = require('../models/Todo');
const Note = require('../models/Note');
const Log = require('../models/Log');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/logger'); 
const bcrypt = require('bcryptjs');

// 1. ADMIN GİRİŞİ
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { id: 'admin_001', role: 'admin', username: 'SuperAdmin' },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        await logAction({ user: { username: 'SuperAdmin', role: 'admin' } }, "ADMIN_LOGIN", "Yönetici girişi yapıldı.");
        return res.json({ token, message: "Hoşgeldin Patron" });
    }
    return res.status(401).json({ message: "Hatalı yönetici bilgileri." });
};

// 2. DASHBOARD İSTATİSTİKLERİ
exports.getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: 'user' });
        const todoCount = await Todo.countDocuments();
        const noteCount = await Note.countDocuments();
        const feedbackCount = await Feedback.countDocuments({ isRead: false });
        res.json({ userCount, todoCount, noteCount, feedbackCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. KULLANICI YÖNETİMİ
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// BANLAMA / BAN AÇMA
exports.toggleBan = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        user.isBanned = !user.isBanned;
        await user.save();
        const action = user.isBanned ? "USER_BANNED" : "USER_UNBANNED";
        await logAction(req, action, `Kullanıcı: ${user.email}`);
        res.json({ message: `Kullanıcı ${user.isBanned ? 'banlandı' : 'banı açıldı'}.`, isBanned: user.isBanned });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ADMIN NOTU EKLEME
exports.updateAdminNote = async (req, res) => {
    try {
        const { note } = req.body;
        await User.findByIdAndUpdate(req.params.id, { adminNotes: note });
        res.json({ message: "Yönetici notu güncellendi." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// duyuru
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        await Announcement.updateMany({}, { isActive: false });
        const newAnn = await Announcement.create({ title, message, type });
        
        // Loglama yaparken req objesini gönderiyoruz, logger artık güvenli
        await logAction(req, "BROADCAST_SENT", `Duyuru yayınlandı: ${title}`);
        
        res.status(201).json(newAnn);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// AKTİF DUYURU
exports.getActiveAnnouncement = async (req, res) => {
    try {
        const ann = await Announcement.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.json(ann);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 5. LOGLARI İZLEME
exports.getSystemLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 6. GERİ BİLDİRİMLERİ OKUMA
exports.getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 7. KULLANICIYI VE TÜM VERİLERİNİ SİL (HARD DELETE)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        await Note.deleteMany({ userId: userId });
        await Todo.deleteMany({ userId: userId });
        await Feedback.deleteMany({ userId: userId });
        await User.findByIdAndDelete(userId);
        await logAction(req, "USER_DELETED_PERMANENTLY", `Silinen: ${user.email} (ID: ${userId})`);
        res.json({ message: "Kullanıcı ve tüm verileri kalıcı olarak silindi." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Silme hatası: " + err.message });
    }
};

// 8. KULLANICI GÜNCELLE
exports.updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.email) {
            const existingUser = await User.findOne({ email: updateData.email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: "Bu e-posta kullanımda." });
            }
        }
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        await logAction(req, "USER_UPDATED_BY_ADMIN", `Admin güncelledi: ${updatedUser.email}`);
        res.json({ message: "Kullanıcı güncellendi.", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 9. KULLANICININ TÜM DETAYLARINI GETİR
exports.getUserFullData = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        const notes = await Note.find({ userId }).sort({ createdAt: -1 });
        const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
        res.json({ user, notes, todos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 10. ADMIN TARAFINDAN KULLANICI OLUŞTURMA (Doğrulamasız)
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: "Lütfen tüm alanları doldurun." });
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: "Bu kullanıcı adı veya e-posta zaten kullanımda." });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword, role: role || 'user', isVerified: true, isBanned: false });
        await newUser.save();
        await logAction(req, "USER_CREATED_BY_ADMIN", `Admin oluşturdu: ${username} (${email})`);
        res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu.", user: newUser });
    } catch (err) {
        res.status(500).json({ message: "Kullanıcı oluşturulurken hata çıktı: " + err.message });
    }
};

// Geri bildirimi okundu işaretle
exports.markFeedbackRead = async (req, res) => {
    try {
        await Feedback.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Okundu işaretlendi." });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Geri bildirimi sil
exports.deleteFeedback = async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: "Geri bildirim silindi." });
    } catch (err) { res.status(500).json({ message: err.message }); }
};