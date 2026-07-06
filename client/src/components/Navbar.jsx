import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Clear search when leaving search page
  useEffect(() => {
    if (!location.pathname.startsWith('/search')) {
      setSearch('');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/" className="text-lg font-semibold text-gray-900 tracking-tight">
            Reverie
          </Link>
          <form onSubmit={handleSearch} className="hidden sm:block">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="w-28 lg:w-48 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-300 placeholder:text-gray-300 bg-gray-50" />
          </form>
        </div>

        {/* Right — desktop */}
        <div className="hidden sm:flex items-center gap-5 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">首页</Link>
          {user ? (
            <>
              <Link to={`/users/${user.id}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                <Avatar src={user.avatar} username={user.username} size="sm" />
                {user.username}
              </Link>
              <Link to="/posts/new" className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors text-xs">写文章</Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-500 hover:text-gray-900 transition-colors">登录</Link>
              <Link to="/register" className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors text-xs">注册</Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
          <form onSubmit={handleSearch}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300 bg-gray-50" />
          </form>
          <Link to="/" onClick={closeMenu} className="block text-sm text-gray-600">首页</Link>
          {user ? (
            <>
              <Link to={`/users/${user.id}`} onClick={closeMenu} className="block text-sm text-gray-600">{user.username}</Link>
              <Link to="/posts/new" onClick={closeMenu} className="block text-sm text-gray-900 font-medium">写文章</Link>
              <button onClick={handleLogout} className="block text-sm text-gray-400">退出</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="block text-sm text-gray-600">登录</Link>
              <Link to="/register" onClick={closeMenu} className="block text-sm text-gray-900 font-medium">注册</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
