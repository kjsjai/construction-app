import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-card w-full max-w-md p-10 rounded-[2.5rem] border border-border shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 mb-6 rotate-3">
            <Building2 className="text-primary-foreground" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-text tracking-tight mb-2">Swastik Home</h1>
          <p className="text-muted text-sm font-medium">Enterprise Construction Management</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-2xl mb-8 text-xs font-bold uppercase tracking-wider flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-danger mr-3 animate-pulse"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-input border border-border rounded-2xl px-5 py-4 text-text text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted/50"
              placeholder="e.g. admin_swastik"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-input border border-border rounded-2xl px-5 py-4 text-text text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center shadow-xl shadow-primary/20 text-sm uppercase tracking-[0.2em] mt-8"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Sign In Now'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-xs text-muted font-medium">
            Authorized Personnel Only. <span className="text-primary font-bold hover:underline cursor-pointer ml-1">Support</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
