import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

function CommentLike({ commentId, postId, initialLiked, initialCount }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggle = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await api.post(`/posts/${postId}/comments/${commentId}/like`);
    setLiked(res.data.liked);
    setCount(prev => res.data.liked ? prev + 1 : prev - 1);
  };

  return (
    <button onClick={toggle}
      className={`inline-flex items-center gap-1 text-xs transition-colors ${liked ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
      <span>{liked ? '♥' : '♡'}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function CommentItem({ comment, postId, onDelete, onReply, depth = 0 }) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplySubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content: replyContent, parent_id: comment.id });
      setReplyContent('');
      setReplyOpen(false);
      onReply();
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{comment.username}</span>
          <span className="text-xs text-gray-300">
            {new Date(comment.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
        {user && user.id === comment.user_id && (
          <button onClick={() => onDelete(comment.id)}
            className="text-xs text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
            删除
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-2">{comment.content}</p>

      <div className="flex items-center gap-4">
        <CommentLike
          commentId={comment.id}
          postId={postId}
          initialLiked={comment.liked}
          initialCount={comment.like_count || 0}
        />
        {depth === 0 && user && (
          <button onClick={() => setReplyOpen(!replyOpen)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {replyOpen ? '取消回复' : '回复'}
          </button>
        )}
      </div>

      {replyOpen && (
        <form onSubmit={handleReplySubmit} className="mt-3 ml-0">
          <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder={`回复 ${comment.username}...`}
            rows="2"
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-xs placeholder:text-gray-300"
          />
          <button type="submit" disabled={replySubmitting}
            className="mt-1.5 bg-gray-900 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-800 disabled:opacity-40 transition-colors">
            {replySubmitting ? '发送中...' : '回复'}
          </button>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-5 mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
          {comment.replies.map(reply => (
            <div key={reply.id}>
              <div className="flex items-start justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{reply.username}</span>
                  <span className="text-xs text-gray-300">
                    {new Date(reply.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {user && user.id === reply.user_id && (
                  <button onClick={() => onDelete(reply.id)}
                    className="text-xs text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    删除
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-1.5">{reply.content}</p>
              <CommentLike
                commentId={reply.id}
                postId={postId}
                initialLiked={reply.liked}
                initialCount={reply.like_count || 0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchComments = () => {
    api.get(`/posts/${postId}/comments`).then(res => setComments(res.data.comments));
  };

  useEffect(() => { fetchComments(); }, [postId]);

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

  const handleDelete = async () => {
    const commentId = deleteTarget;
    setDeleteTarget(null);
    if (!commentId) return;
    await api.delete(`/posts/${postId}/comments/${commentId}`);
    fetchComments();
  };

  // Total = top-level + nested replies
  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-5">评论 ({totalCount})</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="说点什么~\(≥▽≤)/~"
            rows="3"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm placeholder:text-gray-300"
          />
          <button type="submit" disabled={submitting}
            className="mt-2 bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-800 disabled:opacity-40 transition-colors">
            {submitting ? '发布中...' : '发表评论'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-400 mb-8">
          <button onClick={() => navigate('/login')} className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">登录</button> 后即可评论
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-300 text-sm text-center py-8">暂无评论</p>
      ) : (
        <div className="space-y-5">
          {comments.map(c => (
            <div key={c.id} className="border-b border-gray-50 pb-4 last:border-0">
              <CommentItem
                comment={c}
                postId={postId}
                onDelete={setDeleteTarget}
                onReply={fetchComments}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="删除评论"
        message="确定要删除这条评论吗？"
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
