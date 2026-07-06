import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwner = currentUser && String(currentUser.id) === String(id);

  const fetchProfile = () => {
    api.get(`/users/${id}`)
      .then(res => {
        setProfile(res.data.user);
        setPosts(res.data.posts);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, [id]);

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!newUsername.trim()) return;
    setSaving(true);
    try {
      const res = await api.put('/users/me', { username: newUsername.trim() });
      setProfile(prev => ({ ...prev, username: res.data.user.username }));
      setEditing(false);
      window.location.reload();
    } catch (err) {
      setEditError(err.response?.data?.error || '修改失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('确定要删除你的账号吗？\n\n此操作不可撤销，你的所有文章、评论、点赞都将被永久删除。')) return;
    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (loading) {
    return <p className="text-gray-300 text-center py-32">加载中...</p>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center">
        <p className="text-gray-300 text-lg">用户不存在</p>
        <Link to="/" className="text-gray-400 text-sm mt-2 inline-block hover:text-gray-700 hover:underline transition-colors">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-gray-300 hover:text-gray-600 mb-8 inline-block transition-colors">
        ← 返回首页
      </Link>

      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8 md:items-start">
        {/* Left — profile card */}
        <div className="md:sticky md:top-20">
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="flex flex-col items-center text-center">
              <Avatar src={profile.avatar} username={profile.username} size="lg" />

              {editing ? (
                <form onSubmit={handleSaveUsername} className="w-full max-w-xs space-y-3">
                  {editError && (
                    <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{editError}</p>
                  )}
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                    placeholder="新用户名" required autoFocus
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-center" />
                  <div className="flex gap-2 justify-center">
                    <button type="submit" disabled={saving}
                      className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-800 disabled:opacity-40 transition-colors">
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{profile.username}</h1>
                  <p className="text-sm text-gray-400">
                    注册于 {new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    共发表 <span className="text-gray-600 font-medium">{profile.post_count}</span> 篇文章
                  </p>
                  {isOwner && (
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <label className="cursor-pointer text-sm text-gray-400 hover:text-gray-700 transition-colors">
                        更换头像
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('avatar', file);
                            try {
                              const res = await api.post('/users/me/avatar', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              setProfile(prev => ({ ...prev, avatar: res.data.user.avatar }));
                            } catch (err) {
                              alert(err.response?.data?.error || '上传失败');
                            }
                          }}
                        />
                      </label>
                      <button onClick={() => { setNewUsername(profile.username); setEditing(true); }}
                        className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                        编辑资料
                      </button>
                      <button onClick={handleDeleteAccount}
                        className="text-sm text-gray-300 hover:text-red-500 transition-colors">
                        删除账号
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right — posts */}
        <div>
          <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">TA 的文章</h2>
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-300 text-lg mb-1">暂无文章</p>
              <p className="text-gray-300 text-sm">TA 还没有发布任何内容</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard key={post.id} post={post} showAuthor={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
