import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { Search, ArrowUpRight, ArrowDownLeft, Plus, Users, CreditCard, ChevronDown, Layers, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';

export const Transactions: React.FC = () => {
  const { transactions, accounts, groupAccounts, profile } = useApp();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) { setShowDesktopMenu(false); } }
    document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const handleAddClick = (mode: 'personal' | 'fund' | 'admin_user') => { setShowMenu(false); setShowDesktopMenu(false); navigate('/add', { state: { mode } }); };

  const formatCurrency = (amount: number, showFull: boolean) => {
    if (showFull) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) return (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
    if (absAmount >= 10000) return (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredRaw = useMemo(() => {
      return transactions.filter(t => {
        const matchesFilter = filter === 'all' || t.type === filter;
        const matchesSearch = t.note?.toLowerCase().includes(search.toLowerCase()) || t.category?.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      });
  }, [transactions, filter, search]);

  const { myPersonalTx, fundTx, usersTx } = useMemo(() => {
      const my: Transaction[] = []; const fund: Transaction[] = []; const others: Transaction[] = [];
      const myAccountIds = new Set(accounts.filter(a => a.user_id === profile?.id).map(a => a.id));
      const groupIds = new Set(groupAccounts.map(g => g.id));
      filteredRaw.forEach(tx => { if (groupIds.has(tx.account_id)) { fund.push(tx); } else if (myAccountIds.has(tx.account_id)) { my.push(tx); } else { others.push(tx); } });
      return { myPersonalTx: my, fundTx: fund, usersTx: others };
  }, [filteredRaw, accounts, groupAccounts, profile]);

  const TransactionTable = ({ data, emptyMessage }: { data: Transaction[], emptyMessage: string }) => {
      if (data.length === 0) {
          return (
             <div className="bg-surface rounded-3xl border border-border p-6 text-center text-secondary text-xs flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mb-2 text-secondary"><Search size={16} /></div>{emptyMessage}
             </div>
          );
      }

      return (
        <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="py-2 pl-2 sm:pl-3 md:pl-6 pr-2 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider w-[45%] md:w-auto">Name</th>
                  <th className="px-4 py-3 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Time</th>
                  <th className="px-1 sm:px-2 md:px-4 py-2 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider text-right md:text-left whitespace-nowrap">Amount</th>
                  <th className="py-2 pr-2 sm:pr-3 md:pr-6 pl-2 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider text-right w-[20%] md:w-auto">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((tx) => {
                  const status = tx.status || 'completed'; const statusLabel = status.charAt(0).toUpperCase() + status.slice(1); const statusColor = status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  return (
                  <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-2 pl-2 sm:pl-3 md:pl-6 pr-2">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm md:text-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{tx.type === 'income' ? <ArrowDownLeft size={14} className="md:w-5 md:h-5" /> : <ArrowUpRight size={14} className="md:w-5 md:h-5" />}</div>
                          <div className="min-w-0"><p className="text-primary font-medium text-xs md:text-sm capitalize truncate">{tx.note || tx.category?.name || tx.type}</p>{tx.profile && <p className="text-[9px] text-secondary truncate">{tx.profile.name}</p>}</div>
                        </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-secondary text-sm">{tx.category?.name || 'Uncategorized'}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-secondary text-sm">{format(new Date(tx.date), 'dd.MM.yyyy')}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-secondary text-sm">{format(new Date(tx.date), 'hh:mm a')}</span></td>
                    <td className={`px-1 sm:px-2 md:px-4 py-2 font-bold text-xs md:text-sm text-right md:text-left whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}><span>{tx.type === 'expense' ? '- ' : '+ '}Rs {formatCurrency(Number(tx.amount), false)}</span></td>
                    <td className="py-2 pr-2 sm:pr-3 md:pr-6 pl-2 text-right whitespace-nowrap"><span className={`inline-block px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-xs font-medium border ${statusColor}`}>{statusLabel}</span></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      );
  };

  const isAdmin = profile?.role === 'admin';
  const hasResults = filteredRaw.length > 0;

  return (
    <>
      <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-8 relative min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-surface p-3 md:p-4 rounded-3xl border border-border">
          <h2 className="text-lg md:text-2xl font-bold text-primary pl-1">Transactions</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
              <div className="relative w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={14} /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-primary focus:outline-none focus:border-indigo-500 placeholder-secondary" /></div>
              <div className="flex bg-background p-1 rounded-xl border border-border w-full sm:w-auto">{['all', 'income', 'expense'].map((f) => (<button key={f} onClick={() => setFilter(f as any)} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-primary'}`}>{f}</button>))}</div>
              <div className="relative hidden md:block" ref={desktopMenuRef}><button onClick={() => setShowDesktopMenu(!showDesktopMenu)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"><Plus size={16} /><span>Add New</span><ChevronDown size={14} className={`transition-transform ${showDesktopMenu ? 'rotate-180' : ''}`} /></button>{showDesktopMenu && (<div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right"><div className="p-1"><button onClick={() => handleAddClick('personal')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-lg text-left transition-colors group"><div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors"><CreditCard size={14} /></div><div><p className="text-primary text-sm font-medium">Personal</p><p className="text-secondary text-[10px]">Your private wallet</p></div></button><button onClick={() => handleAddClick('fund')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-lg text-left transition-colors group mt-1"><div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Users size={14} /></div><div><p className="text-primary text-sm font-medium">Family Fund</p><p className="text-secondary text-[10px]">Shared group account</p></div></button></div></div>)}</div>
          </div>
        </div>

        {!hasResults && (<div className="bg-surface rounded-3xl border border-border min-h-[300px] flex flex-col items-center justify-center text-secondary"><div className="w-14 h-14 bg-background rounded-full flex items-center justify-center mb-3 text-secondary"><Search size={20} /></div><p className="text-sm">No transactions found.</p></div>)}
        {hasResults && isAdmin && usersTx.length > 0 && (<div className="space-y-2"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 pl-2"><User size={12} /> Users Transactions</h3><TransactionTable data={usersTx} emptyMessage="No user transactions." /></div>)}
        {hasResults && (isAdmin || fundTx.length > 0) && (<div className="space-y-2"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 pl-2"><Users size={12} /> Family Fund Transactions</h3><TransactionTable data={fundTx} emptyMessage="No fund transactions." /></div>)}
        {hasResults && myPersonalTx.length > 0 && (<div className="space-y-2"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 pl-2"><CreditCard size={12} /> Personal Wallet Transactions</h3><TransactionTable data={myPersonalTx} emptyMessage="No personal transactions." /></div>)}
      </div>

      <div className="fixed bottom-20 right-4 z-50 md:hidden flex flex-col items-end gap-3">
          <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right ${showMenu ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20 pointer-events-none'}`}>
              <div className="flex items-center gap-3 animate-slide-up" style={{animationDelay: '50ms'}}><span className="bg-surface text-primary text-[10px] font-bold py-1 px-2.5 rounded-xl border border-border shadow-xl">Fund Tx</span><button onClick={() => handleAddClick('fund')} className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"><Users size={18} /></button></div>
              <div className="flex items-center gap-3 animate-slide-up" style={{animationDelay: '0ms'}}><span className="bg-surface text-primary text-[10px] font-bold py-1 px-2.5 rounded-xl border border-border shadow-xl">Personal Tx</span><button onClick={() => handleAddClick('personal')} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"><CreditCard size={18} /></button></div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className={`w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 transition-transform duration-300 ${showMenu ? 'rotate-45' : 'rotate-0'}`}><Plus size={20} /></button>
      </div>
      {showMenu && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in" onClick={() => setShowMenu(false)}></div>}
      <style>{`@keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
    </>
  );
};