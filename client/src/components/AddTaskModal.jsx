import { useState, useEffect, useRef } from "react";
import { X, Flag, Image as ImageIcon, Clock, Repeat, Loader2, ChevronDown, Bell, Plus, List, AlertTriangle } from "lucide-react"; 
import api from "../api/axios";
import imageCompression from 'browser-image-compression';

const initialForm = { title: "", description: "", priority: "normal", dueDate: "", imageUrl: "", reminderTime: "" };

export default function AddTaskModal({ isOpen, onClose, onTaskAdded, taskToEdit }) {
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState(initialForm);
  
  // UI Error State (Pop-up Mesajı)
  const [error, setError] = useState(null);
  
  // Rutin State'leri
  const [isRoutine, setIsRoutine] = useState(false);
  const [routineType, setRoutineType] = useState('monthly'); 
  const [selectedDays, setSelectedDays] = useState([]);

  // Alt Görev State'leri
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError(null); // Modal açılınca hataları temizle
      if (taskToEdit) {
        let dateStr = "";
        if (taskToEdit.dueDate) {
            const d = new Date(taskToEdit.dueDate);
            const offset = d.getTimezoneOffset() * 60000; 
            dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        }
        setFormData({ title: taskToEdit.title, description: taskToEdit.description, priority: taskToEdit.priority, dueDate: dateStr, imageUrl: taskToEdit.imageUrl, reminderTime: taskToEdit.reminderTime || "" });
        setIsRoutine(taskToEdit.isRoutine || false); 
        setRoutineType(taskToEdit.routineType || 'monthly');
        setSelectedDays(taskToEdit.routineDays || []);
        setSubtasks(taskToEdit.subtasks || []);
      } else {
        setFormData(initialForm); setIsRoutine(false); setRoutineType('monthly'); setSelectedDays([]); setSubtasks([]); setNewSubtask("");
      }
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const handleCloseInternal = () => { onClose(); setTimeout(() => { setFormData(initialForm); setIsRoutine(false); setSubtasks([]); setLoading(false); isSubmittingRef.current = false; setError(null); }, 300); };
  const daysUI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const toggleDay = (uiIndex) => { let jsDay = (uiIndex === 6) ? 0 : uiIndex + 1; if (selectedDays.includes(jsDay)) { setSelectedDays(selectedDays.filter(d => d !== jsDay)); } else { setSelectedDays([...selectedDays, jsDay]); } };
  
  const addSubtask = () => { if (!newSubtask.trim()) return; setSubtasks([...subtasks, { title: newSubtask, isCompleted: false }]); setNewSubtask(""); };
  const removeSubtask = (idx) => { setSubtasks(subtasks.filter((_, i) => i !== idx)); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; 
    setError(null); 
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Dosya boyutu 2MB'dan büyük olamaz!"); e.target.value = ""; return; }
    setLoading(true);
    try { 
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true }; 
        const compressedFile = await imageCompression(file, options); 
        const reader = new FileReader(); 
        reader.readAsDataURL(compressedFile); 
        reader.onloadend = () => { setFormData(prev => ({ ...prev, imageUrl: reader.result })); setLoading(false); }; 
    } catch (error) { console.error(error); setError("Görsel işlenirken hata oluştu."); setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(null); // Önceki hataları temizle

    if (isSubmittingRef.current) return; 

    // --- FRONTEND GEÇMİŞ TARİH KONTROLÜ ---
    if (formData.dueDate) {
        const selectedDate = new Date(formData.dueDate);
        const now = new Date();
        // 1 dakika tolerans (saniye farkları için)
        if (selectedDate.getTime() < now.getTime() - 60000) {
            setError("Geçmiş bir zamana görev planlayamazsınız!");
            
            // Kullanıcının dikkatini çekmek için yukarı kaydır (opsiyonel)
            const modalContainer = document.querySelector('.modal-scroll-container');
            if (modalContainer) modalContainer.scrollTop = 0;
            
            return; // İşlemi durdur
        }
    }

    isSubmittingRef.current = true; 
    setLoading(true);
    
    try {
      let formattedDueDate = ""; 
      if (formData.dueDate) { 
          const d = new Date(formData.dueDate); 
          if (!isNaN(d.getTime())) { formattedDueDate = d.toISOString(); } 
      }
      
      const payload = { 
          ...formData, 
          dueDate: formattedDueDate, 
          reminderTime: formData.reminderTime ? parseInt(formData.reminderTime) : 0, 
          isRoutine, routineType, routineDays: isRoutine ? selectedDays : [], subtasks
      };

      if (taskToEdit) { await api.put(`/todos/${taskToEdit._id}`, payload); } else { await api.post("/todos", payload); }
      onTaskAdded(); handleCloseInternal(); 
    } catch (error) { 
        console.error(error); 
        // Backend'den gelen hata mesajını göster
        const msg = error.response?.data?.message || "Bir hata oluştu.";
        setError(msg);
        isSubmittingRef.current = false; 
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto modal-scroll-container">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-primary">{taskToEdit ? "Düzenle" : "Yeni Hedef"}</h2>
          <button onClick={handleCloseInternal} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400 hover:text-red-500" /></button>
        </div>

        {/* --- POP-UP HATA KUTUSU --- */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
                <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-red-700 text-sm uppercase tracking-wide mb-1">Dikkat</h4>
                    <p className="text-red-600 text-sm font-medium leading-relaxed">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 p-1"><X size={16}/></button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group"><input type="text" placeholder="Ne yapmayı planlıyorsun?" className="w-full text-lg md:text-xl font-bold border-b-2 border-gray-100 py-3 focus:outline-none focus:border-action bg-transparent transition-colors placeholder:text-gray-300" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required autoFocus /></div>
          
          <textarea placeholder="Detaylar, notlar..." className="w-full bg-gray-50 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 resize-none border border-transparent focus:border-primary/20 transition-all outline-none" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />

          <div>
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 tracking-wide"><List size={14}/> ALT GÖREVLER</label>
              <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Madde ekle..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
                  <button type="button" onClick={addSubtask} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl transition-colors"><Plus size={20}/></button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                  {subtasks.map((st, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-sm">
                          <span>{st.title}</span>
                          <button type="button" onClick={() => removeSubtask(idx)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 tracking-wide"><Flag size={14} /> ÖNEM</label>
              <div className="relative"><select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-3 pr-10 text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:border-primary cursor-pointer" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}><option value="urgent">🔴 Çok Acil</option><option value="important">🟡 Önemli</option><option value="normal">🔵 Normal</option><option value="low">⚪ Düşük</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} /></div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 tracking-wide"><Clock size={14} /> BİTİŞ ZAMANI</label>
              <div className="relative"><input type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary cursor-pointer" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required /></div>
            </div>
          </div>

          <div><label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 tracking-wide"><Bell size={14} /> HATIRLATMA (DK)</label><div className="relative"><input type="number" min="0" placeholder="Örn: 15" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary placeholder:font-normal" value={formData.reminderTime} onChange={(e) => setFormData({...formData, reminderTime: e.target.value})} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">DK</span></div></div>

          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <label className={`flex items-center gap-3 font-bold text-indigo-900 cursor-pointer select-none ${taskToEdit?.isMaster === false ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="relative flex items-center"><input type="checkbox" checked={isRoutine} onChange={(e) => setIsRoutine(e.target.checked)} className="peer w-5 h-5 cursor-pointer appearance-none rounded border border-indigo-300 bg-white checked:bg-action checked:border-action transition-all" disabled={taskToEdit?.isMaster === false} /><Repeat size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" /></div> Rutin Oluştur
              </label>
              
              {isRoutine && (
                  <div className="flex bg-white rounded-lg p-1 border border-indigo-200">
                      <button type="button" onClick={() => setRoutineType('weekly')} className={`px-2 py-1 text-xs font-bold rounded ${routineType === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Haftalık</button>
                      <button type="button" onClick={() => setRoutineType('monthly')} className={`px-2 py-1 text-xs font-bold rounded ${routineType === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Aylık</button>
                  </div>
              )}
            </div>

            {isRoutine && !taskToEdit && (
              <div 
                className="flex justify-between gap-1 overflow-x-auto pb-2 md:pb-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
              >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {daysUI.map((day, index) => {
                   let checkJsDay = (index === 6) ? 0 : index + 1;
                   const isSelected = selectedDays.includes(checkJsDay);
                   return (<button key={day} type="button" onClick={() => toggleDay(index)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 ${isSelected ? "bg-indigo-600 text-white scale-110 shadow-indigo-300" : "bg-white text-gray-400 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}>{day}</button>);
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 tracking-wide">EK</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer group bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl px-4 py-3 flex-1 flex items-center justify-center gap-2 text-gray-500 transition-colors">
                <ImageIcon size={18} className="group-hover:text-primary transition-colors"/><span className="text-sm font-medium group-hover:text-gray-700">{loading ? "..." : "Görsel"}</span><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {formData.imageUrl && (<div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/20 shrink-0 relative"><img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ""}))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg hover:bg-red-600"><X size={10} /></button></div>)}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
             <button type="submit" disabled={loading} className="px-8 py-3.5 bg-action text-white font-bold rounded-xl hover:shadow-xl hover:shadow-action/20 transition-all disabled:opacity-50 w-full sm:w-auto">
               {loading ? <Loader2 className="animate-spin mx-auto" /> : (taskToEdit ? "Kaydet" : "Ekle")}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}