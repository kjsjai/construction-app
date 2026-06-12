import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Tag, Building2, Wallet, BarChart3, Users, LogOut, Sun, Moon, Shield, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Construction Phases', path: '/phases', icon: <CalendarDays size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Expenses', path: '/expenses', icon: <Receipt size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Categories', path: '/categories', icon: <Tag size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Funds & Loans', path: '/funds', icon: <Wallet size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['admin', 'manager', 'viewer'] },
    { name: 'Bulk Import', path: '/import', icon: <FileSpreadsheet size={18} />, roles: ['admin', 'manager'] },
    { name: 'Users', path: '/users', icon: <Users size={18} />, roles: ['admin'] },
  ];

  return (
    <div className="w-72 bg-card border-r border-border h-screen flex flex-col hidden md:flex sticky top-0 z-50">
      {/* Logo Section */}
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
            <Building2 className="text-primary-foreground" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-text leading-none">Swastik Home</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">Construction</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted/60">Core Modules</p>
        </div>
        {navItems.filter(item => item.roles.includes(user?.role)).map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted hover:bg-muted hover:text-text"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-full -ml-4"></div>
              )}
              <span className={cn("transition-all", isActive ? "text-primary-foreground" : "group-hover:text-primary group-hover:scale-110")}>
                {item.icon}
              </span>
              <span className="ml-3 text-sm font-bold tracking-wide">{item.name}</span>
              {!isActive && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-1 rounded-full bg-primary"></div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="p-6 space-y-6 bg-muted/10 border-t border-border">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Appearance</span>
          <button 
            onClick={toggleTheme}
            className="w-10 h-6 bg-muted border border-border rounded-full relative transition-colors hover:border-primary/30"
          >
            <div className={cn(
              "absolute top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
              theme === 'dark' ? "right-0.5 bg-primary" : "left-0.5 bg-white border border-border"
            )}>
              {theme === 'dark' ? <Moon size={10} className="text-primary-foreground" /> : <Sun size={10} className="text-amber-500" />}
            </div>
          </button>
        </div>

        {/* User Profile */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg border border-border shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-xs font-bold text-text truncate">{user?.name}</p>
              <div className="flex items-center mt-0.5">
                <Shield size={10} className="text-primary mr-1" />
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-danger hover:bg-danger/5 rounded-lg transition-all border border-transparent hover:border-danger/10"
          >
            <LogOut size={12} />
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-[70] md:hidden transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <Building2 className="text-primary-foreground" size={18} />
            </div>
            <span className="font-bold text-text">Swastik Home</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted hover:text-text hover:bg-muted rounded-lg transition-all"
          >
            {isMobileMenuOpen ? (
              <span className="text-2xl font-light">&times;</span>
            ) : (
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
              </div>
            )}
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
