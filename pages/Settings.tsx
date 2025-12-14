import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Download, PlusCircle, FileText, Check, AlertCircle, Loader2, Wallet, Database, Send, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';

export const Settings: React.FC = () => {
  const { accounts, groupAccounts, profile, refreshData, theme, toggleTheme } = useApp();
  const [selectedExportAccount, setSelectedExportAccount] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestType, setRequestType] = useState<'personal' | 'shared'>('personal');
  const [requestReason, setRequestReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const allAccounts = useMemo(() => {
      const personal = accounts.filter(a => a.user_id === profile?.id).map(a => ({ ...a, displayType: 'Personal' }));
      const shared = groupAccounts.filter(g => g.members?.includes(profile?.id || '')).map(g => ({ ...g, displayType: 'Family Fund' }));
      return [...personal, ...shared];
  }, [accounts, groupAccounts, profile]);

  const handleExport = async () => {
      if (!selectedExportAccount) return;
      setIsExporting(true);
      try {
          const isGroup = groupAccounts.some(g => g.id === selectedExportAccount);
          const table = isGroup ? 'group_transactions' : 'transactions';
          const { data: transactions, error } = await supabase.from(table).select(`*, category:categories(name), profile:created_by(name)`).eq('account_id', selectedExportAccount).order('date', { ascending: false });
          if (error) throw error;
          if (!transactions || transactions.length === 0) { alert("No transactions found for this account."); setIsExporting(false); return; }
          const headers = ['Date', 'Type', 'Category', 'Amount (Rs)', 'Note', 'Status', 'Created By'];
          const csvRows = [headers.join(',')];
          transactions.forEach(tx => {
              const row = [format(new Date(tx.date), 'yyyy-MM-dd HH:mm'), tx.type, tx.category?.name || 'Uncategorized', tx.amount, `"${(tx.note || '').replace(/"/g, '""')}"`, tx.status || 'completed', tx.profile?.name || 'Unknown'];
              csvRows.push(row.join(','));
          });
          const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          const accountName = allAccounts.find(a => a.id === selectedExportAccount)?.name || 'Account';
          link.setAttribute("download", `${accountName.replace(/\s+/g, '_')}_transactions.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (error) { console.error("Export failed:", error); alert("Failed to export data."); } finally { setIsExporting(false); }
  };

  const handleWalletRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!requestName || !profile) return;
      setIsRequesting(true); setRequestStatus(null);
      try {
          const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
          if (!admins || admins.length === 0) throw new Error("No administrator found.");
          const adminId = admins[0].id;
          const { error } = await supabase.from('notifications').insert({ user_id: adminId, type: 'wallet_request', title: 'New Wallet Request', message: `${profile.name} has requested a new ${requestType} wallet named "${requestName}".`, status: 'pending', data: { requesterId: profile.id, walletName: requestName, walletType: requestType, reason: requestReason } });
          if (error) throw error;
          setRequestStatus({ type: 'success', text: 'Request sent successfully!' }); setRequestName(''); setRequestReason(''); await refreshData();
      } catch (error: any) { console.error("Request failed:", error); setRequestStatus({ type: 'error', text: error.message || "Failed to send request." }); } finally { setIsRequesting(false); }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-24 md:pb-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
            <div><h2 className="text-xl md:text-2xl font-bold text-primary">Settings</h2><p className="text-secondary text-xs md:text-sm">Manage your data and account preferences.</p></div>
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface border border-border rounded-xl hover:bg-primary/5 transition-all shadow-sm">{theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}<span className="text-xs md:text-sm font-medium text-primary capitalize">{theme} Mode</span></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            <div className="bg-surface rounded-3xl border border-border p-5 md:p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-3 mb-4 md:mb-6"><div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Database size={18} /></div><div><h3 className="text-base md:text-lg font-bold text-primary">Export Data</h3><p className="text-secondary text-[10px] md:text-xs">Download transaction history as CSV</p></div></div>
                <div className="space-y-3 md:space-y-4 flex-1">
                    <div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">Select Account</label><select value={selectedExportAccount} onChange={(e) => setSelectedExportAccount(e.target.value)} className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer text-sm"><option value="">-- Choose an account --</option>{allAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({acc.displayType}) - Rs {acc.balance}</option>))}</select></div>
                    <div className="bg-background rounded-xl p-3 md:p-4 border border-border text-secondary text-xs"><div className="flex gap-2 items-start"><FileText size={14} className="mt-0.5 shrink-0" /><p className="leading-relaxed">The exported CSV will contain Date, Transaction Type, Category, Amount (Rs), Note, Status, and Creator Name.</p></div></div>
                </div>
                <button onClick={handleExport} disabled={!selectedExportAccount || isExporting} className="w-full mt-4 md:mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 md:py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">{isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}{isExporting ? 'Generating...' : 'Export to CSV'}</button>
            </div>

            <div className="bg-surface rounded-3xl border border-border p-5 md:p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-3 mb-4 md:mb-6"><div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Wallet size={18} /></div><div><h3 className="text-base md:text-lg font-bold text-primary">Request Wallet</h3><p className="text-secondary text-[10px] md:text-xs">Ask admin for a new account</p></div></div>
                <form onSubmit={handleWalletRequest} className="space-y-3 md:space-y-4 flex-1">
                    <div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">Wallet Name</label><input type="text" value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="e.g. Travel Fund" className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-indigo-500 transition-colors text-sm" required /></div>
                    <div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">Wallet Type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setRequestType('personal')} className={`py-2 rounded-lg text-xs md:text-sm font-medium border transition-colors ${requestType === 'personal' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'border-border text-secondary hover:bg-primary/5'}`}>Personal</button><button type="button" onClick={() => setRequestType('shared')} className={`py-2 rounded-lg text-xs md:text-sm font-medium border transition-colors ${requestType === 'shared' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'border-border text-secondary hover:bg-primary/5'}`}>Shared</button></div></div>
                    <div><label className="text-secondary text-[10px] font-bold uppercase tracking-wider block mb-1">Reason (Optional)</label><textarea value={requestReason} onChange={(e) => setRequestReason(e.target.value)} placeholder="Why do you need this wallet?" className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none text-sm" /></div>
                    {requestStatus && (<div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${requestStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{requestStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}{requestStatus.text}</div>)}
                    <button type="submit" disabled={isRequesting || !requestName} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 md:py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-auto text-sm">{isRequesting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}Submit Request</button>
                </form>
            </div>
        </div>
    </div>
  );
};