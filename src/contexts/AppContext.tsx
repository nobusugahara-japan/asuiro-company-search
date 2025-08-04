import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { Hub } from 'aws-amplify/utils';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface User {
  username: string;
  email?: string;
  userId: string;
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
  loadCompanies: () => Promise<void>;
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

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const session = await fetchAuthSession();
      if (session?.tokens) {
        const currentUser = await getCurrentUser();
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
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

  const loadCompanies = async () => {
    try {
      const response = await client.models.Company.list();
      if (response.data) {
        setCompanies(response.data as CompanyData[]);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
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
    loadCompanies,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};