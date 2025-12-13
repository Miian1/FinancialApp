import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Layers, Shield, Trash2, Plus, Ban, CheckCircle, Search, Clock, Check, X, ChevronDown,
  ShoppingBag, Film, Zap, Car, Coffee, Home, GraduationCap, Pill, Gift, PawPrint, Sparkles, 
  Palmtree, Laptop, Receipt, CreditCard, Wrench, Heart, Book, Bus, DollarSign, Banknote, 
  TrendingUp, Package, Building, Coins, Wallet, Briefcase, ChartLine, MoreVertical, Edit2,
  AlertTriangle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Profile } from '../types';

const AVAILABLE_ICONS = [
  // Expenses
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Film', icon: Film },
  { name: 'Zap', icon: Zap },
  { name: 'Car', icon: Car },
  { name: 'Coffee', icon: Coffee },
  { name: 'Home', icon: Home },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Pill', icon: Pill },
  { name: 'Gift', icon: Gift },
  { name: 'PawPrint', icon: PawPrint },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Palmtree', icon: Palmtree },
  { name: 'Laptop', icon: Laptop },
  { name: 'Receipt', icon: Receipt },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Wrench', icon: Wrench },
  { name: 'Heart', icon: Heart },
  { name: 'Book', icon: Book },
  { name: 'Bus', icon: Bus },
  // Income
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Banknote', icon: Banknote },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Package', icon: Package },
  { name: 'Building', icon: Building },
  { name: 'Coins', icon: Coins },
  { name: 'Wallet', icon: Wallet },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'ChartLine', icon: ChartLine },
];

interface UserRowProps { 
  user: Profile; 
  onDelete: (id: string) => void;
  onEdit: (user: Profile) => void;
  onSuspend: (id: string, currentStatus: boolean) => void;
  onDetails: (id: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onDelete, onEdit, onSuspend, onDetails }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <tr className={`hover:bg-primary/5 group relative ${user.is_suspended ? 'bg-rose-500/5' : ''}`}>
        <td className="p-4">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className={`w-8 h-8 rounded-full ${user.is_suspended ? 'grayscale opacity-60' : ''}`} />
                    {user.is_suspended && (
                        <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-0.5">
                            <Ban size={10} className="text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <div className={`text-primary font-medium ${user.is_suspended ? 'line-through text-secondary' : ''}`}>{user.name}</div>
                    <div className="text-xs text-secondary">{user.email}</div>
                </div>
            </div>
        </td>
        <td className="p-4">
            <span className={`capitalize px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-secondary'}`}>
                {user.role}
            </span>
        </td>
        <td className="p-4 text-secondary text-sm">
            {new Date(user.created_at).toLocaleDateString()}
        </td>
        <td className="p-4 text-right">
             <div className="relative inline-block text-left" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                    <MoreVertical size={18} />
                </button>
                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border animate-fade-in origin-top-right">
                         <button 
                            onClick={() => { onDetails(user.id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                         >
                            <Search size={14} /> See Details
                         </button>
                         <button 
                            onClick={() => { onSuspend(user.id, !!user.is_suspended); setShowMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${user.is_suspended ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                         >
                            {user.is_suspended ? <CheckCircle size={14} /> : <Ban size={14} />} 
                            {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                         </button>
                         <button 
                            onClick={() => { onEdit(user); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 transition-colors"
                         >
                            <Edit2 size={14} /> Edit
                         </button>
                         <button 
                            onClick={() => { onDelete(user.id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                         >
                            <Trash2 size={14} /> Delete
                         </button>
                    </div>
                )}
             </div>
        </td>
    </tr>
  );
};

export const Admin: React.FC = () => {
  const { profile, groupAccounts, categories, transactions, refreshData } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'groups' | 'users' | 'categories' | 'approvals'>('approvals');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('ShoppingBag');
  const [showIconSelect, setShowIconSelect] = useState(false);
  const iconSelectRef = useRef<HTMLDivElement>(null);

  // User Management State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('member');
  const [editUserBio, setEditUserBio] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);

  useEffect(() => {
     const fetchUsers = async () => {
         const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
         if (data) setAllUsers(data as Profile[]);
     };
     if (profile?.role === 'admin') fetchUsers();
  }, [profile, activeTab, updatingUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (iconSelectRef.current && !iconSelectRef.current.contains(event.target as Node)) {
        setShowIconSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (profile?.role !== 'admin') return <div className="text-primary text-center mt-20">Access Denied</div>;

  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName) return;
      await supabase.from('categories').insert({
          name: newCatName,
          type: newCatType,
          icon: newCatIcon,
          color: '#6366f1',
          is_default: true
      });
      setNewCatName('');
      setNewCatIcon('ShoppingBag');
      refreshData();
  };

  const deleteCategory = async (id: string) => {
      if(confirm('Are you sure? This might affect transaction history display.')) {
          await supabase.from('categories').delete().eq('id', id);
          refreshData();
      }
  };

  // --- USER ACTIONS ---
  
  const handleDetailsUser = (id: string) => {
      navigate(`/admin/user/${id}`);
  };

  const deleteUser = async (id: string) => {
      if(confirm('Are you sure you want to delete this user? This cannot be undone.')) {
          // Deleting from public.profiles
          await supabase.from('profiles').delete().eq('id', id);
          // Refresh local state
          setAllUsers(prev => prev.filter(u => u.id !== id));
      }
  };

  const handleSuspendUser = async (id: string, currentStatus: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', id);
      
      if (!error) {
          setAllUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: !currentStatus } : u));
      } else {
          alert('Failed to update suspension status. Ensure "is_suspended" column exists in DB.');
      }
  };

  const handleEditUserClick = (user: Profile) => {
      setEditingUser(user);
      setEditUserName(user.name);
      setEditUserRole(user.role);
      setEditUserBio(user.bio || '');
      setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setUpdatingUser(true);

      const { error } = await supabase.from('profiles').update({
          name: editUserName,
          role: editUserRole,
          bio: editUserBio
      }).eq('id', editingUser.id);

      if (error) {
          alert("Failed to update user");
      } else {
          setShowUserModal(false);
          setEditingUser(null);
      }
      setUpdatingUser(false);
  };

  // --- END USER ACTIONS ---

  const toggleGroupStatus = async (id: string, currentStatus: boolean) => {
      await supabase.from('group_accounts').update({ is_suspended: !currentStatus }).eq('id', id);
      refreshData();
  };

  const approveTransaction = async (id: string, accountId: string) => {
      const isGroup = groupAccounts.some(g => g.id === accountId);
      const table = isGroup ? 'group_transactions' : 'transactions';
      await supabase.from(table).update({ status: 'completed' }).eq('id', id);
      refreshData();
  };

  const rejectTransaction = async (id: string, accountId: string) => {
      const isGroup = groupAccounts.some(g => g.id === accountId);
      const table = isGroup ? 'group_transactions' : 'transactions';
      await supabase.from(table).update({ status: 'rejected' }).eq('id', id);
      refreshData();
  }

  const renderIcon = (iconName: string, size: number = 24) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    if (found) {
        const Icon = found.icon;
        return <Icon size={size} />;
    }
    return <span style={{fontSize: size}}>{iconName}</span>;
  };

  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <div>
            <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
            <p className="text-secondary text-sm">System wide controls.</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar gap-4 pb-2 border-b border-border">
            {[
                { id: 'approvals', label: 'Approvals', icon: Clock },
                { id: 'groups', label: 'Family Groups', icon: Layers },
                { id: 'users', label: 'User Directory', icon: Users },
                { id: 'categories', label: 'Categories', icon: Shield }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-secondary hover:bg-primary/5'}`}
                >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                    {tab.id === 'approvals' && pendingTransactions.length > 0 && (
                        <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingTransactions.length}</span>
                    )}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="bg-surface rounded-3xl border border-border overflow-hidden min-h-[400px]">
            
            {activeTab === 'approvals' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="p-4 text-secondary text-sm">Date</th>
                                <th className="p-4 text-secondary text-sm">User</th>
                                <th className="p-4 text-secondary text-sm">Amount</th>
                                <th className="p-4 text-secondary text-sm">Type</th>
                                <th className="p-4 text-secondary text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {pendingTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-primary/5">
                                    <td className="p-4 text-secondary text-sm">{format(new Date(t.date), 'MMM dd, HH:mm')}</td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-primary font-medium text-sm">{t.profile?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className={`p-4 font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {t.type === 'expense' ? '-' : '+'}Rs {Number(t.amount).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-secondary text-sm capitalize">{t.category?.name || t.type}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => approveTransaction(t.id, t.account_id)}
                                                className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                            >
                                                <Check size={14} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => rejectTransaction(t.id, t.account_id)}
                                                className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-secondary">No pending approvals.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'groups' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="p-4 text-secondary text-sm">Group Name</th>
                                <th className="p-4 text-secondary text-sm">Members</th>
                                <th className="p-4 text-secondary text-sm">Balance</th>
                                <th className="p-4 text-secondary text-sm">Status</th>
                                <th className="p-4 text-secondary text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {groupAccounts.map(g => (
                                <tr key={g.id} className="hover:bg-primary/5">
                                    <td className="p-4 text-primary font-medium">{g.name}</td>
                                    <td className="p-4 text-secondary">{g.members?.length || 0} users</td>
                                    <td className="p-4 text-emerald-400 font-mono">Rs {g.balance}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${g.is_suspended ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {g.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => toggleGroupStatus(g.id, g.is_suspended)}
                                            className="text-secondary hover:text-primary"
                                        >
                                            {g.is_suspended ? <CheckCircle size={18} className="text-emerald-400" /> : <Ban size={18} className="text-rose-400" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'users' && (
                 <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="p-4 text-secondary text-sm">User</th>
                                <th className="p-4 text-secondary text-sm">Role</th>
                                <th className="p-4 text-secondary text-sm">Joined</th>
                                <th className="p-4 text-secondary text-sm w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {allUsers.map(u => (
                                <UserRow 
                                    key={u.id} 
                                    user={u} 
                                    onDelete={deleteUser} 
                                    onSuspend={handleSuspendUser}
                                    onEdit={handleEditUserClick}
                                    onDetails={handleDetailsUser}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="p-6">
                    <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 mb-8 bg-background p-4 rounded-2xl border border-border items-start sm:items-center">
                        <input 
                            type="text" 
                            placeholder="New Category Name" 
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="flex-1 w-full sm:w-auto bg-surface border border-gray-500 rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-indigo-500"
                        />
                        
                        {/* Icon Selector */}
                        <div className="relative w-full sm:w-auto" ref={iconSelectRef}>
                            <button 
                                type="button"
                                onClick={() => setShowIconSelect(!showIconSelect)}
                                className="w-full sm:w-48 bg-surface border border-gray-500 rounded-xl px-4 py-2 text-primary flex items-center justify-between hover:border-gray-400 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {renderIcon(newCatIcon, 20)}
                                    <span className="text-sm truncate">{newCatIcon}</span>
                                </div>
                                <ChevronDown size={14} className="text-secondary" />
                            </button>
                            
                            {showIconSelect && (
                                <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 p-3 grid grid-cols-5 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {AVAILABLE_ICONS.map(item => (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => { setNewCatIcon(item.name); setShowIconSelect(false); }}
                                            className={`p-2 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors ${newCatIcon === item.name ? 'bg-indigo-600 text-white' : 'text-secondary'}`}
                                            title={item.name}
                                        >
                                            <item.icon size={20} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <select 
                             value={newCatType}
                             onChange={(e) => setNewCatType(e.target.value as any)}
                             className="w-full sm:w-auto bg-surface border border-gray-500 rounded-xl px-4 py-2 text-primary focus:outline-none"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-indigo-500/30">
                            Add
                        </button>
                    </form>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.map(c => (
                            <div key={c.id} className="bg-background p-4 rounded-2xl border border-border flex flex-col items-center relative group hover:border-indigo-500/30 transition-colors">
                                <button onClick={() => deleteCategory(c.id)} className="absolute top-2 right-2 text-secondary hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <Trash2 size={14} />
                                </button>
                                <div className={`mb-3 p-3 rounded-full ${c.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {renderIcon(c.icon || '', 24)}
                                </div>
                                <span className="text-primary font-bold text-sm text-center">{c.name}</span>
                                <span className={`text-[10px] uppercase mt-1 font-bold ${c.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{c.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Edit User Modal */}
        {showUserModal && editingUser && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
                onClick={() => setShowUserModal(false)}
            >
                <div 
                    className="bg-surface rounded-3xl p-6 w-full max-w-md border border-border relative shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                            <Edit2 size={20} className="text-indigo-400" /> Edit User
                        </h3>
                        <button onClick={() => setShowUserModal(false)} className="text-secondary hover:text-primary">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label className="text-secondary text-xs font-bold uppercase tracking-wider mb-1 block">Name</label>
                            <input 
                                type="text"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                                className="w-full bg-background border border-gray-500 rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="text-secondary text-xs font-bold uppercase tracking-wider mb-1 block">Role</label>
                            <select 
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value)}
                                className="w-full bg-background border border-gray-500 rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-secondary text-xs font-bold uppercase tracking-wider mb-1 block">Bio</label>
                            <textarea 
                                value={editUserBio}
                                onChange={(e) => setEditUserBio(e.target.value)}
                                className="w-full bg-background border border-gray-500 rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 h-24 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                             <button 
                                type="button" 
                                onClick={() => setShowUserModal(false)}
                                className="px-4 py-2 text-secondary hover:text-primary"
                             >
                                Cancel
                             </button>
                             <button 
                                type="submit" 
                                disabled={updatingUser}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                             >
                                {updatingUser ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};