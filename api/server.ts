import app from './app';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 API服务器已启动，端口: ${PORT}`);
      console.log(`📝 博客API地址: http://localhost:${PORT}/api`);
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