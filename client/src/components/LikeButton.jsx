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
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await api.post(`/posts/${postId}/like`);
    setLiked(res.data.liked);
    setCount(prev => res.data.liked ? prev + 1 : prev - 1);
  };

  return (
    <button onClick={handleLike}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all
        ${liked
          ? 'border-red-300 bg-red-50 text-red-500'
          : 'border-gray-300 bg-white text-gray-500 hover:border-red-300'}`}>
      <span className="text-base">{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}
