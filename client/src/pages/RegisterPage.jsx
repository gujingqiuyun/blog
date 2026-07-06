import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">注册</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        )}
        <input type="text" placeholder="用户名" value={username}
          onChange={e => setUsername(e.target.value)} required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder:text-gray-300" />
        <input type="email" placeholder="邮箱" value={email}
          onChange={e => setEmail(e.target.value)} required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder:text-gray-300" />
        <input type="password" placeholder="密码（至少6位）" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder:text-gray-300" />
        <button type="submit" disabled={submitting}
          className="w-full bg-gray-900 text-white py-2.5 rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors text-sm font-medium">
          {submitting ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="text-sm text-gray-400 text-center mt-6">
        已有账号？<Link to="/login" className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">去登录</Link>
      </p>
    </div>
  );
}
