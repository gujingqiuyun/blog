import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { extractTOC } from '../utils/toc';

export default function SidePanels({ authorId, content, currentPostId }) {
  const [authorPosts, setAuthorPosts] = useState([]);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const toc = extractTOC(content);
  const TRIGGER_W = 'w-[200px]';

  useEffect(() => {
    if (!authorId) return;
    api.get(`/users/${authorId}`).then(res => {
      setAuthorPosts(res.data.posts.filter(p => String(p.id) !== String(currentPostId)));
    }).catch(() => {});
  }, [authorId, currentPostId]);

  if (!authorId && toc.length === 0) return null;

  return (
    <>
      {/* Left panel */}
      <div
        className={`hidden md:block fixed left-0 top-[56px] bottom-0 z-20 ${TRIGGER_W}`}
        onMouseEnter={() => setLeftOpen(true)}
        onMouseLeave={() => setLeftOpen(false)}>
        <div className={`h-full overflow-y-auto bg-white border-r border-gray-200 shadow-lg transition-all duration-200 absolute left-0 ${leftOpen ? 'w-56 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 w-56">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">作者其他文章</h3>
            {authorPosts.length === 0 ? (
              <p className="text-xs text-gray-300">暂无其他文章</p>
            ) : (
              <div className="space-y-0.5">
                {authorPosts.map(p => (
                  <Link key={p.id} to={`/posts/${p.id}`}
                    className="block text-sm text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50 transition-colors truncate">
                    {p.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      {toc.length > 0 && (
        <div
          className={`hidden md:block fixed right-0 top-[56px] bottom-0 z-20 ${TRIGGER_W}`}
          onMouseEnter={() => setRightOpen(true)}
          onMouseLeave={() => setRightOpen(false)}>
          <div className={`h-full overflow-y-auto bg-white border-l border-gray-200 shadow-lg transition-all duration-200 absolute right-0 ${rightOpen ? 'w-56 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <div className="p-4 w-56">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">目录</h3>
              <nav className="space-y-0.5">
                {toc.map((h, i) => (
                  <a key={i} href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="block text-sm text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50 transition-colors truncate"
                    style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}>
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
