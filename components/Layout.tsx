import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  MessageCircle, 
  Bell, 
  Settings, 
  LogOut,
  User,
  ShieldAlert,
  X,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, collapsed, badgeCount }: { to: string, icon: any, label: string, collapsed: boolean, badgeCount?: number }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 space-x-3'} py-3 rounded-xl transition-all duration-200 group relative ${
        isActive 
          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
          : 'text-secondary hover:bg-primary/5 hover:text-primary'
      }`
    }
    title={collapsed ? label : undefined}
  >
    <Icon size={20} className="shrink-0" />
    {!collapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all">{label}</span>}
    
    {/* Badge Logic */}
    {badgeCount !== undefined && badgeCount > 0 && (
      collapsed ? (
        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
      ) : (
        <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
          {badgeCount}
        </span>
      )
    )}
  </NavLink>
);

const MobileNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex flex-col items-center justify-center w-full py-2 ${
        isActive ? 'text-indigo-400' : 'text-secondary'
      }`
    }
  >
    <Icon size={22} />
    <span className="text-[10px] mt-1">{label}</span>
  </NavLink>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, notifications, theme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileNotif, setShowMobileNotif] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  // Scroll to top of main content on route change
  useEffect(() => {
    // Reset internal container scroll
    if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Backup: Reset window scroll (though layout prevents window scroll mostly)
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowMobileNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    // App Shell: Fixed height, hidden overflow on body. 
    // This forces 'main' to be the only scrollable area.
    <div className="h-screen w-full bg-background text-primary font-sans flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'} h-full bg-background border-r border-border p-4 transition-all duration-300 ease-in-out flex-shrink-0 relative`}>
        
        {/* Collapse Toggle Button */}
        <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-9 bg-surface border border-border text-secondary hover:text-primary rounded-full p-1 shadow-lg z-50 hidden md:flex items-center justify-center hover:scale-110 transition-transform"
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Branding */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-10 px-2 shrink-0 transition-all duration-300 h-10`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
             <LayoutGrid className="text-white" size={20} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary whitespace-nowrap">
                FamilyFinance
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={isSidebarCollapsed} />
          <SidebarItem to="/accounts" icon={Wallet} label="Accounts" collapsed={isSidebarCollapsed} />
          <SidebarItem to="/transactions" icon={ArrowRightLeft} label="Transactions" collapsed={isSidebarCollapsed} />
          <SidebarItem to="/chat" icon={MessageCircle} label="Family Chat" collapsed={isSidebarCollapsed} />
          <SidebarItem to="/notifications" icon={Bell} label="Notifications" collapsed={isSidebarCollapsed} badgeCount={unreadNotifications} />
          <SidebarItem to="/settings" icon={Settings} label="Settings" collapsed={isSidebarCollapsed} />
          {profile?.role === 'admin' && (
             <SidebarItem to="/admin" icon={ShieldAlert} label="Admin Panel" collapsed={isSidebarCollapsed} />
          )}
        </nav>

        {/* User Footer */}
        <div className="border-t border-border pt-4 mt-auto shrink-0 space-y-2">
          <button 
            onClick={() => navigate('/profile')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 px-2'} py-2 w-full text-left rounded-xl hover:bg-primary/5 transition-all group`}
            title={isSidebarCollapsed ? profile?.name : undefined}
          >
            <img 
              src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-border group-hover:border-secondary transition-colors shrink-0"
            />
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-medium text-primary truncate group-hover:text-indigo-500 transition-colors">{profile?.name}</p>
              <p className="text-xs text-secondary capitalize">{profile?.role}</p>
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-2 w-full transition-all rounded-xl hover:bg-primary/5 text-secondary hover:text-rose-400`}
            title={isSidebarCollapsed ? "Log out" : undefined}
          >
            <LogOut size={18} />
            <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      {/* Not sticky anymore, just part of the flex column above 'main' */}
      <div className="md:hidden z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="text-white" size={20} />
            </div>
            <span className="font-bold text-primary">FamilyFinance</span>
         </div>
         
         <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate('/settings')} 
                className="p-1 text-secondary hover:text-primary"
             >
                <Settings size={22} />
             </button>
             
             <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowMobileNotif(!showMobileNotif)} 
                    className="relative p-1 text-secondary hover:text-primary"
                >
                    <Bell size={24} />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-background flex items-center justify-center text-[9px] text-white font-bold">
                        {unreadNotifications}
                      </span>
                    )}
                </button>

                {showMobileNotif && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in origin-top-right">
                      <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
                            <h4 className="font-bold text-primary text-sm">Notifications</h4>
                            <button onClick={() => setShowMobileNotif(false)}><X size={16} className="text-secondary hover:text-primary"/></button>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {recentNotifications.length === 0 ? (
                                <div className="p-8 text-center text-secondary text-xs">No notifications</div>
                            ) : (
                                recentNotifications.map(n => (
                                    <div 
                                      key={n.id} 
                                      onClick={() => { setShowMobileNotif(false); navigate('/notifications'); }} 
                                      className="p-3 hover:bg-primary/5 border-b border-border cursor-pointer transition-colors group text-left"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                          <span className={`text-xs font-bold capitalize ${n.type === 'invite' ? 'text-indigo-400' : 'text-secondary'}`}>{n.type}</span>
                                          <span className="text-[10px] text-secondary group-hover:text-primary">{format(new Date(n.created_at), 'MMM dd')}</span>
                                        </div>
                                        <p className="text-sm text-secondary group-hover:text-primary line-clamp-2 transition-colors">{n.message}</p>
                                    </div>
                                ))
                            )}
                      </div>
                      <button 
                        onClick={() => { setShowMobileNotif(false); navigate('/notifications'); }}
                        className="w-full p-3 text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-primary/5 transition-colors border-t border-border"
                      >
                          See All
                      </button>
                  </div>
                )}
             </div>
         </div>
      </div>

      {/* Main Content Area */}
      {/* overflow-y-auto enables scrolling within this container */}
      <main 
        ref={mainContentRef} 
        className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-background relative"
      >
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-border z-50 px-2 pb-safe">
        <div className="flex justify-around items-center">
          <MobileNavItem to="/" icon={LayoutDashboard} label="Home" />
          <MobileNavItem to="/accounts" icon={Wallet} label="Accounts" />
          <div className="relative -top-5">
            <button 
              onClick={() => navigate('/transactions')}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 text-white"
            >
              <ArrowRightLeft size={24} />
            </button>
          </div>
          <MobileNavItem to="/chat" icon={MessageCircle} label="Chat" />
          <MobileNavItem to="/profile" icon={User} label="Profile" />
        </div>
      </div>
    </div>
  );
};