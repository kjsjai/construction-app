import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Plus, Wallet, History, Banknote, Edit2 } from 'lucide-react';

const Funds = () => {
  const [funds, setFunds] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [showAddFund, setShowAddFund] = useState(false);
  const [showAddRepayment, setShowAddRepayment] = useState(false);
  const [isEditingFund, setIsEditingFund] = useState(false);
  const [editingFundId, setEditingFundId] = useState(null);
  const [fundForm, setFundForm] = useState({
    date: new Date().toISOString().split('T')[0],
    source_type: 'Loan', source_name: '', amount: '', interest_rate: '', tenure_months: '', bank_name: '', notes: ''
  });
  
  const [repaymentForm, setRepaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    fund_id: '', amount: '', repayment_type: 'EMI', notes: ''
  });
  const [isEditingRepayment, setIsEditingRepayment] = useState(false);
  const [editingRepaymentId, setEditingRepaymentId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fundsRes, repayRes] = await Promise.all([
        api.get('/funds'),
        api.get('/repayments')
      ]);
      setFunds(fundsRes.data);
      setRepayments(repayRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingFund) {
        await api.put(`/funds/${editingFundId}`, fundForm);
        setIsEditingFund(false);
        setEditingFundId(null);
      } else {
        await api.post('/funds', fundForm);
      }
      setShowAddFund(false);
      setFundForm({ date: new Date().toISOString().split('T')[0], source_type: 'Loan', source_name: '', amount: '', interest_rate: '', tenure_months: '', bank_name: '', notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving fund');
    }
  };

  const handleEditFund = (fund) => {
    setFundForm({
      date: fund.date.split('T')[0],
      source_type: fund.source_type,
      source_name: fund.source_name,
      amount: fund.amount,
      interest_rate: fund.interest_rate || '',
      tenure_months: fund.tenure_months || '',
      bank_name: fund.bank_name || '',
      notes: fund.notes || ''
    });
    setEditingFundId(fund.id);
    setIsEditingFund(true);
    setShowAddFund(true);
  };

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingRepayment) {
        await api.put(`/repayments/${editingRepaymentId}`, repaymentForm);
        setIsEditingRepayment(false);
        setEditingRepaymentId(null);
      } else {
        await api.post('/repayments', repaymentForm);
      }
      setShowAddRepayment(false);
      setRepaymentForm({ date: new Date().toISOString().split('T')[0], fund_id: '', amount: '', repayment_type: 'EMI', notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving repayment');
    }
  };

  const handleEditRepayment = (r) => {
    setRepaymentForm({
      date: r.date.split('T')[0],
      fund_id: r.fund_id,
      amount: r.amount,
      repayment_type: r.repayment_type,
      notes: r.notes || ''
    });
    setEditingRepaymentId(r.id);
    setIsEditingRepayment(true);
    setShowAddRepayment(true);
  };

  const handleDeleteRepayment = async (id) => {
    if (!window.confirm('Delete repayment?')) return;
    try {
      await api.delete(`/repayments/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const canEdit = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Funds & Loans</h1>
          <p className="text-muted text-sm mt-1">Track incoming funds and manage loan repayments efficiently.</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { 
              setShowAddRepayment(!showAddRepayment); 
              setShowAddFund(false); 
              setIsEditingRepayment(false);
              setRepaymentForm({ date: new Date().toISOString().split('T')[0], fund_id: '', amount: '', repayment_type: 'EMI', notes: '' });
            }} className="px-4 py-2 bg-card border border-border text-text hover:bg-muted rounded-xl flex items-center transition-all shadow-sm font-semibold text-sm">
              <History size={18} className="mr-2 text-primary" /> {showAddRepayment && !isEditingRepayment ? 'Cancel' : 'Add Repayment'}
            </button>
            <button onClick={() => { 
              setShowAddFund(!showAddFund); 
              setIsEditingFund(false); 
              setShowAddRepayment(false);
              setFundForm({ date: new Date().toISOString().split('T')[0], source_type: 'Loan', source_name: '', amount: '', interest_rate: '', tenure_months: '', bank_name: '', notes: '' }); 
            }} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center transition-all font-bold shadow-lg shadow-primary/20 text-sm">
              <Plus size={20} className="mr-2" /> {showAddFund && !isEditingFund ? 'Cancel' : 'Add Fund Source'}
            </button>
          </div>
        )}
      </div>

      {showAddFund && canEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="text-xl font-bold text-text">{isEditingFund ? 'Edit Fund Source' : 'New Fund Source'}</h2>
              <p className="text-muted text-xs mt-1">Add a new loan or personal fund source to the project.</p>
            </div>
          <form onSubmit={handleFundSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Date *</label>
                <input type="date" required value={fundForm.date} onChange={e => setFundForm({...fundForm, date: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Type *</label>
                <select required value={fundForm.source_type} onChange={e => setFundForm({...fundForm, source_type: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="Loan">Loan</option>
                  <option value="Cash">Cash / Personal</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Source Name *</label>
                <input type="text" required value={fundForm.source_name} onChange={e => setFundForm({...fundForm, source_name: e.target.value})} placeholder="e.g. HDFC Housing Loan" className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Amount (₹) *</label>
                <input type="number" step="any" required value={fundForm.amount} onChange={e => setFundForm({...fundForm, amount: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Interest Rate (%)</label>
                <input type="number" step="any" value={fundForm.interest_rate} onChange={e => setFundForm({...fundForm, interest_rate: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Annual rate" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Bank Name</label>
                <input type="text" value={fundForm.bank_name} onChange={e => setFundForm({...fundForm, bank_name: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Issuing bank" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => { setShowAddFund(false); setIsEditingFund(false); }} className="px-6 py-2.5 border border-border rounded-xl text-text font-semibold hover:bg-muted transition-all text-sm">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm">{isEditingFund ? 'Update Fund' : 'Save Fund'}</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {showAddRepayment && canEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="text-xl font-bold text-text">{isEditingRepayment ? 'Edit Repayment' : 'Record Repayment'}</h2>
              <p className="text-muted text-xs mt-1">Log a loan EMI or principal repayment.</p>
            </div>
          <form onSubmit={handleRepaymentSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Date *</label>
                <input type="date" required value={repaymentForm.date} onChange={e => setRepaymentForm({...repaymentForm, date: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Fund / Loan *</label>
                <select required value={repaymentForm.fund_id} onChange={e => setRepaymentForm({...repaymentForm, fund_id: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="">Select...</option>
                  {funds.filter(f => f.source_type === 'Loan').map(f => (
                    <option key={f.id} value={f.id}>{f.source_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Amount (₹) *</label>
                <input type="number" step="any" required value={repaymentForm.amount} onChange={e => setRepaymentForm({...repaymentForm, amount: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Type</label>
                <select value={repaymentForm.repayment_type} onChange={e => setRepaymentForm({...repaymentForm, repayment_type: e.target.value})} className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="EMI">EMI</option>
                  <option value="Principal">Principal Only</option>
                  <option value="Interest">Interest Only</option>
                  <option value="Prepayment">Prepayment</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => { setShowAddRepayment(false); setIsEditingRepayment(false); }} className="px-6 py-2.5 border border-border rounded-xl text-text font-semibold hover:bg-muted transition-all text-sm">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm">{isEditingRepayment ? 'Update Repayment' : 'Save Repayment'}</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-muted">Loading data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-6">
          <div className="bg-muted/10 border border-border rounded-2xl p-4 flex flex-col">
            <h2 className="text-lg font-bold text-text flex items-center justify-between mb-4 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Wallet className="text-primary" size={16} /> Fund Sources
              </div>
              <span className="text-xs font-bold bg-muted/30 text-muted px-2 py-1 rounded-md">{funds.length}</span>
            </h2>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {funds.length === 0 ? (
                <p className="text-muted font-medium italic p-6 text-center bg-card rounded-xl border border-dashed border-border">No fund sources added yet.</p>
              ) : (
                funds.map(fund => (
                  <div key={fund.id} className="bg-card border border-border p-4 rounded-xl shadow-sm group relative hover:shadow-md transition-all">
                    {canEdit && (
                      <button 
                        onClick={() => handleEditFund(fund)}
                        className="absolute top-2 right-2 p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-card/80 backdrop-blur-sm"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${fund.source_type === 'Loan' ? 'bg-primary/10 text-primary border border-primary/10' : 'bg-green-500/10 text-green-600 border border-green-500/10'}`}>
                            {fund.source_type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base text-text leading-tight">{fund.source_name}</h3>
                        <p className="text-[10px] text-muted font-medium mt-0.5 uppercase tracking-wide">{formatDate(fund.date)} {fund.bank_name && `• ${fund.bank_name}`}</p>
                      </div>
                      <div className="text-right mt-0.5">
                        <p className="text-lg font-bold text-text tracking-tight">{formatCurrency(fund.amount)}</p>
                        {fund.interest_rate && <p className="text-[10px] text-primary font-bold mt-0.5 uppercase tracking-wider">{fund.interest_rate}% Int.</p>}
                      </div>
                    </div>
                    
                    {fund.source_type === 'Loan' && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-muted">Repaid: <span className="text-text">{formatCurrency(fund.repaid_amount)}</span></span>
                          <span className="text-muted">Bal: <span className="text-text">{formatCurrency(fund.outstanding_balance)}</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border shadow-inner">
                          <div 
                            className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" 
                            style={{ width: `${Math.min(100, (fund.repaid_amount / fund.amount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-muted/10 border border-border rounded-2xl p-4 flex flex-col">
            <h2 className="text-lg font-bold text-text flex items-center justify-between mb-4 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <History className="text-primary" size={16} /> Recent Repayments
              </div>
              <span className="text-xs font-bold bg-muted/30 text-muted px-2 py-1 rounded-md">{repayments.length}</span>
            </h2>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {repayments.length === 0 ? (
                <p className="text-muted font-medium italic p-6 text-center bg-card rounded-xl border border-dashed border-border">No repayments recorded.</p>
              ) : (
                repayments.map(r => (
                  <div key={r.id} className="bg-card border border-border p-4 rounded-xl shadow-sm group relative hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text text-sm leading-tight">{r.fund_name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-muted uppercase font-bold tracking-wider bg-muted/30 px-1.5 py-0.5 rounded-md">{r.repayment_type}</span>
                        <span className="text-[10px] text-muted font-medium">{formatDate(r.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-base font-bold text-text tracking-tight">{formatCurrency(r.amount)}</p>
                      {canEdit && (
                        <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEditRepayment(r)} className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-all"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteRepayment(r.id)} className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-all"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funds;
