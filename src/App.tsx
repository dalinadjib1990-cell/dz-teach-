import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Home from './components/Home';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dz-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-dz-purple/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-dz-purple border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(147,51,234,0.3)]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-dz-gold font-bold text-xl">DZ</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-dz-gold font-bold animate-pulse">جاري التحميل...</p>
          <p className="text-zinc-500 text-xs">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
