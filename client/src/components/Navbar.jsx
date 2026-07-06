import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gray-900 tracking-tight">
          Reverie
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">首页</Link>
          {user ? (
            <>
              <Link to={`/users/${user.id}`}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                <Avatar src={user.avatar} username={user.username} size="sm" />
                {user.username}
              </Link>
              <Link to="/posts/new"
                className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors text-xs">
                写文章
              </Link>
              <button onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-500 hover:text-gray-900 transition-colors">登录</Link>
              <Link to="/register"
                className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors text-xs">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
