import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Upload, Search, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    master_category_id: '',
    subcategory_id: '',
    phase_id: '',
    vendor: '',
    quantity: '',
    unit: '',
    rate: '',
    amount: '',
    payment_source: '',
    notes: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/expenses?page=${page}&limit=20&search=${search}`);
      setExpenses(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, phaseRes] = await Promise.all([
        api.get('/categories'),
        api.get('/phases')
      ]);
      setCategories(catRes.data);
      setPhases(phaseRes.data);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCheckbox = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(expenses.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} expenses?`)) return;
    try {
      await api.delete('/expenses/bulk', { data: { ids: selectedIds } });
      setSelectedIds([]);
      fetchExpenses();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Download template logic removed - handled in Bulk Import page

  const handleExport = async () => {
    try {
      const res = await api.get('/expenses/export', {
        responseType: 'blob'
      });
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export expenses.');
    }
  };

  const calculateAmount = () => {
    const qty = parseFloat(formData.quantity);
    const rate = parseFloat(formData.rate);
    if (!isNaN(qty) && !isNaN(rate)) {
      setFormData(prev => ({ ...prev, amount: (qty * rate).toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        category_id: formData.subcategory_id || formData.master_category_id
      };
      delete submitData.master_category_id;
      delete submitData.subcategory_id;

      if (editId) {
        await api.put(`/expenses/${editId}`, submitData);
      } else {
        await api.post('/expenses', submitData);
      }
      setShowAdd(false);
      setEditId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '', master_category_id: '', subcategory_id: '', phase_id: '', vendor: '',
        quantity: '', unit: '', rate: '', amount: '', payment_source: '', notes: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const openEdit = (expense) => {
    let master_id = expense.category_id || '';
    let sub_id = '';
    
    if (expense.category_id) {
      const cat = categories.find(c => c.id === expense.category_id);
      if (cat && cat.parent_id) {
        master_id = cat.parent_id;
        sub_id = cat.id;
      }
    }

    setFormData({
      date: expense.date,
      description: expense.description,
      master_category_id: master_id,
      subcategory_id: sub_id,
      phase_id: expense.phase_id || '',
      vendor: expense.vendor || '',
      quantity: expense.quantity || '',
      unit: expense.unit || '',
      rate: expense.rate || '',
      amount: expense.amount,
      payment_source: expense.payment_source || '',
      notes: expense.notes || ''
    });
    setEditId(expense.id);
    setShowAdd(true);
  };

  const canEdit = ['admin', 'manager'].includes(user?.role);

  const masterCategories = categories.filter(c => !c.parent_id);
  const currentSubcategories = categories.filter(c => c.parent_id === Number(formData.master_category_id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Expenses</h1>
          <p className="text-muted text-sm mt-1">Manage and track your project expenses with precision.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <>
              <button onClick={() => navigate('/import')} className="px-4 py-2 bg-card border border-border text-text hover:bg-muted rounded-xl flex items-center transition-all shadow-sm font-semibold text-sm">
                <Upload size={18} className="mr-2 text-primary" /> Bulk Import
              </button>
              <button onClick={() => { setEditId(null); setShowAdd(true); }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center transition-all font-bold shadow-lg shadow-primary/20 text-sm">
                <Plus size={20} className="mr-2" /> Add Expense
              </button>
            </>
          )}
          <button onClick={handleExport} className="px-4 py-2 bg-card border border-border text-text hover:bg-muted rounded-xl flex items-center transition-all shadow-sm font-semibold text-sm">
            <Download size={18} className="mr-2 text-primary" /> Export
          </button>
        </div>
      </div>

      {showAdd && canEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="text-xl font-bold text-text">{editId ? 'Edit Expense' : 'New Expense'}</h2>
              <p className="text-muted text-xs mt-1">Fill in the details below to record a new construction expense.</p>
            </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Date *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Description *</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. Cement 50 Bags" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Category *</label>
                <select required value={formData.master_category_id} onChange={e => setFormData({...formData, master_category_id: e.target.value, subcategory_id: ''})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="">Select Category...</option>
                  {masterCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Subcategory</label>
                <select value={formData.subcategory_id} onChange={e => setFormData({...formData, subcategory_id: e.target.value})} disabled={!formData.master_category_id || currentSubcategories.length === 0} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50">
                  <option value="">{currentSubcategories.length === 0 ? 'No Subcategories' : 'Select Subcategory...'}</option>
                  {currentSubcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Phase</label>
                <select value={formData.phase_id} onChange={e => setFormData({...formData, phase_id: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="">Select Phase...</option>
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Vendor</label>
                <input type="text" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Supplier name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Quantity</label>
                <input type="number" step="any" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} onBlur={calculateAmount} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Unit</label>
                <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. Bags, SqFt" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Rate (₹)</label>
                <input type="number" step="any" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} onBlur={calculateAmount} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Total Amount (₹) *</label>
                <input type="number" step="any" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-primary/5 border border-primary/30 rounded-xl px-4 py-2.5 text-primary text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Payment Source</label>
                <input type="text" value={formData.payment_source} onChange={e => setFormData({...formData, payment_source: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. Cash, HDFC Loan" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 border border-border rounded-xl text-text font-semibold hover:bg-muted transition-all text-sm">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm">
                <CheckCircle2 size={18} className="mr-2" /> Save Expense
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by description or vendor..." 
              value={search}
              onChange={handleSearch}
              className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && canEdit && (
              <button onClick={handleBulkDelete} className="text-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white px-4 py-2 rounded-xl flex items-center transition-all font-bold shadow-sm">
                <Trash2 size={16} className="mr-2" /> Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-muted font-bold uppercase tracking-widest bg-muted/20 sticky top-0 z-10 border-b border-border">
              <tr>
                {canEdit && (
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={expenses.length > 0 && selectedIds.length === expenses.length}
                      className="bg-input border-border rounded-md text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer" 
                    />
                  </th>
                )}
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Phase</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subcategory</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-center">Unit</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Payment Source</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-20 text-center text-muted font-medium italic">Loading records...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-20 text-center text-muted font-medium italic">No expenses found matching your criteria.</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-all group">
                    {canEdit && (
                      <td className="px-6 py-5">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(expense.id)}
                          onChange={() => handleCheckbox(expense.id)}
                          className="bg-input border-border rounded-md text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer" 
                        />
                      </td>
                    )}
                    <td className="px-6 py-5 text-slate-500 font-medium">{formatDate(expense.date)}</td>
                    <td className="px-6 py-5 text-text font-bold group-hover:text-primary transition-colors max-w-[240px] truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="px-6 py-5 text-text font-medium text-xs">
                      {expense.phase_name || '-'}
                    </td>
                    <td className="px-6 py-5">
                      {expense.category_name ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-primary/5 text-primary border border-primary/10">
                          {expense.category_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5">
                      {expense.subcategory_text ? (
                        <span className="text-[10px] text-muted font-semibold">
                          {expense.subcategory_text}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5 text-[10px] text-muted uppercase font-bold">
                      {expense.vendor || '-'}
                    </td>
                    <td className="px-6 py-5 text-center text-text font-medium text-xs">
                      {expense.quantity || '-'}
                    </td>
                    <td className="px-6 py-5 text-center text-text font-medium text-xs">
                      {expense.unit || '-'}
                    </td>
                    <td className="px-6 py-5 text-right text-text font-medium text-xs">
                      {expense.rate ? formatCurrency(expense.rate) : '-'}
                    </td>
                    <td className="px-6 py-5 text-right text-text font-bold text-base">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-5 text-center text-text font-medium text-xs">
                      {expense.payment_source || '-'}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(expense)} title="Edit" className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(expense.id)} title="Delete" className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted">
          <span>Showing Page {page} of {totalPages || 1}</span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-xl hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages}
              className="px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Expenses;
