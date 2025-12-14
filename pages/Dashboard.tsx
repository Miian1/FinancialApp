import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Bell, X, DollarSign, PiggyBank, Filter, ArrowRight, ChevronDown, Check, CreditCard, Users, Layers, Activity } from 'lucide-react';
import { format } from 'date-fns';

const subDays = (date: Date, days: number): Date => { const result = new Date(date); result.setDate(result.getDate() - days); return result; };
const isSameDay = (d1: Date, d2: Date): boolean => { return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); };
const parseISO = (str: string): Date => { return new Date(str); };

const formatCurrency = (amount: number, showFull: boolean) => {
  if (showFull) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) return (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  if (absAmount >= 10000) return (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface StatCardProps { title: string; amount: number; customValue?: string; subtext?: string; icon: any; badge?: string; badgeColor?: string; color: string; chartData: { value: number }[]; chartColor: string; theme: 'light' | 'dark'; }

const StatCard = ({ title, amount, customValue, subtext, icon: Icon, badge, badgeColor, color, chartData, chartColor, theme }: StatCardProps) => {
  const displayAmount = customValue || 'Rs ' + formatCurrency(amount, false); 
  const idSafeTitle = title.replace(/\s/g, '');

  return (
    <div className="bg-surface rounded-2xl md:rounded-3xl border border-border relative overflow-hidden h-32 md:h-48 flex flex-col justify-between p-3 md:p-6 group transition-all hover:border-secondary/30">
        <div className="flex justify-between items-start z-10 relative">
        <div className={`p-1.5 md:p-3 rounded-xl md:rounded-2xl bg-${color}-500/10 text-${color}-500`}>
            <Icon size={16} className="md:w-6 md:h-6" />
        </div>
        {badge && (
            <span className={`text-[8px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg ${badgeColor || 'bg-emerald-500/20 text-emerald-400'}`}>
            {badge}
            </span>
        )}
        </div>
        <div className="z-10 relative">
        <p className="text-secondary text-[9px] md:text-sm font-medium truncate">{title}</p>
        <h3 className="text-base md:text-2xl font-bold text-primary mt-0.5 md:mt-1 truncate" title={customValue ? customValue : `Rs ${amount.toLocaleString()}`}>{displayAmount}</h3>
        {subtext && <p className="text-[8px] md:text-xs text-secondary mt-0.5 truncate">{subtext}</p>}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-12 md:h-28 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-normal'}`}>
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id={`gradient-${idSafeTitle}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor} stopOpacity={0.5}/><stop offset="100%" stopColor={chartColor} stopOpacity={0}/></linearGradient><linearGradient id={`wave-${idSafeTitle}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={chartColor} stopOpacity={0.4} /><stop offset="50%" stopColor="#ffffff" stopOpacity={0.8} /><stop offset="100%" stopColor={chartColor} stopOpacity={0.4} /><animate attributeName="x1" values="-100%;100%" dur="3s" repeatCount="indefinite" /><animate attributeName="x2" values="0%;200%" dur="3s" repeatCount="indefinite" /></linearGradient></defs><Area type="monotone" dataKey="value" stroke="none" fill={`url(#gradient-${idSafeTitle})`} isAnimationActive={false} /><Area type="monotone" dataKey="value" stroke={`url(#wave-${idSafeTitle})`} strokeWidth={2} fill="none" isAnimationActive={false} /><Area type="monotone" dataKey="value" stroke={theme === 'dark' ? (color === 'white' ? '#000000' : '#ffffff') : chartColor} strokeWidth={3} fill="none" className="electric-dot" isAnimationActive={false} /></AreaChart></ResponsiveContainer>
        </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { viewMode, setViewMode, accounts, groupAccounts, transactions, categories, user, notifications, theme } = useApp();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [chartIndex, setChartIndex] = useState(0); 
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (notifRef.current && !notifRef.current.contains(event.target as Node)) { setShowNotifMenu(false); } if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) { setShowAccountDropdown(false); } }
    document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  useEffect(() => { const interval = setInterval(() => { if (window.innerWidth < 1024) { setChartIndex(prev => (prev === 0 ? 1 : 0)); } }, 8000); return () => clearInterval(interval); }, []);
  useEffect(() => { setSelectedAccountId('all'); }, [viewMode]);

  const availableAccounts = useMemo(() => { if (viewMode === 'personal') { return accounts.filter(a => a.user_id === user?.id); } else { return groupAccounts.filter(g => g.members?.includes(user?.id || '')); } }, [viewMode, accounts, groupAccounts, user]);
  const activeAccounts = useMemo(() => { if (selectedAccountId === 'all') return availableAccounts; return availableAccounts.filter(a => a.id === selectedAccountId); }, [selectedAccountId, availableAccounts]);
  const selectedAccountLabel = useMemo(() => { if (selectedAccountId === 'all') return 'Combined Data'; const acc = availableAccounts.find(a => a.id === selectedAccountId); return acc ? acc.name : 'Select Account'; }, [selectedAccountId, availableAccounts]);
  const totalBalance = useMemo(() => activeAccounts.reduce((acc, curr) => acc + (curr.balance || 0), 0), [activeAccounts]);
  const relevantTransactions = useMemo(() => { const accountIds = activeAccounts.map(a => a.id); return transactions.filter(t => accountIds.includes(t.account_id)); }, [transactions, activeAccounts]);
  const totalIncome = relevantTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = relevantTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const healthScore = useMemo(() => {
      if (totalIncome === 0) return totalExpense === 0 ? 50 : 0;
      const savingsRatio = (totalIncome - totalExpense) / totalIncome;
      // Map: -1 (debt) to 0, 0 (break even) to 50, 1 (all savings) to 100
      const score = 50 + (savingsRatio * 50);
      return Math.max(0, Math.min(100, Math.round(score)));
  }, [totalIncome, totalExpense]);

  const getTrendData = (type: 'balance' | 'income' | 'expense' | 'remaining') => {
      const data = []; let tempBalance = totalBalance; const days = 14;
      if (type === 'balance') { for (let i = 0; i < days; i++) { const d = subDays(new Date(), i); const dayTx = relevantTransactions.filter(t => isSameDay(parseISO(t.date), d)); const netChange = dayTx.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0); data.unshift({ value: tempBalance }); tempBalance -= netChange; } } 
      else { for (let i = days - 1; i >= 0; i--) { const d = subDays(new Date(), i); const dayTx = relevantTransactions.filter(t => isSameDay(parseISO(t.date), d)); let val = 0; if (type === 'income') { val = dayTx.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0); } else if (type === 'expense') { val = dayTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0); } else if (type === 'remaining') { const inc = dayTx.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0); const exp = dayTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0); val = inc - exp; } data.push({ value: val }); } }
      return data;
  };

  const balanceTrend = useMemo(() => getTrendData('balance'), [relevantTransactions, totalBalance]);
  const incomeTrend = useMemo(() => getTrendData('income'), [relevantTransactions]);
  const expenseTrend = useMemo(() => getTrendData('expense'), [relevantTransactions]);
  const remainingTrend = useMemo(() => getTrendData('remaining'), [relevantTransactions]);

  const weeklyStats = useMemo(() => { const data = []; for (let i = 6; i >= 0; i--) { const d = subDays(new Date(), i); const label = format(d, 'cccccc').substring(0, 2); const dayTransactions = relevantTransactions.filter(t => isSameDay(parseISO(t.date), d)); const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0); const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0); data.push({ name: label, income, expense }); } return data; }, [relevantTransactions]);
  const monthlyActivityData = useMemo(() => { const data = []; for (let i = 29; i >= 0; i--) { const d = subDays(new Date(), i); const dateStr = format(d, 'MMM dd'); const dayTransactions = relevantTransactions.filter(t => isSameDay(parseISO(t.date), d) && t.type === 'expense'); const amt = dayTransactions.reduce((acc, t) => acc + Number(t.amount), 0); data.push({ name: dateStr, amount: amt }); } return data; }, [relevantTransactions]);
  const categoryData = useMemo(() => { const stats: Record<string, { value: number, color: string }> = {}; relevantTransactions.filter(t => t.type === 'expense').forEach(t => { const catName = t.category?.name || 'Uncategorized'; const catColor = t.category?.color || '#9ca3af'; if (!stats[catName]) stats[catName] = { value: 0, color: catColor }; stats[catName].value += Number(t.amount); }); return Object.entries(stats).map(([name, { value, color }]) => ({ name, value, color })).sort((a, b) => b.value - a.value); }, [relevantTransactions]);
  const FALLBACK_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#ec4899', '#06b6d4'];
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleTouchStart = (e: React.TouchEvent) => { setTouchStart(e.targetTouches[0].clientX); }
  const handleTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); }
  const handleTouchEnd = () => { if (!touchStart || !touchEnd) return; const distance = touchStart - touchEnd; if (distance > 50 || distance < -50) { setChartIndex(prev => (prev === 0 ? 1 : 0)); } setTouchEnd(0); setTouchStart(0); }

  const renderMonthlyChart = () => (
    <div className="bg-surface p-4 md:p-6 rounded-3xl border border-border h-full flex flex-col shadow-xl">
        <h3 className="text-base md:text-lg font-bold text-primary mb-4 md:mb-6">Monthly Activity</h3>
        <div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyActivityData}><defs><linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="wave-monthly" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="50%" stopColor="#ffffff" stopOpacity={0.8} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} /><animate attributeName="x1" values="-100%;100%" dur="4s" repeatCount="indefinite" /><animate attributeName="x2" values="0%;200%" dur="4s" repeatCount="indefinite" /></linearGradient></defs><XAxis dataKey="name" stroke={theme === 'dark' ? "#4b5563" : "#9ca3af"} tick={{fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} /><YAxis stroke={theme === 'dark' ? "#4b5563" : "#9ca3af"} tick={{fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `${formatCurrency(val, false)}`} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: '12px', color: theme === 'dark' ? '#fff' : '#111827' }} itemStyle={{ color: '#818cf8' }} /><Area type="monotone" dataKey="amount" stroke="none" fillOpacity={1} fill="url(#colorAmt)" /><Area type="monotone" dataKey="amount" stroke="url(#wave-monthly)" strokeWidth={3} fill="none" /><Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={3} fill="none" className="electric-dot" /></AreaChart></ResponsiveContainer></div>
    </div>
  );

  const renderCategoriesChart = () => (
    <div className="bg-surface p-4 md:p-6 rounded-3xl border border-border h-full flex flex-col shadow-xl">
        <h3 className="text-base md:text-lg font-bold text-primary mb-2">Categories</h3>
        <div className="h-[180px] md:h-[200px] w-full relative shrink-0">
            {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color && entry.color.startsWith('#') ? entry.color : FALLBACK_COLORS[index % FALLBACK_COLORS.length]} stroke="none" />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderRadius: '8px', border: 'none', color: theme === 'dark' ? '#fff' : '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} /></PieChart></ResponsiveContainer>
            ) : (<div className="flex items-center justify-center h-full text-secondary text-xs">No expense data</div>)}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar mt-2 flex flex-col justify-center">
            {categoryData.slice(0, 3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 mb-1.5 hover:bg-primary/5 rounded-xl transition-colors bg-background/50 border border-border/50">
                    <div className="flex items-center truncate mr-2"><div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: entry.color && entry.color.startsWith('#') ? entry.color : FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}></div><span className="text-secondary font-medium truncate">{entry.name}</span></div><span className="text-primary font-bold whitespace-nowrap">Rs {formatCurrency(entry.value, false)}</span>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-4">
      <style>{`@keyframes dash-flow { 0% { stroke-dashoffset: 2000; } 100% { stroke-dashoffset: 0; } } .electric-dot { stroke-dasharray: 10 2000; animation: dash-flow 4s linear infinite; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)); opacity: 0.8; }`}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div><h2 className="text-lg md:text-2xl font-bold text-primary max-w-[280px] sm:max-w-none">Welcome back, {user?.user_metadata?.name?.split(' ')[0] || 'User'}!</h2><p className="text-secondary text-xs md:text-sm">Here is your financial overview.</p></div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="bg-surface p-1 rounded-xl flex border border-border">
            <button onClick={() => setViewMode('personal')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${viewMode === 'personal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-secondary hover:text-primary'}`}>Personal</button>
            <button onClick={() => setViewMode('family')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${viewMode === 'family' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-secondary hover:text-primary'}`}>Family</button>
          </div>
          <div className="relative" ref={accountDropdownRef}>
              <button onClick={() => setShowAccountDropdown(!showAccountDropdown)} className="bg-surface border border-border text-primary px-3 py-2 md:px-4 md:py-2.5 rounded-xl flex items-center gap-2 text-[10px] md:text-sm font-medium hover:bg-background transition-colors"><span className="max-w-[90px] md:max-w-[120px] truncate">{selectedAccountLabel}</span><ChevronDown size={14} className={`text-secondary transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} /></button>
              {showAccountDropdown && (<div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"><div className="max-h-72 overflow-y-auto custom-scrollbar p-1"><button onClick={() => { setSelectedAccountId('all'); setShowAccountDropdown(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/5 flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-secondary group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Layers size={14} /></div><span className="text-sm font-medium text-primary">Combined Data</span></div>{selectedAccountId === 'all' && <Check size={16} className="text-indigo-400" />}</button><div className="h-px bg-border my-1 mx-2"></div>{availableAccounts.map(acc => { const isSelected = selectedAccountId === acc.id; return (<button key={acc.id} onClick={() => { setSelectedAccountId(acc.id); setShowAccountDropdown(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/5 flex items-center justify-between group mb-0.5"><div className="flex items-center gap-3 min-w-0"><div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-background text-secondary group-hover:bg-indigo-500/20 group-hover:text-indigo-400'}`}>{viewMode === 'personal' ? <CreditCard size={14} /> : <Users size={14} />}</div><div className="min-w-0"><p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-400' : 'text-primary'}`}>{acc.name}</p><p className="text-xs text-secondary font-mono">Rs {formatCurrency(acc.balance, false)}</p></div></div>{isSelected && <Check size={16} className="text-indigo-400 flex-shrink-0 ml-2" />}</button>); })}</div></div>)}
          </div>
          <div className="hidden md:block relative" ref={notifRef}><button onClick={() => setShowNotifMenu(!showNotifMenu)} className="p-3 rounded-xl bg-surface border border-border text-secondary hover:text-primary transition-colors relative"><Bell size={20} />{unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-surface"></span>}</button>{showNotifMenu && (<div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in"><div className="p-4 border-b border-border flex justify-between items-center bg-background/50"><h4 className="font-bold text-primary text-sm">Notifications</h4><button onClick={() => setShowNotifMenu(false)}><X size={16} className="text-secondary hover:text-primary"/></button></div><div className="max-h-64 overflow-y-auto custom-scrollbar">{recentNotifications.map(n => (<div key={n.id} onClick={() => { setShowNotifMenu(false); navigate('/notifications'); }} className="p-3 hover:bg-primary/5 border-b border-border cursor-pointer transition-colors group"><div className="flex justify-between items-start mb-1"><span className={`text-xs font-bold capitalize ${n.type === 'invite' ? 'text-indigo-400' : 'text-secondary'}`}>{n.type}</span><span className="text-[10px] text-secondary group-hover:text-primary">{format(new Date(n.created_at), 'MMM dd')}</span></div><p className="text-sm text-secondary group-hover:text-primary line-clamp-2 transition-colors">{n.message}</p></div>))}</div><button onClick={() => { setShowNotifMenu(false); navigate('/notifications'); }} className="w-full p-3 text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-primary/5 transition-colors border-t border-border">See All</button></div>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard title="My Balance" amount={totalBalance} icon={Wallet} color="indigo" badge="+2.1%" badgeColor="bg-emerald-500/20 text-emerald-400" chartData={balanceTrend} chartColor="#818cf8" theme={theme} />
        <StatCard 
          title="Health Score" 
          amount={0} 
          customValue={`${healthScore} / 100`}
          subtext="Based on spending & saving habits" 
          icon={Activity} 
          color="amber" 
          badge={healthScore >= 70 ? "Healthy" : "Attention"} 
          badgeColor={healthScore >= 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"} 
          chartData={remainingTrend} 
          chartColor="#fbbf24" 
          theme={theme} 
        />
        <StatCard title="Income" amount={totalIncome} icon={ArrowDownLeft} color="blue" badge="+10.3%" badgeColor="bg-emerald-500/20 text-emerald-400" chartData={incomeTrend} chartColor="#3b82f6" theme={theme} />
        <StatCard title="Expenses" amount={totalExpense} icon={ArrowUpRight} color="rose" badge="-5.8%" badgeColor="bg-rose-500/20 text-rose-400" chartData={expenseTrend} chartColor="#fb7185" theme={theme} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="hidden xl:flex xl:col-span-1 bg-surface p-6 rounded-3xl border border-border flex-col">
          <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-primary">Statistics</h3></div>
          <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyStats} barGap={8}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#374151" : "#e5e7eb"} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12}} tickFormatter={(val) => `${formatCurrency(val, false)}`} /><Tooltip cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: '12px', color: theme === 'dark' ? '#fff' : '#111827' }} /><Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} /><Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="xl:col-span-2 bg-surface p-4 md:p-6 rounded-3xl border border-border overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 md:mb-6"><h3 className="text-base md:text-lg font-bold text-primary">Transactions</h3><button onClick={() => navigate('/transactions')} className="flex items-center text-secondary text-xs md:text-sm hover:text-primary transition-colors">See All <ArrowRight size={14} className="ml-1" /></button></div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead><tr className="border-b border-border text-secondary text-[10px] md:text-xs uppercase tracking-wider"><th className="pb-3 font-medium pl-2">Name</th><th className="pb-3 font-medium hidden md:table-cell">Category</th><th className="pb-3 font-medium hidden md:table-cell">Date</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium text-right pr-2">Status</th></tr></thead>
               <tbody className="divide-y divide-border">
                 {relevantTransactions.slice(0, 4).map((tx) => { const status = tx.status || 'completed'; const statusLabel = status.charAt(0).toUpperCase() + status.slice(1); const statusColor = status === 'pending' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'; return (<tr key={tx.id} className="group hover:bg-primary/5 transition-colors"><td className="py-3 pr-2 pl-2"><div className="flex items-center space-x-2 md:space-x-3"><div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div><span className="text-primary font-medium text-xs md:text-sm capitalize">{tx.type}</span></div></td><td className="py-3 pr-2 text-secondary text-xs md:text-sm hidden md:table-cell">{tx.category?.name || 'Uncategorized'}</td><td className="py-3 pr-2 text-secondary text-xs md:text-sm hidden md:table-cell">{format(new Date(tx.date), 'dd.MM.yyyy')}</td><td className={`py-3 pr-2 font-bold text-xs md:text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}><span>{tx.type === 'expense' ? '- ' : '+ '}Rs {formatCurrency(Number(tx.amount), false)}</span></td><td className="py-3 text-right pr-2"><span className={`text-[10px] md:text-xs font-medium px-2 py-1 rounded ${statusColor}`}>{statusLabel}</span></td></tr>)})}
                 {relevantTransactions.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-secondary text-xs">No recent transactions.</td></tr>}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      <div className="relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="lg:hidden h-[280px] md:h-[420px] w-full [perspective:1000px] mt-2 md:mt-4">
            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${chartIndex === 1 ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 [backface-visibility:hidden]">{renderMonthlyChart()}</div><div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{renderCategoriesChart()}</div>
            </div>
            <div className="flex justify-center gap-2 mt-3"><div className={`w-1.5 h-1.5 rounded-full transition-colors ${chartIndex === 0 ? 'bg-indigo-500' : 'bg-gray-700'}`}></div><div className={`w-1.5 h-1.5 rounded-full transition-colors ${chartIndex === 1 ? 'bg-indigo-500' : 'bg-gray-700'}`}></div></div>
        </div>
        <div className="hidden lg:grid grid-cols-3 gap-6 h-[420px]"><div className="col-span-2 h-full">{renderMonthlyChart()}</div><div className="h-full">{renderCategoriesChart()}</div></div>
      </div>
    </div>
  );
};