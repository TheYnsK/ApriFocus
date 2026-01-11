const User = require('../models/User');
const TempCode = require('../models/TempCode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailSender');
const { getVerificationEmail } = require('../utils/emailTemplates');
const { registerSchema, loginSchema } = require('../utils/validationSchemas');
const { pickAllowed, ALLOWED_USER_FIELDS } = require('../utils/dataFilter');
const { z } = require('zod');
const logAction = require('../utils/logger'); // Loglama eklendi

// 8 Haneli Kod Üretici
const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// 1. KAYIT İSTEĞİ
exports.registerRequest = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password } = validatedData;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).json({ message: "Bu e-posta veya kullanıcı adı zaten kullanımda." });
    }

    await TempCode.deleteMany({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateCode();

    const newTemp = new TempCode({
        email,
        code: verificationCode,
        type: 'REGISTER',
        userData: {
            username,
            password: hashedPassword
        }
    });
    
    await newTemp.save();

    const emailHtml = getVerificationEmail(verificationCode);
    await sendEmail({
        email,
        subject: 'ApriFocus - Doğrulama Kodunuz',
        html: emailHtml
    });

    res.status(200).json({ message: "Doğrulama kodu e-posta adresinize gönderildi." });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validasyon Hatası", details: error.errors });
    }
    console.error("Register Request Error:", error);
    res.status(500).json({ message: "Sunucu hatası: İşlem gerçekleştirilemedi." });
  }
};

// 2. KAYIT ONAYI
exports.verifyRegister = async (req, res) => {
    try {
        const { email, code } = req.body;

        const record = await TempCode.findOneAndDelete({ email, code, type: 'REGISTER' });
        
        if (!record) {
            return res.status(400).json({ message: "Geçersiz veya süresi dolmuş kod." });
        }

        const { username, password } = record.userData;

        const newUser = new User({
            username,
            email,
            password, 
            isVerified: true,
            role: 'user'
        });

        await newUser.save();
        await logAction({ user: newUser }, "REGISTER_SUCCESS", "Yeni üye kaydı");

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "7d" } 
        );

        res.status(201).json({
            message: "Hesap başarıyla oluşturuldu.",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                preferences: newUser.preferences
            }
        });

    } catch (error) {
        console.error("Verify Register Error:", error);
        res.status(500).json({ message: "Sunucu hatası: " + error.message });
    }
};

// GİRİŞ
exports.login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    // --- BAN KONTROLÜ EKLENDİ ---
    if (user.isBanned) {
        return res.status(403).json({ 
            message: "Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin." 
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Geçersiz şifre." });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" } 
    );
    
    await logAction({ user }, "LOGIN_SUCCESS", "Giriş yapıldı");

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        xp: user.xp || 0
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validasyon Hatası", details: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// MİSAFİR GİRİŞİ
exports.guestLogin = async (req, res) => {
    for (let i = 0; i < 3; i++) {
        try {
            const randomString = crypto.randomBytes(16).toString('hex');
            const username = `Guest_${randomString.slice(0, 10)}`;
            const email = `guest_${randomString}@temp.com`;
            
            const randomPassword = crypto.randomBytes(12).toString('base64');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            
            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 10); 

            const newGuest = new User({
                username,
                email,
                password: hashedPassword,
                role: 'guest',
                expireAt: expirationDate,
                isVerified: true
            });

            await newGuest.save();
            await logAction({ user: newGuest }, "GUEST_LOGIN", "Misafir girişi");

            const token = jwt.sign(
                { id: newGuest._id, role: 'guest' }, 
                process.env.JWT_SECRET, 
                { expiresIn: "10m" } 
            );

            return res.status(200).json({
                token,
                user: {
                    id: newGuest._id,
                    username: newGuest.username,
                    role: 'guest',
                    expiresIn: expirationDate,
                    xp: 0
                }
            });

        } catch (error) {
            if (error.code === 11000) {
                if (i === 2) return res.status(500).json({ message: "Misafir hesabı oluşturulamadı." });
                continue; 
            }
            return res.status(500).json({ message: error.message });
        }
    }
};

// PROFİL GÜNCELLEME
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = pickAllowed(req.body, ALLOWED_USER_FIELDS); 

    if (updateData.username) {
        const existingUser = await User.findOne({ username: updateData.username });
        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
        }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData }, 
      { new: true, runValidators: true } 
    ).select('-password');

    res.json(updatedUser);

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
};

// --- ŞİFRE SIFIRLAMA (YENİ EKLENEN KISIMLAR) ---

// 1. Kod İste (Forgot Password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });

    await TempCode.deleteMany({ email });

    const code = generateCode();
    
    await TempCode.create({
      email,
      code,
      type: 'FORGOT_PASSWORD'
    });

    // Loglama
    await logAction({ body: { email } }, "FORGOT_PASS_REQUEST", "Şifre sıfırlama kodu istendi");

    // E-posta gönder
    const emailHtml = getVerificationEmail(code); 
    await sendEmail({
        email,
        subject: 'ApriFocus - Şifre Sıfırlama Kodu',
        html: emailHtml
    });

    res.json({ message: "Sıfırlama kodu e-posta adresinize gönderildi." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "İşlem başarısız." });
  }
};

// 2. Şifreyi Değiştir (Reset Password)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const record = await TempCode.findOneAndDelete({ email, code, type: 'FORGOT_PASSWORD' });
    if (!record) return res.status(400).json({ message: "Geçersiz veya süresi dolmuş kod." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    await logAction({ body: { email } }, "PASSWORD_RESET_SUCCESS", "Şifre başarıyla değiştirildi");

    res.json({ message: "Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Şifre değiştirilemedi." });
  }
};