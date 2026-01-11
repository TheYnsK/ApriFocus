const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ROUTES
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');
const noteRoutes = require('./routes/noteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

/* ======================
   VERCEL + SECURITY
====================== */
app.set('trust proxy', 1);
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ======================
   MONGODB CONNECTION
====================== */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    throw err;
  }
};

// DB middleware (Vercel serverless uyumlu)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* ======================
   API ROUTES
====================== */
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedbacks', feedbackRoutes);

/* ======================
   HEALTH CHECK
====================== */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: "ApriFocus API",
    env: process.env.NODE_ENV || "development"
  });
});

/* ======================
   LOCAL SERVER (DEV)
====================== */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Local API running at http://localhost:${PORT}`);
  });
}

// Vercel için handler export (TEK)
module.exports = (req, res) => app(req, res);
