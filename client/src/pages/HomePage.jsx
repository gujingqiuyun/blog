import { useState, useEffect } from 'react';
import api from '../api/client';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts')
      .then(res => setPosts(res.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-300 text-center py-32">加载中...</p>;
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Reverie</h1>
          <p className="text-gray-400 leading-relaxed max-w-md mx-auto">
            因为时间永远分岔<span className="hidden md:inline"> </span><br className="md:hidden" />通向无数的未来
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Posts */}
        <section>
          <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">最新文章</h2>
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg mb-2">还没有文章</p>
              <p className="text-gray-300 text-sm">成为第一个作者吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
