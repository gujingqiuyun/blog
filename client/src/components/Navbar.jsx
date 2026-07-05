import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          MyBlog
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/posts/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                写文章
              </Link>
              <span className="text-sm text-gray-600">{user.username}</span>
              <button onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">登录</Link>
              <Link to="/register"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
