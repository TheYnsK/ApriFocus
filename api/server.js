const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// --- ROTA DOSYALARINI ÇAĞIR ---
const authRoutes = require('./routes/authRoutes'); 
const todoRoutes = require('./routes/todoRoutes');
const noteRoutes = require('./routes/noteRoutes'); // <-- BU SATIR EKSİKTİ VEYA HATALIYDI
const adminRoutes = require('./routes/adminRoutes'); // EKLE
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// --- DB BAĞLANTISI ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`🔌 Database Mode: Connected`);
    } catch (error) {
        console.error("MongoDB Bağlantı Hatası:", error);
        process.exit(1);
    }
};

// --- MIDDLEWARE ---
app.use(helmet());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS AYARLARI
app.use(cors({
    origin: ["http://localhost:5101", "http://localhost:5173", "http://127.0.0.1:5101"], 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// --- ROTALARIN TANIMLANMASI (Endpoints) ---
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notes', noteRoutes); // <-- BURASI ÇOK ÖNEMLİ (404 H ATASINI ÇÖZER)
app.use('/api/admin', adminRoutes); // <-- BU SATIRI EKLE
app.use('/api/feedbacks', feedbackRoutes);


// Test Rotası
app.get('/', (req, res) => {
    res.send('ApriFocus API Local Mode Çalışıyor 🚀');
});

// --- SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    connectDB();
    console.log(`✅ Local Server is running on: http://localhost:${PORT}`);
});