import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, CreditCard, Users, Calendar, Activity, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, TrendingDown, MoreHorizontal, Layers, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const formatCurrency = (amount: number, showFull: boolean) => {
  if (showFull) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) return (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  if (absAmount >= 10000) return (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, groupAccounts, transactions, profile, theme, goBack } = useApp();
  const [showFullNumbers, setShowFullNumbers] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const account = useMemo(() => accounts.find(a => a.id === id) || groupAccounts.find(a => a.id === id), [accounts, groupAccounts, id]);
  const isGroup = useMemo(() => groupAccounts.some(a => a.id === id), [groupAccounts, id]);
  const accountTransactions = useMemo(() => transactions.filter(t => t.account_id === id), [transactions, id]);
  const accountOwner = useMemo(() => { if (isGroup) return null; if ((account as any).profile) return (account as any).profile; if (account?.user_id === profile?.id) return profile; return null; }, [account, isGroup, profile]);
  const userAccountCount = useMemo(() => { if (isGroup || !account) return 0; return accounts.filter(a => a.user_id === account.user_id).length; }, [accounts, account, isGroup]);

  const chartData = useMemo(() => {
      const data = [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-20);
      let currentBal = account?.balance || 0;
      const history = [];
      let tempBal = currentBal;
      const allSorted = [...accountTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      for (const tx of allSorted.slice(0, 20)) {
           history.unshift({ date: tx.date, balance: tempBal, amount: tx.amount, type: tx.type });
           if (tx.type === 'income') tempBal -= Number(tx.amount); else tempBal += Number(tx.amount);
      }
      return history;
  }, [accountTransactions, account]);

  const totalIncome = useMemo(() => accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0), [accountTransactions]);
  const totalExpense = useMemo(() => accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0), [accountTransactions]);
  const getDisplayNumber = (amount: number) => { if (isMobile) return formatCurrency(amount, false); return formatCurrency(amount, showFullNumbers); };

  if (!account) return <div className="text-primary p-8">Account not found</div>;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
            <button onClick={goBack} className="p-2 bg-surface rounded-xl border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"><ArrowLeft size={18} /></button>
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                    {!isGroup && (<div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 to-purple-600"><img src={accountOwner?.avatar || `https://ui-avatars.com/api/?name=${accountOwner?.name || account.name}&background=random`} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-background" /></div>)}
                    {isGroup && (<div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30"><Users size={18} className="sm:w-6 sm:h-6" /></div>)}
                </div>
                <div className="min-w-0"><h2 className="text-lg sm:text-2xl font-bold text-primary leading-tight truncate pr-2">{account.name}</h2><div className="flex items-center gap-2"><p className="text-secondary text-[10px] sm:text-sm truncate">{isGroup ? 'Family Fund' : 'Personal Wallet'}</p>{account.is_suspended && <span className="text-rose-500 font-bold text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded flex-shrink-0">SUSPENDED</span>}</div></div>
            </div>
        </div>
        <button onClick={() => setShowFullNumbers(!showFullNumbers)} className="hidden sm:block p-2.5 sm:p-3 rounded-xl bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0" title={showFullNumbers ? "Hide details" : "Show full numbers"}>{showFullNumbers ? <Eye size={20} /> : <EyeOff size={20} />}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-border relative overflow-hidden flex flex-col justify-between min-h-[180px] md:min-h-[220px]">
          <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'opacity-20' : 'opacity-40'}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="balance" stroke={theme === 'dark' ? "#6366f1" : "#4f46e5"} strokeWidth={3} fill="url(#colorBalance)" /></AreaChart></ResponsiveContainer></div>
          <div className="relative z-10 p-5 md:p-8 flex flex-col h-full justify-between">
              <div><p className="text-secondary mb-1 font-medium text-xs md:text-sm">Total Balance</p><div className="flex flex-wrap items-baseline gap-4"><h3 className="text-3xl md:text-5xl font-bold text-primary tracking-tight">Rs {getDisplayNumber(Number(account.balance))}</h3></div></div>
              <div className="flex flex-wrap gap-6 md:gap-8 mt-4 md:mt-6">
                <div><p className="text-secondary text-[9px] md:text-[10px] uppercase tracking-wider font-bold mb-1">Created</p><p className="text-primary font-medium flex items-center gap-1.5 text-xs md:text-sm"><Calendar size={12} className="text-indigo-400" />{format(new Date(account.created_at), 'MMM dd, yyyy')}</p></div>
                <div><p className="text-secondary text-[9px] md:text-[10px] uppercase tracking-wider font-bold mb-1">Currency</p><p className="text-primary font-medium text-xs md:text-sm">INR (Rs)</p></div>
                <div><p className="text-secondary text-[9px] md:text-[10px] uppercase tracking-wider font-bold mb-1">Remaining</p><p className="text-emerald-400 font-bold text-xs md:text-sm">Rs {getDisplayNumber(Number(account.balance))}</p></div>
             </div>
          </div>
          <div className="absolute top-6 right-6 p-4 bg-indigo-500/10 rounded-2xl hidden sm:block"><CreditCard size={48} className="text-indigo-500/50" /></div>
        </div>
        
        <div className="bg-surface p-5 md:p-6 rounded-3xl border border-border flex flex-col h-full">
           <div className="flex items-center justify-between mb-4 md:mb-6"><h4 className="text-primary font-bold flex items-center gap-2 text-sm md:text-base"><Activity size={16} className="text-indigo-400" /> Details</h4><div className={`px-2 py-1 rounded text-[10px] font-bold ${account.is_suspended ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{account.is_suspended ? 'Active' : 'Active'}</div></div>
           <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50"><span className="text-secondary text-xs">Transaction Count</span><span className="text-primary font-mono text-xs font-bold">{accountTransactions.length}</span></div>
              {!isGroup && (<div className="flex justify-between items-center pb-2 border-b border-border/50"><span className="text-secondary text-xs">User Accounts</span><span className="text-primary font-mono text-xs font-bold">{userAccountCount}</span></div>)}
              {isGroup && (<div className="flex justify-between items-center pb-2 border-b border-border/50"><span className="text-secondary text-xs">Members</span><span className="text-primary font-mono text-xs font-bold">{(account as any).members?.length || 1}</span></div>)}
              <div className="grid grid-cols-2 gap-3 pt-1"><div className="bg-background p-3 rounded-xl border border-border/50"><p className="text-[10px] text-secondary mb-1">Income</p><p className="text-emerald-400 font-bold text-xs">+Rs {getDisplayNumber(totalIncome)}</p></div><div className="bg-background p-3 rounded-xl border border-border/50"><p className="text-[10px] text-secondary mb-1">Expense</p><p className="text-rose-400 font-bold text-xs">-Rs {getDisplayNumber(totalExpense)}</p></div></div>
           </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-border overflow-hidden">
         <div className="p-4 md:p-6 border-b border-border"><h3 className="text-base md:text-lg font-bold text-primary">Recent Activity</h3></div>
         <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-background/50 border-b border-border">
                 <tr><th className="py-3 pl-4 pr-2 text-secondary text-[10px] font-bold uppercase tracking-wider">Name</th><th className="px-3 py-3 text-secondary text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell">Category</th><th className="px-3 py-3 text-secondary text-[10px] font-bold uppercase tracking-wider hidden md:table-cell">Date</th><th className="px-3 py-3 text-secondary text-[10px] font-bold uppercase tracking-wider">Amount</th><th className="py-3 pl-2 pr-4 text-secondary text-[10px] font-bold uppercase tracking-wider text-right">Status</th></tr>
               </thead>
               <tbody className="divide-y divide-border">
                 {accountTransactions.length > 0 ? (accountTransactions.map(tx => { const status = tx.status || 'completed'; const statusLabel = status.charAt(0).toUpperCase() + status.slice(1); const statusColor = status === 'pending' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'; return (
                    <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-3 pl-4 pr-2"><div className="flex items-center space-x-3"><div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div><span className="text-primary font-bold text-xs capitalize">{tx.type}</span></div></td>
                        <td className="px-3 py-3 hidden sm:table-cell"><span className="text-secondary text-xs font-medium">{tx.category?.name || 'Uncategorized'}</span></td>
                        <td className="px-3 py-3 hidden md:table-cell"><span className="text-secondary text-xs">{format(new Date(tx.date), 'dd.MM.yyyy')}</span></td>
                        <td className="px-3 py-3"><span className={`font-bold text-xs ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}><span>{tx.type === 'expense' ? '- ' : '+ '}Rs {getDisplayNumber(Number(tx.amount))}</span></span></td>
                        <td className="py-3 pl-2 pr-4 text-right"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>{statusLabel}</span></td>
                    </tr>
                 )})) : (<tr><td colSpan={6} className="p-6 text-center text-secondary text-xs">No transactions yet.</td></tr>)}
               </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};