import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Menu, X } from "lucide-react";
import FeedbackWidget from "./FeedbackWidget";
import AnnouncementModal from "./AnnouncementModal";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-main font-sans text-gray-800 relative">
      <AnnouncementModal />
      <FeedbackWidget />

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary transform transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:fixed md:inset-y-0`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white md:hidden"><X size={24} /></button>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <div className="md:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <h3 className="text-xl font-bold text-primary">ApriFocus</h3>
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
        </div>

        <Header />

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
}