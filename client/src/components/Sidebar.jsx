import { LayoutDashboard, Calendar, Settings, Target, Book } from "lucide-react"; 
import { useLocation, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { icon: LayoutDashboard, text: "Görevlerim", path: "/" },
    { icon: Calendar, text: "Takvim", path: "/calendar" },
    { icon: Book, text: "Not Defteri", path: "/notes" },
    { icon: Settings, text: "Ayarlar", path: "/settings" },
  ];

  return (
    <div className="h-full w-full bg-primary text-white flex flex-col">
      <div className="p-8 flex items-center gap-3 border-b border-white/20">
        <div className="bg-action p-2 rounded-xl shadow-lg shadow-action/40">
           <Target size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-white leading-none">ApriFocus</h1>
          <span className="text-[10px] text-indigo-300 tracking-widest uppercase">Asistan</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-white/10 text-white font-semibold border-l-4 border-action" 
                  : "text-indigo-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span>{item.text}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 m-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-sm font-bold truncate">{user?.username}</p>
             <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
          </div>
      </div>
    </div>
  );
}