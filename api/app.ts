/**
 * This is a API server
 */

import dotenv from 'dotenv';
// 确保在所有其他导入之前加载环境变量
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
// 在CommonJS环境中，__dirname和__filename是全局可用的
// 不需要使用fileURLToPath和import.meta.url

import database from './database/database.js';
import authRoutes from './routes/auth.js';
import articlesRouter from './routes/articles.js';
import categoriesRouter from './routes/categories.js';
import tagsRouter from './routes/tags.js';
import imagesRouter from './routes/images.js';
import settingsRouter from './routes/settings.js';

type Request = import('express').Request;
type Response = import('express').Response;
type NextFunction = import('express').NextFunction;

// 数据库初始化
try {
  database.init();
  console.log('✅ 数据库初始化完成');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
}

const app: import('express').Application = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 必须在API路由之前
// 动态计算uploads目录路径，支持不同的部署环境
const uploadsPath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// 将数据库实例挂载到请求对象
app.use((req: any, res, next) => {
  req.db = database;
  next();
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/settings', settingsRouter);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;
export { database };
