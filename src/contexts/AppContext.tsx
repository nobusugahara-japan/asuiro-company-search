import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

interface User {
  username: string;
  email?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
}

interface CompanyData {
  id?: string;
  indexKanjiName?: string;
  ceoName?: string;
  companyLocation?: string;
  numberOfEmployees?: number;
  capitalStock?: number;
  [key: string]: any;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedCompany: CompanyData | null;
  setSelectedCompany: (company: CompanyData | null) => void;
  companies: CompanyData[];
  setCompanies: (companies: CompanyData[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshAuth: () => Promise<void>;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

const client = generateClient<Schema>();

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('メイン');

  console.log(user)

  const updateUserInDB = async (currentUser: any) => {
    try {
      // ユーザー情報をコンソールに出力
      console.log('Current user:', currentUser);
      
      // ユーザーIDをemailとして使用（既存のDBスキーマに合わせて）
      const email = currentUser.signInDetails?.loginId || currentUser.username;
      
      // 既存のユーザーを検索
      const existingUsers = await client.models.User.list({
        filter: {
          email: {
            eq: email
          }
        }
      });

      if (existingUsers.data && existingUsers.data.length > 0) {
        // 既存ユーザーを更新
        const existingUser = existingUsers.data[0];
        const updatedUser = await client.models.User.update({
          id: existingUser.id,
          userId: currentUser.userId,
          userName: currentUser.username,
        });
        console.log('User updated in DB:', email);
        // 更新されたユーザー情報を返す
        return updatedUser.data;
      } else {
        // 新規ユーザーを作成
        const newUser = await client.models.User.create({
          email: email,
          userId: currentUser.userId,
          userName: currentUser.username,
        });
        console.log('New user created in DB:', email);
        // 作成されたユーザー情報を返す
        return newUser.data;
      }
    } catch (error) {
      console.error('Error updating user in DB:', error);
      return null;
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const session = await fetchAuthSession();
      if (session?.tokens) {
        const currentUser = await getCurrentUser();
        console.log('getCurrentUser result:', currentUser);
        
        // DBにユーザー情報を更新し、DB上のユーザー情報を取得
        const dbUser = await updateUserInDB(currentUser);
        
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email: currentUser.signInDetails?.loginId,
          firstName: dbUser?.firstName || undefined,
          lastName: dbUser?.lastName || undefined,
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'signedOut':
        case 'tokenRefresh':
          refreshAuth();
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setSidebarOpen(JSON.parse(savedSidebarState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const value: AppContextType = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    sidebarOpen,
    setSidebarOpen,
    selectedCompany,
    setSelectedCompany,
    companies,
    setCompanies,
    searchQuery,
    setSearchQuery,
    refreshAuth,
    activeSection,
    setActiveSection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};