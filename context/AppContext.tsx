import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, Account, GroupAccount, Category, Transaction, Notification } from '../types';

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

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // 1. Fetch Profile first to check role
      const { data: profileRes } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      const currentProfile = profileRes || null;
      setProfile(currentProfile);

      // 2. Configure Accounts Query
      // Using 'profile:profiles(*)' to join profile data. Requires FK from accounts.user_id to profiles.id
      let accountsQuery = supabase.from('accounts').select('*, profile:profiles(*)');
      
      if (currentProfile?.role !== 'admin') {
         accountsQuery = accountsQuery.eq('user_id', session.user.id);
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
        supabase.from('group_accounts').select('*'), // Fetch all groups to allow joining
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
        supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (groupAccountsRes.data) setGroupAccounts(groupAccountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      
      // Combine Personal and Group Transactions
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
        fetchData();
      } else {
        setProfile(null);
        setAccounts([]);
        setGroupAccounts([]);
        setTransactions([]);
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
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};