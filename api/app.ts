/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { join } from 'path';
import multer from 'multer';

// CommonJS模块中__dirname已经可用
import database from './database/database';
import authRoutes from './routes/auth.js';
import articlesRouter from './routes/articles';
import categoriesRouter from './routes/categories';
import tagsRouter from './routes/tags';
import imagesRouter from './routes/images';
import settingsRouter from './routes/settings';

// load env
dotenv.config();

// 数据库初始化
database.init().then(() => {
  console.log('✅ 数据库初始化完成');
}).catch((error) => {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
});

const app: express.Application = express();

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
export { database as db };
export { app as createApp };
