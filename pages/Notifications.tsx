import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Bell, UserPlus, Check, X, Info, AlertTriangle, LogIn, LogOut, Wallet } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Notification } from '../types';

export const Notifications: React.FC = () => {
  const { notifications, refreshData, profile } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const myNotifications = useMemo(() => notifications.filter(n => n.user_id === profile?.id), [notifications, profile]);
  const filteredList = useMemo(() => myNotifications.filter(n => { if (filter === 'unread') return !n.is_read; if (filter === 'join_request') return n.type === 'join_request'; if (filter === 'leave_request') return n.type === 'leave_request'; if (filter === 'wallet_request') return n.type === 'wallet_request'; if (filter === 'invite') return n.type === 'invite'; return true; }), [myNotifications, filter]);
  const { today, previous } = useMemo(() => { const todayArr: Notification[] = []; const prevArr: Notification[] = []; filteredList.forEach(n => { if (isToday(new Date(n.created_at))) { todayArr.push(n); } else { prevArr.push(n); } }); return { today: todayArr, previous: prevArr }; }, [filteredList]);

  const handleRequest = async (id: string, accept: boolean, data: any, type: string) => {
    setProcessing(id);
    try {
        if (data?.groupId && data?.requesterId) {
             const { data: groupData } = await supabase.from('group_accounts').select('*').eq('id', data.groupId).single();
            if (groupData) {
                let newMembers = groupData.members || []; let newPending = groupData.pending_members || []; let newLeaving = groupData.leaving_members || [];
                if (type === 'join_request') { newPending = newPending.filter((pid: string) => pid !== data.requesterId); if (accept) { newMembers = [...newMembers, data.requesterId]; } } 
                else if (type === 'leave_request') { newLeaving = newLeaving.filter((pid: string) => pid !== data.requesterId); if (accept) { newMembers = newMembers.filter((pid: string) => pid !== data.requesterId); } }
                await supabase.from('group_accounts').update({ members: [...new Set(newMembers)], pending_members: newPending, leaving_members: newLeaving }).eq('id', data.groupId);
            }
        }
        if (type === 'invite' && accept && data?.groupId) { const { data: groupData } = await supabase.from('group_accounts').select('members').eq('id', data.groupId).single(); if (groupData) { const newMembers = [...(groupData.members || []), notifications.find(n => n.id === id)?.user_id]; await supabase.from('group_accounts').update({ members: [...new Set(newMembers)] }).eq('id', data.groupId); } }
        await supabase.from('notifications').update({ status: accept ? 'accepted' : 'rejected', is_read: true }).eq('id', id);
        await refreshData();
    } catch (error) { console.error('Error handling request:', error); } finally { setProcessing(null); }
  };

  const markAsRead = async (id: string) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); refreshData(); };
  const markAllRead = async () => { const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id); if (unreadIds.length > 0) { await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds); refreshData(); } }
  const getIcon = (type: string) => { switch(type) { case 'invite': return <UserPlus size={18} className="text-indigo-400" />; case 'join_request': return <LogIn size={18} className="text-emerald-400" />; case 'leave_request': return <LogOut size={18} className="text-rose-400" />; case 'wallet_request': return <Wallet size={18} className="text-amber-400" />; case 'alert': return <AlertTriangle size={18} className="text-rose-400" />; case 'info': return <Info size={18} className="text-blue-400" />; default: return <Bell size={18} className="text-secondary" />; } };

  const tabs = [{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }];
  if (profile?.role === 'admin') { tabs.push({ id: 'join_request', label: 'Join Req' }); tabs.push({ id: 'leave_request', label: 'Leave Req' }); tabs.push({ id: 'wallet_request', label: 'Wallet Req' }); } else { tabs.push({ id: 'invite', label: 'Invites' }); }

  const NotificationItem: React.FC<{ n: Notification }> = ({ n }) => (
    <div className={`p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-surface border-border' : 'bg-surface border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`} onClick={() => !n.is_read && !['invite', 'join_request', 'leave_request', 'wallet_request'].includes(n.type) && markAsRead(n.id)}>
        <div className="flex gap-3">
            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-background border border-border`}>{getIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1"><h4 className="text-primary text-sm font-medium truncate pr-2">{n.title}</h4><span className="text-[10px] text-secondary whitespace-nowrap">{format(new Date(n.created_at), 'HH:mm')}</span></div>
                <p className="text-secondary text-xs leading-relaxed">{n.message}</p>
                {['invite', 'join_request', 'leave_request', 'wallet_request'].includes(n.type) && n.status === 'pending' && (
                    <div className="flex gap-2 mt-3"><button onClick={(e) => { e.stopPropagation(); handleRequest(n.id, true, n.data, n.type); }} disabled={!!processing} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center transition-colors border border-emerald-500/30">{processing === n.id ? '...' : <><Check size={14} className="mr-1" /> Accept</>}</button><button onClick={(e) => { e.stopPropagation(); handleRequest(n.id, false, n.data, n.type); }} disabled={!!processing} className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center transition-colors border border-rose-500/30">{processing === n.id ? '...' : <><X size={14} className="mr-1" /> Decline</>}</button></div>
                )}
                {n.status !== 'pending' && ['invite', 'join_request', 'leave_request', 'wallet_request'].includes(n.type) && (<div className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${n.status === 'accepted' ? 'text-emerald-500' : 'text-rose-500'}`}>{n.status}</div>)}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20">
        <div className="flex justify-between items-center"><div><h2 className="text-xl md:text-2xl font-bold text-primary">Notifications</h2><p className="text-secondary text-xs md:text-sm">Stay updated with your family activity.</p></div>{notifications.some(n => !n.is_read) && (<button onClick={markAllRead} className="text-[10px] md:text-xs text-indigo-400 hover:text-indigo-300 bg-surface border border-border px-3 py-1.5 rounded-lg">Mark all read</button>)}</div>
        <div className="hidden md:flex bg-surface p-1 rounded-xl border border-border w-fit overflow-x-auto">{tabs.map((tab) => (<button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all whitespace-nowrap ${filter === tab.id ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-primary'}`}>{tab.label}</button>))}</div>
        <div className="space-y-4">
            {today.length === 0 && previous.length === 0 && (<div className="text-center py-16 text-secondary bg-surface rounded-3xl border border-border"><Bell size={40} className="mx-auto mb-4 opacity-20" /><p className="font-medium text-sm">No notifications found.</p></div>)}
            {today.length > 0 && (<div className="animate-fade-in"><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-2 ml-1">Today</h3><div className="space-y-2">{today.map(n => <NotificationItem key={n.id} n={n} />)}</div></div>)}
            {previous.length > 0 && (<div className="animate-fade-in" style={{animationDelay: '100ms'}}><h3 className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-2 ml-1 mt-4">Previous</h3><div className="space-y-2">{previous.map(n => <NotificationItem key={n.id} n={n} />)}</div></div>)}
        </div>
    </div>
  );
};