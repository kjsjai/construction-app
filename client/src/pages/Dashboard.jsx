import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { StatCard } from '../components/StatCard';
import { Receipt, Wallet, TrendingUp, AlertCircle, Building2, Banknote } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, monthRes, catRes, expRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/monthly'),
          api.get('/reports/by-category'),
          api.get('/expenses?limit=5')
        ]);
        
        setSummary(sumRes.data);
        setMonthlyData(monthRes.data);
        setCategoryData(catRes.data);
        setRecentExpenses(expRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Overview of your construction project finances.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-card border border-border rounded-lg shadow-sm flex items-center gap-2">
            <Building2 className="text-primary" size={18} />
            <span className="text-sm font-semibold text-text">Swastik Home</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(summary?.totalExpenses)} 
          icon={<Receipt size={24} />} 
          subtitle="Overall project spending"
        />
        <StatCard 
          title="Total Funds Received" 
          value={formatCurrency(summary?.totalFunds)} 
          icon={<Banknote size={24} />} 
          subtitle="Loans and own funds"
        />
        <StatCard 
          title="Available Balance" 
          value={formatCurrency(summary?.availableBalance)} 
          icon={<Wallet size={24} />} 
          subtitle="Total funds - Expenses - Repayments"
        />
        <StatCard 
          title="This Month" 
          value={formatCurrency(summary?.thisMonthSpending)} 
          icon={<TrendingUp size={24} />} 
          subtitle="Expenses for the current month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 bg-card border border-border shadow-sm p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-text">Monthly Spending Trend</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted))', marginBottom: '4px', fontWeight: 'bold' }}
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl flex flex-col">
          <h3 className="font-bold text-lg text-text mb-8">Expenses by Category</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || 'hsl(var(--primary))'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Top Category</span>
              <span className="text-sm font-bold text-text truncate max-w-[100px]">{categoryData[0]?.name || '-'}</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: cat.color || 'hsl(var(--primary))' }}></div>
                  <span className="text-text font-medium truncate max-w-[140px]">{cat.name}</span>
                </div>
                <span className="font-bold text-text">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg text-text">Recent Transactions</h3>
          <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted font-bold uppercase bg-muted/20">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted font-medium italic">No recent expenses found.</td>
                </tr>
              ) : (
                recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-5 text-slate-500 font-medium">{formatDate(expense.date)}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-text font-bold group-hover:text-primary transition-colors">{expense.description}</span>
                        <span className="text-[10px] text-muted uppercase font-bold mt-0.5">{expense.vendor || 'Personal'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-primary/5 text-primary border border-primary/10">
                        {expense.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-text font-bold text-base">{formatCurrency(expense.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
