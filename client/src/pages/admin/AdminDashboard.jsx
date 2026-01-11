import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  Users, FileText, Activity, LogOut, Search, Trash2, Edit, Ban, 
  CheckCircle, MessageSquare, Megaphone, X, Eye, Save, Calendar, 
  StickyNote, ShieldCheck, UserPlus, Lock, Clock, Mail, Menu, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ userCount: 0, todoCount: 0, noteCount: 0, feedbackCount: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // POPUP (TOAST) SİSTEMİ
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", type: "info" });
  const [detailUser, setDetailUser] = useState(null); 
  const [detailData, setDetailData] = useState({ notes: [], todos: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "", avatar: "", role: "user" });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", email: "", password: "", role: "user" });

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/admin");
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, logsRes, feedbackRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/logs"),
          api.get("/admin/feedbacks")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (err) {
      if(err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkRead = async (id) => {
    try { 
        await api.put(`/admin/feedbacks/${id}/read`); 
        showToast("Okundu olarak işaretlendi");
        fetchData(); 
    } catch (err) { console.error(err); }
  };

  // GERİ BİLDİRİM SİLME (ALERT TAMAMEN KALDIRILDI)
  const handleDeleteFeedback = async (id) => {
    try { 
        await api.delete(`/admin/feedbacks/${id}`); 
        showToast("Geri bildirim başarıyla silindi", "error"); // Bizim Popup
        fetchData(); 
    } catch (err) { 
        console.error(err);
        showToast("Silme işlemi başarısız", "error");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
        await api.post("/admin/users", createForm);
        showToast("Yeni kullanıcı başarıyla oluşturuldu");
        setIsCreateModalOpen(false);
        setCreateForm({ username: "", email: "", password: "", role: "user" });
        fetchData();
    } catch (err) { 
        console.error(err);
        showToast(err.response?.data?.message || "Oluşturma hatası", "error");
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) return showToast("Lütfen tüm alanları doldurun", "error");
    try {
        await api.post("/admin/announcement", announcementForm);
        showToast("Duyuru başarıyla yayınlandı");
        setAnnouncementForm({ title: "", message: "", type: "info" });
    } catch (err) { 
        console.error(err);
        showToast("Duyuru gönderilemedi", "error");
    }
  };

  const openDetailModal = async (user) => {
    setDetailUser(user);
    setEditForm({ username: user.username, email: user.email, avatar: user.avatar || "", role: user.role });
    setDetailLoading(true);
    try {
        const res = await api.get(`/admin/users/${user._id}/full`);
        setDetailData({ notes: res.data.notes, todos: res.data.todos });
    } catch (err) { console.error(err); } finally { setDetailLoading(false); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/admin/users/${detailUser._id}`, editForm);
        showToast("Kullanıcı bilgileri güncellendi");
        fetchData(); setDetailUser({ ...detailUser, ...editForm });
    } catch (err) { console.error(err); showToast("Güncelleme başarısız", "error"); }
  };

  const handleBanUser = async (id) => {
    try { 
        await api.put(`/admin/users/${id}/ban`); 
        showToast("Kullanıcı durumu değiştirildi");
        fetchData(); 
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("DİKKAT: Kullanıcı ve tüm verileri silinecek! Onaylıyor musun?")) return;
    try { 
        await api.delete(`/admin/users/${id}`); 
        showToast("Kullanıcı sistemden tamamen silindi", "error");
        fetchData(); if(detailUser?._id === id) setDetailUser(null); 
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-black text-indigo-500 flex items-center justify-center font-mono tracking-widest uppercase">SİSTEM_YÜKLENİYOR...</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 flex font-sans relative overflow-hidden">
      
      {/* TOAST NOTIFICATION POPUP */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right duration-300 ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'}`}>
          {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-[60] w-72 bg-gray-900 border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"><ShieldCheck size={24} className="text-white" /></div>
             <h1 className="text-xl font-black text-white tracking-tighter">APRIFOCUS</h1>
          </div>
          <button className="lg:hidden p-2 text-gray-400" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>
        <nav className="flex-1 p-6 space-y-1">
            {[ { id: 'overview', label: 'Genel Bakış', icon: Activity }, { id: 'users', label: 'Kullanıcılar', icon: Users }, { id: 'logs', label: 'Sistem Kayıtları', icon: FileText }, { id: 'feedback', label: 'Geri Bildirimler', icon: MessageSquare }].map(item => (
             <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}`}>
                <item.icon size={18} /> <span className="text-sm font-bold tracking-tight">{item.label}</span>
             </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 font-bold text-sm py-3 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={16} /> Çıkış Yap</button></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto h-screen relative custom-scrollbar">
        <div className="lg:hidden p-4 bg-gray-900 border-b border-white/5 flex justify-between items-center sticky top-0 z-40">
            <h1 className="font-bold text-indigo-500 tracking-tighter">APRIFOCUS</h1>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-800 rounded-lg text-white"><Menu size={24}/></button>
        </div>

        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
            {activeTab === "overview" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Dashboard</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[ { l: 'Üye Sayısı', v: stats.userCount, c: 'text-indigo-500' }, { l: 'Görevler', v: stats.todoCount, c: 'text-purple-500' }, { l: 'Notlar', v: stats.noteCount, c: 'text-emerald-500' }, { l: 'Gelen Mesaj', v: feedbacks.length, c: 'text-orange-500' } ].map((s, i) => (
                            <div key={i} className="bg-gray-900/50 border border-white/5 p-4 md:p-6 rounded-3xl backdrop-blur-sm">
                                <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">{s.l}</p>
                                <p className={`text-2xl md:text-4xl font-black ${s.c}`}>{s.v}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-indigo-600/5 border border-indigo-500/20 p-6 md:p-8 rounded-3xl space-y-4">
                        <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2"><Megaphone size={20}/> Global Duyuru Gönder</h3>
                        <input type="text" placeholder="Duyuru Başlığı..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} />
                        <textarea placeholder="Duyuru mesajını buraya yazın..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white h-24 outline-none focus:border-indigo-500" value={announcementForm.message} onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})} />
                        <button onClick={handleSendAnnouncement} className="bg-indigo-600 hover:bg-indigo-700 w-full py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all shadow-lg">Yayınla</button>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="animate-in fade-in duration-500 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Kullanıcı Yönetimi</h2>
                        <div className="flex gap-2">
                            <div className="relative"><Search size={14} className="absolute left-3 top-3 text-gray-500"/><input type="text" placeholder="Ara..." className="bg-gray-900 border border-white/5 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                            <button onClick={() => setIsCreateModalOpen(true)} className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all uppercase">Yeni Kayıt</button>
                        </div>
                    </div>
                    <div className="bg-gray-900/30 rounded-3xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <tr><th className="p-6">Profil</th><th className="p-6">Puan (XP)</th><th className="p-6">Durum</th><th className="p-6 text-right">Eylemler</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-white/[0.02] group transition-all">
                                        <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center font-black text-indigo-500 border border-white/5 uppercase">{user.username[0]}</div><div><p className="font-bold text-gray-100">{user.username}</p><p className="text-xs text-gray-600 font-mono">{user.email}</p></div></div></td>
                                        <td className="p-6 font-mono font-bold text-indigo-400">{user.xp} XP</td>
                                        <td className="p-6">{user.isBanned ? <span className="text-red-500 text-[10px] font-black bg-red-500/10 px-2 py-1 rounded tracking-tighter">YASAKLI</span> : <span className="text-emerald-500 text-[10px] font-black bg-emerald-500/10 px-2 py-1 rounded tracking-tighter">AKTİF</span>}</td>
                                        <td className="p-6 text-right"><div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => openDetailModal(user)} className="p-2 bg-white/5 rounded-lg hover:bg-indigo-600 transition-all"><Eye size={18}/></button><button onClick={() => handleBanUser(user._id)} className={`p-2 rounded-lg bg-white/5 transition-all ${user.isBanned ? 'hover:bg-emerald-600' : 'hover:bg-orange-600'}`}>{user.isBanned ? <CheckCircle size={18}/> : <Ban size={18}/>}</button><button onClick={() => handleDeleteUser(user._id)} className="p-2 bg-white/5 rounded-lg hover:bg-red-600 transition-all text-red-500 hover:text-white"><Trash2 size={18}/></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "feedback" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                    {feedbacks.length === 0 && <div className="col-span-2 text-center py-20 text-gray-600 font-bold uppercase tracking-widest">Henüz mesaj yok</div>}
                    {feedbacks.map(f => (
                        <div key={f._id} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${f.isRead ? 'bg-gray-900/20 border-white/5 opacity-50' : 'bg-gray-900 border-indigo-500/30 shadow-lg shadow-indigo-500/5'}`}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><span className={`text-[10px] font-black px-2 py-1 rounded ${f.type === 'bug' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'} uppercase`}>{f.type}</span>{!f.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>}</div>
                                <h4 className="font-bold text-white text-lg">{f.subject}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{f.message}</p>
                                <div className="text-[10px] text-gray-600 font-black space-y-1 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 uppercase tracking-tighter"><Mail size={10}/> {f.senderInfo?.email}</div>
                                    <div className="flex items-center gap-2 uppercase tracking-tighter"><Clock size={10}/> {new Date(f.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6 justify-end">
                                {!f.isRead && <button onClick={() => handleMarkRead(f._id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={18}/></button>}
                                <button onClick={() => handleDeleteFeedback(f._id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "logs" && (
                <div className="animate-in fade-in duration-500 space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Sistem Günlükleri</h2>
                    <div className="bg-black border border-white/5 rounded-3xl p-6 font-mono text-[11px] h-[650px] overflow-y-auto custom-scrollbar space-y-1 shadow-inner">
                        {logs.map((log) => (
                            <div key={log._id} className="grid grid-cols-[100px_1fr] gap-4 p-1 hover:bg-white/5 rounded border-b border-white/[0.02]">
                                <span className="text-gray-600">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                                <div><span className="text-indigo-400 font-bold mr-2 uppercase tracking-tighter">{log.username}</span><span className="text-yellow-600 font-bold mr-2">/{log.action}</span><span className="text-gray-400">{log.details}</span><span className="float-right text-[9px] text-gray-800">{log.ipAddress}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailUser && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-[40px] border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                  <button onClick={() => setDetailUser(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white z-50 transition-all"><X size={32}/></button>
                  <div className="w-full md:w-80 bg-black p-10 border-r border-white/5 overflow-y-auto custom-scrollbar shrink-0">
                      <div className="flex flex-col items-center mb-10">{editForm.avatar ? <img src={editForm.avatar} alt="P" className="w-32 h-32 rounded-3xl border-2 border-indigo-500 object-cover shadow-2xl" /> : <div className="w-32 h-32 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl font-black text-white uppercase">{detailUser.username[0]}</div>}</div>
                      <form onSubmit={handleUpdateUser} className="space-y-6 font-bold uppercase tracking-widest text-[10px]">
                          <div className="space-y-1">
                              <label className="text-gray-500">Kullanıcı Adı</label>
                              <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full bg-gray-900 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:border-indigo-500 outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-gray-500">E-Posta</label>
                              <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-gray-900 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:border-indigo-500 outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-gray-500">Avatar URL</label>
                              <input type="text" placeholder="URL girin..." value={editForm.avatar} onChange={(e) => setEditForm({...editForm, avatar: e.target.value})} className="w-full bg-gray-900 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:border-indigo-500 outline-none text-[10px]" />
                          </div>
                          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5">GÜNCELLE</button>
                      </form>
                  </div>
                  <div className="flex-1 bg-gray-900 p-6 md:p-10 flex flex-col relative overflow-hidden">
                      <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase tracking-widest">Veri Analizi</h3>
                      {detailLoading ? <div className="flex flex-col items-center justify-center h-full text-indigo-500 gap-4"><div className="w-12 h-1 bg-indigo-500 animate-pulse"></div><span className="font-mono text-[10px] uppercase animate-pulse tracking-[0.5em]">Analiz_Ediliyor</span></div> : (
                          <div className="flex-1 overflow-y-auto space-y-10 pr-4 custom-scrollbar">
                              <div className="space-y-4"><h4 className="text-emerald-500 text-xs font-black tracking-widest flex items-center gap-2 uppercase">Kullanıcı Notları</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{detailData.notes.map(note => (<div key={note._id} className="bg-black/40 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-all"><p className="font-bold text-white mb-2">{note.title}</p><div className="text-gray-500 text-xs line-clamp-3" dangerouslySetInnerHTML={{ __html: note.content }} /></div>))}</div></div>
                              <div className="space-y-4"><h4 className="text-indigo-500 text-xs font-black tracking-widest flex items-center gap-2 uppercase">Kullanıcı Görevleri</h4><div className="space-y-2">{detailData.todos.map(todo => (<div key={todo._id} className="flex justify-between items-center bg-black/40 px-6 py-4 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all"><p className={`font-bold text-sm ${todo.status === 'completed' ? 'text-gray-700 line-through' : 'text-gray-300'}`}>{todo.title}</p><span className="text-[10px] font-mono text-gray-600 tracking-tighter uppercase">{new Date(todo.dueDate).toLocaleDateString()}</span></div>))}</div></div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-4">
              <div className="bg-gray-900 w-full max-w-md p-10 rounded-[40px] border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-all"><X size={24}/></button>
                  <h3 className="text-2xl font-black text-white mb-8 tracking-tighter text-center uppercase tracking-widest">Yeni Üye Kaydı</h3>
                  <form onSubmit={handleCreateUser} className="space-y-5">
                      <input type="text" placeholder="Kullanıcı Adı" required value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" />
                      <input type="email" placeholder="E-Mail Adresi" required value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" />
                      <input type="password" placeholder="Güvenli Şifre" required value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" />
                      <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">Sisteme Ekle</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}