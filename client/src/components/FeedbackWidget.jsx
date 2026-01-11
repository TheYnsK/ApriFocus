import { useState } from 'react';
import api from '../api/axios';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    type: 'general',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.subject.trim() || !form.message.trim()) return;

    setLoading(true);
    try {
      await api.post('/feedbacks', form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setForm({ type: 'general', subject: '', message: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end">
      
      {/* FORM PENCERESİ (Butonun üstünde açılır) */}
      {isOpen && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-sm">Bize Ulaşın</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={16}/></button>
          </div>

          {success ? (
            <div className="p-8 flex flex-col items-center justify-center text-center h-64">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 animate-bounce">
                 <Send size={32} />
               </div>
               <h4 className="font-bold text-gray-800">Gönderildi!</h4>
               <p className="text-xs text-gray-500 mt-1">Geri bildiriminiz için teşekkürler.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Tür</label>
                <select 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 mt-1 outline-none focus:border-indigo-500"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="general">Genel Görüş</option>
                  <option value="bug">Hata Bildirimi (Bug)</option>
                  <option value="feature">Özellik İsteği</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500">Konu</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 mt-1 outline-none focus:border-indigo-500"
                  placeholder="Kısaca özetle..."
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Mesaj</label>
                <textarea 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 mt-1 h-24 resize-none outline-none focus:border-indigo-500"
                  placeholder="Düşüncelerinizi yazın..."
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                Gönder
              </button>
            </form>
          )}
        </div>
      )}

      {/* ANA BUTON (Yuvarlak) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-700 text-white rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}