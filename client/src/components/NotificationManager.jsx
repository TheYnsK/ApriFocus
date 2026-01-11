import { useEffect, useRef, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

let permissionRequested = false;

export default function NotificationManager() {
    const { user } = useContext(AuthContext);
    const notifiedTasksRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);
    const taskNotificationsEnabled = user?.preferences?.taskNotifications ?? true;

    useEffect(() => {
        if (!user || permissionRequested) return;
        if (Notification.permission === 'default') {
            permissionRequested = true;
            Notification.requestPermission();
        }
    }, [user]);

    useEffect(() => {
        if (!user || !taskNotificationsEnabled) return;

        const checkAndNotify = async () => {
            if (Notification.permission !== "granted") return;
            try {
                const res = await api.get("/todos");
                const todos = Array.isArray(res.data) ? res.data : [];
                const now = new Date();

                todos.forEach((todo) => {
                    if (todo.isMaster || !todo.dueDate) return;
                    if (todo.status === 'completed') {
                        if (notifiedTasksRef.current.has(todo._id)) notifiedTasksRef.current.delete(todo._id);
                        return;
                    }

                    const dueDate = new Date(todo.dueDate);
                    const reminderMinutes = todo.reminderTime || 0;
                    const notificationTime = new Date(dueDate.getTime() - reminderMinutes * 60000);
                    const diff = notificationTime - now;

                    if (diff <= 0) {
                        if (isFirstLoadRef.current) {
                            notifiedTasksRef.current.add(todo._id);
                            return; 
                        }
                        if (diff > -10 * 60000 && !notifiedTasksRef.current.has(todo._id)) {
                            new Notification(`Hatırlatma: ${todo.title}`, {
                                body: `Zamanı geldi! (${new Date(todo.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
                                icon: "/logo.svg",
                                tag: todo._id
                            });
                            notifiedTasksRef.current.add(todo._id);
                        }
                    } 
                    else if (diff > 0) {
                        if (notifiedTasksRef.current.has(todo._id)) notifiedTasksRef.current.delete(todo._id);
                    }
                });

                if (isFirstLoadRef.current) isFirstLoadRef.current = false;
            } catch (error) {
                if (error.response && error.response.status !== 401) console.error("Bildirim hatası:", error);
            }
        };

        checkAndNotify();
        const interval = setInterval(checkAndNotify, 5 * 1000);
        return () => clearInterval(interval);
    }, [user, taskNotificationsEnabled]);

    return null;
}