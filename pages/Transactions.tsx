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

  // Close desktop menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setShowDesktopMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddClick = (mode: 'personal' | 'fund' | 'admin_user') => {
      setShowMenu(false);
      setShowDesktopMenu(false);
      navigate('/add', { state: { mode } });
  };

  // Unified Number Formatter
  const formatCurrency = (amount: number, showFull: boolean) => {
    if (showFull) {
      return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  
    const absAmount = Math.abs(amount);
  
    // >= 1,000,000 -> 1.5M
    if (absAmount >= 1000000) {
      return (amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
    }
    
    // >= 10,000 -> 15k
    if (absAmount >= 10000) {
      return (amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
    }
  
    // Default
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- Filtering & Bucketing Logic ---

  // 1. Filter by Type and Search
  const filteredRaw = useMemo(() => {
      return transactions.filter(t => {
        const matchesFilter = filter === 'all' || t.type === filter;
        const matchesSearch = t.note?.toLowerCase().includes(search.toLowerCase()) || 
                              t.category?.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      });
  }, [transactions, filter, search]);

  // 2. Bucket into Sections
  const { myPersonalTx, fundTx, usersTx } = useMemo(() => {
      const my: Transaction[] = [];
      const fund: Transaction[] = [];
      const others: Transaction[] = [];

      // Create Sets for fast lookup
      // My Accounts: Accounts owned by current user
      const myAccountIds = new Set(accounts.filter(a => a.user_id === profile?.id).map(a => a.id));
      // Group Accounts: All group accounts loaded
      const groupIds = new Set(groupAccounts.map(g => g.id));

      filteredRaw.forEach(tx => {
          if (groupIds.has(tx.account_id)) {
              fund.push(tx);
          } else if (myAccountIds.has(tx.account_id)) {
              my.push(tx);
          } else {
              // Not a group, not mine => Must be another user's personal transaction (Admin view)
              others.push(tx);
          }
      });

      return { myPersonalTx: my, fundTx: fund, usersTx: others };
  }, [filteredRaw, accounts, groupAccounts, profile]);

  // --- Reusable Table Component ---
  const TransactionTable = ({ data, emptyMessage }: { data: Transaction[], emptyMessage: string }) => {
      if (data.length === 0) {
          return (
             <div className="bg-surface rounded-3xl border border-border p-8 text-center text-secondary text-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-3 text-secondary">
                      <Search size={20} />
                  </div>
                  {emptyMessage}
             </div>
          );
      }

      return (
        <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="py-3 pl-3 md:pl-6 pr-2 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider w-[40%] md:w-auto">Name</th>
                  <th className="px-4 py-4 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-4 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-4 py-4 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Time</th>
                  <th className="px-2 md:px-4 py-3 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider text-right md:text-left whitespace-nowrap">Amount</th>
                  <th className="py-3 pr-3 md:pr-6 pl-2 text-secondary font-bold text-[10px] md:text-xs uppercase tracking-wider text-right w-[20%] md:w-auto">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((tx) => {
                  const status = tx.status || 'completed';
                  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                  const statusColor = status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  
                  return (
                  <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                    {/* Name Column (Icon + Name) */}
                    <td className="py-3 pl-3 md:pl-6 pr-2">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm md:text-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {tx.type === 'income' ? <ArrowDownLeft size={16} className="md:w-5 md:h-5" /> : <ArrowUpRight size={16} className="md:w-5 md:h-5" />}
                          </div>
                          <div className="min-w-0">
                             <p className="text-primary font-medium text-xs md:text-sm capitalize truncate">{tx.note || tx.category?.name || tx.type}</p>
                             {/* Show user name if available (Admin view utility) */}
                             {tx.profile && (
                                 <p className="text-[10px] text-secondary truncate">{tx.profile.name}</p>
                             )}
                          </div>
                        </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-secondary text-sm">
                            {tx.category?.name || 'Uncategorized'}
                        </span>
                    </td>

                    {/* Date Column */}
                    <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-secondary text-sm">{format(new Date(tx.date), 'dd.MM.yyyy')}</span>
                    </td>

                    {/* Time Column */}
                    <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-secondary text-sm">{format(new Date(tx.date), 'hh:mm a')}</span>
                    </td>

                    {/* Amount Column */}
                    <td className={`px-2 md:px-4 py-3 font-bold text-xs md:text-sm text-right md:text-left whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span>
                              {tx.type === 'expense' ? '- ' : '+ '}Rs {formatCurrency(Number(tx.amount), false)}
                          </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-3 pr-3 md:pr-6 pl-2 text-right whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-bold border ${statusColor}`}>
                            {statusLabel}
                        </span>
                    </td>
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
      <div className="space-y-6 animate-fade-in pb-24 md:pb-8 relative min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-3xl border border-border">
          <h2 className="text-2xl font-bold text-primary pl-2">Transactions</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary focus:outline-none focus:border-indigo-500 placeholder-secondary"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-background p-1 rounded-xl border border-border w-full sm:w-auto">
                {['all', 'income', 'expense'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-primary'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Desktop Add Button */}
              <div className="relative hidden md:block" ref={desktopMenuRef}>
                  <button 
                      onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                  >
                      <Plus size={18} />
                      <span>Add New</span>
                      <ChevronDown size={14} className={`transition-transform ${showDesktopMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Dropdown */}
                  {showDesktopMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right">
                          <div className="p-1">
                              <button onClick={() => handleAddClick('personal')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-lg text-left transition-colors group">
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                      <CreditCard size={14} />
                                  </div>
                                  <div>
                                      <p className="text-primary text-sm font-medium">Personal</p>
                                      <p className="text-secondary text-[10px]">Your private wallet</p>
                                  </div>
                              </button>
                              
                              <button onClick={() => handleAddClick('fund')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-lg text-left transition-colors group mt-1">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                      <Users size={14} />
                                  </div>
                                  <div>
                                      <p className="text-primary text-sm font-medium">Family Fund</p>
                                      <p className="text-secondary text-[10px]">Shared group account</p>
                                  </div>
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* --- Sections Rendering --- */}
        
        {/* Global Empty State */}
        {!hasResults && (
             <div className="bg-surface rounded-3xl border border-border min-h-[400px] flex flex-col items-center justify-center text-secondary">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 text-secondary">
                      <Search size={24} />
                  </div>
                  <p>No transactions found matching your criteria.</p>
             </div>
        )}

        {/* 1. ADMIN ONLY: Users Transactions */}
        {hasResults && isAdmin && usersTx.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2 pl-2">
                    <User size={14} /> Users Transactions
                </h3>
                <TransactionTable data={usersTx} emptyMessage="No user transactions." />
            </div>
        )}

        {/* 2. SHARED: Family Fund Transactions */}
        {hasResults && (isAdmin || fundTx.length > 0) && (
            <div className="space-y-3">
                <h3 className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2 pl-2">
                    <Users size={14} /> Family Fund Transactions
                </h3>
                <TransactionTable data={fundTx} emptyMessage="No fund transactions." />
            </div>
        )}

        {/* 3. PERSONAL: My Transactions */}
        {hasResults && myPersonalTx.length > 0 && (
             <div className="space-y-3">
                <h3 className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2 pl-2">
                    <CreditCard size={14} /> Personal Wallet Transactions
                </h3>
                <TransactionTable data={myPersonalTx} emptyMessage="No personal transactions." />
             </div>
        )}

      </div>

      {/* Mobile Floating Action Button and Menu (Gooey effect) */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden flex flex-col items-end gap-3">
          {/* Menu Items Container - Aligned right */}
          <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right ${showMenu ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20 pointer-events-none'}`}>
              
              {/* Fund Transaction */}
              <div className="flex items-center gap-3 animate-slide-up" style={{animationDelay: '50ms'}}>
                  <span className="bg-surface text-primary text-xs font-bold py-1.5 px-3 rounded-xl border border-border shadow-xl">Fund Tx</span>
                  <button 
                      onClick={() => handleAddClick('fund')}
                      className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                  >
                      <Users size={20} />
                  </button>
              </div>

              {/* Personal Transaction */}
              <div className="flex items-center gap-3 animate-slide-up" style={{animationDelay: '0ms'}}>
                  <span className="bg-surface text-primary text-xs font-bold py-1.5 px-3 rounded-xl border border-border shadow-xl">Personal Tx</span>
                  <button 
                      onClick={() => handleAddClick('personal')}
                      className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
                  >
                      <CreditCard size={20} />
                  </button>
              </div>
          </div>

          {/* Main FAB */}
          <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 transition-transform duration-300 ${showMenu ? 'rotate-45' : 'rotate-0'}`}
          >
              <Plus size={28} />
          </button>
      </div>
      
      {/* Backdrop for Menu */}
      {showMenu && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in" onClick={() => setShowMenu(false)}></div>
      )}

      {/* Styles for animation */}
      <style>{`
        @keyframes slide-up {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
};