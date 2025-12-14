import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Plus, CreditCard, Users, MoreVertical, LogIn, LogOut, Trash2, User, Clock, Loader2, Lock, Search, X, Check, Edit2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';

// Unified Number Formatter
const formatCurrency = (amount: number, showFull: boolean) => {
  if (showFull) {
    return 'Rs ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const prefix = isNegative ? '-Rs ' : 'Rs ';

  // >= 1,000,000 -> 1.5M
  if (absAmount >= 1000000) {
    return prefix + (absAmount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  }
  
  // >= 10,000 -> 15k
  if (absAmount >= 10000) {
    return prefix + (absAmount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k';
  }

  // Default
  return prefix + absAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const AccountRow: React.FC<{
  id: string;
  name: string;
  balance: number;
  type: 'personal' | 'shared';
  isSuspended: boolean;
  members?: string[];
  pendingMembers?: string[];
  leavingMembers?: string[];
  userId?: string;
  owner?: Profile; 
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  onSuspend: (id: string, current: boolean) => void;
  onDetails: (id: string) => void;
  onEdit: (id: string, name: string, type: 'personal' | 'shared', ownerId?: string) => void;
  onDelete: (id: string, type: 'personal' | 'shared') => void;
  isAdmin: boolean;
  isMasked?: boolean;
}> = ({ id, name, balance, type, isSuspended, members, pendingMembers, leavingMembers, userId, owner, onJoin, onLeave, onSuspend, onDetails, onEdit, onDelete, isAdmin, isMasked }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<any>(null);

  const isMember = members?.includes(userId || '');
  const isPending = pendingMembers?.includes(userId || '');
  const isLeaving = leavingMembers?.includes(userId || '');

  // Calculate initials or icon
  const getIcon = () => {
    if (type === 'personal') {
       return <CreditCard size={14} className="sm:w-5 sm:h-5" />;
    }
    const initials = name.substring(0, 2).toUpperCase();
    return <span className="font-bold text-[10px] sm:text-sm">{initials}</span>;
  };

  const isOwner = owner?.id === userId;

  const updateMenuPosition = () => {
      if (menuButtonRef.current) {
          const rect = menuButtonRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          setOpenUpwards(spaceBelow < 250);
      }
  };

  const handleMouseEnter = () => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
      }
      updateMenuPosition();
  };

  const handleMouseLeave = () => {
      closeTimeoutRef.current = setTimeout(() => {
          setShowMenu(false);
      }, 300);
  };

  const balanceDisplay = formatCurrency(balance, false);

  let themeClasses = "";
  if (isSuspended) {
      themeClasses = "bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
  } else if (type === 'personal') {
      themeClasses = "bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]";
  } else {
      themeClasses = "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]";
  }

  const containerClasses = `w-full rounded-2xl border p-2.5 sm:p-3 flex items-center justify-between transition-all duration-300 group relative h-auto min-h-[64px] sm:h-[88px] backdrop-blur-md ${themeClasses} ${showMenu ? 'z-20' : 'z-10'}`;

  const tagClasses = `text-[8px] sm:text-[10px] uppercase px-1.5 py-0.5 rounded-lg border flex-shrink-0 font-bold backdrop-blur-md transition-all shadow-lg opacity-70 whitespace-nowrap ${
      type === 'personal' 
        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  }`;

  const iconClasses = `w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center ${
      type === 'personal' 
          ? 'bg-indigo-500/20 text-indigo-400' 
          : 'bg-emerald-500/20 text-emerald-400'
  }`;

  const renderActionButton = () => {
      if (type !== 'shared' || !userId || !onJoin || !onLeave) return null;

      if (isLeaving) {
          return (
              <button disabled className="flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-colors border border-gray-600 text-gray-400 cursor-not-allowed whitespace-nowrap">
                  <Loader2 size={10} className="animate-spin" /> <span className="hidden sm:inline">LEAVING...</span><span className="sm:hidden">WAIT</span>
              </button>
          );
      }

      if (isMember) {
          return (
              <button
                onClick={() => onLeave(id)}
                className="flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-colors border border-gray-600 text-gray-400 hover:text-primary hover:border-gray-500 whitespace-nowrap"
              >
                  <LogOut size={10}/> <span className="hidden sm:inline">LEAVE</span><span className="sm:hidden">LEAVE</span>
              </button>
          );
      }

      if (isPending) {
          return (
              <button disabled className="flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-colors border border-yellow-600/30 bg-yellow-600/10 text-yellow-500 cursor-not-allowed whitespace-nowrap">
                  <Clock size={10}/> <span>PENDING</span>
              </button>
          );
      }

      return (
          <button
            onClick={() => onJoin(id)}
            className="flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-colors border bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30 whitespace-nowrap"
          >
             <LogIn size={10}/> <span className="hidden sm:inline">JOIN</span><span className="sm:hidden">JOIN</span>
          </button>
      );
  };

  return (
    <div className={containerClasses}>
      {isSuspended && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none rounded-2xl z-0">
             <span className="text-2xl sm:text-5xl font-black text-rose-500/10 -rotate-6 tracking-widest uppercase whitespace-nowrap">
                 SUSPENDED
             </span>
         </div>
      )}

      <div className="flex-1 min-w-0 flex items-center space-x-2 sm:space-x-4 overflow-hidden h-full mr-1 relative z-10">
        <div className={iconClasses}>{getIcon()}</div>
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
           <h3 className="text-primary font-extrabold tracking-wide truncate text-xs sm:text-base">{name}</h3>
           
           <div className="flex items-center flex-wrap gap-1.5">
               <span className={tagClasses}>{type === 'personal' ? 'Personal' : 'Shared'}</span>
               
               {(type === 'shared' && isMember && !isLeaving) ? (
                   <span className="text-[9px] sm:text-[10px] text-emerald-400/80 font-medium truncate">Joined</span>
               ) : (type === 'personal' && owner && !isOwner && isAdmin) ? (
                   <span className="text-[9px] sm:text-[10px] text-secondary/70 flex items-center truncate max-w-[80px]">
                       <User size={10} className="mr-1 flex-shrink-0"/>
                       <span className="truncate">{owner.name}</span>
                   </span>
               ) : null}
           </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-6 flex-shrink-0 h-full relative z-10">
         <div className="text-right flex flex-col justify-center h-full">
             {isMasked ? (
                 <div className="flex items-center space-x-1 text-secondary justify-end"><Lock size={12} /><span className="text-sm sm:text-lg font-bold tracking-widest">****</span></div>
             ) : (
                 <div className="flex flex-col items-end"><span className="block font-bold text-primary truncate text-sm sm:text-2xl">{balanceDisplay}</span></div>
             )}
         </div>
         <div className="flex items-center h-full gap-0.5 sm:gap-1">
            {renderActionButton()}
            <div className="relative ml-0.5 sm:ml-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <button ref={menuButtonRef} onClick={() => { updateMenuPosition(); setShowMenu(!showMenu); }} className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"><MoreVertical size={16} /></button>
                {showMenu && (
                    <div className={`absolute right-0 w-40 z-50 animate-fade-in ${openUpwards ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}>
                        <div className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                            {!isMasked && <button onClick={() => { onDetails(id); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-xs sm:text-sm text-secondary hover:bg-primary/5 hover:text-primary transition-colors">See Details</button>}
                            {(isAdmin || type === 'personal') && <button onClick={() => { onSuspend(id, isSuspended); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-xs sm:text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">{isSuspended ? 'Unsuspend' : 'Suspend'}</button>}
                            {isAdmin && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(id, name, type, owner?.id); setShowMenu(false); }} className="flex w-full text-left px-4 py-3 text-xs sm:text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors items-center gap-2"><Edit2 size={12} /> Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(id, type); setShowMenu(false); }} className="flex w-full text-left px-4 py-3 text-xs sm:text-sm text-rose-500 hover:bg-rose-500/10 transition-colors items-center gap-2"><Trash2 size={12} /> Delete</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export const Accounts: React.FC = () => {
  const { accounts, groupAccounts, profile, refreshData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'personal' | 'shared'>('personal');
  const [targetUserId, setTargetUserId] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, type: 'personal' | 'shared' | null}>({ isOpen: false, id: null, type: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showModal && profile?.role === 'admin') {
        supabase.from('profiles').select('*').then(({ data }) => { if (data) setAllUsers(data as Profile[]); });
    }
  }, [showModal, profile]);

  useEffect(() => {
    if (showModal || deleteModal.isOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal, deleteModal.isOpen]);

  const handleCreateOrUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (editingId) {
        const table = newAccountType === 'personal' ? 'accounts' : 'group_accounts';
        const updateData: any = { name: newAccountName };
        if (newAccountType === 'personal' && profile.role === 'admin' && targetUserId) { updateData.user_id = targetUserId; }
        await supabase.from(table).update(updateData).eq('id', editingId);
    } else {
        const ownerId = (newAccountType === 'personal' && profile.role === 'admin' && targetUserId) ? targetUserId : profile.id;
        if (newAccountType === 'personal') { await supabase.from('accounts').insert({ user_id: ownerId, name: newAccountName, type: 'personal', balance: 0, color: 'bg-indigo-600' }); } 
        else { await supabase.from('group_accounts').insert({ user_id: profile.id, name: newAccountName, balance: 0, members: [profile.id], color: 'bg-emerald-600' }); }
    }
    await refreshData();
    closeModal();
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); setNewAccountName(''); setNewAccountType('personal'); setTargetUserId(''); setUserSearchTerm(''); setShowUserDropdown(false); }
  const handleOpenEdit = (id: string, name: string, type: 'personal' | 'shared', ownerId?: string) => {
      setEditingId(id); setNewAccountName(name); setNewAccountType(type);
      if (ownerId && profile?.role === 'admin') { setTargetUserId(ownerId); supabase.from('profiles').select('*').eq('id', ownerId).single().then(({data}) => { if (data) setUserSearchTerm(`${data.name} (${data.email})`); }); }
      setShowModal(true);
  };
  const handleDelete = (id: string, type: 'personal' | 'shared') => { setDeleteModal({ isOpen: true, id, type }); };
  const executeDelete = async () => {
      if (!deleteModal.id || !deleteModal.type) return;
      const { id, type } = deleteModal;
      const accountTable = type === 'personal' ? 'accounts' : 'group_accounts';
      const txTable = type === 'personal' ? 'transactions' : 'group_transactions';
      try {
          setIsDeleting(true);
          await supabase.from(txTable).delete().eq('account_id', id);
          const { error } = await supabase.from(accountTable).delete().eq('id', id);
          if (error) throw error;
          await refreshData();
          setDeleteModal({ isOpen: false, id: null, type: null });
      } catch (err: any) { alert("Error deleting account: " + err.message); } finally { setIsDeleting(false); }
  };
  const handleSuspend = async (id: string, isGroup: boolean, currentStatus: boolean) => { const table = isGroup ? 'group_accounts' : 'accounts'; await supabase.from(table).update({ is_suspended: !currentStatus }).eq('id', id); refreshData(); };
  const handleDetails = (id: string) => { navigate(`/accounts/${id}`); };
  const handleJoinRequest = async (groupId: string) => { if (!profile) return; const group = groupAccounts.find(g => g.id === groupId); if (!group) return; await supabase.from('group_accounts').update({ pending_members: [...(group.pending_members || []), profile.id] }).eq('id', groupId); await supabase.from('notifications').insert({ user_id: group.user_id, title: 'Join Request', message: `${profile.name} requested to join ${group.name}`, type: 'join_request', status: 'pending', data: { groupId, requesterId: profile.id } }); refreshData(); };
  const handleLeaveRequest = async (groupId: string) => { if (!profile) return; const group = groupAccounts.find(g => g.id === groupId); if (!group) return; await supabase.from('group_accounts').update({ leaving_members: [...(group.leaving_members || []), profile.id] }).eq('id', groupId); await supabase.from('notifications').insert({ user_id: group.user_id, title: 'Leave Request', message: `${profile.name} wants to leave ${group.name}`, type: 'leave_request', status: 'pending', data: { groupId, requesterId: profile.id } }); refreshData(); };

  const myAccounts = accounts.filter(a => a.user_id === profile?.id);
  const otherAccounts = accounts.filter(a => a.user_id !== profile?.id);
  const joinedFunds = groupAccounts.filter(acc => acc.members?.includes(profile?.id || ''));
  const availableFunds = groupAccounts.filter(acc => !acc.members?.includes(profile?.id || ''));
  const filteredUsers = allUsers.filter(u => u.id !== profile?.id && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase())));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl md:text-2xl font-bold text-primary">Accounts</h2><p className="text-secondary text-xs md:text-sm">Manage your personal and family funds.</p></div>
        <div className="flex items-center gap-2">{profile?.role === 'admin' && (<button onClick={() => { setEditingId(null); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center space-x-1.5 transition-colors shadow-lg shadow-indigo-500/30 text-xs sm:text-sm font-medium"><Plus size={16} /><span className="hidden sm:inline">Add Account</span></button>)}</div>
      </div>

      {otherAccounts.length > 0 && profile?.role === 'admin' && (<div className="space-y-2 sm:space-y-3"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider ml-1">Users Accounts</h3><div className="grid gap-2 sm:gap-3">{otherAccounts.map(acc => (<AccountRow key={acc.id} id={acc.id} name={acc.name} balance={acc.balance} type="personal" isSuspended={acc.is_suspended} userId={profile?.id} owner={acc.profile} onSuspend={(id, status) => handleSuspend(id, false, status)} onDetails={handleDetails} onEdit={handleOpenEdit} onDelete={handleDelete} isAdmin={true} />))}</div></div>)}
      {joinedFunds.length > 0 && (<div className="space-y-2 sm:space-y-3"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider ml-1">My Family Funds</h3><div className="grid gap-2 sm:gap-3">{joinedFunds.map(acc => (<AccountRow key={acc.id} id={acc.id} name={acc.name} balance={acc.balance} type="shared" isSuspended={acc.is_suspended} members={acc.members} pendingMembers={acc.pending_members} leavingMembers={acc.leaving_members} userId={profile?.id} onJoin={handleJoinRequest} onLeave={handleLeaveRequest} onSuspend={(id, status) => handleSuspend(id, true, status)} onDetails={handleDetails} onEdit={handleOpenEdit} onDelete={handleDelete} isAdmin={profile?.role === 'admin'} isMasked={false} />))}</div></div>)}
      <div className="space-y-2 sm:space-y-3"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider ml-1">Available Funds</h3><div className="grid gap-2 sm:gap-3">{availableFunds.map(acc => (<AccountRow key={acc.id} id={acc.id} name={acc.name} balance={acc.balance} type="shared" isSuspended={acc.is_suspended} members={acc.members} pendingMembers={acc.pending_members} leavingMembers={acc.leaving_members} userId={profile?.id} onJoin={handleJoinRequest} onLeave={handleLeaveRequest} onSuspend={(id, status) => handleSuspend(id, true, status)} onDetails={handleDetails} onEdit={handleOpenEdit} onDelete={handleDelete} isAdmin={profile?.role === 'admin'} isMasked={true} />))} {availableFunds.length === 0 && joinedFunds.length === 0 && <p className="text-secondary text-xs pl-2">No family funds found.</p>}</div></div>
      <div className="space-y-2 sm:space-y-3"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider ml-1">Personal Wallets</h3><div className="grid gap-2 sm:gap-3">{myAccounts.map(acc => (<AccountRow key={acc.id} id={acc.id} name={acc.name} balance={acc.balance} type="personal" isSuspended={acc.is_suspended} userId={profile?.id} owner={acc.profile} onSuspend={(id, status) => handleSuspend(id, false, status)} onDetails={handleDetails} onEdit={handleOpenEdit} onDelete={handleDelete} isAdmin={profile?.role === 'admin'} />))} {myAccounts.length === 0 && <p className="text-secondary text-xs pl-2">No personal accounts found.</p>}</div></div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all" onClick={closeModal}>
          <div className="bg-surface rounded-3xl p-5 sm:p-6 w-full max-w-md border border-border animate-fade-in shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-primary">{editingId ? 'Edit Account' : 'Create New Account'}</h3><button onClick={closeModal} className="p-1 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><X size={20} /></button></div>
             <form onSubmit={handleCreateOrUpdateAccount} className="space-y-4">
                <div><label className="block text-secondary text-xs mb-1">Account Name</label><input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 text-sm" placeholder="e.g. Vacation Fund" required maxLength={25} /><div className="text-right text-[10px] text-secondary mt-1">{newAccountName.length}/25</div></div>
                {!editingId && (<div><label className="block text-secondary text-xs mb-1">Type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setNewAccountType('personal')} className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 ${newAccountType === 'personal' ? 'bg-indigo-600/20 border-indigo-500 text-primary' : 'border-border text-secondary hover:bg-primary/5'}`}><CreditCard size={18} /><span className="text-xs">Personal</span></button><button type="button" onClick={() => setNewAccountType('shared')} className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 ${newAccountType === 'shared' ? 'bg-emerald-600/20 border-emerald-500 text-primary' : 'border-border text-secondary hover:bg-primary/5'}`}><Users size={18} /><span className="text-xs">Family Shared</span></button></div></div>)}
                {profile?.role === 'admin' && newAccountType === 'personal' && (<div className="relative"><label className="block text-secondary text-xs mb-1">Assign (Optional)</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={14} /><input type="text" value={userSearchTerm} onChange={(e) => { setUserSearchTerm(e.target.value); setShowUserDropdown(true); }} onFocus={() => setShowUserDropdown(true)} placeholder="Search user..." className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-3 text-primary focus:outline-none focus:border-indigo-500 text-sm" />{targetUserId && (<button type="button" onClick={() => { setTargetUserId(''); setUserSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"><X size={14} /></button>)}</div>{showUserDropdown && userSearchTerm && (<div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar"><div className="p-3 hover:bg-primary/5 cursor-pointer text-secondary hover:text-primary border-b border-border/50 text-sm" onClick={() => { setTargetUserId(''); setUserSearchTerm(`Myself (${profile.name})`); setShowUserDropdown(false); }}>Myself</div>{filteredUsers.map(u => (<div key={u.id} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { setTargetUserId(u.id); setUserSearchTerm(`${u.name} (${u.email})`); setShowUserDropdown(false); }}><div><p className="text-primary text-sm font-medium">{u.name}</p><p className="text-secondary text-xs">{u.email}</p></div>{targetUserId === u.id && <Check size={14} className="text-emerald-500" />}</div>))}</div>)}{showUserDropdown && (<div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)}></div>)}</div>)}
                <div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={closeModal} className="px-4 py-2 text-xs text-secondary hover:text-primary">Cancel</button><button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 text-xs font-bold">{editingId ? 'Save' : 'Create'}</button></div>
             </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !isDeleting && setDeleteModal({ ...deleteModal, isOpen: false })}>
           <div className="bg-surface rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center space-y-4"><div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2"><AlertTriangle size={24} /></div><h3 className="text-lg font-bold text-primary">Delete Account?</h3><p className="text-secondary text-xs leading-relaxed">This cannot be undone.</p><div className="flex w-full space-x-3 mt-4"><button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} disabled={isDeleting} className="flex-1 px-4 py-2.5 rounded-xl bg-background text-primary text-sm font-medium hover:bg-border transition-colors disabled:opacity-50">Cancel</button><button onClick={executeDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30 flex items-center justify-center disabled:opacity-50">{isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}</button></div></div>
           </div>
        </div>
      )}
    </div>
  );
};