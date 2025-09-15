import dotenv from 'dotenv';
// 确保在加载app之前先加载环境变量
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3001;

// 调试：输出JWT_SECRET是否正确加载
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? '✅ 已设置' : '❌ 未设置');

async function startServer() {
  try {
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 API服务器运行在端口 ${PORT}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

// 将文件转换为模块以避免全局作用域冲突
export {};