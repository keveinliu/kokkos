import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Upload, Image as ImageIcon, FolderOpen } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { toast } from 'sonner';
import type { Article, Category, Tag, ArticleInput } from '../../shared/types';
import { articleApi, categoryApi, tagApi, imageApi } from '../services/api';
import ImageManager from '../components/ImageManager';

const ArticleEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [article, setArticle] = useState<ArticleInput>({
    title: '',
    content: '',
    excerpt: '',
    category_id: undefined,
    status: 'draft',
    is_featured: false,
    tag_ids: [],
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (isEditing && id) {
      fetchArticle(id);
    }
  }, [id, isEditing]);

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const data = await articleApi.getById(parseInt(articleId));
      const articleData = data.data;
      setArticle({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt || '',
        category_id: articleData.category_id,
        status: articleData.status,
        is_featured: articleData.is_featured,
      });
      setSelectedTags(articleData.tags?.map((tag: Tag) => tag.id) || []);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getList();
      setCategories(data.data || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await tagApi.getList();
      setTags(data.data || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!article.title.trim() || !article.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...article,
        status,
        tag_ids: selectedTags,
      };

      let data;
      if (isEditing && id) {
        data = await articleApi.update(parseInt(id), payload);
        // 更新成功后显示成功提示并跳转
        alert('文章更新成功！');
        navigate(`/article/${id}`);
      } else {
        data = await articleApi.create(payload);
        // 创建成功后跳转到新文章页面
        navigate(`/article/${data.data.id}`);
      }
    } catch (error) {
      console.error('保存文章失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理图片上传
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await imageApi.upload(file);
      return result.data.url;
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败');
      throw error;
    }
  };

  // 处理图片文件选择
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await handleImageUpload(file);
      
      // 插入图片到编辑器
       const imageMarkdown = `![${file.name}](${imageUrl})`;
       const newContent = article.content + '\n\n' + imageMarkdown;
       setArticle(prev => ({ ...prev, content: newContent }));
      
      toast.success('图片上传成功');
    } catch (error) {
      // 错误已在handleImageUpload中处理
    } finally {
      setIsUploadingImage(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 触发文件选择
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSelectImageFromManager = (imageUrl: string) => {
    if (article.content) {
      const imageMarkdown = `![图片](${imageUrl})`;
      setArticle(prev => ({ ...prev, content: prev.content + '\n\n' + imageMarkdown }));
      toast.success('图片已插入到编辑器');
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('请拖拽图片文件');
      return;
    }

    // 处理第一个图片文件
    const file = imageFiles[0];
    
    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await handleImageUpload(file);
      
      // 插入图片到编辑器
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      const newContent = article.content + '\n\n' + imageMarkdown;
      setArticle(prev => ({ ...prev, content: newContent }));
      
      toast.success('图片上传成功');
    } catch (error) {
      // 错误已在handleImageUpload中处理
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  const createNewTag = async (tagName: string) => {
    if (!tagName.trim()) return;
    
    try {
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tagName.trim(),
          color: randomColor
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 创建完整的标签对象
          const newTag = {
            id: result.data.id,
            name: tagName.trim(),
            color: randomColor,
            description: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setTags(prev => [...prev, newTag]);
          setSelectedTags(prev => [...prev, newTag.id]);
          setNewTagName('');
        }
      }
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createNewTag(newTagName);
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
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? '编辑文章' : '新建文章'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={triggerImageUpload}
            disabled={isUploadingImage}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="上传图片"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {isUploadingImage ? '上传中...' : '插入图片'}
          </button>
          
          <button
            onClick={() => setShowImageManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            图片管理
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '发布中...' : '发布'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧编辑区 */}
        <div className="flex-1 flex flex-col">
          {/* 文章信息 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <input
              type="text"
              placeholder="请输入文章标题..."
              value={article.title}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            <textarea
              placeholder="文章摘要（可选）..."
              value={article.excerpt}
              onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
              className="w-full mt-3 bg-transparent border-none outline-none resize-none text-gray-600 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-400"
              rows={2}
            />
          </div>
          
          {/* Markdown编辑器 */}
          <div className="flex-1 overflow-hidden">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative"
            >
              <MDEditor
                value={article.content}
                onChange={(val) => setArticle(prev => ({ ...prev, content: val || '' }))}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{
                  placeholder: '开始写作...（支持拖拽图片上传）',
                  style: {
                    fontSize: 16,
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                  },
                }}
                height={400}
              />
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                  <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Upload className="w-4 h-4 animate-spin" />
                    <span>正在上传图片...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧设置面板 */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分类
              </label>
              <select
                value={article.category_id || ''}
                onChange={(e) => setArticle(prev => ({ 
                  ...prev, 
                  category_id: e.target.value ? Number(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">选择分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </label>
              
              {/* 已选择的标签 */}
              {selectedTags.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">已选择的标签:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tag.id}
                                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="ml-2 text-blue-200 hover:text-white transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {/* 新标签输入框 */}
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="输入新标签名称，按回车创建"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => createNewTag(newTagName)}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
              
              {/* 现有标签选择 */}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">选择现有标签:</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 其他设置 */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={article.is_featured}
                  onChange={(e) => setArticle(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">设为精选文章</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* 图片管理器 */}
      <ImageManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        onSelectImage={handleSelectImageFromManager}
      />
    </div>
  );
};

export default ArticleEdit;