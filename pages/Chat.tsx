import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Message, Profile } from '../types';
import { Send, Search, UserPlus, ArrowLeft, X, UserCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const Chat: React.FC = () => {
  const { profile } = useApp();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [activeFriend, setActiveFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add Friend & Requests State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Fetch Friends
  const fetchFriends = async () => {
    if (!profile) return;
    setLoadingFriends(true);
    // Get accepted friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, receiver_id')
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq('status', 'accepted');

    if (friendships) {
      const friendIds = friendships.map(f => f.requester_id === profile.id ? f.receiver_id : f.requester_id);
      if (friendIds.length > 0) {
          const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', friendIds);
          setFriends(friendProfiles || []);
      } else {
          setFriends([]);
      }
    }
    setLoadingFriends(false);
  };

  // Fetch Pending Incoming Requests
  const fetchIncomingRequests = async () => {
    if (!profile) return;
    const { data: requests } = await supabase
        .from('friendships')
        .select('requester_id')
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');
    
    if (requests && requests.length > 0) {
        const requesterIds = requests.map(r => r.requester_id);
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', requesterIds);
        setIncomingRequests(profiles as Profile[] || []);
    } else {
        setIncomingRequests([]);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [profile]);

  useEffect(() => {
    if (isAddingContact) {
        fetchIncomingRequests();
    }
  }, [isAddingContact, profile]);

  // Search Users to Add
  useEffect(() => {
    if (!isAddingContact || !userSearchTerm.trim()) {
        setSearchResults([]);
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
        setSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', profile?.id) // Not me
            .ilike('name', `%${userSearchTerm}%`)
            .limit(10);
        
        // Filter out existing friends
        const friendIds = new Set(friends.map(f => f.id));
        const filtered = (data || []).filter(u => !friendIds.has(u.id));
        
        setSearchResults(filtered as Profile[]);
        setSearching(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchTerm, isAddingContact, friends, profile]);

  const sendFriendRequest = async (receiverId: string) => {
      if (!profile) return;
      
      const { data: existing } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(requester_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${profile.id})`)
          .single();

      if (existing) {
          setSentRequests(prev => new Set(prev).add(receiverId));
          return;
      }

      await supabase.from('friendships').insert({
          requester_id: profile.id,
          receiver_id: receiverId,
          status: 'pending'
      });

      await supabase.from('notifications').insert({
          user_id: receiverId,
          title: 'Friend Request',
          message: `${profile.name} wants to connect.`,
          type: 'invite',
          status: 'pending',
          data: { requesterId: profile.id }
      });

      setSentRequests(prev => new Set(prev).add(receiverId));
  };

  const handleAcceptFriend = async (requesterId: string) => {
      if (!profile) return;

      // Update friendship status to accepted
      const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('requester_id', requesterId)
          .eq('receiver_id', profile.id);

      if (!error) {
          // Refresh lists
          await fetchIncomingRequests();
          await fetchFriends();
      }
  };

  // Fetch Messages
  useEffect(() => {
    if (!profile || !activeFriend) return;
    
    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeFriend.id}),and(sender_id.eq.${activeFriend.id},receiver_id.eq.${profile.id})`)
            .order('created_at', { ascending: true })
            .limit(50);
        setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${profile.id}:${activeFriend.id}`)
      .on(
        'postgres_changes', 
        { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${profile.id}` 
        }, 
        (payload) => {
           if (payload.new.sender_id === activeFriend.id) {
               setMessages(prev => [...prev, payload.new as Message]);
           }
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [profile, activeFriend]);

  // Scroll to bottom
  useEffect(() => {
      // Use a small timeout to ensure rendering is complete (especially on mobile transitions)
      const timeout = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeout);
  }, [messages, activeFriend]);

  const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !profile || !activeFriend) return;

      const msg = {
          sender_id: profile.id,
          receiver_id: activeFriend.id,
          content: newMessage,
          created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, { ...msg, id: 'temp-' + Date.now(), is_read: false } as Message]);
      setNewMessage('');

      await supabase.from('messages').insert({
          sender_id: profile.id,
          receiver_id: activeFriend.id,
          content: msg.content
      });
  };

  return (
    <div className="h-full relative overflow-hidden md:flex md:gap-4">
       
       {/* LEFT COLUMN: Friend List / Search */}
       <div className={`
          absolute inset-0 md:static z-0
          w-full h-full md:w-80 flex-shrink-0
          bg-surface rounded-3xl border border-border flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${activeFriend ? '-translate-x-1/4 opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto' : 'translate-x-0 opacity-100'}
       `}>
          <div className="p-4 border-b border-border shrink-0">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-primary font-bold">{isAddingContact ? 'Manage Contacts' : 'Messages'}</h3>
                 <button 
                    onClick={() => { setIsAddingContact(!isAddingContact); setUserSearchTerm(''); }}
                    className={`p-2 rounded-xl transition-colors ${isAddingContact ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                 >
                    {isAddingContact ? <X size={18} /> : <UserPlus size={18} />}
                 </button>
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                <input 
                    type="text" 
                    placeholder={isAddingContact ? "Search people..." : "Search friends..."}
                    value={isAddingContact ? userSearchTerm : undefined}
                    onChange={isAddingContact ? (e) => setUserSearchTerm(e.target.value) : undefined}
                    className="w-full bg-background rounded-xl pl-9 pr-3 py-2 text-sm text-primary focus:outline-none border border-border" 
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {isAddingContact ? (
                 <div className="p-2">
                     {/* Pending Requests Section */}
                     {incomingRequests.length > 0 && !userSearchTerm && (
                         <div className="mb-4 animate-fade-in">
                             <h4 className="px-3 text-xs font-bold text-secondary uppercase tracking-wider mb-2 mt-2">Friend Requests</h4>
                             {incomingRequests.map(user => (
                                 <div key={user.id} className="p-3 bg-primary/5 rounded-xl flex items-center justify-between mb-2 border border-border">
                                     <div className="flex items-center space-x-3 min-w-0">
                                         <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-8 h-8 rounded-full" alt="avatar" />
                                         <div className="min-w-0">
                                             <p className="text-primary text-sm font-medium truncate">{user.name}</p>
                                         </div>
                                     </div>
                                     <button 
                                         onClick={() => handleAcceptFriend(user.id)}
                                         className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                                         title="Accept Request"
                                     >
                                         <UserCheck size={16} />
                                     </button>
                                 </div>
                             ))}
                             <div className="h-px bg-border my-4 mx-2"></div>
                         </div>
                     )}

                     {/* Search Results */}
                     {searching ? (
                         <div className="flex justify-center p-4 text-secondary"><Loader2 className="animate-spin" /></div>
                     ) : searchResults.length > 0 ? (
                         searchResults.map(user => {
                             const isSent = sentRequests.has(user.id);
                             return (
                                <div key={user.id} className="p-3 hover:bg-primary/5 rounded-xl flex items-center justify-between group">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-8 h-8 rounded-full" />
                                        <div className="min-w-0">
                                            <p className="text-primary text-sm font-medium truncate w-32">{user.name}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => sendFriendRequest(user.id)}
                                        disabled={isSent}
                                        className={`p-2 rounded-lg text-xs font-bold transition-colors ${isSent ? 'text-secondary' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    >
                                        {isSent ? 'Sent' : <UserPlus size={16} />}
                                    </button>
                                </div>
                             )
                         })
                     ) : (
                         <div className="p-4 text-center text-secondary text-sm">
                             {userSearchTerm ? 'No users found.' : 'Type to search for people...'}
                         </div>
                     )}
                 </div>
             ) : (
                 <>
                    {loadingFriends ? (
                        <div className="p-4 text-center text-secondary">Loading contacts...</div>
                    ) : friends.length === 0 ? (
                        <div className="p-4 text-center text-secondary">
                            <p>No friends yet.</p>
                            <p className="text-xs mt-2">Click + to add contacts.</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <div 
                                key={friend.id}
                                onClick={() => setActiveFriend(friend)}
                                className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-primary/5 transition-colors border-l-2 ${activeFriend?.id === friend.id ? 'border-indigo-500 bg-primary/5' : 'border-transparent'}`}
                            >
                                <img 
                                    src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} 
                                    className="w-10 h-10 rounded-full" 
                                    alt="Avatar"
                                />
                                <div>
                                    <p className="text-primary font-medium text-sm">{friend.name}</p>
                                    <p className="text-secondary text-xs">Tap to chat</p>
                                </div>
                            </div>
                        ))
                    )}
                 </>
             )}
          </div>
       </div>

       {/* RIGHT COLUMN: Chat Area */}
       <div className={`
          absolute inset-0 md:static z-10
          w-full h-full md:flex-1
          flex flex-col
          bg-background md:bg-transparent
          transition-transform duration-300 ease-in-out
          ${activeFriend ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
       `}>
          {activeFriend ? (
              <div className="flex flex-col h-full bg-surface md:rounded-3xl border-0 md:border border-border overflow-hidden relative shadow-2xl md:shadow-none">
                 
                 {/* Header */}
                 <div className="p-4 border-b border-border flex items-center justify-between bg-surface shrink-0 z-10">
                    <div className="flex items-center">
                        <button onClick={() => setActiveFriend(null)} className="md:hidden mr-3 p-1 rounded-full hover:bg-primary/5 text-secondary hover:text-primary transition-colors">
                            <ArrowLeft size={22} />
                        </button>
                        <img 
                            src={activeFriend.avatar || `https://ui-avatars.com/api/?name=${activeFriend.name}&background=random`} 
                            className="w-10 h-10 rounded-full mr-3 border border-border" 
                            alt="Avatar"
                        />
                        <div>
                            <span className="text-primary font-bold block leading-tight">{activeFriend.name}</span>
                            <span className="text-emerald-500 text-xs font-medium flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>Online</span>
                        </div>
                    </div>
                 </div>
                 
                 {/* Messages List */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/30">
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === profile?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-surface text-primary rounded-tl-sm border border-border'}`}>
                                    {msg.content}
                                    <div className={`text-[10px] mt-1.5 text-right opacity-70`}>
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <form onSubmit={sendMessage} className="shrink-0 p-3 md:p-4 bg-surface border-t border-border flex items-center gap-2 md:gap-3 safe-bottom pb-6 md:pb-4">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-background text-primary border border-border rounded-2xl px-5 py-3.5 md:py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-secondary text-base"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className={`w-12 h-12 md:w-11 md:h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0
                            ${newMessage.trim() ? 'shadow-[0_0_15px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-105 active:scale-95' : ''}
                        `}
                    >
                        <Send size={20} className={newMessage.trim() ? "translate-x-0.5" : ""} />
                    </button>
                 </form>
              </div>
          ) : (
              // Empty State
              <div className="flex flex-col h-full bg-surface rounded-3xl border border-border items-center justify-center text-secondary p-8">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
                      <MessageCircleIcon size={40} className="text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">Family Chat</h3>
                  <p className="max-w-xs text-center text-sm">Select a family member from the list to start chatting or add a new contact.</p>
              </div>
          )}
       </div>
    </div>
  );
};

const MessageCircleIcon = ({size, className}: {size:number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
)