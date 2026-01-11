import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, UserCircle, Target } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", formData);
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Giriş başarısız.");
    }
  };

  const handleGuestLogin = async () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
      const res = await api.post("/auth/guest-login");
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (error) {
      console.error(error);
      setError("Misafir girişi yapılamadı.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] relative overflow-hidden px-4">
      
      {/* Arkaplan Şekilleri (Süsleme) */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-action/10 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-[450px] border border-white relative z-10 transition-all">
        
        {/* Logo ve Başlık Alanı */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Target size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            APRI<span className="text-primary">FOCUS</span>
          </h1>
          <div className="h-1 w-12 bg-action rounded-full mt-1" />
          <p className="text-gray-500 font-medium mt-3 text-sm">Verimlilik yolculuğuna devam et.</p>
        </div>

        {/* Hata Mesajı Pop-up Tarzı */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="group space-y-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                name="email"
                placeholder="isim@ornek.com"
                className="w-full pl-12 pr-4 py-4 bg-gray-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 focus:outline-none transition-all text-gray-800 font-medium placeholder:text-gray-400"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Güvenlik Şifresi</label>
              <Link to="/forgot-password" size="sm" className="text-[11px] text-primary font-black hover:text-action transition-colors">
                ŞİFREMİ UNUTTUM
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-100/50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 focus:outline-none transition-all text-gray-800 font-medium placeholder:text-gray-400"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-indigo-700 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-[0_10px_20px_rgba(76,29,149,0.3)] hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            Sisteme Giriş Yap <ArrowRight size={18} />
          </button>
        </form>

        {/* Ayırıcı */}
        <div className="flex items-center gap-4 my-10 text-gray-300">
          <div className="h-[1px] flex-1 bg-gray-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Veya</span>
          <div className="h-[1px] flex-1 bg-gray-200" />
        </div>

        {/* Misafir Butonu */}
        <button
          onClick={handleGuestLogin}
          className="w-full bg-white border-2 border-slate-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-action/30 hover:text-action transition-all flex items-center justify-center gap-3 mb-8 shadow-sm group"
        >
          <UserCircle size={20} className="group-hover:scale-110 transition-transform" /> 
          <span className="text-sm">Misafir Olarak Dene</span>
        </button>

        {/* Kayıt Ol Linki */}
        <p className="text-center text-gray-500 text-sm font-medium">
          Henüz hesabın yok mu?{" "}
          <Link to="/register" className="text-action font-black hover:underline transition-all">
            Hemen Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}