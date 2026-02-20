import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  role: 'Owner' | 'Employee' | 'Label Admin' | 'admin';
  name: string;
  currency: 'USD' | 'INR';
  canManageArtists?: boolean;
  revenueShare?: number;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ds_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const userData = (await res.json()) as any;
        if (userData.authenticated === false) {
          setUser(null);
          localStorage.removeItem('ds_user');
        } else {
          setUser(userData as User);
          localStorage.setItem('ds_user', JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem('ds_user');
      }
    } catch (error) {
      // Don't clear user on network error to allow offline view if needed, 
      // but for security we usually clear it if the API says so.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('ds_user', JSON.stringify(userData));
    
    if (userData.role === 'Owner' || userData.role === 'Employee' || userData.role === 'admin') {
      navigate('/admin');
    } else if (userData.role === 'Label Admin') {
      navigate('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    }
    setUser(null);
    localStorage.removeItem('ds_user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
