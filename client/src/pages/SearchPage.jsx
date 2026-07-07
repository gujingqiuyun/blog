import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import Avatar from '../components/Avatar';

function highlightSnippet(snippet, query) {
  if (!snippet || !query) return '';
  // Strip all existing <mark> tags + markdown noise
  let text = snippet
    .replace(/<\/?mark>/gi, '')
    .replace(/[#*>`\-\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Escape query for regex, highlight only exact keyword matches
  const terms = query.split(/[\s,，]+/).filter(Boolean);
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'gi'), '<mark>$&</mark>');
  }
  return text;
}

function SearchCard({ post, query }) {
  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <Link to={`/posts/${post.id}`}>
        <h2 className="text-base font-semibold text-gray-900 mb-1 hover:text-gray-600 transition-colors line-clamp-1">
          {post.title}
        </h2>
      </Link>
      {post.snippet ? (
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: highlightSnippet(post.snippet, query) }} />
      ) : post.summary ? (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{post.summary}</p>
      ) : (
        <p className="text-sm text-gray-400 mb-3 line-clamp-1">{post.content?.slice(0, 100)}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Avatar src={post.avatar} username={post.username} size="sm" />
        <span>{post.username}</span>
        <span className="text-gray-300">·</span>
        <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        <span className="text-gray-300">·</span>
        <span>{post.view_count ?? 0} 阅读</span>
      </div>
    </article>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setPosts([]); return; }
    setLoading(true);
    api.get(`/posts/search?q=${encodeURIComponent(q)}`)
      .then(res => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-gray-300 hover:text-gray-600 mb-6 inline-block transition-colors">
        ← 返回
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
        {q ? `搜索「${q}」` : '搜索'}
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        {loading ? '搜索中...' : `找到 ${posts.length} 篇文章`}
      </p>

      {posts.length === 0 && !loading ? (
        <div className="text-center py-20">
          <p className="text-gray-300 text-lg">没有找到相关内容</p>
          <p className="text-gray-300 text-sm mt-1">试试其他关键词</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <SearchCard key={post.id} post={post} query={q} />
          ))}
        </div>
      )}
    </div>
  );
}
