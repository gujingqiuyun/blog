import { useEffect } from 'react';

export default function Modal({ open, title, message, confirmText = '确定', cancelText = '取消', danger, onConfirm, onCancel }) {
  useEffect(() => {
    if (open) {
      const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-5 whitespace-pre-wrap">{message}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
