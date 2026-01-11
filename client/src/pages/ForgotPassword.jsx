import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // ADIM 1: KOD GÖNDER
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(2);
      setSuccess("Doğrulama kodu e-posta adresinize gönderildi.");
    } catch (err) {
      setError(err.response?.data?.message || "Hata oluştu.");
    } finally { setLoading(false); }
  };

  // ADIM 2: ŞİFRE SIFIRLA
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Şifreler eşleşmiyor!"); return; }
    if (newPassword.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }

    setLoading(true); setError(null);
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      setSuccess("Şifreniz başarıyla değiştirildi! Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Sıfırlama başarısız.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        
        <Link to="/login" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft size={24} />
        </Link>

        <div className="text-center mb-8 mt-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Şifremi Unuttum</h1>
            <p className="text-gray-500 text-sm mt-2">
                {step === 1 ? "Hesabını kurtarmak için e-posta adresini gir." : "E-postana gelen kodu ve yeni şifreni gir."}
            </p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-pulse">
                <AlertTriangle size={20} /> {error}
            </div>
        )}
        
        {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 text-sm font-bold">
                <CheckCircle size={20} /> {success}
            </div>
        )}

        {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-6">
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={20} />
                    <input type="email" placeholder="E-posta Adresi" required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-all font-medium"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-opacity-90 shadow-lg shadow-primary/30">
                    {loading ? <Loader2 className="animate-spin" /> : <>Kod Gönder <ArrowRight size={20} /></>}
                </button>
            </form>
        ) : (
            <form onSubmit={handleReset} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={20} />
                    <input type="text" placeholder="Doğrulama Kodu (8 Hane)" required maxLength={8}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-all font-bold tracking-widest uppercase text-center"
                        value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                </div>
                
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={20} />
                    <input type="password" placeholder="Yeni Şifre" required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-all font-medium"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={20} />
                    <input type="password" placeholder="Şifreyi Onayla" required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-all font-medium"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-600/30">
                    {loading ? <Loader2 className="animate-spin" /> : <>Şifreyi Değiştir <CheckCircle size={20} /></>}
                </button>
            </form>
        )}
      </div>
    </div>
  );
}