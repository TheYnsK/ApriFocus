import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios"; 
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"; // ArrowLeft eklendi

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await api.post("/admin/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Giriş başarısız.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* GERİ DÖNÜŞ BUTONU (SOL ÜST) */}
      <button 
        onClick={() => navigate("/login")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors z-50 font-medium group"
      >
        <div className="p-2 bg-gray-800 rounded-full group-hover:bg-gray-700 transition-colors border border-gray-700">
            <ArrowLeft size={20} />
        </div>
        <span className="hidden sm:inline">Kullanıcı Girişine Dön</span>
      </button>

      {/* Arkaplan Efekti */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-gray-800/80 backdrop-blur-xl w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-700 relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 transform rotate-3">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-2">Yönetici Paneli</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Güvenli Erişim Kapısı</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">E-posta</label>
            <div className="relative group">
              <input 
                type="email" 
                className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:border-indigo-500 focus:bg-gray-900 transition-all placeholder:text-gray-600"
                placeholder="admin@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Shield size={18} className="absolute left-3.5 top-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Şifre</label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-xl px-4 py-3.5 pl-11 pr-11 focus:outline-none focus:border-indigo-500 focus:bg-gray-900 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={18} className="absolute left-3.5 top-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-4 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 mt-4"
          >
            SİSTEME GİRİŞ YAP
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-gray-700/50 pt-6">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold opacity-60">
                Yetkisiz girişler kaydedilmektedir
            </p>
        </div>

      </div>
    </div>
  );
}