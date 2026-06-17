import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register'; // 1. Import the new Register component
import Dashboard from './pages/Dashboard';
import Board from './pages/Board'; 

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-600 dark:text-zinc-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* 2. Add the Register route */}
      
      {/* Protected Routes */}
      <Route path="/" element={ <ProtectedRoute><Dashboard /></ProtectedRoute> } />
      <Route path="/board/:id" element={ <ProtectedRoute><Board /></ProtectedRoute> } />
      
      {/* Redirect all other paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}