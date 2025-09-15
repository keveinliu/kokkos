import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // 检查是否是首次用户注册
  const isFirstUser = (location.state as any)?.isFirstUser || false;
  const welcomeMessage = (location.state as any)?.message || '';
  const userRole = (location.state as any)?.role || 'user';

  // 检查是否已有管理员用户
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/check-users');
        const data = await response.json();
        if (data.success) {
          setHasAdmin(data.data.hasAdmin);
          // 如果已有管理员且不是首次用户访问，重定向到登录页
          if (data.data.hasAdmin && !isFirstUser) {
            toast.info('系统已有管理员，请直接登录');
            navigate('/login');
            return;
          }
        }
      } catch (error) {
        console.error('检查管理员状态失败:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminExists();
  }, [isFirstUser, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!form.username.trim()) {
      toast.error('请输入用户名');
      return false;
    }
    
    if (form.username.trim().length < 3) {
      toast.error('用户名至少需要3个字符');
      return false;
    }
    
    if (!form.email.trim()) {
      toast.error('请输入邮箱地址');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('请输入有效的邮箱地址');
      return false;
    }
    
    if (!form.password) {
      toast.error('请输入密码');
      return false;
    }
    
    if (form.password.length < 6) {
      toast.error('密码至少需要6个字符');
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(isFirstUser && { role: userRole }) // 首次用户时指定角色
        })
      });

      const data = await response.json();

      if (data.success) {
        // 使用 AuthContext 的 login 方法
        login(data.data.token, data.data.user);
        
        const successMessage = isFirstUser 
          ? '管理员账户创建成功，欢迎使用芥子博客！' 
          : '注册成功，欢迎使用芥子博客！';
        toast.success(successMessage);
        navigate('/');
      } else {
        toast.error(data.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      toast.error('注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查管理员状态，显示加载
  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">检查系统状态...</p>
        </div>
      </div>
    );
  }

  // 如果已有管理员且不是首次用户，显示提示信息
  if (hasAdmin && !isFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <UserPlus className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              注册已关闭
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              系统已有管理员用户，新用户注册已关闭。
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                前往登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isFirstUser ? '创建管理员账户' : (hasAdmin ? '注册已关闭' : '创建新账户')}
          </h2>
          {welcomeMessage && (
            <p className="mt-2 text-center text-sm text-blue-600 dark:text-blue-400">
              {welcomeMessage}
            </p>
          )}
          {!isFirstUser && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              或者{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                登录已有账户
              </Link>
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={form.username}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入用户名（至少3个字符）"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入邮箱地址"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="请输入密码（至少6个字符）"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                确认密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="请再次输入密码"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  注册中...
                </div>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;