import type { Article, Category, Tag, ArticleStatus } from '../../shared/types';

// API 基础配置
const API_BASE_URL = 'http://localhost:3001/api';

// 通用请求函数
const request = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
};

// 文章相关 API
export const articleApi = {
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
    
    return request(`/articles?${searchParams.toString()}`);
  },

  // 获取单篇文章
  getById: async (id: number) => {
    return request(`/articles/${id}`);
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
    
    return request(`/categories?${searchParams.toString()}`);
  },

  // 获取单个分类
  getById: async (id: number) => {
    return request(`/categories/${id}`);
  },

  // 创建分类
  create: async (data: Partial<Category>) => {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新分类
  update: async (id: number, data: Partial<Category>) => {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除分类
  delete: async (id: number) => {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // 批量更新排序
  batchUpdateSort: async (updates: { id: number; sort_order: number }[]) => {
    return request('/categories/batch-sort', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  },

  // 获取分类统计
  getStats: async (id: number) => {
    return request(`/categories/${id}/stats`);
  },
};

// 标签相关 API
export const tagApi = {
  // 获取标签列表
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
    
    return request(`/tags?${searchParams.toString()}`);
  },

  // 获取单个标签
  getById: async (id: number) => {
    return request(`/tags/${id}`);
  },

  // 创建标签
  create: async (data: Partial<Tag>) => {
    return request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新标签
  update: async (id: number, data: Partial<Tag>) => {
    return request(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除标签
  delete: async (id: number) => {
    return request(`/tags/${id}`, {
      method: 'DELETE',
    });
  },

  // 批量删除标签
  batchDelete: async (ids: number[]) => {
    return request('/tags/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  // 获取标签统计
  getStats: async (id: number) => {
    return request(`/tags/${id}/stats`);
  },

  // 获取热门标签
  getPopular: async (limit: number = 10) => {
    return request(`/tags/popular/list?limit=${limit}`);
  },

  // 搜索标签
  search: async (keyword: string, limit: number = 20) => {
    return request(`/tags/search/${encodeURIComponent(keyword)}?limit=${limit}`);
  },
};

// 图片相关 API
export const imageApi = {
  // 上传单个图片
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
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
    
    const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
      method: 'POST',
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
    page?: number;
    limit?: number;
    search?: string;
    mime_type?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return request(`/images?${searchParams.toString()}`);
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
    return request('/settings');
  },

  // 获取单个设置
  get: async (key: string) => {
    return request(`/settings/${key}`);
  },

  // 更新设置
  update: async (key: string, value: any, description?: string) => {
    return request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description }),
    });
  },

  // 批量更新设置
  batchUpdate: async (settings: Record<string, { value: any; description?: string }>) => {
    return request('/settings/batch-update', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },

  // 数据备份
  backup: async (includeImages: boolean = false) => {
    return request('/settings/backup', {
      method: 'POST',
      body: JSON.stringify({ include_images: includeImages }),
    });
  },

  // 数据恢复
  restore: async (backupFile: string, clearExisting: boolean = false) => {
    return request('/settings/restore', {
      method: 'POST',
      body: JSON.stringify({ backup_file: backupFile, clear_existing: clearExisting }),
    });
  },

  // 获取备份文件列表
  getBackups: async () => {
    return request('/settings/backups/list');
  },

  // 删除备份文件
  deleteBackup: async (filename: string) => {
    return request(`/settings/backups/${filename}`, {
      method: 'DELETE',
    });
  },
};

// 导出所有 API
export default {
  article: articleApi,
  category: categoryApi,
  tag: tagApi,
  image: imageApi,
  settings: settingsApi,
};