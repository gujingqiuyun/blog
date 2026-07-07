import { Link } from 'react-router-dom';
import Avatar from './Avatar';

const StatsIcons = {
  like: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  comment: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  eye: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

export default function PostCard({ post, showAuthor = true, from }) {
  const views = post.view_count ?? 0;
  const linkTo = from ? `/posts/${post.id}?from=${from}` : `/posts/${post.id}`;

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors flex flex-col">
      <div className="flex-1">
        <Link to={linkTo}>
          <h2 className="text-base font-semibold text-gray-900 mb-1.5 hover:text-gray-600 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h2>
        </Link>
        {post.summary ? (
          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{post.summary}</p>
        ) : (
          <div className="flex-1" />
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {showAuthor ? (
            <Link to={`/users/${post.user_id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity min-w-0">
              <Avatar src={post.avatar} username={post.username} size="sm" />
              <span className="text-gray-500 hover:text-gray-700 font-medium transition-colors truncate">{post.username}</span>
            </Link>
          ) : (
            <span className="text-gray-400 truncate">{post.username}</span>
          )}
          <span className="text-gray-300 flex-shrink-0">{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-gray-400">
            {StatsIcons.eye}
            <span>{views}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-gray-400">
            {StatsIcons.like}
            <span>{post.like_count}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-gray-400">
            {StatsIcons.comment}
            <span>{post.comment_count}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
