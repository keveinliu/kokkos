const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4173;
const API_PORT = process.env.API_PORT || 3001;

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  next();
});

// API代理中间件 - 手动代理实现
app.use('/api', (req, res, next) => {
  console.log(`[API] 处理API请求: ${req.method} ${req.originalUrl}`);
  
  const http = require('http');
  const url = require('url');
  
  // 构建目标URL - 保持完整的API路径
  const fullPath = req.originalUrl || req.url;
  const targetUrl = `http://localhost:${API_PORT}${fullPath}`;
  console.log(`[PROXY] 转发到: ${targetUrl}`);
  
  // 确保路径正确
  if (!fullPath.startsWith('/api')) {
    return res.status(400).json({ error: 'Invalid API path' });
  }
  
  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path: fullPath,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[PROXY] 收到响应: ${proxyRes.statusCode}`);
    
    // 设置响应头
    res.status(proxyRes.statusCode);
    Object.keys(proxyRes.headers).forEach(key => {
      res.set(key, proxyRes.headers[key]);
    });
    
    // 转发响应数据
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[PROXY] 请求错误:', err.message);
    res.status(500).json({ error: 'Proxy request failed' });
  });
  
  // 转发请求体
  req.pipe(proxyReq);
});

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')));

// 处理SPA路由 - 只处理非API请求
app.get('*', (req, res) => {
  // 确保不拦截API请求
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`前端服务器运行在 http://localhost:${PORT}`);
  console.log('静态文件目录: dist/');
  console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});