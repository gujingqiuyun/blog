import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <article className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <Link to={`/posts/${post.id}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
      </Link>
      {post.summary && (
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{post.summary}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>{post.username}</span>
          <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{post.like_count} 赞</span>
          <span>{post.comment_count} 评论</span>
        </div>
      </div>
    </article>
  );
}
