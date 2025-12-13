import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Account, Transaction } from '../types';
import { ArrowLeft, User, Shield, Calendar, Mail, CreditCard, Ban, CheckCircle, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { format } from 'date-fns';

export const AdminUserDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<Profile | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch User
                const { data: userData } = await supabase.from('profiles').select('*').eq('id', id).single();
                if (userData) setUser(userData);

                // Fetch Accounts
                const { data: accountsData } = await supabase.from('accounts').select('*').eq('user_id', id);
                if (accountsData) setAccounts(accountsData);

                // Fetch Transactions (Personal)
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('*, category:categories(*)')
                    .eq('created_by', id)
                    .order('date', { ascending: false })
                    .limit(50);
                if (txData) setTransactions(txData);

            } catch (error) {
                console.error("Error fetching user details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);

    // Unified formatCurrency
    const formatCurrency = (amount: number) => {
        return 'Rs ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading) return <div className="text-primary text-center mt-20">Loading User Details...</div>;
    if (!user) return <div className="text-primary text-center mt-20">User not found</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/admin')} 
                    className="p-2 bg-surface rounded-xl border border-border text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-primary">User Details</h2>
            </div>

            {/* User Profile Card */}
            <div className="bg-surface rounded-3xl border border-border p-6 shadow-xl relative overflow-hidden">
                {user.is_suspended && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                        SUSPENDED
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600">
                             <img 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                className={`w-full h-full rounded-full bg-background object-cover ${user.is_suspended ? 'grayscale' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h3 className="text-2xl font-bold text-primary">{user.name}</h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-secondary">
                             <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                             <span className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                             <span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-background text-secondary border-border'}`}>
                                {user.role}
                             </span>
                             <span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${user.is_suspended ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {user.is_suspended ? 'Suspended' : 'Active'}
                             </span>
                        </div>
                        {user.bio && (
                            <p className="text-secondary text-sm italic mt-2">"{user.bio}"</p>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto bg-background p-4 rounded-2xl border border-border">
                        <div className="text-center">
                            <p className="text-secondary text-[10px] font-bold uppercase">Balance</p>
                            <p className="text-primary font-mono font-bold">{formatCurrency(totalBalance)}</p>
                        </div>
                        <div className="text-center border-l border-border pl-4">
                            <p className="text-secondary text-[10px] font-bold uppercase">Accounts</p>
                            <p className="text-primary font-mono font-bold">{accounts.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallets Section */}
            <div>
                <h3 className="text-secondary text-xs font-bold uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                    <CreditCard size={14} /> Personal Wallets
                </h3>
                {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="text-primary font-bold text-sm">{acc.name}</p>
                                        <p className={`text-xs ${acc.is_suspended ? 'text-rose-400 font-bold' : 'text-secondary'}`}>
                                            {acc.is_suspended ? 'SUSPENDED' : 'Active'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-primary font-mono font-bold text-sm">{formatCurrency(acc.balance)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-surface rounded-2xl border border-border text-center text-secondary text-sm">
                        No personal wallets found.
                    </div>
                )}
            </div>

            {/* Recent Transactions Section */}
            <div>
                 <h3 className="text-secondary text-xs font-bold uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                    <Search size={14} /> Recent Activity
                </h3>
                {transactions.length > 0 ? (
                    <div className="bg-surface rounded-3xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="p-4 text-secondary text-xs font-bold uppercase">Name</th>
                                        <th className="p-4 text-secondary text-xs font-bold uppercase hidden sm:table-cell">Category</th>
                                        <th className="p-4 text-secondary text-xs font-bold uppercase hidden sm:table-cell">Date</th>
                                        <th className="p-4 text-secondary text-xs font-bold uppercase text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-primary/5">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                    </div>
                                                    <span className="text-primary text-sm font-medium">{tx.note || 'Transaction'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell text-secondary text-sm">{tx.category?.name || tx.type}</td>
                                            <td className="p-4 hidden sm:table-cell text-secondary text-sm">{format(new Date(tx.date), 'MMM dd, HH:mm')}</td>
                                            <td className={`p-4 text-right font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Number(tx.amount))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                     <div className="p-8 bg-surface rounded-2xl border border-border text-center text-secondary text-sm">
                        No recent transactions.
                    </div>
                )}
            </div>
        </div>
    );
};