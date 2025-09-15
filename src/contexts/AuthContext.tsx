import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user && !!token;

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_info');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          
          // 验证token是否仍然有效
          const isValid = await verifyToken(storedToken);
          if (!isValid) {
            // Token无效，清除认证信息
            logout();
          }
        } catch (error) {
          console.error('解析用户信息失败:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 验证token有效性
  const verifyToken = async (tokenToVerify: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenToVerify}`,
            'Content-Type': 'application/json',
          },
        });

      return response.ok;
    } catch (error) {
      console.error('Token验证失败:', error);
      return false;
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    navigate('/login');
  };

  const checkAuth = async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      logout();
      toast.error('登录已过期，请重新登录');
      return false;
    }

    return true;
  };

  // 设置axios拦截器或全局请求头
  useEffect(() => {
    if (token) {
      // 这里可以设置全局的请求拦截器
      // 为所有API请求添加Authorization头
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};