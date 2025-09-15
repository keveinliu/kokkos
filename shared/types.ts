// 共享类型定义

// 文章状态
export type ArticleStatus = 'draft' | 'published' | 'archived';

// 分类接口
export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// 标签接口
export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

// 文章接口
export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  category_id?: number;
  status: ArticleStatus;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // 关联数据
  category?: Category;
  tags?: Tag[];
  images?: Image[];
}

// 文章列表项（用于列表显示）
export interface ArticleListItem {
  id: number;
  title: string;
  excerpt?: string;
  category?: Category;
  tags?: Tag[];
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// 图片接口
export interface Image {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  article_id?: number;
  created_at: string;
}

// 系统设置接口
export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页接口
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// 文章查询参数
export interface ArticleQuery {
  page?: number;
  limit?: number;
  category_id?: number;
  tag_id?: number;
  status?: ArticleStatus;
  search?: string;
  is_featured?: boolean;
  sort?: 'created_at' | 'updated_at' | 'view_count' | 'title';
  order?: 'ASC' | 'DESC';
}

// 文章创建/更新数据
export interface ArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  category_id?: number;
  status?: ArticleStatus;
  is_featured?: boolean;
  tag_ids?: number[];
}

// 分类创建/更新数据
export interface CategoryInput {
  name: string;
  description?: string;
  color?: string;
}

// 标签创建/更新数据
export interface TagInput {
  name: string;
  color?: string;
}

// 文件上传响应
export interface UploadResponse {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  url: string; // 访问URL
}

// 备份信息
export interface BackupInfo {
  filename: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

// 统计信息
export interface Statistics {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_categories: number;
  total_tags: number;
  total_images: number;
  total_views: number;
}

// 主题配置
export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
}

// 应用配置
export interface AppConfig {
  site_title: string;
  site_description: string;
  posts_per_page: number;
  theme: ThemeConfig;
  backup_enabled: boolean;
  backup_interval: number;
}