import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Palette, Globe, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { settingsApi } from '../services/api';

interface SystemSettings {
  site_title: string;
  site_description: string;
  author_name: string;
  author_email: string;
  posts_per_page: number;
  enable_comments: boolean;
  auto_backup: boolean;
  backup_interval: number;
}

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings>({
    site_title: '芥子博客',
    site_description: '一个简洁的个人博客',
    author_name: '',
    author_email: '',
    posts_per_page: 10,
    enable_comments: false,
    auto_backup: true,
    backup_interval: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getAll();
      if (data.data) {
        // 从后端嵌套格式中提取value值，转换为前端期望的扁平格式
        const flatSettings: SystemSettings = {
          site_title: data.data.site_title?.value || settings.site_title,
          site_description: data.data.site_description?.value || settings.site_description,
          author_name: data.data.author_name?.value || settings.author_name,
          author_email: data.data.author_email?.value || settings.author_email,
          posts_per_page: Number(data.data.posts_per_page?.value) || settings.posts_per_page,
          enable_comments: Boolean(data.data.enable_comments?.value) || settings.enable_comments,
          auto_backup: Boolean(data.data.auto_backup?.value) || settings.auto_backup,
          backup_interval: Number(data.data.backup_interval?.value) || settings.backup_interval,
        };
        setSettings(flatSettings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // 将设置转换为后端期望的格式
      const settingsData = {
        site_title: { value: settings.site_title },
        site_description: { value: settings.site_description },
        author_name: { value: settings.author_name },
        author_email: { value: settings.author_email },
        posts_per_page: { value: settings.posts_per_page },
        enable_comments: { value: settings.enable_comments },
        auto_backup: { value: settings.auto_backup },
        backup_interval: { value: settings.backup_interval },
      };
      
      await settingsApi.batchUpdate(settingsData);
      alert('设置保存成功');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupStatus('正在备份...');
      const result = await settingsApi.backup(true);
      
      if (result.success && result.data?.backup) {
        // 使用API返回的完整备份数据
        const backupContent = JSON.stringify(result.data.backup, null, 2);
        
        const blob = new Blob([backupContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename || `blog-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setBackupStatus('备份完成');
      } else {
        throw new Error(result.message || '备份失败');
      }
    } catch (error) {
      console.error('备份失败:', error);
      setBackupStatus('备份失败');
    }

    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('恢复数据将覆盖当前所有数据，确定要继续吗？')) {
      return;
    }

    try {
      setBackupStatus('正在恢复...');
      
      const result = await settingsApi.restoreFromFile(file, true);
      
      if (result.success) {
        setBackupStatus('恢复成功');
        // 重新加载设置
        fetchSettings();
      } else {
        throw new Error(result.message || '恢复失败');
      }
    } catch (error) {
      console.error('恢复失败:', error);
      setBackupStatus('恢复失败');
    }

    setTimeout(() => setBackupStatus(''), 3000);
    // 清空文件输入
    event.target.value = '';
  }

  const handleDebugAuth = () => {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');
    const debugText = `Token: ${token ? 'exists' : 'missing'}\nUser Info: ${userInfo ? 'exists' : 'missing'}\nToken Value: ${token || 'null'}\nUser Value: ${userInfo || 'null'}`;
    setDebugInfo(debugText);
    console.log('Debug Auth Info:', { token, userInfo });
  };

  const handleTestAPI = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ test: 'data' })
      });
      const result = await response.text();
      setDebugInfo(`API Test Result: ${response.status} - ${result}`);
    } catch (error) {
      setDebugInfo(`API Test Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          系统设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          配置博客的基本信息和系统参数
        </p>
      </div>

      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              站点信息
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                站点标题
              </label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) => setSettings(prev => ({ ...prev, site_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每页文章数
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.posts_per_page}
                onChange={(e) => setSettings(prev => ({ ...prev, posts_per_page: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                站点描述
              </label>
              <textarea
                value={settings.site_description}
                onChange={(e) => setSettings(prev => ({ ...prev, site_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 作者信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              作者信息
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                作者姓名
              </label>
              <input
                type="text"
                value={settings.author_name}
                onChange={(e) => setSettings(prev => ({ ...prev, author_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                作者邮箱
              </label>
              <input
                type="email"
                value={settings.author_email}
                onChange={(e) => setSettings(prev => ({ ...prev, author_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 外观设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              外观设置
            </h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主题模式
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">浅色模式</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">深色模式</span>
              </label>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              数据管理
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  数据备份
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  导出所有博客数据到本地文件
                </p>
              </div>
              <button
                onClick={handleBackup}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                备份数据
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  数据恢复
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  从备份文件恢复博客数据
                </p>
              </div>
              <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                恢复数据
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                />
              </label>
            </div>
            
            {backupStatus && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {backupStatus}
              </div>
            )}
          </div>
        </div>

        {/* 调试区域 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 shadow-sm border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
              调试工具 (临时)
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleDebugAuth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                检查认证状态
              </button>
              <button
                onClick={handleTestAPI}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                测试API调用
              </button>
            </div>
            
            {debugInfo && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {debugInfo}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;