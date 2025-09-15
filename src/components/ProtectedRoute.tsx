import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          // 如果已认证，验证token是否仍然有效
          await checkAuth();
        }
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, isLoading, checkAuth]);

  // 显示加载状态
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页面，并保存当前路径
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;