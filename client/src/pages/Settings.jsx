import { useState, useContext, useRef } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { User, Bell, Shield, LogOut, Save, Loader2, Camera, CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react";

export default function Settings() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    generalNotifications: user?.preferences?.generalNotifications ?? true,
    taskNotifications: user?.preferences?.taskNotifications ?? true,
    notificationFrequency: user?.preferences?.notificationFrequency || 30
  });

  const showMessage = (type, text) => { setStatusMessage({ type, text }); setTimeout(() => setStatusMessage(null), 3000); };
  
  const handleImageUpload = (e) => { 
      const file = e.target.files[0]; 
      if (!file) return; 
      if (file.size > 2 * 1024 * 1024) { showMessage('error', "Lütfen 2MB'dan küçük bir resim seçin."); return; } 
      const reader = new FileReader(); 
      reader.readAsDataURL(file); 
      reader.onloadend = () => { setFormData(prev => ({ ...prev, avatar: reader.result })); }; 
  };
  
  const handleSave = async () => { 
      setLoading(true); setStatusMessage(null); 
      try { 
          const payload = { username: formData.username, avatar: formData.avatar, preferences: { generalNotifications: formData.generalNotifications, taskNotifications: formData.taskNotifications, notificationFrequency: parseInt(formData.notificationFrequency) } }; 
          const res = await api.put('/auth/update', payload); 
          updateUser(res.data); 
          showMessage('success', "Ayarlar başarıyla güncellendi!"); 
      } catch (error) { 
          const msg = error.response?.data?.message || "Hata oluştu."; showMessage('error', msg); 
      } finally { setLoading(false); } 
  };

  return (
    <div>
        <h3 className="text-3xl font-bold text-primary mb-6">Ayarlar</h3>

        <div className="grid gap-8 max-w-4xl">
          {statusMessage && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Profil Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {/* --- GÜNCELLEME: Avatar / Harf Mantığı --- */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {formData.avatar ? (
                    <img src={formData.avatar} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-4xl">
                        {formData.username.charAt(0).toUpperCase()}
                    </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">{formData.username}</h4>
              <p className="text-gray-500">{formData.email}</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <User size={20} className="text-primary" />
              <h4 className="font-bold text-lg">Hesap Bilgileri</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">E-posta</label>
                <input type="email" value={formData.email} disabled className="w-full p-3 bg-gray-100 text-gray-500 rounded-xl border cursor-not-allowed" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 border-b pb-2 pt-4">
              <Bell size={20} className="text-primary" />
              <h4 className="font-bold text-lg">Bildirim Ayarları</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-orange-500 shadow-sm"><Calendar size={20} /></div>
                  <div><p className="font-bold text-gray-700 text-sm md:text-base">Görev Hatırlatıcıları</p><p className="text-xs text-gray-500">Görev süresi yaklaştığında haber ver.</p></div>
                </div>
                <input type="checkbox" checked={formData.taskNotifications} onChange={(e) => setFormData({ ...formData, taskNotifications: e.target.checked })} className="w-6 h-6 accent-action cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-indigo-500 shadow-sm"><Clock size={20} /></div>
                  <div><p className="font-bold text-gray-700 text-sm md:text-base">Genel Odaklanma Uyarısı</p><p className="text-xs text-gray-500">Belirli aralıklarla çalışman gerektiğini hatırlat.</p></div>
                </div>
                <input type="checkbox" checked={formData.generalNotifications} onChange={(e) => setFormData({ ...formData, generalNotifications: e.target.checked })} className="w-6 h-6 accent-action cursor-pointer" />
              </div>

              {formData.generalNotifications && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl md:ml-4 animate-in fade-in">
                  <div><p className="font-bold text-indigo-900 text-sm">Sıklık Ayarı</p><p className="text-xs text-indigo-600">Kaç dakikada bir uyarı gelsin?</p></div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="120" value={formData.notificationFrequency} onChange={(e) => setFormData({ ...formData, notificationFrequency: e.target.value })} className="w-16 p-2 text-center font-bold rounded-lg border border-indigo-200 outline-none focus:border-action" />
                    <span className="text-sm font-bold text-indigo-400">dk</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Değişiklikleri Kaydet
              </button>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex justify-between items-center">
            <div className="flex items-center gap-3 text-red-800">
              <Shield size={24} />
              <div><h4 className="font-bold text-sm md:text-base">Oturumu Sonlandır</h4><p className="text-xs md:text-sm text-red-600/80">Cihazdan güvenli çıkış yap.</p></div>
            </div>
            <button onClick={logout} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2 text-sm md:text-base">
              <LogOut size={16} /> Çıkış
            </button>
          </div>
        </div>
    </div>
  );
}