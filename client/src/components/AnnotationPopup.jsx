import { useState } from 'react';
import api from '../api/client';

const COLORS = ['#fef08a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa', '#d1d5db'];
const LINE_STYLES = [
  { id: 'solid', label: '━' },
  { id: 'dashed', label: '┅' },
  { id: 'wavy', label: '〜' },
];

export default function AnnotationPopup({ x, y, text, existingType, postId, onClose }) {
  const [mode, setMode] = useState(existingType || 'highlight');
  const [ulStyle, setUlStyle] = useState('solid');
  const [done, setDone] = useState(false);

  if (done) return null;

  const handleSave = async (type, color, style) => {
    setDone(true);
    // Delete existing, then create new
    await api.delete('/annotations', { data: { post_id: postId, text } }).catch(() => {});
    await api.post('/annotations', { post_id: postId, selected_text: text, start_offset: 0, type, color, style: style || 'solid' }).catch(() => {});
    onClose();
  };

  const handleRemove = async () => {
    setDone(true);
    await api.delete('/annotations', { data: { post_id: postId, text } }).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2" style={{ left: x, top: y }}>
      <div className="flex gap-1 mb-2">
        <button onClick={() => setMode('highlight')} className={`text-xs px-2 py-1 rounded ${mode === 'highlight' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>🖍</button>
        <button onClick={() => setMode('underline')} className={`text-xs px-2 py-1 rounded ${mode === 'underline' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>U̲</button>
        <button onClick={handleRemove} className="text-xs px-2 py-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 ml-1">删除</button>
        <button onClick={onClose} className="text-xs px-1.5 py-1 rounded text-gray-300 hover:text-gray-600 ml-auto">✕</button>
      </div>
      {mode === 'underline' && (
        <div className="flex gap-1 mb-2">
          {LINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setUlStyle(s.id)} className={`text-xs px-2 py-0.5 rounded border ${ulStyle === s.id ? 'border-gray-900 bg-gray-100 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{s.label}</button>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        {COLORS.map(c => (
          <button key={c} onClick={() => handleSave(mode, c, mode === 'underline' ? ulStyle : 'solid')}
            className={`w-5 h-5 rounded-full border hover:scale-110 transition-transform ${mode === 'highlight' ? 'border-gray-300' : 'border-transparent'}`}
            style={mode === 'highlight' ? { backgroundColor: c } : { borderBottom: `3px solid ${c}`, borderRadius: 0, height: '16px' }} />
        ))}
      </div>
    </div>
  );
}
