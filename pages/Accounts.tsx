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
       return <CreditCard size={18} className="sm:w-5 sm:h-5" />;
    }
    // Initials for group
    const initials = name.substring(0, 2).toUpperCase();
    return <span className="font-bold text-xs sm:text-sm">{initials}</span>;
  };

  const isOwner = owner?.id === userId;

  const updateMenuPosition = () => {
      if (menuButtonRef.current) {
          const rect = menuButtonRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          // If less than 250px space below, open upwards
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
      }, 300); // 300ms delay before closing
  };

  const balanceDisplay = formatCurrency(balance, false); // Always formatted

  const getNameSize = (text: string) => {
      if (text.length > 25) return 'text-xs sm:text-sm';
      if (text.length > 18) return 'text-sm sm:text-base';
      return 'text-base sm:text-lg';
  };
  
  // Font sizes for specific views
  const getFontSize = (text: string) => {
      // Responsive sizing:
      // If length >= 9 (e.g. $1,000.00), use text-lg on mobile
      // If length >= 7 (e.g. $100.00), use text-xl on mobile
      // Otherwise text-2xl
      // Always text-2xl on desktop (sm breakpoint)
      
      if (text.length >= 9) return 'text-lg sm:text-2xl';
      if (text.length >= 7) return 'text-xl sm:text-2xl';
      return 'text-2xl';
  };

  const nameSize = getNameSize(name);
  const balanceFontSize = getFontSize(balanceDisplay);

  // Styles
  // Define Card Theme based on Type and Suspension status
  let themeClasses = "";
  if (isSuspended) {
      // REMOVED overflow-hidden to allow menu to show
      themeClasses = "bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
  } else if (type === 'personal') {
      themeClasses = "bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]";
  } else {
      // Shared
      themeClasses = "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]";
  }

  // Reduced padding (p-2 sm:p-3) to prevent text cutting
  const containerClasses = `w-full rounded-2xl border p-2 sm:p-3 flex items-center justify-between transition-all duration-300 group relative h-[72px] sm:h-[88px] backdrop-blur-md ${themeClasses} ${showMenu ? 'z-20' : 'z-10'}`;

  // Tags: Glassmorphism with glow and reduced opacity (70%)
  const tagClasses = `text-[10px] uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 font-bold backdrop-blur-md transition-all shadow-lg opacity-70 ${
      type === 'personal' 
        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  }`;

  const iconClasses = `w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center ${
      type === 'personal' 
          ? 'bg-indigo-500/20 text-indigo-400' 
          : 'bg-emerald-500/20 text-emerald-400'
  }`;

  const renderActionButton = () => {
      if (type !== 'shared' || !userId || !onJoin || !onLeave) return null;

      if (isLeaving) {
          return (
              <button disabled className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors border border-gray-600 text-gray-400 cursor-not-allowed whitespace-nowrap">
                  <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin" /> <span className="hidden sm:inline">LEAVING...</span><span className="sm:hidden">LEAVING</span>
              </button>
          );
      }

      if (isMember) {
          return (
              <button
                onClick={() => onLeave(id)}
                className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors border border-gray-600 text-gray-400 hover:text-primary hover:border-gray-500 whitespace-nowrap"
              >
                  <LogOut size={10} className="sm:w-3 sm:h-3"/> <span className="hidden sm:inline">LEAVE FUND</span><span className="sm:hidden">LEAVE</span>
              </button>
          );
      }

      if (isPending) {
          return (
              <button disabled className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors border border-yellow-600/30 bg-yellow-600/10 text-yellow-500 cursor-not-allowed whitespace-nowrap">
                  <Clock size={10} className="sm:w-3 sm:h-3"/> <span>PENDING</span>
              </button>
          );
      }

      return (
          <button
            onClick={() => onJoin(id)}
            className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors border bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30 whitespace-nowrap"
          >
             <LogIn size={10} className="sm:w-3 sm:h-3"/> <span className="hidden sm:inline">JOIN FUND</span><span className="sm:hidden">JOIN</span>
          </button>
      );
  };

  return (
    <div className={containerClasses}>
      {/* Watermark for Suspended Accounts */}
      {isSuspended && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none rounded-2xl">
             <span className="text-5xl font-black text-rose-500/10 -rotate-6 tracking-widest uppercase whitespace-nowrap">
                 SUSPENDED
             </span>
         </div>
      )}

      {/* Left Column */}
      <div className="flex-1 min-w-0 flex items-center space-x-3 sm:space-x-4 overflow-hidden h-full mr-2 relative z-10">
        {/* Icon Circle */}
        <div className={iconClasses}>
           {getIcon()}
        </div>
        
        <div className="min-w-0 flex-1 flex flex-col justify-center">
           <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              {/* Increased font weight to extrabold */}
              <h3 className={`text-primary font-extrabold tracking-wide truncate ${nameSize}`}>{name}</h3>
              <span className={tagClasses}>
                 {type === 'personal' ? 'Personal' : 'Shared'}
              </span>
           </div>
           
           {/* Subtext with reduced opacity (70%) */}
           {(type === 'shared' && isMember && !isLeaving) ? (
               <p className="text-xs text-emerald-400/70 font-medium mt-0.5">Joined</p>
           ) : (type === 'personal' && owner && !isOwner && isAdmin) ? (
               <p className="text-xs text-secondary/70 flex items-center mt-0.5 truncate">
                  <User size={10} className="mr-1 flex-shrink-0"/>
                  <span className="truncate">{owner.name}</span>
               </p>
           ) : null}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0 h-full relative z-10">
         <div className="text-right flex flex-col justify-center h-full">
             {isMasked ? (
                 <div className="flex items-center space-x-1 sm:space-x-2 text-secondary justify-end">
                     <Lock size={14} className="sm:w-4 sm:h-4" />
                     <span className="text-lg sm:text-xl font-bold tracking-widest">****</span>
                 </div>
             ) : (
                 <div className="flex flex-col items-end">
                    <span className={`block font-bold text-primary truncate ${balanceFontSize}`}>
                        {balanceDisplay}
                    </span>
                 </div>
             )}
         </div>
         
         <div className="flex items-center h-full gap-1 sm:gap-0">
            {renderActionButton()}

            {/* 3-Dot Menu */}
            <div 
                className="relative ml-1 sm:ml-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button 
                    ref={menuButtonRef}
                    onClick={() => { updateMenuPosition(); setShowMenu(!showMenu); }}
                    className="p-1.5 sm:p-2 text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                >
                    <MoreVertical size={18} className="sm:w-5 sm:h-5" />
                </button>
                
                {showMenu && (
                    <div 
                        className={`absolute right-0 w-48 z-50 animate-fade-in ${openUpwards ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}
                    >
                        {/* The menu container */}
                        <div className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                            {!isMasked && (
                                <button 
                                    onClick={() => { onDetails(id); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    See Details
                                </button>
                            )}
                            {(isAdmin || type === 'personal') && ( // Admin can suspend any, User can suspend personal
                                <button 
                                    onClick={() => { onSuspend(id, isSuspended); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                    {isSuspended ? 'Unsuspend' : 'Suspend'}
                                </button>
                            )}
                            {isAdmin && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEdit(id, name, type, owner?.id); setShowMenu(false); }}
                                        className="hidden sm:flex w-full text-left px-4 py-3 text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors items-center gap-2"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(id, type); setShowMenu(false); }}
                                        className="hidden sm:flex w-full text-left px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
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
  
  // Search Users State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, type: 'personal' | 'shared' | null}>({
    isOpen: false,
    id: null,
    type: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const navigate = useNavigate();

  // Fetch users when modal opens for Admin
  useEffect(() => {
    if (showModal && profile?.role === 'admin') {
        supabase.from('profiles').select('*').then(({ data }) => {
            if (data) setAllUsers(data as Profile[]);
        });
    }
  }, [showModal, profile]);

  // Disable scrolling when modal is open
  useEffect(() => {
    if (showModal || deleteModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, deleteModal.isOpen]);

  const handleCreateOrUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (editingId) {
        // UPDATE MODE
        const table = newAccountType === 'personal' ? 'accounts' : 'group_accounts';
        
        const updateData: any = {
            name: newAccountName
        };

        // Update owner only if it's personal and admin selected a new user
        if (newAccountType === 'personal' && profile.role === 'admin' && targetUserId) {
            updateData.user_id = targetUserId;
        }

        const { error } = await supabase.from(table).update(updateData).eq('id', editingId);
        
        if (error) {
            console.error("Update failed", error);
            alert("Failed to update account");
        }
    } else {
        // CREATE MODE
        const ownerId = (newAccountType === 'personal' && profile.role === 'admin' && targetUserId) 
            ? targetUserId 
            : profile.id;

        if (newAccountType === 'personal') {
          await supabase.from('accounts').insert({
            user_id: ownerId,
            name: newAccountName,
            type: 'personal',
            balance: 0,
            color: 'bg-indigo-600'
          });
        } else {
          await supabase.from('group_accounts').insert({
            user_id: profile.id,
            name: newAccountName,
            balance: 0,
            members: [profile.id], // Creator is first member
            color: 'bg-emerald-600'
          });
        }
    }
    
    await refreshData();
    closeModal();
  };

  const closeModal = () => {
      setShowModal(false);
      setEditingId(null);
      setNewAccountName('');
      setNewAccountType('personal');
      setTargetUserId('');
      setUserSearchTerm('');
      setShowUserDropdown(false);
  }

  const handleOpenEdit = (id: string, name: string, type: 'personal' | 'shared', ownerId?: string) => {
      setEditingId(id);
      setNewAccountName(name);
      setNewAccountType(type);
      
      // Pre-fill user search if owner exists (for Admin view of personal accounts)
      if (ownerId && profile?.role === 'admin') {
          setTargetUserId(ownerId);
          // Find user name for display
          supabase.from('profiles').select('*').eq('id', ownerId).single().then(({data}) => {
              if (data) setUserSearchTerm(`${data.name} (${data.email})`);
          });
      }
      setShowModal(true);
  };

  const handleDelete = (id: string, type: 'personal' | 'shared') => {
      // Open the delete confirmation modal
      setDeleteModal({ isOpen: true, id, type });
  };

  const executeDelete = async () => {
      if (!deleteModal.id || !deleteModal.type) return;

      const { id, type } = deleteModal;
      const accountTable = type === 'personal' ? 'accounts' : 'group_accounts';
      const txTable = type === 'personal' ? 'transactions' : 'group_transactions';
      
      try {
          setIsDeleting(true);
          
          // Manually delete transactions first to prevent Foreign Key errors if cascade isn't set
          const { error: txError } = await supabase.from(txTable).delete().eq('account_id', id);
          if (txError) {
             console.error("Error deleting transactions:", txError);
             // We continue to try deleting account, as maybe there were no transactions
          }
          
          // Delete account
          const { error } = await supabase.from(accountTable).delete().eq('id', id);
          
          if (error) throw error;
          
          await refreshData();
          setDeleteModal({ isOpen: false, id: null, type: null });
      } catch (err: any) {
          alert("Error deleting account: " + err.message);
      } finally {
          setIsDeleting(false);
      }
  };

  const handleSuspend = async (id: string, isGroup: boolean, currentStatus: boolean) => {
     const table = isGroup ? 'group_accounts' : 'accounts';
     await supabase.from(table).update({ is_suspended: !currentStatus }).eq('id', id);
     refreshData();
  };

  const handleDetails = (id: string) => {
     navigate(`/accounts/${id}`);
  };

  const handleJoinRequest = async (groupId: string) => {
      if (!profile) return;
      
      const group = groupAccounts.find(g => g.id === groupId);
      if (!group) return;

      // Optimistic update for UI
      const currentPending = group.pending_members || [];
      await supabase.from('group_accounts')
        .update({ pending_members: [...currentPending, profile.id] })
        .eq('id', groupId);

      // Notify Admin (Group Owner)
      await supabase.from('notifications').insert({
          user_id: group.user_id,
          title: 'Join Request',
          message: `${profile.name} requested to join ${group.name}`,
          type: 'join_request',
          status: 'pending',
          data: { groupId, requesterId: profile.id }
      });

      refreshData();
  };

  const handleLeaveRequest = async (groupId: string) => {
      if (!profile) return;
      const group = groupAccounts.find(g => g.id === groupId);
      if (!group) return;

      // Optimistic update
      const currentLeaving = group.leaving_members || [];
      await supabase.from('group_accounts')
        .update({ leaving_members: [...currentLeaving, profile.id] })
        .eq('id', groupId);

      // Notify Admin
      await supabase.from('notifications').insert({
          user_id: group.user_id,
          title: 'Leave Request',
          message: `${profile.name} wants to leave ${group.name}`,
          type: 'leave_request',
          status: 'pending',
          data: { groupId, requesterId: profile.id }
      });

      refreshData();
  };

  // Separation Logic
  const myAccounts = accounts.filter(a => a.user_id === profile?.id);
  const otherAccounts = accounts.filter(a => a.user_id !== profile?.id);
  
  // Separate Joined vs Available funds
  const joinedFunds = groupAccounts.filter(acc => acc.members?.includes(profile?.id || ''));
  const availableFunds = groupAccounts.filter(acc => !acc.members?.includes(profile?.id || ''));

  // Filter users for assignment
  const filteredUsers = allUsers.filter(u => 
      u.id !== profile?.id && 
      (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
       u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Accounts</h2>
          <p className="text-secondary text-sm">Manage your personal and family funds.</p>
        </div>
        <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
                <button 
                onClick={() => { setEditingId(null); setShowModal(true); }}
                className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl items-center space-x-2 transition-colors shadow-lg shadow-indigo-500/30"
                >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Account</span>
                </button>
            )}
        </div>
      </div>

      {/* 1. Users Accounts (Admin View) */}
      {otherAccounts.length > 0 && profile?.role === 'admin' && (
          <div className="space-y-4">
            <h3 className="text-secondary text-xs font-bold uppercase tracking-wider ml-1">Users Accounts</h3>
            <div className="grid gap-3 sm:gap-4">
                {otherAccounts.map(acc => (
                    <AccountRow 
                        key={acc.id}
                        id={acc.id}
                        name={acc.name}
                        balance={acc.balance}
                        type="personal"
                        isSuspended={acc.is_suspended}
                        userId={profile?.id}
                        owner={acc.profile}
                        onSuspend={(id, status) => handleSuspend(id, false, status)}
                        onDetails={handleDetails}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        isAdmin={true}
                    />
                ))}
            </div>
          </div>
      )}

      {/* 2. My Family Funds (Joined) */}
      {joinedFunds.length > 0 && (
          <div className="space-y-4">
             <h3 className="text-secondary text-xs font-bold uppercase tracking-wider ml-1">My Family Funds</h3>
             <div className="grid gap-3 sm:gap-4">
                {joinedFunds.map(acc => (
                    <AccountRow 
                        key={acc.id}
                        id={acc.id}
                        name={acc.name}
                        balance={acc.balance}
                        type="shared"
                        isSuspended={acc.is_suspended}
                        members={acc.members}
                        pendingMembers={acc.pending_members}
                        leavingMembers={acc.leaving_members}
                        userId={profile?.id}
                        onJoin={handleJoinRequest}
                        onLeave={handleLeaveRequest}
                        onSuspend={(id, status) => handleSuspend(id, true, status)}
                        onDetails={handleDetails}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        isAdmin={profile?.role === 'admin'}
                        isMasked={false}
                    />
                ))}
             </div>
          </div>
      )}

      {/* 3. Available Family Funds */}
      <div className="space-y-4">
         <h3 className="text-secondary text-xs font-bold uppercase tracking-wider ml-1">Available Funds</h3>
         <div className="grid gap-3 sm:gap-4">
            {availableFunds.map(acc => (
                <AccountRow 
                    key={acc.id}
                    id={acc.id}
                    name={acc.name}
                    balance={acc.balance}
                    type="shared"
                    isSuspended={acc.is_suspended}
                    members={acc.members}
                    pendingMembers={acc.pending_members}
                    leavingMembers={acc.leaving_members}
                    userId={profile?.id}
                    onJoin={handleJoinRequest}
                    onLeave={handleLeaveRequest}
                    onSuspend={(id, status) => handleSuspend(id, true, status)}
                    onDetails={handleDetails}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    isAdmin={profile?.role === 'admin'}
                    isMasked={true}
                />
            ))}
            {availableFunds.length === 0 && joinedFunds.length === 0 && <p className="text-secondary text-sm pl-2">No family funds found.</p>}
         </div>
      </div>

      {/* 4. Personal Wallets (My Accounts) */}
      <div className="space-y-4">
         <h3 className="text-secondary text-xs font-bold uppercase tracking-wider ml-1">Personal Wallets</h3>
         <div className="grid gap-3 sm:gap-4">
            {myAccounts.map(acc => (
                <AccountRow 
                    key={acc.id}
                    id={acc.id}
                    name={acc.name}
                    balance={acc.balance}
                    type="personal"
                    isSuspended={acc.is_suspended}
                    userId={profile?.id}
                    owner={acc.profile}
                    onSuspend={(id, status) => handleSuspend(id, false, status)}
                    onDetails={handleDetails}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    isAdmin={profile?.role === 'admin'}
                />
            ))}
            {myAccounts.length === 0 && <p className="text-secondary text-sm pl-2">No personal accounts found.</p>}
         </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all"
            onClick={closeModal}
        >
          <div 
            className="bg-surface rounded-3xl p-6 w-full max-w-md border border-border animate-fade-in shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-primary">{editingId ? 'Edit Account' : 'Create New Account'}</h3>
                 <button 
                    onClick={closeModal}
                    className="p-1 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                 >
                    <X size={20} />
                 </button>
             </div>
             
             <form onSubmit={handleCreateOrUpdateAccount} className="space-y-4">
                <div>
                  <label className="block text-secondary text-sm mb-2">Account Name</label>
                  <input 
                    type="text" 
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Vacation Fund"
                    required
                    maxLength={25}
                  />
                  <div className="text-right text-xs text-secondary mt-1">
                      {newAccountName.length}/25 characters
                  </div>
                </div>
                
                {/* Prevent changing Type when editing to avoid data loss/table swap complexity */}
                {!editingId && (
                    <div>
                    <label className="block text-secondary text-sm mb-2">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setNewAccountType('personal')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 ${newAccountType === 'personal' ? 'bg-indigo-600/20 border-indigo-500 text-primary' : 'border-border text-secondary hover:bg-primary/5'}`}
                        >
                            <CreditCard size={20} />
                            <span className="text-sm">Personal</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewAccountType('shared')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 ${newAccountType === 'shared' ? 'bg-emerald-600/20 border-emerald-500 text-primary' : 'border-border text-secondary hover:bg-primary/5'}`}
                        >
                            <Users size={20} />
                            <span className="text-sm">Family Shared</span>
                        </button>
                    </div>
                    </div>
                )}
                
                {editingId && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
                        <p className="text-xs text-yellow-500">Note: You cannot change account type (Personal/Shared) after creation.</p>
                    </div>
                )}

                {/* Admin Select User for Personal Account */}
                {profile?.role === 'admin' && newAccountType === 'personal' && (
                    <div className="relative">
                        <label className="block text-secondary text-sm mb-2">Assign to User (Optional)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                            <input
                                type="text"
                                value={userSearchTerm}
                                onChange={(e) => { setUserSearchTerm(e.target.value); setShowUserDropdown(true); }}
                                onFocus={() => setShowUserDropdown(true)}
                                placeholder="Search user by name or email..."
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-3 text-primary focus:outline-none focus:border-indigo-500"
                            />
                            {targetUserId && (
                                <button 
                                    type="button"
                                    onClick={() => { setTargetUserId(''); setUserSearchTerm(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        {/* Dropdown List */}
                        {showUserDropdown && userSearchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                <div 
                                    className="p-3 hover:bg-primary/5 cursor-pointer text-secondary hover:text-primary border-b border-border/50"
                                    onClick={() => {
                                        setTargetUserId('');
                                        setUserSearchTerm(`Myself (${profile.name})`);
                                        setShowUserDropdown(false);
                                    }}
                                >
                                    <span className="font-medium">Myself</span>
                                </div>
                                {filteredUsers.map(u => (
                                    <div 
                                        key={u.id}
                                        className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setTargetUserId(u.id);
                                            setUserSearchTerm(`${u.name} (${u.email})`);
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <div>
                                            <p className="text-primary text-sm font-medium">{u.name}</p>
                                            <p className="text-secondary text-xs">{u.email}</p>
                                        </div>
                                        {targetUserId === u.id && <Check size={16} className="text-emerald-500" />}
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="p-3 text-center text-secondary text-sm">No users found</div>
                                )}
                            </div>
                        )}
                        {/* Overlay to close dropdown if clicking outside */}
                        {showUserDropdown && (
                             <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)}></div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                   <button 
                     type="button" 
                     onClick={closeModal}
                     className="px-4 py-2 text-secondary hover:text-primary"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30"
                   >
                     {editingId ? 'Save Changes' : 'Create'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => !isDeleting && setDeleteModal({ ...deleteModal, isOpen: false })}
        >
           <div 
             className="bg-surface rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl relative"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                     <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Delete Account?</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                     Are you sure you want to delete this account? This action cannot be undone and all associated transactions will be permanently lost.
                  </p>
                  
                  <div className="flex w-full space-x-3 mt-6">
                      <button 
                        onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-3 rounded-xl bg-background text-primary font-medium hover:bg-border transition-colors disabled:opacity-50"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={executeDelete}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30 flex items-center justify-center disabled:opacity-50"
                      >
                         {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};