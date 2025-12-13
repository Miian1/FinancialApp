
export type Role = 'admin' | 'member';
export type AccountType = 'personal' | 'shared';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type NotificationType = 'invite' | 'info' | 'alert' | 'transaction' | 'admin' | 'join_request' | 'leave_request' | 'wallet_request';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: Role;
  bio?: string;
  created_at: string;
  is_suspended?: boolean; // Added field
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  type: AccountType;
  currency: string;
  color: string;
  is_suspended: boolean;
  created_at: string;
  profile?: Profile; // Joined data for Admin view
}

export interface GroupAccount {
  id: string;
  user_id: string; // Creator/Admin
  name: string;
  balance: number;
  currency: string;
  color: string;
  is_suspended: boolean;
  members: string[]; // Array of Profile IDs
  pending_members?: string[];
  leaving_members?: string[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_default: boolean;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  date: string;
  note: string | null;
  created_by: string;
  status?: 'pending' | 'completed' | 'rejected';
  category?: Category; // Joined data
  profile?: Profile; // Joined data
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: 'pending' | 'accepted' | 'rejected';
  is_read: boolean;
  data: any;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}