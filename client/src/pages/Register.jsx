import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, ArrowRight, Target } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const passwordRules = [
    { label: "En az 6 karakter", valid: formData.password.length >= 6 },
  ];

  const isPasswordValid = passwordRules.every(r => r.valid);

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Kullanıcı adı gereklidir.";
    if (!formData.email.trim()) newErrors.email = "E-posta adresi gereklidir.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Geçerli bir e-posta adresi girin.";
    
    if (!formData.password) {
        newErrors.password = "Şifre gereklidir.";
    } else if (!isPasswordValid) {
        newErrors.password = "Şifreniz gereksinimleri karşılamıyor.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => { 
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if (errors[e.target.name]) {
          setErrors(prev => ({...prev, [e.target.name]: null}));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await api.post("/auth/register", formData);
      if (res.data.token && res.data.user) {
          login(res.data.user, res.data.token);
          navigate("/");
      } else {
          navigate("/login");
      }
    } catch (error) {
      console.error(error);
      if (error.response?.data?.message) {
          setErrors({ general: error.response.data.message });
      } else if (error.response?.data?.details) {
          const apiErrors = {};
          error.response.data.details.forEach(err => {
              apiErrors[err.path[0]] = err.message;
          });
          setErrors(apiErrors);
      } else {
          setErrors({ general: "Sunucu hatası. Lütfen tekrar deneyin." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] relative overflow-hidden px-4">
      
      {/* Arkaplan Dekoratif Küreler */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-action/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-[480px] border border-white relative z-10 transition-all">
        
        {/* Logo ve Başlık */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Target size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
            APRI<span className="text-primary">FOCUS</span>
          </h1>
          <div className="h-1 w-10 bg-action rounded-full mt-1" />
          <p className="text-gray-500 font-medium mt-3 text-sm text-center">
            Yeni bir başlangıç için aramıza katıl.
          </p>
        </div>

        {/* Hata Bildirimi */}
        {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-bold animate-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                <AlertTriangle size={18} />
                {errors.general}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Kullanıcı Adı */}
            <div className="group space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.username ? "text-red-400" : "text-gray-400 group-focus-within:text-primary"}`} size={18} />
                    <input 
                        type="text" 
                        name="username" 
                        placeholder="Örn: aprifocus_user" 
                        className={`w-full pl-12 pr-4 py-4 bg-gray-100/50 border rounded-2xl outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white ${errors.username ? "border-red-300" : "border-transparent focus:border-primary/30"}`} 
                        onChange={handleChange} 
                        value={formData.username}
                    />
                </div>
                {errors.username && <p className="text-red-500 text-[10px] font-black mt-1 ml-2 uppercase">{errors.username}</p>}
            </div>

            {/* E-posta */}
            <div className="group space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
                <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? "text-red-400" : "text-gray-400 group-focus-within:text-primary"}`} size={18} />
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="isim@ornek.com" 
                        className={`w-full pl-12 pr-4 py-4 bg-gray-100/50 border rounded-2xl outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white ${errors.email ? "border-red-300" : "border-transparent focus:border-primary/30"}`} 
                        onChange={handleChange} 
                        value={formData.email}
                    />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-black mt-1 ml-2 uppercase">{errors.email}</p>}
            </div>

            {/* Şifre */}
            <div className="group space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Güvenlik Şifresi</label>
                <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-primary"}`} size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="••••••••" 
                        className={`w-full pl-12 pr-12 py-4 bg-gray-100/50 border rounded-2xl outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white ${errors.password ? "border-red-300" : "border-transparent focus:border-primary/30"}`} 
                        onChange={handleChange} 
                        value={formData.password}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                {/* Şifre Gereksinimleri */}
                <div className="mt-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 backdrop-blur-sm">
                    <div className="space-y-1.5">
                        {passwordRules.map((rule, idx) => (
                            <div key={idx} className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${rule.valid ? "text-green-600" : "text-gray-400"}`}>
                                {rule.valid ? <CheckCircle size={14} className="text-green-500" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200" />}
                                <span className={rule.valid ? "line-through opacity-60" : ""}>{rule.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] font-black mt-1 ml-2 uppercase">{errors.password}</p>}
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-primary to-indigo-700 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-[0_10px_20px_rgba(76,29,149,0.3)] hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Hesabımı Oluştur <ArrowRight size={18} /></>}
            </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
            Zaten hesabın var mı? <Link to="/login" className="text-primary font-black hover:underline transition-all">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
}