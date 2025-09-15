import type { Article, Category, Tag, ArticleStatus } from '../../shared/types';

// API 基础配置
const API_BASE_URL = 'http://localhost:3001/api';

// 通用请求函数
const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  // 获取存储的token
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  // 处理401未授权错误（token过期或无效）
  if (response.status === 401) {
    // 清除无效token
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    // 跳转到登录页面
    window.location.href = '/login';
    throw new Error('Token expired or invalid');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// 文章相关API
export const articlesApi = {
  // 获取文章列表
  getList: async (params: {
    page?: number;
    limit?: number;
    status?: ArticleStatus;
    category_id?: number;
    tag_id?: number;
    search?: string;
    sort?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return request<{ data: any[]; total: number }>(`/articles?${searchParams.toString()}`);
  },

  // 获取单篇文章
  getById: async (id: number) => {
    return request<{ data: any }>(`/articles/${id}`);
  },

  // 创建文章
  create: async (data: Partial<Article>) => {
    return request('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新文章
  update: async (id: number, data: Partial<Article>) => {
    return request(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除文章
  delete: async (id: number) => {
    return request(`/articles/${id}`, {
      method: 'DELETE',
    });
  },

  // 批量删除文章
  batchDelete: async (ids: number[]) => {
    return request('/articles/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  // 批量更新文章状态
  batchUpdateStatus: async (ids: number[], status: ArticleStatus) => {
    return request('/articles/batch-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    });
  },

  // 获取文章统计
  getStats: async (id: number) => {
    return request(`/articles/${id}/stats`);
  },

  // 增加浏览量
  incrementViews: async (id: number) => {
    return request(`/articles/${id}/view`, {
      method: 'POST',
    });
  },
};

// 分类相关 API
export const categoryApi = {
  // 获取分类列表
  getList: async (params: {
    include_count?: boolean;
    search?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return request<any>(`/categories?${searchParams.toString()}`);
  },

  // 获取单个分类
  getById: async (id: number) => {
    return request<any>(`/categories/${id}`);
  },

  // 创建分类
  create: async (data: Partial<Category>) => {
    return request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新分类
  update: async (id: number, data: Partial<Category>) => {
    return request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除分类
  delete: async (id: number) => {
    return request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // 批量更新排序
  batchUpdateSort: async (updates: { id: number; sort_order: number }[]) => {
    return request<any>('/categories/batch-sort', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  },

  // 获取分类统计
  getStats: async (id: number) => {
    return request<any>(`/categories/${id}/stats`);
  },
};

// 标签相关API
export const tagsApi = {
  // 获取所有标签
  getAll: () => request<any>('/tags'),

  // 获取标签列表（带参数）
  getList: (params: { include_count?: boolean } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return request<any>(`/tags?${searchParams.toString()}`);
  },

  // 根据ID获取标签
  getById: (id: string) => request<any>(`/tags/${id}`),

  // 创建标签
  create: (tag: any) => request<any>('/tags', {
    method: 'POST',
    body: JSON.stringify(tag),
  }),

  // 更新标签
  update: (id: string, tag: any) => request<any>(`/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tag),
  }),

  // 删除标签
  delete: (id: string) => request<any>(`/tags/${id}`, {
    method: 'DELETE',
  }),

  // 获取热门标签
  getPopular: (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return request<any>(`/tags/popular${params}`);
  },
};

// 图片相关 API
export const imageApi = {
  // 上传单个图片
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '上传失败' }));
      throw new Error(error.message || '上传失败');
    }

    return response.json();
  },

  // 批量上传图片
  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '上传失败' }));
      throw new Error(error.message || '上传失败');
    }

    return response.json();
  },

  // 获取图片列表
  getList: async (params: {
    article_id?: number;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return request<{ images: any[] }>(`/images?${searchParams.toString()}`);
  },

  // 获取单个图片信息
  getById: async (id: number) => {
    return request(`/images/${id}`);
  },

  // 删除图片
  delete: async (id: number) => {
    return request(`/images/${id}`, {
      method: 'DELETE',
    });
  },

  // 批量删除图片
  batchDelete: async (ids: number[]) => {
    return request('/images/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  // 获取图片统计
  getStats: async () => {
    return request('/images/stats/summary');
  },
};

// 设置相关 API
export const settingsApi = {
  // 获取所有设置
  getAll: async () => {
    return request<any>('/settings');
  },

  // 获取单个设置
  get: async (key: string) => {
    return request<any>(`/settings/${key}`);
  },

  // 更新设置
  update: async (key: string, value: any, description?: string) => {
    return request<any>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description }),
    });
  },

  // 批量更新设置
  batchUpdate: async (settings: Record<string, { value: any; description?: string }>) => {
    return request<any>('/settings/batch-update', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },

  // 数据备份
  backup: async (includeImages: boolean = false) => {
    return request<any>('/settings/backup', {
      method: 'POST',
      body: JSON.stringify({ include_images: includeImages }),
    });
  },

  // 数据恢复
  restore: async (backupFile: string, clearExisting: boolean = false) => {
    return request<any>('/settings/restore', {
      method: 'POST',
      body: JSON.stringify({ backup_file: backupFile, clear_existing: clearExisting }),
    });
  },

  // 文件上传恢复
  restoreFromFile: async (file: File, clearExisting: boolean = false) => {
    const formData = new FormData();
    formData.append('backup', file);
    formData.append('clear_existing', clearExisting.toString());

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/settings/restore`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '恢复失败' }));
      throw new Error(error.message || '恢复失败');
    }

    return response.json();
  },

  // 获取备份文件列表
  getBackups: async () => {
    return request<any>('/settings/backups/list');
  },

  // 删除备份文件
  deleteBackup: async (filename: string) => {
    return request<any>(`/settings/backups/${filename}`, {
      method: 'DELETE',
    });
  },
};

// 导出所有 API
export default {
  articles: articlesApi,
  category: categoryApi,
  tags: tagsApi,
  image: imageApi,
  settings: settingsApi,
};