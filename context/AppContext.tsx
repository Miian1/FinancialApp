import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, Account, GroupAccount, Category, Transaction, Notification } from '../types';
import { useNavigate } from 'react-router-dom';

interface AppState {
  user: any | null;
  profile: Profile | null;
  accounts: Account[];
  groupAccounts: GroupAccount[];
  categories: Category[];
  transactions: Transaction[];
  notifications: Notification[];
  loading: boolean;
  refreshData: () => Promise<void>;
  viewMode: 'personal' | 'family';
  setViewMode: (mode: 'personal' | 'family') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  goBack: () => void;
  exitModalOpen: boolean;
  setExitModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppState>({
  user: null,
  profile: null,
  accounts: [],
  groupAccounts: [],
  categories: [],
  transactions: [],
  notifications: [],
  loading: true,
  refreshData: async () => {},
  viewMode: 'personal',
  setViewMode: () => {},
  theme: 'dark',
  toggleTheme: () => {},
  goBack: () => {},
  exitModalOpen: false,
  setExitModalOpen: () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groupAccounts, setGroupAccounts] = useState<GroupAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'personal' | 'family'>('personal');
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Go Back Logic
  const goBack = useCallback(() => {
    // Check React Router history state index. If > 0, we can go back.
    const state = window.history.state as { idx: number } | null;
    if (state && state.idx > 0) {
        navigate(-1);
    } else {
        // No history stack, prompt exit
        setExitModalOpen(true);
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 1. Fetch Profile
      let { data: profileRes, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      // Self-healing: Create profile if missing in DB but user exists in Auth (e.g. Google Login first time)
      if (!profileRes) {
          console.log("Profile missing for user, attempting creation:", currentUser.id);
          
          const meta = currentUser.user_metadata || {};
          // Prioritize meta.name, then full_name, then email username
          const name = meta.name || meta.full_name || currentUser.email?.split('@')[0] || 'User';
          const avatar = meta.avatar_url || meta.picture || null;

          // Using UPSERT to avoid race conditions if multiple tabs/hooks try to create
          const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
              id: currentUser.id,
              email: currentUser.email,
              name: name,
              role: 'member',
              avatar: avatar,
              is_suspended: false
          }, { onConflict: 'id' }).select().single();

          if (!insertError && newProfile) {
              profileRes = newProfile;
              console.log("Profile created successfully:", newProfile);
          } else {
              console.error("Error creating profile:", insertError);
              // If upsert fails (e.g. RLS), we might create a temporary local profile to allow UI to render
              // This acts as a fallback so the app doesn't crash
              if (insertError) {
                  profileRes = {
                    id: currentUser.id,
                    email: currentUser.email!,
                    name: name,
                    role: 'member',
                    avatar: avatar,
                    created_at: new Date().toISOString(),
                    is_suspended: false
                  } as unknown as Profile;
              }
          }
      }

      const currentProfile = profileRes || null;
      setProfile(currentProfile);

      // 2. Configure Accounts Query
      let accountsQuery = supabase.from('accounts').select('*, profile:profiles(*)');
      
      if (currentProfile?.role !== 'admin') {
         accountsQuery = accountsQuery.eq('user_id', currentUser.id);
      }

      // 3. Fetch remaining data
      const [
        accountsRes,
        groupAccountsRes,
        categoriesRes,
        personalTxRes,
        groupTxRes,
        notificationsRes
      ] = await Promise.all([
        accountsQuery,
        supabase.from('group_accounts').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('transactions').select(`
          *,
          category:categories(*),
          profile:created_by(*)
        `).order('date', { ascending: false }).limit(500),
        supabase.from('group_transactions').select(`
          *,
          category:categories(*),
          profile:created_by(*)
        `).order('date', { ascending: false }).limit(500),
        supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (groupAccountsRes.data) setGroupAccounts(groupAccountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      
      const allTransactions = [
          ...(personalTxRes.data || []),
          ...(groupTxRes.data || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions as Transaction[]);
      
      if (notificationsRes.data) setNotifications(notificationsRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Add a small delay to ensure DB triggers (if any) have fired, though our upsert handles it
        fetchData();
      } else {
        setProfile(null);
        setAccounts([]);
        setGroupAccounts([]);
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchData]);

  return (
    <AppContext.Provider value={{
      user,
      profile,
      accounts,
      groupAccounts,
      categories,
      transactions,
      notifications,
      loading,
      refreshData: fetchData,
      viewMode,
      setViewMode,
      theme,
      toggleTheme,
      goBack,
      exitModalOpen,
      setExitModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};