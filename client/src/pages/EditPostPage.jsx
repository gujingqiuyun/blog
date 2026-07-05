import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/posts/${id}`).then(res => {
      const p = res.data.post;
      setTitle(p.title);
      setSummary(p.summary);
      setContent(p.content);
      setLoading(false);
    }).catch(() => {
      setError('文章不存在');
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/posts/${id}`, { title, content, summary });
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center py-20 text-gray-400">加载中...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑文章</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div>
          <input type="text" placeholder="文章标题" value={title}
            onChange={e => setTitle(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium" />
        </div>
        <div>
          <input type="text" placeholder="摘要（可选）" value={summary}
            onChange={e => setSummary(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
        </div>
        <div>
          <textarea placeholder="文章内容..." value={content}
            onChange={e => setContent(e.target.value)} required rows="16"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? '保存中...' : '保存修改'}
          </button>
          <button type="button" onClick={() => navigate(`/posts/${id}`)}
            className="text-gray-500 px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
