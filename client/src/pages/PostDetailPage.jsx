import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import LikeButton from '../components/LikeButton';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`)
      .then(res => setPost(res.data.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (loading) return <p className="text-center py-20 text-gray-400">加载中...</p>;
  if (!post) return <p className="text-center py-20 text-gray-400">文章不存在</p>;

  const isAuthor = user && user.id === post.user_id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <article className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-700">{post.username}</span>
          <span className="text-gray-300">·</span>
          <span>{new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          {post.updated_at !== post.created_at && (
            <span className="text-gray-400">（已编辑）</span>
          )}
          {isAuthor && (
            <div className="ml-auto flex gap-2">
              <Link to={`/posts/${post.id}/edit`}
                className="text-blue-600 hover:text-blue-800 transition-colors">
                编辑
              </Link>
              <button onClick={handleDelete}
                className="text-red-400 hover:text-red-600 transition-colors">
                删除
              </button>
            </div>
          )}
        </div>

        <div className="prose prose-gray max-w-none mb-8 whitespace-pre-wrap leading-relaxed text-gray-800">
          {post.content}
        </div>
      </article>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <LikeButton postId={post.id} initialLiked={post.liked} initialCount={post.like_count} />
          <span className="text-sm text-gray-500">{post.comment_count} 条评论</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
}
