import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '../api/client';
import MarkdownToolbar from '../components/MarkdownToolbar';
import { mdComponents } from '../utils/markdown';
import { useHistory } from '../utils/useHistory';

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useHistory('');
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

  if (loading) return <p className="text-gray-300 text-center py-32">加载中...</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">编辑文章</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        )}
        <input type="text" placeholder="文章标题" value={title}
          onChange={e => setTitle(e.target.value)} required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg font-semibold placeholder:text-gray-300" />
        <input type="text" placeholder="摘要（可选）" value={summary}
          onChange={e => setSummary(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder:text-gray-300" />

        {/* Split-pane editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:flex md:flex-col" style={{ height: '540px' }}>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">编辑</p>
            <MarkdownToolbar textareaRef={textareaRef} content={content} setContent={setContent} />
            <textarea ref={textareaRef} placeholder="文章内容... 支持 Markdown 语法" value={content}
              onChange={e => setContent(e.target.value)} required rows="20"
              className="w-full flex-1 px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none leading-relaxed placeholder:text-gray-300 font-mono text-sm"
            />
          </div>
          <div className="md:flex md:flex-col" style={{ height: '540px' }}>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">预览</p>
            <div id="edit-preview-pane" className="preview-pane markdown-content flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md bg-white">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdComponents}>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-300 text-sm">在左侧输入内容，这里实时预览...</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors text-sm font-medium">
            {submitting ? '保存中...' : '保存修改'}
          </button>
          <button type="button" onClick={() => navigate(`/posts/${id}`)}
            className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-md hover:bg-gray-50 transition-colors text-sm">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
