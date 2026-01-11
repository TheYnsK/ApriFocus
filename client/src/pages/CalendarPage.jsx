import { useState, useEffect, useRef, useContext, useMemo } from "react";
import api from "../api/axios";
import { ChevronLeft, ChevronRight, X, Download, AlertCircle, Sparkles } from "lucide-react";
import TaskDetailModal from "../components/TaskDetailModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AuthContext } from "../context/AuthContext";

export default function CalendarPage() {
  const [todos, setTodos] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTodos, setSelectedDayTodos] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });

  const calendarRef = useRef(null);
  const { updateUserXP } = useContext(AuthContext);

  // --- 2026 TATİL VERİLERİ (SABİT) ---
  const holidays2026 = useMemo(() => ({
    "2026-01-01": { name: "Yılbaşı", type: "official" },
    "2026-03-19": { name: "Ramazan Bayramı Arifesi", type: "religious" },
    "2026-03-20": { name: "Ramazan Bayramı 1. Gün", type: "religious" },
    "2026-03-21": { name: "Ramazan Bayramı 2. Gün", type: "religious" },
    "2026-03-22": { name: "Ramazan Bayramı 3. Gün", type: "religious" },
    "2026-04-23": { name: "Ulusal Egemenlik ve Çocuk Bayramı", type: "official" },
    "2026-05-01": { name: "Emek ve Dayanışma Günü", type: "official" },
    "2026-05-19": { name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", type: "official" },
    "2026-05-26": { name: "Kurban Bayramı Arifesi", type: "religious" },
    "2026-05-27": { name: "Kurban Bayramı 1. Gün", type: "religious" },
    "2026-05-28": { name: "Kurban Bayramı 2. Gün", type: "religious" },
    "2026-05-29": { name: "Kurban Bayramı 3. Gün", type: "religious" },
    "2026-05-30": { name: "Kurban Bayramı 4. Gün", type: "religious" },
    "2026-07-15": { name: "Demokrasi ve Milli Birlik Günü", type: "official" },
    "2026-08-30": { name: "Zafer Bayramı", type: "official" },
    "2026-10-28": { name: "Cumhuriyet Bayramı Arifesi", type: "official" },
    "2026-10-29": { name: "Cumhuriyet Bayramı", type: "official" },
  }), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // --- DÜZELTME: Backend rotasıyla birebir aynı yapıldı ---
        const res = await api.get("/todos/calendar");
        setTodos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Takvim verileri hatası:", err);
        setTodos([]);
      }
    };
    loadData();
  }, [refreshCount]);

  const fetchTodos = () => setRefreshCount(prev => prev + 1);

  const showCustomAlert = (msg) => {
    setAlertInfo({ show: true, message: msg });
    setTimeout(() => setAlertInfo({ show: false, message: "" }), 3000);
  };

  const handleDownloadPDF = async () => {
  if (!calendarRef.current) return;

  const safeMonthNames = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];

  const el = calendarRef.current;

  // --- PDF MODE: sadece export sırasında CSS override için ---
  const hadClass = el.classList.contains("pdf-export-mode");
  el.classList.add("pdf-export-mode");

  const originalStyle = el.style.cssText;

  // A4 Landscape oranına uygun sabit canvas alanı (oran: 1.414)
  el.style.width = "1600px";
  el.style.minHeight = "1131px";
  el.style.height = "auto";
  el.style.padding = "40px";
  el.style.overflow = "visible";
  el.style.background = "#ffffff"; // şeffaflık istemiyoruz

  const canvas = await html2canvas(el, {
    scale: 3, // kalite ↑
    useCORS: true,
    logging: false,
    windowWidth: 1600,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    onclone: (doc) => {
      // clone DOM içinde font/render stabilitesi (bazı makinelerde kırpmayı azaltır)
      const root = doc.querySelector(".pdf-export-mode");
      if (root) {
        root.style.webkitFontSmoothing = "antialiased";
        root.style.textRendering = "geometricPrecision";
      }
    },
  });

  // geri al
  el.style.cssText = originalStyle;
  if (!hadClass) el.classList.remove("pdf-export-mode");

  // PNG: yazılar daha net
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  const pageWidth = pdf.internal.pageSize.getWidth();   // ~297
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~210
  const margin = 10;

  const monthIndex = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const safeMonth = safeMonthNames[monthIndex];
  const titleText = `${safeMonth} ${year}`;

  // Başlık
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(79, 70, 229);
  pdf.text(titleText, pageWidth / 2, 15, { align: "center" });

  // Görsel alanı (aspect-fit, stretch yok)
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2 - 15;

  const imgW = canvas.width;
  const imgH = canvas.height;

  const ratio = Math.min(usableWidth / imgW, usableHeight / imgH);
  const renderW = imgW * ratio;
  const renderH = imgH * ratio;

  const x = (pageWidth - renderW) / 2;
  const y = 20;

  pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");

  // Footer
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(150);
  pdf.text(`ApriFocus - ${safeMonth} ${year}`, pageWidth / 2, pageHeight - 5, { align: "center" });

  pdf.save(`ApriFocus_Takvim_${safeMonth}_${year}.pdf`);
};



  const handleDragStart = (e, todo) => { setDraggedTask(todo); e.dataTransfer.effectAllowed = "move"; e.target.style.opacity = "0.5"; };
  const handleDragEnd = (e) => { e.target.style.opacity = "1"; setDraggedTask(null); };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    if (!draggedTask) return;

    const targetDateDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDay);
    const originalDate = new Date(draggedTask.dueDate);

    const finalTargetDate = new Date(
      targetDateDay.getFullYear(),
      targetDateDay.getMonth(),
      targetDateDay.getDate(),
      originalDate.getHours(),
      originalDate.getMinutes()
    );

    const now = new Date();
    if (finalTargetDate.getTime() < now.getTime() - 60000) {
      showCustomAlert("Geçmiş bir zamana görev taşıyamazsınız!");
      return;
    }

    const updatedTodos = todos.map((t) => t._id === draggedTask._id ? { ...t, dueDate: finalTargetDate.toISOString() } : t);
    setTodos(updatedTodos);

    try { await api.put(`/todos/${draggedTask._id}`, { dueDate: finalTargetDate }); fetchTodos(); }
    catch (err) { console.error("Hata:", err); fetchTodos(); }
  };

  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const isSameLocalDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const getTodosForDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return todos.filter((todo) => {
      if (!todo?.dueDate) return false;
      const due = new Date(todo.dueDate);
      if (Number.isNaN(due.getTime())) return false;
      return isSameLocalDay(due, targetDate);
    });
  };

  // --- TATİL BULUCU YARDIMCI FONKSİYON ---
  const getHolidayForDate = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return holidays2026[key];
  };

  const handleDayClick = (day, dailyTodos) => { if (dailyTodos.length > 0) setSelectedDayTodos({ day, list: dailyTodos }); };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const firstDayIndex = (startDay + 6) % 7;
  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const now = new Date();

  const getDayColorClass = (count, isToday, isWeekend) => {
    const base = "transition-all duration-300 border-2";
    if (isToday) return `${base} bg-blue-50/80 border-blue-500 ring-4 ring-blue-200 z-10 scale-[1.02] shadow-xl`;

    // HAFTASONU AYARI: Hafif gri arka plan
    const bgClass = isWeekend ? "bg-slate-50/80" : "bg-white";

    if (count === 0) return `${base} ${bgClass} border-slate-200 hover:border-slate-300`;
    if (count === 1) return `${base} bg-emerald-50 border-emerald-300 hover:border-emerald-500`;
    if (count === 2) return `${base} bg-teal-50 border-teal-300 hover:border-teal-500`;
    if (count === 3) return `${base} bg-sky-100 border-sky-300 hover:border-sky-500`;
    if (count === 4) return `${base} bg-indigo-100 border-indigo-300 hover:border-indigo-500`;
    if (count === 5) return `${base} bg-violet-100 border-violet-300 hover:border-violet-500`;
    if (count === 6) return `${base} bg-fuchsia-100 border-fuchsia-300 hover:border-fuchsia-500`;
    return `${base} bg-rose-100 border-rose-400 hover:border-rose-600 shadow-md animate-pulse`;
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-8 bg-slate-50/50 overflow-hidden relative">

      {alertInfo.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-300 border border-red-400">
          <div className="bg-white/20 p-2 rounded-full">
            <AlertCircle size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider opacity-90">Hata</h4>
            <p className="font-medium text-base">{alertInfo.message}</p>
          </div>
          <button onClick={() => setAlertInfo({ show: false, message: "" })} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"><X size={20} /></button>
        </div>
      )}

      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-8 gap-4 pb-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm p-4 rounded-3xl">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Takvim</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center justify-center sm:justify-start gap-2">
            {currentDate.toLocaleString("tr-TR", { month: "long" })}
            <span className="text-slate-300 font-light">{currentDate.getFullYear()}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4" data-html2canvas-ignore="true">
          <button onClick={handleDownloadPDF} className="group flex items-center gap-2 bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-2xl font-bold hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1 transition-all text-sm md:text-base">
            <Download size={18} className="group-hover:animate-bounce" />
            <span className="hidden sm:inline">PDF İndir</span>
          </button>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-[2.5rem] shadow-xl border border-slate-100 bg-white">
        <div
          ref={calendarRef}
          className="flex flex-col h-full p-4 md:p-8 min-w-[800px] md:min-w-0"
        >
          <div className="grid grid-cols-7 mb-4">
            {dayNames.map((d, i) => (
              <div key={d} className="text-center pb-2">
                <span className={`text-xs font-black uppercase tracking-wider ${i >= 5 ? 'text-orange-400' : 'text-slate-400'}`}>{d}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3 flex-1 auto-rows-fr">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-100"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dailyTodos = getTodosForDate(day);
              const holiday = getHolidayForDate(day); // Tatil verisini al
              const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Pazar=0, Cmt=6
              const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

              return (
                <div
                  key={day}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => handleDayClick(day, dailyTodos)}
                  className={`
                          relative p-2 md:p-3 rounded-3xl flex flex-col gap-1 overflow-hidden group transition-transform
                          ${holiday ? "pb-4 md:pb-5" : ""}
                          ${getDayColorClass(dailyTodos.length, isToday, isWeekend)}
                      `}
                  style={{ minHeight: holiday ? "160px" : "100px" }}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className={`text-lg font-bold leading-none ${isToday ? "text-blue-600" : isWeekend ? "text-slate-400" : "text-slate-700/50"}`}>{day}</span>
                    {holiday && (
                      <Sparkles size={14} className={holiday.type === 'official' ? 'text-rose-500' : 'text-amber-500'} />
                    )}
                  </div>

                  {/* TATİL ETİKETİ */}
{holiday && (
  <div
    className={`
      holiday-badge z-10 text-[9px] px-2 py-1 rounded-md font-bold mb-1 text-center
      ${holiday.type === 'official' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}
    `}
  >
    {holiday.name}
  </div>
)}






                  <div className="flex-1 flex flex-col gap-1 z-10 relative">
                    {dailyTodos.slice(0, 3).map((todo) => (
                      <div
                        key={todo._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(todo); }}
                        className={`
                              text-[9px] md:text-[10px] px-1.5 py-1 md:px-2 md:py-1.5 rounded-lg font-bold truncate shadow-sm cursor-grab active:cursor-grabbing border transition-all
                              ${todo.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                            todo.priority === 'important' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              'bg-white text-slate-600 border-slate-200'}
                              ${todo.status === 'completed' ? 'opacity-50 line-through grayscale' : 'hover:-translate-y-0.5'}
                            `}
                      >
                        {todo.title}
                      </div>
                    ))}

                    {dailyTodos.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-400 text-center mt-auto bg-white/60 border border-slate-100 rounded-lg py-0.5 backdrop-blur-sm">
                        +{dailyTodos.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDayTodos && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/50">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentDate.toLocaleString("tr-TR", { month: "long" })}</p>
                <h3 className="text-2xl font-black">{selectedDayTodos.day}</h3>
              </div>
              <button onClick={() => setSelectedDayTodos(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 bg-slate-50 flex-1">
              {selectedDayTodos.list.map(todo => (
                <div key={todo._id} onClick={() => setSelectedTask(todo)} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 cursor-pointer flex justify-between items-center transition-all group">
                  <div className="flex flex-col">
                    <span className={`font-bold text-slate-700 ${todo.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{todo.title}</span>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {new Date(todo.dueDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onToggleComplete={async (e, task) => {
          if (!task) return;
          const status = task.status === "completed" ? "pending" : "completed";
          const res = await api.put(`/todos/${task._id}`, { status });
          if (res.data?.userXP !== undefined) updateUserXP(res.data.userXP);
          fetchTodos();
        }}
        onDelete={async (e, id) => { await api.delete(`/todos/${id}`); fetchTodos(); }}
        onTogglePin={async (e, task) => { await api.put(`/todos/${task._id}`, { isPinned: !task.isPinned }); fetchTodos(); }}
      />
    </div>
  );
}
