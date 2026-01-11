import { useState, useEffect } from 'react';
import { X, Megaphone, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSignal = (e) => {
      setAnnouncement(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('newAnnouncement', handleSignal);
    return () => window.removeEventListener('newAnnouncement', handleSignal);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // OKUNDU OLARAK KAYDET: Bir daha bu ID ile duyuru gelirse App.jsx tetiklemeyecek.
    if (announcement) {
      localStorage.setItem('lastReadAnnouncementId', announcement._id);
    }
  };

  if (!isOpen || !announcement) return null;

  const styles = {
    info: { bg: 'bg-indigo-600', icon: <Info size={24}/> },
    warning: { bg: 'bg-orange-500', icon: <AlertTriangle size={24}/> },
    danger: { bg: 'bg-red-600', icon: <Megaphone size={24}/> },
    success: { bg: 'bg-emerald-600', icon: <CheckCircle size={24}/> }
  };
  const s = styles[announcement.type] || styles.info;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300">
        
        {/* Banner */}
        <div className={`${s.bg} p-5 text-white flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              {s.icon} 
              <span className="uppercase tracking-widest text-[10px] font-black">Sistem Duyurusu</span>
            </div>
            <button onClick={handleClose} className="hover:opacity-70 transition-all p-1"><X size={20}/></button>
        </div>

        {/* İçerik */}
        <div className="p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {announcement.title}
            </h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              {announcement.message}
            </p>
            <div className="pt-2">
                <button 
                  onClick={handleClose} 
                  className="w-full py-4 bg-gray-900 text-white text-[11px] font-black tracking-[0.2em] uppercase rounded-2xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                  OKUDUM
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}