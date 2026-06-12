import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Tag, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', icon: 'tag', description: '', parent_id: '', budget_limit: '' });
  const [editId, setEditId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setShowAdd(false);
      setEditId(null);
      setFormData({ name: '', color: '#3B82F6', icon: 'tag', description: '', parent_id: '', budget_limit: '' });
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting category');
    }
  };

  const openEdit = (cat) => {
    setFormData({ name: cat.name, color: cat.color, icon: cat.icon || '', description: cat.description || '', parent_id: cat.parent_id || '', budget_limit: cat.budget_limit || '' });
    setEditId(cat.id);
    setShowAdd(true);
  };

  const canEdit = ['admin', 'manager'].includes(user?.role);

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubCategories = (parentId) => categories.filter(c => c.parent_id === parentId);
  const getCategoryTree = (parentId) => {
    let result = [];
    const children = categories.filter(c => c.parent_id === parentId);
    for (const child of children) {
      result.push(child);
      result = result.concat(getCategoryTree(child.id));
    }
    return result;
  };
  const getDepth = (cId, depth = 0) => {
    const c = categories.find(x => x.id === cId);
    if (!c || !c.parent_id) return depth;
    return getDepth(c.parent_id, depth + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Categories</h1>
          <p className="text-muted text-sm mt-1">Organize your expenses into logical groups.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditId(null); setShowAdd(!showAdd); }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center transition-all font-bold shadow-lg shadow-primary/20 text-sm">
            <Plus size={20} className="mr-2" /> Add Category
          </button>
        )}
      </div>

      {showAdd && canEdit && (
        <div className="bg-card border border-border shadow-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-xl font-bold text-text">{editId ? 'Edit Category' : 'New Category'}</h2>
            <p className="text-muted text-xs mt-1">Customize a category to better track your spending.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. Raw Materials" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Parent Category</label>
                <select value={formData.parent_id || ''} onChange={e => setFormData({...formData, parent_id: e.target.value || null})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => !editId || c.id !== editId).map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.parent_id ? '(Sub)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Budget Limit (₹)</label>
                <input type="number" value={formData.budget_limit} onChange={e => setFormData({...formData, budget_limit: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. 900000" />
              </div>
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="What falls under this category?" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 border border-border rounded-xl text-text font-semibold hover:bg-muted transition-all text-sm">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm">
                <CheckCircle2 size={18} className="mr-2" /> Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 pb-6 space-y-6">
          {mainCategories.map(mainCat => (
            <div key={mainCat.id} className="break-inside-avoid bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group/main overflow-hidden">
              <div className="p-5 bg-muted/10 border-b border-border/50 flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                    <Tag size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-text leading-tight truncate">{mainCat.name}</h2>
                    {mainCat.description && (
                      <p className="text-xs text-muted font-medium mt-1 line-clamp-2">{mainCat.description}</p>
                    )}
                    {mainCat.budget_limit > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Budget: ₹{Number(mainCat.budget_limit).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex flex-col space-y-1 opacity-0 group-hover/main:opacity-100 transition-all shrink-0 ml-2">
                    <button onClick={() => openEdit(mainCat)} className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(mainCat.id)} className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-all"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1">
                {getCategoryTree(mainCat.id).map(cat => {
                  const depth = getDepth(cat.id);
                  const indentClass = depth === 1 ? '' : depth === 2 ? 'ml-6 border-l-2 border-border/50 pl-3 rounded-l-none' : 'ml-12 border-l-2 border-border/50 pl-3 rounded-l-none';
                  
                  return (
                    <div key={cat.id} className={`group/sub relative flex items-start justify-between p-2 hover:bg-muted/30 rounded-xl transition-all ${indentClass}`}>
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-7 h-7 shrink-0 rounded-lg bg-muted/20 flex items-center justify-center text-muted border border-border mt-0.5">
                          <Tag size={12} />
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <h3 className="font-semibold text-text text-sm leading-tight flex items-center gap-2 truncate">
                            <span className="truncate">{cat.name}</span>
                          </h3>
                          {cat.description && (
                            <p className="text-xs text-muted font-medium mt-0.5 line-clamp-1">{cat.description}</p>
                          )}
                          {cat.budget_limit > 0 && (
                            <div className="mt-1.5 inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                              ₹{Number(cat.budget_limit).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex space-x-1 opacity-0 group-hover/sub:opacity-100 transition-all shrink-0 ml-2">
                          <button onClick={() => openEdit(cat)} className="p-1 text-muted hover:text-primary hover:bg-primary/10 rounded transition-all"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(cat.id)} className="p-1 text-muted hover:text-danger hover:bg-danger/10 rounded transition-all"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {getCategoryTree(mainCat.id).length === 0 && (
                  <div className="flex items-center justify-center py-4 text-muted/50">
                    <span className="text-xs font-medium">No subcategories</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="break-inside-avoid w-full py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
              <Tag size={48} className="text-muted/30 mb-4" />
              <p className="text-muted font-bold">No categories found.</p>
              <p className="text-muted text-sm mt-1">Add a category to start organizing your expenses.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
