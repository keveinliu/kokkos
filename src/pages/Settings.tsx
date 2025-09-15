import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Palette, Globe, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
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
      
      const response = await fetch('/api/settings/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsData }),
      });

      if (response.ok) {
        alert('设置保存成功');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存失败');
      }
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
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          include_images: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 创建下载链接
          const backupContent = JSON.stringify({
            version: '1.0.0',
            timestamp: result.meta?.timestamp || new Date().toISOString(),
            data: result.data || {}
          }, null, 2);
          
          const blob = new Blob([backupContent], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.meta?.filename || `blog-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setBackupStatus('备份完成');
        } else {
          throw new Error(result.message || '备份失败');
        }
      } else {
        throw new Error('备份失败');
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
      const formData = new FormData();
      formData.append('backup', file);

      const response = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setBackupStatus('恢复完成，请重启应用');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('恢复失败');
      }
    } catch (error) {
      console.error('恢复失败:', error);
      setBackupStatus('恢复失败');
    }

    // 清空文件输入
    event.target.value = '';
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