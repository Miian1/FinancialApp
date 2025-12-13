import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, Check, Shield, Mail, Key, Edit, Camera, FileText } from 'lucide-react';

// Unified Number Formatter
const formatCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);

  // >= 1,000,000 -> 1.5M
  if (absAmount >= 1000000) {
    return 'Rs ' + (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  }
  
  // >= 10,000 -> 15k
  if (absAmount >= 10000) {
    return 'Rs ' + (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
  }

  // Default
  return 'Rs ' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
};

export const ProfilePage: React.FC = () => {
  const { profile, accounts, transactions } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Calculate Personal Balance (Sum of personal account balances)
  const personalBalance = useMemo(() => {
    return accounts
        .filter(a => a.user_id === profile?.id)
        .reduce((acc, curr) => acc + Number(curr.balance), 0);
  }, [accounts, profile]);

  // Calculate Transaction Count (Transactions created by user)
  const transactionCount = useMemo(() => {
    return transactions.filter(t => t.created_by === profile?.id).length;
  }, [transactions, profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">User Profile</h2>
        <button 
            onClick={() => navigate('/edit-profile')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all"
        >
            <Edit size={16} /> Edit Profile
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xl">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 relative">
             <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          <div className="px-6 pb-8 relative">
              {/* Avatar - Negative margin to overlap banner */}
              <div className="relative -mt-16 mb-4 flex justify-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full p-1 bg-surface">
                        <img 
                            src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}&background=random&size=128`} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover bg-background"
                        />
                    </div>
                    <button 
                        onClick={() => navigate('/edit-profile')}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-surface text-white cursor-pointer hover:bg-indigo-500 transition-colors z-10"
                        title="Change Picture"
                    >
                        <Camera size={14} />
                    </button>
                  </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-3">
                  <div>
                      <h3 className="text-2xl font-bold text-primary">{profile?.name}</h3>
                      <p className="text-secondary text-sm">{profile?.email}</p>
                  </div>
                  
                  {/* Bio Section */}
                  {profile?.bio && (
                      <p className="text-secondary/80 text-sm max-w-md mx-auto italic">
                          "{profile.bio}"
                      </p>
                  )}

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wide">
                      <Shield size={12} />
                      {profile?.role}
                  </div>
              </div>

              {/* Stats Divider */}
              <div className="w-full h-px bg-border my-8"></div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-border last:border-0">
                      <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Personal Balance</p>
                      <h4 className="text-2xl sm:text-3xl font-bold text-primary font-mono">{formatCurrency(personalBalance)}</h4>
                  </div>
                  <div className="text-center">
                      <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Transactions</p>
                      <h4 className="text-2xl sm:text-3xl font-bold text-primary font-mono">{transactionCount}</h4>
                  </div>
              </div>
          </div>
      </div>

      {/* Account Details Section */}
      <div className="bg-surface rounded-3xl border border-border p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
              <Mail size={20} className="text-secondary" />
              <h3 className="text-lg font-bold text-primary">Account Details</h3>
          </div>

          <div className="space-y-6">
              {/* Email */}
              <div className="group">
                  <label className="text-secondary text-xs font-bold uppercase tracking-wider block mb-2">Email Address</label>
                  <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border text-primary">
                      <span>{profile?.email}</span>
                      <Check size={18} className="text-emerald-500" />
                  </div>
              </div>

              {/* User ID */}
              <div>
                  <label className="text-secondary text-xs font-bold uppercase tracking-wider block mb-2">User ID</label>
                  <div className="flex items-center gap-2 p-4 bg-background rounded-xl border border-border group relative">
                      <code className="text-xs sm:text-sm text-secondary font-mono truncate flex-1 select-all">
                          {profile?.id}
                      </code>
                      <button 
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-primary/5 rounded-lg text-secondary hover:text-primary transition-colors"
                          title="Copy ID"
                      >
                          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                  </div>
              </div>

              {/* Bio Details */}
              {profile?.bio && (
                  <div>
                      <label className="text-secondary text-xs font-bold uppercase tracking-wider block mb-2">About</label>
                      <div className="p-4 bg-background rounded-xl border border-border text-primary text-sm">
                          {profile.bio}
                      </div>
                  </div>
              )}

              {/* Password & Edit Links */}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                  <div className="flex items-center gap-2 text-secondary">
                      <Key size={18} />
                      <span className="text-sm font-medium">Security & Profile</span>
                  </div>
                  <button 
                      onClick={() => navigate('/edit-profile')}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline flex items-center gap-1"
                  >
                      <Edit size={14} /> Edit Profile
                  </button>
              </div>
          </div>
      </div>
      
      {/* Mobile Logout / Edit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
              onClick={() => navigate('/edit-profile')}
              className="sm:hidden w-full bg-surface hover:bg-primary/5 text-indigo-400 font-bold py-4 rounded-2xl border border-border transition-all flex items-center justify-center gap-2"
          >
              <Edit size={20} />
              Edit Profile
          </button>
          
          <button 
              onClick={handleLogout}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl border border-rose-500/20 transition-all flex items-center justify-center gap-2 sm:col-span-2"
          >
              <LogOut size={20} />
              Log Out
          </button>
      </div>
    </div>
  );
};