import { useState, useEffect } from "react";
import { X, Calendar, Clock, Flag, CheckCircle, Trash2, Pin, AlignLeft, Image as ImageIcon, CheckSquare } from "lucide-react";
import api from "../api/axios";

// AuthContext ve updateUserXP buradan kaldırıldı çünkü işlem artık ana sayfada yapılıyor.

export default function TaskDetailModal({ task, isOpen, onClose, onToggleComplete, onDelete, onTogglePin }) {
  const [localTask, setLocalTask] = useState(task);

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  if (!isOpen || !localTask) return null;

  const date = new Date(localTask.dueDate);
  const formattedDate = !isNaN(date) ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Tarih Yok";
  const formattedTime = !isNaN(date) ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  
  const priorityLabels = { urgent: "Çok Acil", important: "Önemli", normal: "Normal", low: "Düşük" };
  const priorityColors = { urgent: "text-red-600 bg-red-50", important: "text-orange-600 bg-orange-50", normal: "text-blue-600 bg-blue-50", low: "text-gray-600 bg-gray-50" };

  const subtasks = localTask.subtasks || [];
  const completedSubtasks = subtasks.filter(st => st.isCompleted).length;
  const totalSubtasks = subtasks.length;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  let progressColor = "bg-red-500";
  if (progressPercent >= 50) progressColor = "bg-yellow-500";
  if (progressPercent >= 100) progressColor = "bg-green-500";

  // Alt görevleri güncelle (XP etkilemediği için API çağrısı burada kalabilir veya taşınabilir, şimdilik burada kalsın)
  const toggleSubtask = async (index) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].isCompleted = !newSubtasks[index].isCompleted;
    setLocalTask({ ...localTask, subtasks: newSubtasks });
    try { 
        await api.put(`/todos/${localTask._id}`, { subtasks: newSubtasks }); 
    } catch (error) { 
        console.error("Alt görev hatası:", error); 
    }
  };

  // Ana görevi tamamla (İşlemi Dashboard'a devreder)
  const handleMainTaskToggle = async () => {
      if (onToggleComplete) {
          // null: event nesnesi yok, localTask: güncellenecek görev
          onToggleComplete(null, localTask);
      }
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header (Resim ve Kapat Butonu) */}
        <div className="relative bg-gray-100 shrink-0 min-h-[120px] flex items-center justify-center">
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm z-20"><X size={20} /></button>
          {localTask.imageUrl ? (
              <div className="w-full max-h-[300px] flex items-center justify-center bg-gray-200">
                  <img src={localTask.imageUrl} alt="Görsel" className="w-full h-full max-h-[300px] object-contain" />
              </div>
          ) : (
              <div className="w-full h-32 bg-gradient-to-r from-primary to-indigo-600 flex items-center justify-center">
                  <ImageIcon className="text-white/20 w-16 h-16" />
              </div>
          )}
        </div>

        {/* İçerik */}
        <div className="p-6 md:p-8 overflow-y-auto">
          
          <div className="flex justify-between items-start mb-4">
             <h2 className={`text-xl md:text-2xl font-bold leading-tight text-gray-800 ${localTask.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{localTask.title}</h2>
             {localTask.isPinned && (<div className="bg-orange-100 p-2 rounded-lg shrink-0 ml-4"><Pin className="fill-orange-500 text-orange-500 rotate-45" size={20} /></div>)}
          </div>

          {/* İlerleme Çubuğu */}
          {totalSubtasks > 0 && (
              <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1"><span>İlerleme</span><span>%{progressPercent}</span></div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${progressColor}`} style={{ width: `${progressPercent}%` }}></div>
                  </div>
              </div>
          )}

          {/* Açıklama */}
          <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><AlignLeft size={14}/> AÇIKLAMA</h4>
              <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 text-sm leading-relaxed border border-gray-100 whitespace-pre-wrap font-medium">
                  {localTask.description || "Açıklama yok."}
              </div>
          </div>

          {/* Alt Görevler */}
          {totalSubtasks > 0 && (
              <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><CheckSquare size={14}/> ALT GÖREVLER</h4>
                  <div className="space-y-2">
                      {subtasks.map((sub, idx) => (
                          <div key={idx} onClick={() => toggleSubtask(idx)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                  {sub.isCompleted && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <span className={`text-sm ${sub.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{sub.title}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Detay Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar size={20} /></div>
                <div><p className="text-[10px] text-gray-400 font-bold tracking-wider">TARİH</p><p className="font-semibold text-gray-700 text-sm">{formattedDate}</p></div>
            </div>
            
            {/* HATIRLATMA (SADECE VARSA GÖSTER) */}
            {localTask.reminderTime > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider">SAAT</p>
                        <p className="font-semibold text-gray-700 text-sm">{formattedTime}</p>
                    </div>
                </div>
            )}

            <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <div className={`p-2.5 rounded-lg ${priorityColors[localTask.priority] || 'bg-gray-100'}`}><Flag size={20} /></div>
                <div><p className="text-[10px] text-gray-400 font-bold tracking-wider">ÖNEM</p><p className="font-bold uppercase text-sm text-gray-800">{priorityLabels[localTask.priority] || localTask.priority}</p></div>
            </div>
          </div>
        </div>

        {/* Footer Butonlar */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className="flex gap-3">
            <button onClick={handleMainTaskToggle} className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${localTask.status === 'completed' ? 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50' : 'bg-primary text-white shadow-lg'}`}>
                <CheckCircle size={20} /> {localTask.status === 'completed' ? 'Geri Al' : 'Tamamla'}
            </button>
            <button onClick={() => { onTogglePin(null, localTask); onClose(); }} className="p-3.5 rounded-xl border-2 bg-white border-gray-200 text-gray-400 hover:text-gray-600">
                <Pin size={22} className={localTask.isPinned ? "fill-current" : ""} />
            </button>
            <button onClick={() => { onDelete(null, localTask._id); onClose(); }} className="p-3.5 bg-white border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50">
                <Trash2 size={22} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}