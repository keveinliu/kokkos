import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Eye, Tag, Plus, Filter } from 'lucide-react';
import type { Article, Category, Tag as TagType } from '../../shared/types';
import { articlesApi, categoryApi, tagsApi, settingsApi } from '../services/api';

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [siteDescription, setSiteDescription] = useState('记录生活，分享思考');
  const [siteTitle, setSiteTitle] = useState('芥子博客');

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, selectedCategory, selectedTag, searchTerm, postsPerPage]);

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      if (response.success && response.data) {
        const postsPerPageSetting = response.data.posts_per_page;
        if (postsPerPageSetting && postsPerPageSetting.value) {
          setPostsPerPage(parseInt(postsPerPageSetting.value) || 10);
        }
        
        const siteDescriptionSetting = response.data.site_description;
        if (siteDescriptionSetting && siteDescriptionSetting.value) {
          setSiteDescription(siteDescriptionSetting.value);
        }
        
        const siteTitleSetting = response.data.site_title;
        if (siteTitleSetting && siteTitleSetting.value) {
          setSiteTitle(siteTitleSetting.value);
        }
      }
    } catch (error) {
      console.error('获取设置失败:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: postsPerPage,
        status: 'published',
        sort: 'created_at',
        order: 'DESC', // 按创建时间倒序排列
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedTag) params.tag_id = selectedTag;
      
      const data = await articlesApi.getList(params);
      setArticles(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / postsPerPage));
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getList({ include_count: true });
      setCategories(data.data || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await tagsApi.getList({ include_count: true });
      setTags(data.data || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleTagFilter = (tagId: number | null) => {
    setSelectedTag(tagId);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {siteTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {siteDescription}
          </p>
        </div>
        <Link
          to="/edit"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          写文章
        </Link>
      </div>

      <div className="flex gap-6">
        {/* 主内容区 */}
        <div className="flex-1">
          {/* 搜索栏 */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* 过滤器 */}
          {(selectedCategory || selectedTag || searchTerm) && (
            <div className="mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">当前过滤:</span>
              {selectedCategory && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedTag && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  {tags.find(t => t.id === selectedTag)?.name}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                  "{searchTerm}"
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                清除过滤
              </button>
            </div>
          )}

          {/* 文章列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || selectedCategory || selectedTag ? '没有找到匹配的文章' : '还没有文章'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || selectedCategory || selectedTag ? '尝试调整搜索条件' : '开始写第一篇文章吧'}
              </p>
              <Link
                to="/edit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                写文章
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      to={`/article/${article.id}`}
                      className="flex-1"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {article.title}
                      </h2>
                    </Link>
                    {article.is_featured && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                        精选
                      </span>
                    )}
                  </div>
                  
                  {article.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {truncateText(article.excerpt, 200)}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(article.published_at || article.created_at)}
                      </div>
                      
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {article.view_count}
                      </div>
                      
                      {article.category && (
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: article.category.color + '20',
                            color: article.category.color 
                          }}
                        >
                          {article.category.name}
                        </span>
                      )}
                    </div>
                    
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: tag.color + '20',
                              color: tag.color 
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="w-80 space-y-6">
          {/* 分类 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              分类
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 标签 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagFilter(selectedTag === tag.id ? null : tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag.id
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: selectedTag === tag.id ? tag.color : tag.color + '20',
                    color: selectedTag === tag.id ? 'white' : tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;