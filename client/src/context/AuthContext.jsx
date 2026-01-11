import { createContext, useState, useEffect } from "react";
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Kullanıcı Kontrolü
  useEffect(() => {
    const checkUser = async () => {
      const token = sessionStorage.getItem("token");
      const savedUser = sessionStorage.getItem("user");
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // 2. GENEL HATIRLATICI
  useEffect(() => {
    if (!user || !user.preferences?.generalNotifications) return;
    if (Notification.permission !== "granted") Notification.requestPermission();

    const frequency = user.preferences.notificationFrequency || 30;
    const intervalId = setInterval(() => {
        if (Notification.permission === "granted") {
            new Notification("🎯 Odaklanma Zamanı", {
                body: `Hey ${user.username}, hedeflerinden uzaklaşma. Çalışmaya devam et!`,
                icon: "/logo.svg",
                tag: "general-focus"
            });
        }
    }, frequency * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  // --- Login / Logout Fonksiyonları ---
  const login = (userData, token) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (newUserData) => {
    sessionStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // --- YENİ: Anlık XP Güncelleme ---
  const updateUserXP = (newXP) => {
      setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, xp: newXP };
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
      });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, updateUserXP, loading }}>
      {children}
    </AuthContext.Provider>
  );
};