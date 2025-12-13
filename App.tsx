import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { supabase } from './services/supabaseClient';
import { LayoutGrid } from 'lucide-react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { AddTransaction } from './pages/AddTransaction';
import { Chat } from './pages/Chat';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { AdminUserDetails } from './pages/AdminUserDetails'; 
import { AccountDetails } from './pages/AccountDetails';
import { ProfilePage } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Settings } from './pages/Settings'; // New Import

// Login Component
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const navigate = useNavigate();

  // Clear message when switching modes
  useEffect(() => {
    setMessage(null);
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: email.split('@')[0], avatar: '' } }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // Navigation is handled by the auth listener in AppProvider/Layout or redirection logic
        navigate('/');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href, // Redirect back to this app
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center p-4">
      <div className="bg-[#161722] p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <LayoutGrid size={28} className="text-white" />
           </div>
           <h1 className="text-2xl font-bold text-white">FamilyFinance</h1>
           <p className="text-gray-400">
             {mode === 'signin' && 'Manage your family finances together.'}
             {mode === 'signup' && 'Create your family account.'}
             {mode === 'forgot' && 'Recover your password.'}
           </p>
        </div>
        
        {message && (
          <div className={`p-3 rounded-xl text-sm mb-4 ${message.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
           <div>
              <label className="text-gray-400 text-sm block mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0B0C15] border border-gray-700 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                required
              />
           </div>
           
           {mode !== 'forgot' && (
             <div>
                <label className="text-gray-400 text-sm block mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0B0C15] border border-gray-700 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
             </div>
           )}

           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
           >
             {loading ? 'Processing...' : (
               mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Link'
             )}
           </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <>
              <p className="text-gray-400 text-sm">
                Don't have an account?
                <button onClick={() => setMode('signup')} className="text-indigo-400 ml-2 hover:underline">Sign Up</button>
              </p>
              <button onClick={() => setMode('forgot')} className="text-gray-500 text-xs hover:text-gray-300">Forgot Password?</button>
            </>
          )}
          
          {mode === 'signup' && (
            <p className="text-gray-400 text-sm">
              Already have an account?
              <button onClick={() => setMode('signin')} className="text-indigo-400 ml-2 hover:underline">Sign In</button>
            </p>
          )}

          {mode === 'forgot' && (
            <button onClick={() => setMode('signin')} className="text-gray-400 text-sm hover:text-white">
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useApp();
  const location = useLocation();
  
  if (loading) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-indigo-500">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
          <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetails /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/user/:id" element={<ProtectedRoute><AdminUserDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}