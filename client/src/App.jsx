import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext, useEffect } from "react";
import api from "./api/axios";
import Layout from "./components/Layout";

// Sayfaları İçe Aktar
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import Settings from "./pages/Settings";
import NotesPage from "./pages/NotesPage";
import VerifyRegister from "./pages/VerifyRegister";


// ADMIN PAGES
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  // AppRoutes içindeki useEffect kısmını bununla değiştir
useEffect(() => {
  if (user && user.role !== 'admin') {
    const checkAnnouncements = async () => {
      try {
        const res = await api.get("/admin/announcement"); 
        if (res.data) {
          // sessionStorage yerine localStorage kullanıyoruz (Kalıcı hafıza)
          const lastReadId = localStorage.getItem('lastReadAnnouncementId');
          
          // Eğer çekilen duyuru ID'si, hafızadakinden farklıysa (Yeni duyuru gelmişse)
          if (lastReadId !== res.data._id) {
            window.dispatchEvent(new CustomEvent('newAnnouncement', { detail: res.data }));
          }
        }
      } catch (err) { console.error("Duyuru kontrol hatası:", err); }
    };

    // Sayfa ilk açıldığında kontrol et (Offline iken yayınlananları yakalar)
    checkAnnouncements();

    // Ardından her 15 saniyede bir kontrol etmeye devam et
    const interval = setInterval(checkAnnouncements, 15000); 
    return () => clearInterval(interval);
  }
}, [user]);

  if (loading) return null;

  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return <Layout>{children}</Layout>;
  };

  const AdminRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/admin" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/verify-register" element={!user ? <VerifyRegister /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}