import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { Loader2, AlertTriangle } from "lucide-react";

export default function VerifyRegister() {
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Backend’in beklediği body büyük ihtimalle: { email, code }
      const res = await api.post("/auth/verify-register", {
            email: email.trim().toLowerCase(),
            code: code.trim().toUpperCase()
            });


      // verify başarılıysa genelde token + user döner
      if (res.data?.token && res.data?.user) {
        // AuthContext login fonksiyonunu burada da kullanmak istersen ekleyebilirsin.
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
      } else {
        // Token dönmüyorsa login'e yönlendir
        navigate("/login");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Doğrulama başarısız.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Kayıt Doğrulama</h1>
        <p className="text-sm text-gray-600 mb-6">
          Mailine gelen doğrulama kodunu gir.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              E-Posta
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-100 outline-none"
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Doğrulama Kodu
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-100 outline-none tracking-widest text-center font-black"
              placeholder="123456"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-indigo-700 text-white py-3 rounded-2xl font-black"
            type="submit"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Doğrula"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-700 font-black hover:underline">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
