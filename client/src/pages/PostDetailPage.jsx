import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import LikeButton from '../components/LikeButton';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getReadingStats } from '../utils/reading';
import SidePanels from '../components/SidePanels';
import { mdComponents } from '../utils/markdown';

export default function PostDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [starred, setStarred] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);
  const lastViewed = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`)
      .then(res => setPost(res.data.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));

    if (lastViewed.current !== id) {
      lastViewed.current = id;
      api.post(`/posts/${id}/view`).catch(() => {});
    }

    if (user) {
      api.get(`/posts/${id}/star`).then(r => setStarred(r.data.starred)).catch(() => {});
    }
  }, [id, user]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (y < lastScrollY.current && y > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const toggleStar = async () => {
    if (!user) return navigate('/login');
    const r = await api.post(`/posts/${id}/star`);
    setStarred(r.data.starred);
  };

  const handleDelete = async () => {
    setDeleteModal(false);
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (loading) return <p className="text-gray-300 text-center py-32">加载中...</p>;
  if (!post) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-300 text-lg">文章不存在</p>
      <Link to="/" className="text-gray-500 text-sm mt-2 inline-block hover:text-gray-900 hover:underline transition-colors">返回首页</Link>
    </div>
  );

  const isAuthor = user && user.id === post.user_id;
  const stats = post ? getReadingStats(post.content) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back nav */}
      <button onClick={() => navigate(from === 'profile' && user ? `/users/${user.id}` : '/')} className="text-sm text-gray-300 hover:text-gray-600 mb-8 inline-block transition-colors">
        ← 返回
      </button>

      {/* Article */}
      <article>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight leading-snug">{post.title}</h1>

        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Link to={`/users/${post.user_id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Avatar src={post.avatar} username={post.username} size="md" />
              <span className="font-medium text-gray-600 hover:text-gray-900 transition-colors">{post.username}</span>
            </Link>
            <span className="text-gray-200">·</span>
            <span>{new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {post.updated_at !== post.created_at && (
              <span className="text-gray-300">（已编辑）</span>
            )}
            {isAuthor && (
              <div className="ml-auto flex gap-3">
                <Link to={`/posts/${post.id}/edit`}
                  className="text-gray-400 hover:text-gray-700 transition-colors">
                  编辑
                </Link>
                <button onClick={() => setDeleteModal(true)}
                  className="text-gray-300 hover:text-red-500 transition-colors">
                  删除
                </button>
              </div>
            )}
          </div>
          {stats && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
              <span className="inline-flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {post.view_count ?? 0} 次阅读
              </span>
              <span className="inline-flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                约 {stats.totalWords.toLocaleString()} 字
              </span>
              {stats.codeLines > 0 && (
                <span className="inline-flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  {stats.codeLines} 行代码
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                预计阅读 {stats.readingTime} 分钟
              </span>
            </div>
          )}
        </div>

        <div className="markdown-content text-base mb-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdComponents}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Actions bar */}
      <div className="flex items-center gap-4 py-5 border-t border-b border-gray-200 mb-10">
        <LikeButton postId={post.id} initialLiked={post.liked} initialCount={post.like_count} />
        <button onClick={toggleStar} title={starred ? '取消收藏' : '收藏'} className={`text-sm transition-colors ${starred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}>
          {starred ? '★' : '☆'}
        </button>
        <span className="text-sm text-gray-300">{post.comment_count} 条评论</span>
      </div>

      {/* Comments */}
      <CommentSection postId={post.id} />

      {/* Side panels */}
      <SidePanels authorId={post.user_id} content={post.content} currentPostId={post.id} />

      {/* Scroll to top */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0 })}
          className="fixed top-[70px] left-1/2 -translate-x-1/2 z-40 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      )}

      <Modal
        open={deleteModal}
        title="删除文章"
        message="确定要删除这篇文章吗？此操作不可撤销。"
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}
