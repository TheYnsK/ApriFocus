import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user } = useContext(AuthContext);

  return (
    <div className="h-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-soft">
      <div>
        <h2 className="text-xl font-bold text-gray-800">
          Hoşgeldin, <span className="text-action">{user?.username}</span> 👋
        </h2>
        <p className="text-sm text-gray-500">Bugün hedeflerine odaklanma günü.</p>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {user?.role === 'guest' && (
           <div className="hidden md:block bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-xs font-bold border border-orange-200 animate-pulse">
             Misafir Modu
           </div>
        )}

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 overflow-hidden relative shadow-sm">
             {user?.avatar ? (
                <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                   {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
             )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-700">{user?.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
}