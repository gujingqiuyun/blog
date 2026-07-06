import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/posts', { title, content, summary });
      navigate(`/posts/${res.data.post.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">写文章</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        )}
        <input type="text" placeholder="文章标题" value={title}
          onChange={e => setTitle(e.target.value)} required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg font-semibold placeholder:text-gray-300" />
        <div className="relative">
          <input type="text" placeholder="摘要（可选，最多 100 字）" value={summary}
            onChange={e => setSummary(e.target.value)} maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder:text-gray-300 pr-12" />
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${summary.length >= 90 ? 'text-red-400' : summary.length > 0 ? 'text-gray-400' : 'text-gray-300'}`}>
            {summary.length}/100
          </span>
        </div>

        {/* Split-pane editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Editor */}
          <div>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">编辑</p>
            <textarea
              placeholder="开始写作... 支持 Markdown 语法" value={content}
              onChange={e => setContent(e.target.value)} required rows="20"
              className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none leading-relaxed placeholder:text-gray-300 font-mono text-sm md:h-[500px]"
            />
          </div>
          {/* Right: Preview */}
          <div>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">预览</p>
            <div className="preview-pane markdown-content md:h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-md bg-white">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-300 text-sm">在左侧输入内容，这里实时预览...</p>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors text-sm font-medium">
          {submitting ? '发布中...' : '发布'}
        </button>
      </form>
    </div>
  );
}
