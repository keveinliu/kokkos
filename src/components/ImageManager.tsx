import React, { useState, useEffect } from 'react';
import { X, Trash2, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { imageApi } from '../services/api';

interface Image {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

interface ImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string) => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({ isOpen, onClose, onSelectImage }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageApi.getList();
      setImages(response.images || []);
    } catch (error) {
      console.error('Failed to load images:', error);
      toast.error('加载图片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      await imageApi.delete(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('图片删除成功');
    } catch (error) {
      console.error('删除图片失败:', error);
      toast.error('删除图片失败');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('图片链接已复制');
  };

  const handleSelectImage = (image: Image) => {
    if (onSelectImage) {
      onSelectImage(image.url);
      onClose();
    } else {
      setSelectedImage(image);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">图片管理</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 图片列表 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">暂无图片</div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectImage(image)}
                  >
                    <div className="aspect-square">
                      <img
                        src={image.url}
                        alt={image.original_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* 悬浮操作按钮 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(image.url);
                          }}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                          title="复制链接"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                          className="p-2 bg-white rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 图片信息 */}
                    <div className="p-2">
                      <div className="text-sm font-medium truncate" title={image.original_name}>
                        {image.original_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(image.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 图片预览 */}
          {selectedImage && (
            <div className="w-1/3 border-l bg-gray-50 p-4">
              <div className="mb-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.original_name}
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">文件名：</span>
                  <span className="text-gray-600">{selectedImage.original_name}</span>
                </div>
                <div>
                  <span className="font-medium">大小：</span>
                  <span className="text-gray-600">{formatFileSize(selectedImage.size)}</span>
                </div>
                <div>
                  <span className="font-medium">类型：</span>
                  <span className="text-gray-600">{selectedImage.mime_type}</span>
                </div>
                <div>
                  <span className="font-medium">上传时间：</span>
                  <span className="text-gray-600">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleCopyUrl(selectedImage.url)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  复制链接
                </button>
                
                {onSelectImage && (
                  <button
                    onClick={() => {
                      onSelectImage(selectedImage.url);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    选择此图片
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageManager;