import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, Check, Shield, Mail, Key, Edit, Camera, FileText } from 'lucide-react';

const formatCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) return 'Rs ' + (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  if (absAmount >= 10000) return 'Rs ' + (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
  return 'Rs ' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
};

export const ProfilePage: React.FC = () => {
  const { profile, accounts, transactions } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const personalBalance = useMemo(() => accounts.filter(a => a.user_id === profile?.id).reduce((acc, curr) => acc + Number(curr.balance), 0), [accounts, profile]);
  const transactionCount = useMemo(() => transactions.filter(t => t.created_by === profile?.id).length, [transactions, profile]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };
  const copyToClipboard = () => { if (profile?.id) { navigator.clipboard.writeText(profile.id); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center"><h2 className="text-xl md:text-2xl font-bold text-primary">User Profile</h2><button onClick={() => navigate('/edit-profile')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all"><Edit size={16} /> Edit Profile</button></div>

      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xl">
          <div className="h-24 md:h-32 bg-gradient-to-r from-indigo-900 to-purple-900 relative"><div className="absolute inset-0 bg-black/20"></div></div>
          <div className="px-6 pb-6 md:pb-8 relative">
              <div className="relative -mt-12 md:-mt-16 mb-3 flex justify-center">
                  <div className="relative group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-surface"><img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}&background=random&size=128`} alt="Profile" className="w-full h-full rounded-full object-cover bg-background" /></div>
                    <button onClick={() => navigate('/edit-profile')} className="absolute bottom-1 right-1 w-7 h-7 md:w-8 md:h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-surface text-white cursor-pointer hover:bg-indigo-500 transition-colors z-10" title="Change Picture"><Camera size={14} /></button>
                  </div>
              </div>
              <div className="text-center space-y-2">
                  <div><h3 className="text-xl md:text-2xl font-bold text-primary">{profile?.name}</h3><p className="text-secondary text-xs md:text-sm">{profile?.email}</p></div>
                  {profile?.bio && (<p className="text-secondary/80 text-xs md:text-sm max-w-md mx-auto italic">"{profile.bio}"</p>)}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wide"><Shield size={10} />{profile?.role}</div>
              </div>
              <div className="w-full h-px bg-border my-6"></div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-border last:border-0"><p className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Personal Balance</p><h4 className="text-xl md:text-3xl font-bold text-primary font-mono">{formatCurrency(personalBalance)}</h4></div>
                  <div className="text-center"><p className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Transactions</p><h4 className="text-xl md:text-3xl font-bold text-primary font-mono">{transactionCount}</h4></div>
              </div>
          </div>
      </div>

      <div className="bg-surface rounded-3xl border border-border p-5 md:p-6 shadow-xl">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6"><Mail size={18} className="text-secondary" /><h3 className="text-base md:text-lg font-bold text-primary">Account Details</h3></div>
          <div className="space-y-4">
              <div className="group"><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">Email Address</label><div className="flex items-center justify-between p-3 md:p-4 bg-background rounded-xl border border-border text-primary text-sm"><span>{profile?.email}</span><Check size={16} className="text-emerald-500" /></div></div>
              <div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">User ID</label><div className="flex items-center gap-2 p-3 md:p-4 bg-background rounded-xl border border-border group relative"><code className="text-xs text-secondary font-mono truncate flex-1 select-all">{profile?.id}</code><button onClick={copyToClipboard} className="p-1.5 hover:bg-primary/5 rounded-lg text-secondary hover:text-primary transition-colors" title="Copy ID">{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</button></div></div>
              {profile?.bio && (<div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">About</label><div className="p-3 md:p-4 bg-background rounded-xl border border-border text-primary text-sm">{profile.bio}</div></div>)}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-2"><div className="flex items-center gap-2 text-secondary"><Key size={16} /><span className="text-xs md:text-sm font-medium">Security & Profile</span></div><button onClick={() => navigate('/edit-profile')} className="text-indigo-400 hover:text-indigo-300 text-xs md:text-sm font-medium hover:underline flex items-center gap-1"><Edit size={12} /> Edit Profile</button></div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-safe"><button onClick={() => navigate('/edit-profile')} className="sm:hidden w-full bg-surface hover:bg-primary/5 text-indigo-400 font-bold py-3.5 rounded-2xl border border-border transition-all flex items-center justify-center gap-2 text-sm"><Edit size={18} />Edit Profile</button><button onClick={handleLogout} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-3.5 rounded-2xl border border-rose-500/20 transition-all flex items-center justify-center gap-2 sm:col-span-2 text-sm"><LogOut size={18} />Log Out</button></div>
    </div>
  );
};