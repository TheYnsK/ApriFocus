import axios from 'axios';

// Production'da (Vercel) '/api' kullanır, Local'de 5001 portunu.
const baseURL = import.meta.env.MODE === 'production' 
  ? '/api' 
  : 'http://localhost:5001/api';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       sessionStorage.removeItem('token');
       sessionStorage.removeItem('user');
       if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
           window.location.href = '/login';
       }
    }
    return Promise.reject(error);
  }
);

export default api;