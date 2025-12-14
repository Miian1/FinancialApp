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
import { Settings } from './pages/Settings';

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Determine redirect URL: use window.location.origin for local dev, 
      // but explicitly use the Netlify URL for production to match Supabase allow lists exactly.
      const redirectUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? window.location.origin
        : 'https://financialapp1.netlify.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
      // No need to set loading false as it redirects
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: email.split('@')[0], avatar: '' } }
        });
        if (error) throw error;

        // If auto-confirm is enabled, session exists immediately.
        // We attempt to create the profile row here to ensure it exists before redirection.
        if (data.user && data.session) {
            await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
                name: email.split('@')[0],
                role: 'member',
                avatar: ''
            });
        }

        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
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

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#161722] text-gray-400">Or continue with</span>
            </div>
        </div>

        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
        </button>
        
        <div className="mt-4 text-center space-y-2">
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
    <HashRouter>
      <AppProvider>
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
      </AppProvider>
    </HashRouter>
  );
}