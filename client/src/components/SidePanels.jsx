import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { extractTOC, buildTOCTree } from '../utils/toc';

export default function SidePanels({ authorId, content, currentPostId }) {
  const [authorPosts, setAuthorPosts] = useState([]);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeH1, setActiveH1] = useState(null);
  const [expandedH1, setExpandedH1] = useState(null);
  const TRIGGER_W = 'w-[200px]';
  const toc = useMemo(() => extractTOC(content), [content]);
  const tocTree = useMemo(() => buildTOCTree(toc), [toc]);

  useEffect(() => {
    if (!authorId) return;
    api.get(`/users/${authorId}`).then(res => {
      setAuthorPosts(res.data.posts.filter(p => String(p.id) !== String(currentPostId)));
    }).catch(() => {});
  }, [authorId, currentPostId]);

  // Track which H1 section is currently in view
  useEffect(() => {
    if (tocTree.length === 0) return;
    const ids = tocTree.map(h => h.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveH1(e.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocTree]);

  // Expand the active H1
  useEffect(() => {
    if (activeH1) setExpandedH1(activeH1);
  }, [activeH1]);

  if (!authorId && toc.length === 0) return null;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Left panel — author's posts */}
      <div className={`hidden md:block fixed left-0 top-[56px] bottom-0 z-20 ${TRIGGER_W}`}
        onMouseEnter={() => setLeftOpen(true)} onMouseLeave={() => setLeftOpen(false)}>
        <div className={`h-full overflow-y-auto bg-white border-r border-gray-200 shadow-lg transition-all duration-200 absolute left-0 ${leftOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 w-64">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">作者其他文章</h3>
            {authorPosts.length === 0 ? (
              <p className="text-xs text-gray-300">暂无其他文章</p>
            ) : (
              <div className="space-y-0.5">
                {authorPosts.map(p => (
                  <Link key={p.id} to={`/posts/${p.id}`}
                    className="block text-sm text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50 transition-colors line-clamp-2 leading-snug">
                    {p.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — TOC */}
      {tocTree.length > 0 && (
        <div className={`hidden md:block fixed right-0 top-[56px] bottom-0 z-20 ${TRIGGER_W}`}
          onMouseEnter={() => setRightOpen(true)} onMouseLeave={() => setRightOpen(false)}>
          <div className={`h-full overflow-y-auto bg-white border-l border-gray-200 shadow-lg transition-all duration-200 absolute right-0 ${rightOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <div className="p-4 w-64">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">目录</h3>
              <nav className="space-y-0.5">
                {tocTree.map(h1 => {
                  const isExpanded = expandedH1 === h1.id;
                  return (
                    <div key={h1.id}>
                      <button
                        onClick={() => {
                          setExpandedH1(isExpanded ? null : h1.id);
                          scrollTo(h1.id);
                        }}
                        className={`w-full text-left text-sm py-1 px-2 rounded transition-colors line-clamp-2 leading-snug flex items-start gap-1
                          ${activeH1 === h1.id ? 'text-gray-900 font-medium bg-gray-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                        <span className={`text-xs transition-transform mt-0.5 ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                        {h1.text}
                      </button>
                      {isExpanded && h1.children.length > 0 && (
                        <div className="ml-4 border-l border-gray-100 pl-2 space-y-0.5">
                          {h1.children.map(h2 => (
                            <button key={h2.id}
                              onClick={() => scrollTo(h2.id)}
                              className="block w-full text-left text-xs text-gray-500 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50 transition-colors line-clamp-2 leading-snug">
                              {h2.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
