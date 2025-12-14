import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Search, X, User, CreditCard, Users, Wallet, ShoppingBag, Film, Zap, Car, Coffee, Home, Utensils, Smartphone, Gift, Plane, GraduationCap, Activity, Music, Briefcase, Heart, Pill, PawPrint, Sparkles, Palmtree, Laptop, Receipt, Wrench, Book, Bus, DollarSign, Banknote, TrendingUp, Package, Building, Coins, ChartLine } from 'lucide-react';
import { Profile, Category } from '../types';

export const AddTransaction: React.FC = () => {
  const { profile, accounts, groupAccounts, categories, transactions, refreshData, goBack } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as { mode: 'personal' | 'fund' | 'admin_user' })?.mode || 'personal';

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminTargetUser, setAdminTargetUser] = useState<Profile | null>(null);
  const [adminUserResults, setAdminUserResults] = useState<Profile[]>([]);
  const [showAdminUserDropdown, setShowAdminUserDropdown] = useState(false);

  useEffect(() => {
    if (mode === 'admin_user' && adminSearchTerm.length > 1) {
        const fetchUsers = async () => { const { data } = await supabase.from('profiles').select('*').ilike('name', `%${adminSearchTerm}%`).limit(5); setAdminUserResults(data as Profile[] || []); };
        const debounce = setTimeout(fetchUsers, 300); return () => clearTimeout(debounce);
    } else { setAdminUserResults([]); }
  }, [adminSearchTerm, mode]);

  const rawAvailableAccounts = useMemo(() => {
      if (mode === 'personal') return accounts.filter(a => a.user_id === profile?.id);
      if (mode === 'fund') return groupAccounts.filter(g => g.members?.includes(profile?.id || ''));
      if (mode === 'admin_user') return adminTargetUser ? accounts.filter(a => a.user_id === adminTargetUser.id) : [];
      return [];
  }, [mode, accounts, groupAccounts, profile, adminTargetUser]);

  const sortedAccounts = useMemo(() => {
     if (mode === 'admin_user') return rawAvailableAccounts;
     const recentAccountIds = new Map<string, number>();
     transactions.forEach((t, index) => { if (!recentAccountIds.has(t.account_id)) recentAccountIds.set(t.account_id, index); });
     return [...rawAvailableAccounts].sort((a, b) => { const aIndex = recentAccountIds.has(a.id) ? recentAccountIds.get(a.id)! : Infinity; const bIndex = recentAccountIds.has(b.id) ? recentAccountIds.get(b.id)! : Infinity; return aIndex - bIndex; });
  }, [rawAvailableAccounts, transactions, mode]);

  const displayAccounts = useMemo(() => {
      if (mode === 'admin_user') return sortedAccounts; 
      let filtered = sortedAccounts;
      if (accountSearch) { filtered = filtered.filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase())); return filtered; }
      return filtered.slice(0, 5);
  }, [sortedAccounts, accountSearch, mode]);

  useEffect(() => {
      if (rawAvailableAccounts.length === 1 && !accountId) setAccountId(rawAvailableAccounts[0].id);
      if (mode === 'admin_user' && adminTargetUser && !rawAvailableAccounts.some(a => a.id === accountId)) setAccountId('');
  }, [rawAvailableAccounts, accountId, mode, adminTargetUser]);

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!amount || !accountId || !categoryId || !profile) return;
     setSubmitting(true);
     const isGroup = groupAccounts.some(g => g.id === accountId);
     const txTable = isGroup ? 'group_transactions' : 'transactions';
     const { error } = await supabase.from(txTable).insert({ account_id: accountId, amount: parseFloat(amount), type: type, category_id: categoryId, note: note, created_by: profile.id, status: 'pending' });
     if (error) { console.error('Error creating transaction:', error); alert('Error creating transaction'); setSubmitting(false); return; }
     const accountTable = isGroup ? 'group_accounts' : 'accounts';
     const account = [...accounts, ...groupAccounts].find(a => a.id === accountId);
     if (account) { const newBalance = type === 'income' ? Number(account.balance) + parseFloat(amount) : Number(account.balance) - parseFloat(amount); await supabase.from(accountTable).update({ balance: newBalance }).eq('id', accountId); }
     await refreshData(); goBack();
  };

  const filteredCategories = categories.filter(c => c.type === type);
  const getTitle = () => { if (mode === 'fund') return 'Add Fund Transaction'; if (mode === 'admin_user') return 'Add User Transaction (Admin)'; return 'Add Personal Transaction'; }
  const getAccountLabel = () => { if (mode === 'fund') return 'SELECT FAMILY FUND'; if (mode === 'admin_user') return 'SELECT USER'; return 'SELECT ACCOUNT'; }
  const ICON_MAP: Record<string, any> = { ShoppingBag, Film, Zap, Car, Coffee, Home, GraduationCap, Pill, Gift, PawPrint, Sparkles, Palmtree, Laptop, Receipt, CreditCard, Wrench, Heart, Book, Bus, DollarSign, Banknote, TrendingUp, Package, Building, Coins, Wallet, Briefcase, Activity, Utensils, Smartphone, Plane, Music, ChartLine };
  const getCategoryIcon = (category: Category) => {
      const name = category.name.toLowerCase(); const iconStr = (category.icon || '').trim(); const size = 20;
      if (ICON_MAP[iconStr]) { const Icon = ICON_MAP[iconStr]; return <Icon size={size} />; }
      if (iconStr && /\p{Emoji}/u.test(iconStr) && iconStr.length < 5) return <span className="text-xl leading-none">{category.icon}</span>;
      return <ShoppingBag size={size} />;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col h-[100dvh] w-full">
       <div className="flex items-center justify-between p-4 md:p-6 bg-background z-10 shrink-0 border-b border-border">
         <button onClick={goBack} className="flex items-center text-secondary hover:text-primary transition-colors"><ArrowLeft size={20} className="mr-2" /><span className="text-base md:text-lg font-medium">Cancel</span></button>
         <h2 className="text-primary font-bold text-sm md:text-lg hidden sm:block">{getTitle()}</h2>
         <div className="w-16 hidden sm:block"></div>
       </div>

       <form onSubmit={handleSubmit} className="flex-1 overflow-hidden relative w-full h-full">
           <div className={`w-full h-full overflow-y-auto lg:overflow-visible p-4 lg:p-8 xl:p-12 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-12 xl:gap-16 lg:items-start`}>
               <div className="order-1 lg:order-2 space-y-4 lg:space-y-8 flex flex-col justify-center animate-fade-in py-4 lg:py-8" style={{animationDelay: '100ms'}}>
                   <div className="text-center space-y-3">
                        <label className="text-secondary text-xs font-medium tracking-wide block uppercase">Amount</label>
                        <div className="flex items-center justify-center relative group">
                            <span className={`text-2xl md:text-5xl font-bold mr-2 transition-colors ${amount ? 'text-primary' : 'text-secondary'}`}>Rs</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent text-4xl md:text-7xl font-bold text-primary text-center w-full max-w-[300px] focus:outline-none placeholder-gray-500 transition-colors" placeholder="0" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-border rounded-full group-focus-within:bg-indigo-500 group-focus-within:w-48 transition-all duration-300"></div>
                        </div>
                   </div>
                   <div className="bg-surface p-1 rounded-xl border border-border flex relative overflow-hidden shadow-lg max-w-xs mx-auto w-full">
                        <div className={`absolute inset-y-1 w-[calc(50%-4px)] bg-gradient-to-r transition-all duration-300 rounded-lg shadow-lg z-0 ${type === 'expense' ? 'left-1 from-rose-600 to-rose-500 shadow-rose-500/30' : 'left-[calc(50%+2px)] from-emerald-600 to-emerald-500 shadow-emerald-500/30'}`}></div>
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 relative z-10 py-2.5 text-xs font-bold transition-colors ${type === 'expense' ? 'text-white' : 'text-secondary hover:text-primary'}`}>Expense</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 relative z-10 py-2.5 text-xs font-bold transition-colors ${type === 'income' ? 'text-white' : 'text-secondary hover:text-primary'}`}>Income</button>
                   </div>
                   {mode === 'admin_user' && (
                       <div className="space-y-2 max-w-sm mx-auto w-full">
                            <label className="text-secondary text-[10px] uppercase tracking-wider font-bold ml-1">User Account</label>
                            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-surface border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 appearance-none font-medium text-sm shadow-sm transition-all cursor-pointer hover:border-gray-500">
                                <option value="" className="text-secondary">Select Account</option>
                                {rawAvailableAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} (Rs {acc.balance})</option>))}
                            </select>
                       </div>
                   )}
               </div>

               <div className="order-2 lg:order-1 space-y-2 lg:h-full flex flex-col animate-fade-in" style={{animationDelay: '0ms'}}>
                   <label className="text-secondary text-[10px] uppercase tracking-wider font-bold ml-1">{getAccountLabel()}</label>
                   {mode === 'admin_user' ? (
                       <div className="bg-surface p-4 rounded-2xl border border-border space-y-3 shadow-lg flex-1">
                            {!adminTargetUser ? (
                               <div className="relative">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                   <input type="text" value={adminSearchTerm} onChange={(e) => { setAdminSearchTerm(e.target.value); setShowAdminUserDropdown(true); }} onFocus={() => setShowAdminUserDropdown(true)} placeholder="Search user..." className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-3 text-primary text-sm focus:outline-none focus:border-indigo-500" />
                                   {showAdminUserDropdown && adminUserResults.length > 0 && (<div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">{adminUserResults.map(u => (<div key={u.id} onClick={() => { setAdminTargetUser(u); setShowAdminUserDropdown(false); setAdminSearchTerm(''); }} className="p-3 hover:bg-primary/5 cursor-pointer flex items-center space-x-3 border-b border-border/50 last:border-0"><div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><User size={14} /></div><div><p className="text-primary text-xs font-medium">{u.name}</p><p className="text-secondary text-[10px]">{u.email}</p></div></div>))}</div>)}
                               </div>
                           ) : (
                               <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/30">{adminTargetUser.name.charAt(0)}</div><div><p className="text-primary text-sm font-bold">{adminTargetUser.name}</p><p className="text-indigo-400 text-[10px] font-medium">Selected User</p></div></div><button type="button" onClick={() => { setAdminTargetUser(null); setAccountId(''); }} className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 hover:bg-indigo-500/40 hover:text-white transition-colors"><X size={16} /></button></div>
                           )}
                       </div>
                   ) : (
                       <div className="flex flex-col h-full space-y-2">
                           <div className="relative mb-1"><input type="text" value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} placeholder="Search accounts..." className="w-full bg-surface border border-border rounded-xl px-3 py-2 pl-9 text-primary text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder-secondary" /><div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"><Search size={14} /></div></div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 lg:max-h-[calc(100vh-280px)] overflow-x-hidden">{displayAccounts.length > 0 ? (displayAccounts.map(acc => { const isSelected = accountId === acc.id; return (<div key={acc.id} onClick={() => setAccountId(acc.id)} className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group w-full box-border ${isSelected ? 'bg-surface border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.15)] scale-[1.01]' : 'bg-surface border-border hover:border-secondary'}`}><div className="flex items-center gap-3 min-w-0"><div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-background border border-border text-secondary'}`}>{mode === 'fund' ? <Users size={16} /> : <CreditCard size={16} />}</div><div className="min-w-0"><p className={`text-xs font-bold mb-0.5 truncate ${isSelected ? 'text-primary' : 'text-secondary'}`}>{acc.name}</p><p className={`text-[10px] font-mono truncate ${isSelected ? 'text-indigo-400' : 'text-secondary'}`}>Rs {Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div></div>{isSelected && <Check size={14} className="text-indigo-400 flex-shrink-0 ml-2" />}</div>); })) : (<div className="text-center p-6 text-secondary text-[10px] bg-surface rounded-xl border border-border border-dashed">No accounts found.</div>)}</div>
                       </div>
                   )}
               </div>

               <div className="order-3 lg:order-3 space-y-3 flex flex-col lg:h-full animate-fade-in lg:border-l border-border lg:pl-8 xl:pl-12" style={{animationDelay: '200ms'}}>
                    <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                        <label className="text-secondary text-[10px] uppercase tracking-wider font-bold ml-1">Category</label>
                        <div className="lg:bg-surface lg:rounded-3xl lg:p-4 lg:border lg:border-border flex-1 lg:overflow-y-auto lg:custom-scrollbar lg:min-h-[300px]">
                             <div className="flex overflow-x-auto gap-3 pb-3 lg:pb-0 hide-scrollbar snap-x lg:grid lg:grid-cols-3 xl:grid-cols-3 lg:gap-y-4 lg:gap-x-3">
                                {filteredCategories.map(cat => (
                                    <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className="flex flex-col items-center gap-1.5 group focus:outline-none flex-shrink-0 snap-start">
                                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-primary border transition-all duration-300 shadow-sm relative overflow-hidden ${categoryId === cat.id ? 'bg-background border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-110 text-indigo-400' : 'bg-background border-border text-secondary hover:border-gray-500 hover:text-primary hover:scale-105'}`}>{getCategoryIcon(cat)}</div>
                                        <span className={`text-[9px] lg:text-[10px] font-bold text-center tracking-wide w-14 lg:w-full truncate transition-colors ${categoryId === cat.id ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>{cat.name}</span>
                                    </button>
                                ))}
                                {filteredCategories.length === 0 && (<div className="col-span-full w-full text-center text-secondary py-8 flex flex-col items-center justify-center"><div className="w-8 h-8 rounded-full bg-background flex items-center justify-center mb-2 text-lg">📂</div><p className="text-[10px]">No categories found.</p></div>)}
                             </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-secondary text-[10px] uppercase tracking-wider font-bold ml-1">Note (Optional)</label>
                       <div className="relative"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="w-full bg-surface border border-border rounded-xl p-3 text-primary resize-none h-16 lg:h-24 focus:outline-none focus:border-indigo-500 transition-all placeholder-secondary text-xs" /></div>
                    </div>
                    <button type="submit" disabled={submitting || !accountId || !categoryId} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:scale-100 mt-auto text-sm">{submitting ? 'Saving...' : <><Check className="mr-2" size={18} /> Save Transaction</>}</button>
               </div>
           </div>
       </form>
    </div>
  );
};