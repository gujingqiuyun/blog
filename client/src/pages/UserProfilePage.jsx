import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

function ColumnPosts({ colId, visible, onRemove }) {
  const [posts, setPosts] = useState([]);
  useEffect(() => { if (visible) api.get(`/columns/${colId}/posts`).then(r => setPosts(r.data.posts)).catch(() => {}); }, [visible, colId]);
  if (!visible) return null;
  return posts.length > 0 ? (
    <div className="ml-4 mt-2 space-y-1 border-l border-gray-100 pl-3">
      {posts.map(p => (
        <div key={p.id} className="flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 group">
          <Link to={`/posts/${p.id}`} className="truncate flex-1">· {p.title}</Link>
          <button onClick={() => onRemove(colId, p.id)} className="text-gray-300 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-xs text-gray-300 ml-4 mt-1">暂无文章</p>
  );
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stars, setStars] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [collapsedCols, setCollapsedCols] = useState({});
  const [deleteColId, setDeleteColId] = useState(null);

  // Select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [addModal, setAddModal] = useState(false);

  const isOwner = currentUser && String(currentUser.id) === String(id);

  const fetchProfile = () => {
    api.get(`/users/${id}`).then(res => { setProfile(res.data.user); setPosts(res.data.posts); })
      .catch(() => setProfile(null)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchProfile(); }, [id]);

  const fetchStars = () => { api.get(`/users/${id}/stars`).then(r => setStars(r.data.posts)).catch(() => {}); };
  const fetchColumns = () => { isOwner && api.get('/columns').then(r => setColumns(r.data.columns)).catch(() => {}); };

  useEffect(() => { if (tab === 'stars') fetchStars(); if (tab === 'columns') fetchColumns(); }, [tab, id]);

  const createColumn = async () => {
    if (!newColName.trim()) return;
    await api.post('/columns', { name: newColName.trim() });
    setNewColName('');
    fetchColumns();
  };

  const deleteColumn = async () => {
    await api.delete(`/columns/${deleteColId}`);
    setDeleteColId(null);
    fetchColumns();
  };

  const removePost = async (colId, postId) => {
    await api.delete(`/columns/${colId}/posts/${postId}`);
    // Force refetch by toggling collapse
    setCollapsedCols(p => ({ ...p, [colId]: p[colId] }));
    setTimeout(() => setCollapsedCols(p => ({ ...p, [colId]: !p[colId] })), 50);
  };

  const toggleSelect = (pid) => setSelected(p => p.includes(pid) ? p.filter(x => x !== pid) : [...p, pid]);

  const addToColumn = async (colId) => {
    for (const pid of selected) {
      try { await api.post(`/columns/${colId}/posts`, { post_id: pid }); } catch (e) {}
    }
    setSelected([]);
    setSelectMode(false);
    setAddModal(false);
    fetchColumns();
  };

  const deletePosts = async () => {
    if (!confirm(`确定删除 ${selected.length} 篇文章？此操作不可撤销。`)) return;
    for (const pid of selected) {
      try { await api.delete(`/posts/${pid}`); } catch (e) {}
    }
    setSelected([]);
    setSelectMode(false);
    fetchProfile();
  };

  // Editing state
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveUsername = async (e) => {
    e.preventDefault(); setEditError('');
    if (!newUsername.trim()) return;
    setSaving(true);
    try { const r = await api.put('/users/me', { username: newUsername.trim() }); setProfile(prev => ({ ...prev, username: r.data.user.username })); setEditing(false); window.location.reload(); }
    catch (err) { setEditError(err.response?.data?.error || '修改失败'); } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('确定要删除你的账号吗？\n\n此操作不可撤销。')) return;
    try { await api.delete('/users/me'); logout(); navigate('/'); } catch (err) { alert(err.response?.data?.error || '删除失败'); }
  };

  if (loading) return <p className="text-gray-300 text-center py-32">加载中...</p>;
  if (!profile) return (
    <div className="max-w-4xl mx-auto px-4 py-32 text-center">
      <p className="text-gray-300 text-lg">用户不存在</p>
      <Link to="/" className="text-gray-400 text-sm mt-2 inline-block hover:text-gray-700 hover:underline transition-colors">返回首页</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/')} className="text-sm text-gray-300 hover:text-gray-600 mb-8 inline-block transition-colors">← 返回</button>
      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8 md:items-start">
        <div className="md:sticky md:top-20">
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="flex flex-col items-center text-center">
              <Avatar src={profile.avatar} username={profile.username} size="lg" />
              {editing ? (
                <form onSubmit={handleSaveUsername} className="w-full max-w-xs space-y-3">
                  {editError && <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{editError}</p>}
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="新用户名" required autoFocus className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-center" />
                  <div className="flex gap-2 justify-center">
                    <button type="submit" disabled={saving} className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-800 disabled:opacity-40 transition-colors">{saving ? '保存中...' : '保存'}</button>
                    <button type="button" onClick={() => setEditing(false)} className="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-md text-sm hover:bg-gray-50 transition-colors">取消</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{profile.username}</h1>
                  <p className="text-sm text-gray-400">注册于 {new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm text-gray-400 mb-4">共发表 <span className="text-gray-600 font-medium">{profile.post_count}</span> 篇文章</p>
                  {isOwner && (
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <label className="cursor-pointer text-sm text-gray-400 hover:text-gray-700 transition-colors">更换头像
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('avatar', f); try { const r = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setProfile(prev => ({ ...prev, avatar: r.data.user.avatar })); } catch (err) { alert(err.response?.data?.error || '上传失败'); } }} />
                      </label>
                      <button onClick={() => { setNewUsername(profile.username); setEditing(true); }} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">编辑资料</button>
                      <button onClick={handleDeleteAccount} className="text-sm text-gray-300 hover:text-red-500 transition-colors">删除账号</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 mb-5">
            <div className="flex gap-1">
              {[['posts', '文章'], ['columns', '专栏'], ['stars', '收藏夹']].map(([key, label]) => (
                <button key={key} onClick={() => { setTab(key); setSelectMode(false); setSelected([]); }} className={`text-sm px-3 py-1.5 -mb-px transition-colors ${tab === key ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600'}`}>{label}</button>
              ))}
            </div>
            {tab === 'posts' && isOwner && posts.length > 0 && (
              <div className="flex gap-2">
                {selectMode ? (
                  <>
                    <button onClick={() => { setSelected([]); setSelectMode(false); }} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                    {selected.length > 0 && (
                      <>
                        <button onClick={() => setAddModal(true)} className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800">添加到专栏</button>
                        <button onClick={deletePosts} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">删除</button>
                      </>
                    )}
                  </>
                ) : (
                  <button onClick={() => setSelectMode(true)} className="text-xs text-gray-400 hover:text-gray-600">选择</button>
                )}
              </div>
            )}
          </div>

          {/* Posts tab */}
          {tab === 'posts' && (posts.length === 0 ? <div className="text-center py-16"><p className="text-gray-300 text-lg">暂无文章</p></div> : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex items-start gap-2">
                  {selectMode && <input type="checkbox" checked={selected.includes(post.id)} onChange={() => toggleSelect(post.id)} className="mt-4" />}
                  <div className="flex-1"><PostCard post={post} showAuthor={false} from="profile" /></div>
                </div>
              ))}
            </div>
          ))}

          {/* Stars tab */}
          {tab === 'stars' && (stars.length === 0 ? <div className="text-center py-16"><p className="text-gray-300 text-lg">暂无收藏</p></div> : <div className="space-y-3">{stars.map(post => (<PostCard key={post.id} post={post} showAuthor={true} from="profile" />))}</div>)}

          {/* Columns tab */}
          {tab === 'columns' && isOwner && (
            <div>
              <div className="flex gap-2 mb-4">
                <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="新建专栏..." className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <button onClick={createColumn} className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-800">创建</button>
              </div>
              {columns.length === 0 ? <p className="text-gray-300 text-sm text-center py-10">暂无专栏</p> : (
                <div className="space-y-3">
                  {columns.map(col => (
                    <div key={col.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => setCollapsedCols(p => ({ ...p, [col.id]: !p[col.id] }))} className="font-medium text-gray-800 hover:text-gray-600 transition-colors">
                          <span className="mr-1">{collapsedCols[col.id] ? '📁' : '📂'}</span>{col.name}
                        </button>
                        <button onClick={() => setDeleteColId(col.id)} className="text-gray-300 hover:text-red-400 text-xs transition-colors">删除</button>
                      </div>
                      <ColumnPosts colId={col.id} visible={!collapsedCols[col.id]} onRemove={removePost} />
                    </div>
                  ))}
                </div>
              )}
              <Modal open={!!deleteColId} title="删除专栏" message="文章不会被删除，只是移出专栏。" confirmText="删除" danger onConfirm={deleteColumn} onCancel={() => setDeleteColId(null)} />
            </div>
          )}
          {tab === 'columns' && !isOwner && <div className="text-center py-16"><p className="text-gray-300 text-sm">暂无公开专栏</p></div>}

          {/* Add to column modal */}
          {addModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddModal(false)}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">添加到专栏</h3>
                <p className="text-sm text-gray-400 mb-3">已选 {selected.length} 篇文章</p>
                <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
                  {columns.map(col => (
                    <button key={col.id} onClick={() => addToColumn(col.id)}
                      className="block w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      📁 {col.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAddModal(false)} className="text-sm text-gray-400 hover:text-gray-600">取消</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
