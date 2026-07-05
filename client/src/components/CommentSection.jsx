import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchComments = () => {
    api.get(`/posts/${postId}/comments`).then(res => setComments(res.data.comments));
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content });
      setContent('');
      fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('确定删除这条评论？')) return;
    await api.delete(`/posts/${postId}/comments/${commentId}`);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">评论 ({comments.length})</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <button type="submit" disabled={submitting}
            className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? '发布中...' : '发表评论'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">登录</button> 后即可评论
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无评论，来抢沙发吧</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="border-b border-gray-100 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800">{c.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  {user && user.id === c.user_id && (
                    <button onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      删除
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
