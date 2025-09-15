import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

interface FirstTimeSetupProps {
  children: React.ReactNode;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkForUsers();
  }, []);

  const checkForUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/check-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setHasUsers(data.data.hasUsers);
        if (!data.data.hasUsers) {
          setShowSetup(true);
        }
      } else {
        console.error('检查用户失败:', data.message);
        // 如果检查失败，假设有用户存在，避免阻塞应用
        setHasUsers(true);
      }
    } catch (error) {
      console.error('检查用户时发生错误:', error);
      // 网络错误时，假设有用户存在
      setHasUsers(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateFirstUser = () => {
    navigate('/register', { 
      state: { 
        isFirstUser: true,
        role: 'admin',
        message: '欢迎使用芥子博客！请创建您的第一个管理员账户。'
      } 
    });
  };

  const handleSkip = () => {
    setShowSetup(false);
    toast.info('您可以稍后在设置中创建管理员账户');
  };

  // 显示加载状态
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">初始化应用...</p>
        </div>
      </div>
    );
  }

  // 渲染逻辑
  if (showSetup && !hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              欢迎使用芥子博客
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              这是您第一次使用本系统，请创建管理员账户来开始使用。
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                系统初始化
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                为了确保系统安全，您需要创建一个管理员账户。该账户将拥有系统的完全访问权限，包括：
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  创建和编辑文章
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  管理分类和标签
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  系统设置和配置
                </li>
              </ul>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateFirstUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  创建管理员账户
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  稍后设置
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                创建账户后，您可以随时在设置中修改账户信息
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 正常渲染子组件
  return <>{children}</>;
};

export default FirstTimeSetup;