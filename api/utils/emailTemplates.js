// ApriFocus E-posta Şablonları

// 1. Doğrulama Kodu Şablonu
const getVerificationEmail = (code) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 10px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4c1d95; margin: 0; font-size: 24px; font-weight: bold;">ApriFocus</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Potansiyelini Keşfet</p>
      </div>

      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1f2937; margin-top: 0; text-align: center;">Doğrulama Kodunuz</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; text-align: center;">
          Merhaba! ApriFocus'a hoş geldiniz. Hesabınızı doğrulamak için aşağıdaki kodu kullanın:
        </p>

        <div style="background-color: #f3f4f6; border: 2px dashed #4c1d95; color: #4c1d95; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px;">
          ${code}
        </div>

        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
          Bu kod <strong>2 dakika</strong> süreyle geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ApriFocus. Tüm hakları saklıdır.</p>
      </div>
    </div>
  `;
};

// 2. Şifre Sıfırlama Şablonu (İleride Kullanacağız)
const getPasswordResetEmail = (url) => {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4c1d95;">Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <a href="${url}" style="background-color: #4c1d95; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Şifremi Sıfırla</a>
      </div>
    `;
  };
  
  module.exports = {
    getVerificationEmail,
    getPasswordResetEmail
  };