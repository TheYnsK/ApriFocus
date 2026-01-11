const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Geri Bildirim Gönder
exports.sendFeedback = async (req, res) => {
  try {
    const { subject, message, type } = req.body;
    const userId = req.user.id;

    // Kullanıcı bilgilerini al (Snapshot için)
    const user = await User.findById(userId);

    const newFeedback = new Feedback({
      userId,
      senderInfo: {
        username: user.username,
        email: user.email
      },
      subject,
      message,
      type: type || 'general'
    });

    await newFeedback.save();

    res.status(201).json({ message: "Geri bildiriminiz iletildi. Teşekkürler!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Geri bildirim gönderilemedi." });
  }
};