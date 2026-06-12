import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/format';
import { Shield, ShieldAlert, User, Trash2, Edit2, CheckCircle2, Plus } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', username: '', password: '', role: 'viewer', status: 'active' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/users/${editingId}`, formData);
        setIsEditing(false);
        setEditingId(null);
      } else {
        await api.post('/users', formData);
        setShowAdd(false);
      }
      setFormData({ name: '', email: '', username: '', password: '', role: 'viewer', status: 'active' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '', // Leave empty for no change if the backend supports it, or handle separately
      role: user.role,
      status: user.status
    });
    setEditingId(user.id);
    setIsEditing(true);
    setShowAdd(true);
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${id}`, { status: newStatus });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) return alert('Cannot delete yourself.');
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">User Management</h1>
          <p className="text-muted text-sm mt-1">Manage system access and permissions for your team.</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setIsEditing(false); setFormData({ name: '', email: '', username: '', password: '', role: 'viewer', status: 'active' }); }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center transition-all font-bold shadow-lg shadow-primary/20 text-sm">
          <Plus size={20} className="mr-2" /> {showAdd && !isEditing ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border shadow-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-xl font-bold text-text">{isEditing ? 'Edit User' : 'New User'}</h2>
            <p className="text-muted text-xs mt-1">Configure user profile and access privileges.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Full Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Email *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Username *</label>
                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="johndoe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">{isEditing ? 'New Password (optional)' : 'Temporary Password *'}</label>
                <input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Role *</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => { setShowAdd(false); setIsEditing(false); }} className="px-6 py-2.5 border border-border rounded-xl text-text font-semibold hover:bg-muted transition-all text-sm">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm">
                <CheckCircle2 size={18} className="mr-2" /> {isEditing ? 'Update User' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-muted font-bold uppercase tracking-widest bg-muted/20 border-b border-border">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role & Access</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-muted font-medium italic">Loading users...</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-text">{u.name}</span>
                        <span className="text-xs text-muted mt-0.5">{u.email}</span>
                        <span className="text-[10px] text-primary/70 font-mono mt-1">@{u.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${
                      u.role === 'admin' ? 'bg-danger/5 text-danger border-danger/10' : 
                      u.role === 'manager' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-slate-500/5 text-slate-600 border-slate-500/10'
                    }`}>
                      {u.role === 'admin' ? <ShieldAlert size={12} /> : 
                       u.role === 'manager' ? <Shield size={12} /> : <User size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => currentUser.id !== u.id && handleStatusChange(u.id, u.status)}
                      disabled={currentUser.id === u.id}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all ${
                        u.status === 'active' 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/10 hover:bg-green-500/20' 
                        : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                      }`}
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-xs text-muted font-medium">{formatDate(u.last_login) || 'Never'}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleEdit(u)} className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      {currentUser.id !== u.id && (
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
