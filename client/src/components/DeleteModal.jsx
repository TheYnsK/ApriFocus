import { AlertTriangle, X, Trash2 } from "lucide-react";

export default function DeleteModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        
        <div className="p-6 text-center">
          {/* İkon Alanı */}
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">Görevi Sil?</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Bu işlem geri alınamaz. Görevi kalıcı olarak silmek istediğine emin misin?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Vazgeç
            </button>
            
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Siliniyor..." : (
                <>
                  <Trash2 size={18} /> Evet, Sil
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}