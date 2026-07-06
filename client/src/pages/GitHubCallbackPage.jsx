import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function GitHubCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
      window.location.reload();
    } else {
      navigate('/login?error=github_failed');
    }
  }, []);

  return <p className="text-gray-400 text-center py-32">登录中...</p>;
}
