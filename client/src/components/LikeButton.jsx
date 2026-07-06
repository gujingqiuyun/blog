import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LikeButton({ postId, initialLiked, initialCount }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await api.post(`/posts/${postId}/like`);
    setLiked(res.data.liked);
    setCount(prev => res.data.liked ? prev + 1 : prev - 1);
  };

  return (
    <button onClick={handleLike}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors
        ${liked
          ? 'border-gray-900 bg-gray-50 text-gray-900'
          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-400 hover:text-gray-600'}`}>
      <span>{liked ? '♥' : '♡'}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}
