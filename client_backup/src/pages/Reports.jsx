import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatCurrency } from '../lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Printer, Download } from 'lucide-react';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [phaseData, setPhaseData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sumRes, catRes, phaseRes, monthRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/by-category'),
          api.get('/reports/by-phase'),
          api.get('/reports/monthly')
        ]);
        setSummary(sumRes.data);
        setCategoryData(catRes.data);
        setPhaseData(phaseRes.data);
        setMonthlyData(monthRes.data);
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const handlePrint = () => window.print();

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Construction_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export report');
    }
  };

  if (loading) return <div className="text-muted p-10">Loading reports...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Reports & Analytics</h1>
          <p className="text-muted text-sm mt-1">Detailed financial analysis and project insights.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="px-5 py-2.5 bg-card border border-border text-text hover:bg-muted rounded-xl flex items-center transition-all shadow-sm font-bold text-sm">
            <Download size={18} className="mr-2 text-primary" /> Export Excel
          </button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 font-bold text-sm">
            <Printer size={18} className="mr-2" /> Print PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 relative">Total Budget (Est)</p>
          <p className="text-2xl font-bold text-text tracking-tight relative">{formatCurrency(summary?.totalFunds)}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 relative">Total Spent</p>
          <p className="text-2xl font-bold text-danger tracking-tight relative">{formatCurrency(summary?.totalExpenses)}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 relative">Available Funds</p>
          <p className="text-2xl font-bold text-success tracking-tight relative">{formatCurrency(summary?.availableBalance)}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 relative">Budget Usage</p>
          <div className="flex items-end gap-2 relative">
            <p className="text-2xl font-bold text-primary tracking-tight">
              {summary?.totalFunds ? ((summary.totalExpenses / summary.totalFunds) * 100).toFixed(1) : 0}%
            </p>
            <span className="text-[10px] text-muted font-bold uppercase mb-1">of total</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
        {/* Category Chart */}
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm break-inside-avoid">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-text">Spending by Category</h3>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download size={12} className="text-primary" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  itemStyle={{ color: 'hsl(var(--text))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex flex-col p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center mb-1">
                  <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-text truncate">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-text ml-4 tracking-tight">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Chart */}
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm break-inside-avoid">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-text">Spending by Phase</h3>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Bar size={12} className="text-success" />
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.3} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--text))" fontSize={10} fontWeight="700" width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Spent']}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm break-inside-avoid">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-lg text-text">Monthly Expenditure Trend</h3>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 py-1 bg-muted rounded-lg">Last 12 Months</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                formatter={(value) => [formatCurrency(value), 'Monthly Total']}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
