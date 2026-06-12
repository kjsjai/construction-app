import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Funds from './pages/Funds';
import Reports from './pages/Reports';
import BulkImport from './pages/BulkImport';
import Users from './pages/Users';
import Phases from './pages/Phases';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/phases" element={<Phases />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/funds" element={<Funds />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/import" element={<BulkImport />} />
              </Route>
            </Route>
  
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
  
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
