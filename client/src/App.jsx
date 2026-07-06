import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import UserProfilePage from './pages/UserProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="text-center py-20 text-gray-400">加载中...</p>;
  }
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/posts/new" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
