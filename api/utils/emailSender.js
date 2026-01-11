const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Transporter Oluştur
  const transporter = nodemailer.createTransport({
    service: 'gmail', // veya kullandığın başka bir servis
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Mail Seçenekleri
  const mailOptions = {
    from: `"ApriFocus Asistan" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html, 
  };

  // 3. Gönder
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;