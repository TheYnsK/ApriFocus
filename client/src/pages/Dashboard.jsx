import { useState, useEffect, useContext, useCallback } from "react";
import api from "../api/axios";
import { Plus, CheckCircle, Trash2, Pin, ArrowUpDown, Calendar, Clock, AlertCircle, Loader2, Edit2, Repeat } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import AddTaskModal from "../components/AddTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import DeleteModal from "../components/DeleteModal";

export default function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("date");
  const { user, updateUserXP } = useContext(AuthContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTodos = useCallback(async () => {
    try { 
        const res = await api.get("/todos"); 
        setTodos(Array.isArray(res.data) ? res.data : []); 
    } 
    catch (err) { console.error(err); setError("Veriler yüklenirken bir sorun oluştu."); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const getTaskStatus = (todo) => {
    if (!todo.dueDate) return { text: "Tarih Yok", color: "text-gray-400", bg: "bg-gray-100" };
    const now = new Date(); const due = new Date(todo.dueDate);
    if (isNaN(due)) return { text: "Hatalı Tarih", color: "text-gray-400", bg: "bg-gray-100" };
    const diffMs = due - now; const diffHours = diffMs / (1000 * 60 * 60); const diffDays = diffHours / 24;
    
    if (todo.isRoutine) {
        return { 
            text: todo.routineType === 'weekly' ? "Haftalık Rutin" : "Aylık Rutin", 
            color: "text-indigo-600 font-bold", 
            bg: "bg-indigo-50", 
            icon: <Repeat size={14} className="text-indigo-600" /> 
        };
    }

    if (diffMs < 0) return { text: "Süresi Doldu!", color: "text-red-600 font-bold", bg: "bg-red-50", icon: <AlertCircle size={14} className="text-red-600" /> };
    else if (diffHours < 24) return { text: `Az Kaldı (${Math.floor(diffHours)} sa)`, color: "text-orange-600 font-semibold", bg: "bg-orange-50", icon: <Clock size={14} className="text-orange-600" /> };
    else return { text: `${Math.floor(diffDays)} gün var`, color: "text-green-600", bg: "bg-green-50", icon: <Calendar size={14} className="text-green-600" /> };
  };

  const toggleComplete = async (e, todo) => { 
      e?.stopPropagation(); 
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      
      // OPTIMISTIC UPDATE: Hemen state'i güncelle
      setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, status: newStatus } : t)); 
      
      try { 
          const res = await api.put(`/todos/${todo._id}`, { status: newStatus }); 
          if (res.data.userXP !== undefined) updateUserXP(res.data.userXP);
          // Rutinler arası senkronizasyon için listeyi arka planda sessizce yenile
          const refresh = await api.get("/todos");
          setTodos(refresh.data);
      } catch (err) { 
          console.error(err); fetchTodos(); 
      } 
  };

  const onRequestDelete = (e, id) => { e?.stopPropagation(); setTaskToDeleteId(id); setIsDeleteModalOpen(true); };
  
  const confirmDelete = async () => { 
      if (!taskToDeleteId) return; 
      setDeleteLoading(true); 
      // Optimistic delete
      setTodos(prev => prev.filter(t => t._id !== taskToDeleteId));
      try { 
          await api.delete(`/todos/${taskToDeleteId}`); 
          setIsDeleteModalOpen(false); 
          setTaskToDeleteId(null); 
      } catch (err) { 
          console.error(err); 
          fetchTodos(); // Hata varsa listeyi geri yükle
          alert("Silme başarısız."); 
      } 
      finally { setDeleteLoading(false); } 
  };

  const handleEdit = (e, todo) => { e?.stopPropagation(); setTaskToEdit(todo); setIsModalOpen(true); };
  
  const togglePin = async (e, todo) => { 
    e?.stopPropagation(); 
    const newPinStatus = !todo.isPinned;
    setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, isPinned: newPinStatus } : t)); 
    try { await api.put(`/todos/${todo._id}`, { isPinned: newPinStatus }); } 
    catch (err) { console.error(err); fetchTodos(); } 
  };
  
  const getSortedTodos = () => { 
      if (!Array.isArray(todos)) return []; 
      return [...todos]
        .filter(t => t.isRoutine ? t.isMaster : true)
        .sort((a, b) => { 
            if (a.isPinned && !b.isPinned) return -1; 
            if (!a.isPinned && b.isPinned) return 1; 
            if (sortType === "date") return new Date(a.dueDate) - new Date(b.dueDate); 
            if (sortType === "priority") { const p = { urgent: 3, important: 2, normal: 1, low: 0 }; return p[b.priority] - p[a.priority]; } 
            return (a.title || "").localeCompare(b.title || ""); 
        }); 
  };
  
  const sortedTodos = getSortedTodos();
  const pendingCount = sortedTodos.filter(t => t.status === 'pending').length;
  const completedCount = sortedTodos.filter(t => t.status === 'completed').length;

  if (error) return <div className="flex h-full items-center justify-center"><div className="text-red-500 font-bold bg-white p-6 rounded-xl shadow-soft border border-red-100">{error}</div></div>;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div><h3 className="text-2xl md:text-3xl font-bold text-text-base">Görev Panosu</h3><p className="text-gray-400 text-sm mt-1">Planlarını yönet, başarıya ulaş.</p></div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-soft transition-all cursor-pointer">
              <ArrowUpDown size={18} className="text-primary" />
              <select className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full appearance-none pr-8 z-10" value={sortType} onChange={(e) => setSortType(e.target.value)}>
                <option value="date">Tarihe Göre</option><option value="priority">Öneme Göre</option><option value="name">İsme Göre</option>
              </select>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-action text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-action/30 flex items-center justify-center gap-2 hover:bg-opacity-90 hover:-translate-y-1 transition-all active:scale-95 flex-1 md:flex-none">
            <Plus size={20} /> <span className="hidden sm:inline">Yeni Görev</span><span className="sm:hidden">Ekle</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-indigo-900 p-6 rounded-3xl shadow-elevated text-white relative overflow-hidden group transition-transform">
          <div className="relative z-10"><p className="text-indigo-200 text-sm font-medium">Toplam XP</p><h4 className="text-4xl font-bold mt-1 tracking-tight">{user?.xp || 0}</h4></div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col justify-center"><p className="text-gray-500 text-sm font-medium">Bekleyen</p><h4 className="text-3xl font-bold text-action mt-1">{pendingCount}</h4></div>
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col justify-center"><p className="text-gray-500 text-sm font-medium">Tamamlanan</p><h4 className="text-3xl font-bold text-success mt-1">{completedCount}</h4></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={40} className="animate-spin text-primary opacity-50" /></div>
      ) : (
        <div className="space-y-3 pb-20">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-soft border border-dashed border-gray-300"><p className="text-gray-400 font-medium">Listen boş. İlk görevini ekleyerek başla!</p></div>
          ) : (
            sortedTodos.map((todo) => {
              const statusInfo = getTaskStatus(todo);
              const isCompleted = todo.status === 'completed';
              return (
                <div key={todo._id} onClick={() => setSelectedTask(todo)} className={`relative p-4 rounded-2xl shadow-soft border transition-all hover:shadow-elevated hover:border-action/50 hover:-translate-y-0.5 flex items-center gap-4 cursor-pointer group ${isCompleted ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                  <button onClick={(e) => toggleComplete(e, todo)} className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 shrink-0 ${isCompleted ? 'bg-success border-success text-white scale-110' : 'border-gray-300 text-transparent hover:border-success'}`}>
                    <CheckCircle size={14} strokeWidth={3} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-lg font-bold truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.title}{todo.isPinned && <Pin size={16} className="inline ml-2 text-action fill-action rotate-45" />}</h4>
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{todo.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs font-semibold tracking-wide">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.icon}<span>{statusInfo.text}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {todo.imageUrl && <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 shrink-0"><img src={todo.imageUrl} alt="Görsel" className="w-full h-full object-cover" /></div>}
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                          <button onClick={(e) => handleEdit(e, todo)} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"><Edit2 size={16} /></button>
                          <button onClick={(e) => togglePin(e, todo)} className={`p-1.5 rounded-lg transition-colors ${todo.isPinned ? 'bg-orange-100 text-action' : 'text-gray-400 hover:bg-gray-100'}`}><Pin size={16} className={todo.isPinned ? "fill-current" : ""} /></button>
                          <button onClick={(e) => onRequestDelete(e, todo._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <AddTaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTaskToEdit(null); }} onTaskAdded={fetchTodos} taskToEdit={taskToEdit} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} loading={deleteLoading} />
      <TaskDetailModal isOpen={!!selectedTask} task={selectedTask} onClose={() => { setSelectedTask(null); fetchTodos(); }} onToggleComplete={(e, t) => { toggleComplete(e, t); setSelectedTask(null); }} onDelete={(e, id) => { setSelectedTask(null); onRequestDelete(e, id); }} onTogglePin={togglePin} />
    </>
  );
}