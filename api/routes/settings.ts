import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { promisify } from 'util';
import database from '../database/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// 配置 multer 使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JSON 文件'));
    }
  }
});

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const db = (req as any).db;
    const settings = await db.all('SELECT * FROM settings ORDER BY key ASC');
    
    // 转换为键值对格式
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      let value = setting.value;
      
      // 尝试解析 JSON 值
      if (setting.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          // 如果解析失败，保持原值
        }
      } else if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'number') {
        value = Number(value);
      }
      
      acc[setting.key] = {
        value,
        type: setting.type,
        description: setting.description,
        updated_at: setting.updated_at
      };
      return acc;
    }, {});

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 获取单个设置
router.get('/:key', async (req, res) => {
  try {
    const db = (req as any).db;
    const { key } = req.params;

    const setting = await db.get('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (!setting) {
      return res.status(404).json({ success: false, message: '设置项不存在' });
    }

    let value = setting.value;
    
    // 根据类型转换值
    if (setting.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        // 如果解析失败，保持原值
      }
    } else if (setting.type === 'boolean') {
      value = value === 'true';
    } else if (setting.type === 'number') {
      value = Number(value);
    }

    res.json({
      success: true,
      data: {
        key: setting.key,
        value,
        type: setting.type,
        description: setting.description,
        updated_at: setting.updated_at
      }
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 更新设置
router.put('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { key } = req.params;
    const { value, description } = req.body;

    // 检查设置是否存在
    const existingSetting = await db.get('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (!existingSetting) {
      return res.status(404).json({ success: false, message: '设置项不存在' });
    }

    // 根据类型处理值
    let processedValue = value;
    if (existingSetting.type === 'json') {
      processedValue = typeof value === 'string' ? value : JSON.stringify(value);
    } else if (existingSetting.type === 'boolean') {
      processedValue = Boolean(value).toString();
    } else if (existingSetting.type === 'number') {
      processedValue = Number(value).toString();
    } else {
      processedValue = String(value);
    }

    const now = new Date().toISOString();
    await db.run(`
      UPDATE settings SET
        value = ?,
        description = COALESCE(?, description),
        updated_at = ?
      WHERE key = ?
    `, [processedValue, description, now, key]);

    res.json({ success: true, message: '设置更新成功' });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ success: false, message: '更新设置失败' });
  }
});

// 批量更新设置
router.post('/batch-update', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: '参数无效' });
    }

    const now = new Date().toISOString();
    
    // 使用事务处理批量更新
    await db.run('BEGIN TRANSACTION');

    try {
      for (const [key, data] of Object.entries(settings)) {
        const { value, description } = data as any;
        
        // 检查设置是否存在
        const existingSetting = await db.get('SELECT * FROM settings WHERE key = ?', [key]);
        
        if (existingSetting) {
          // 根据类型处理值
          let processedValue = value;
          if (existingSetting.type === 'json') {
            processedValue = typeof value === 'string' ? value : JSON.stringify(value);
          } else if (existingSetting.type === 'boolean') {
            processedValue = Boolean(value).toString();
          } else if (existingSetting.type === 'number') {
            processedValue = Number(value).toString();
          } else {
            processedValue = String(value);
          }

          await db.run(`
            UPDATE settings SET
              value = ?,
              description = COALESCE(?, description),
              updated_at = ?
            WHERE key = ?
          `, [processedValue, description, now, key]);
        }
      }

      await db.run('COMMIT');
      res.json({ success: true, message: '设置批量更新成功' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('批量更新设置失败:', error);
    res.status(500).json({ success: false, message: '批量更新设置失败' });
  }
});

// 数据备份
router.post('/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { include_images = false } = req.body;
    
    // 确保备份目录存在
    const backupDir = process.env.BACKUPS_PATH || path.join(process.cwd(), 'backups');
    try {
      await stat(backupDir);
    } catch {
      await mkdir(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    // 导出所有数据
    const backupData: any = {
      articles: await db.all('SELECT * FROM articles ORDER BY id'),
      categories: await db.all('SELECT * FROM categories ORDER BY id'),
      tags: await db.all('SELECT * FROM tags ORDER BY id'),
      article_tags: await db.all('SELECT * FROM article_tags ORDER BY article_id, tag_id'),
      settings: await db.all('SELECT * FROM settings ORDER BY key'),
    };

    // 如果包含图片，也导出图片信息
    if (include_images) {
      backupData.images = await db.all('SELECT * FROM images ORDER BY id');
    }

    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: backupData,
    };

    // 写入备份文件
    await writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');

    // 设置响应头，让浏览器下载文件
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
    
    // 直接返回备份数据供下载
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('数据备份失败:', error);
    res.status(500).json({ success: false, message: '数据备份失败' });
  }
});

// 数据恢复
router.post('/restore', authenticateToken, requireRole(['admin']), upload.single('backup'), async (req, res) => {
  try {
    const db = (req as any).db;
    const file = req.file;
    const { clear_existing = true } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }

    // 解析上传的JSON文件
    let backup;
    try {
      const backupContent = file.buffer.toString('utf8');
      backup = JSON.parse(backupContent);
    } catch (error) {
      return res.status(400).json({ success: false, message: '备份文件格式无效' });
    }

    if (!backup.data) {
      return res.status(400).json({ success: false, message: '备份文件格式错误' });
    }

    // 使用事务处理恢复
    await db.run('BEGIN TRANSACTION');

    try {
      // 如果需要清除现有数据
      if (clear_existing) {
        await db.run('DELETE FROM article_tags');
        await db.run('DELETE FROM articles');
        await db.run('DELETE FROM categories');
        await db.run('DELETE FROM tags');
        if (backup.data.images) {
          await db.run('DELETE FROM images');
        }
        // 不删除 settings，而是更新
      }

      // 恢复分类
      if (backup.data.categories && backup.data.categories.length > 0) {
        for (const category of backup.data.categories) {
          await db.run(`
            INSERT OR REPLACE INTO categories 
            (id, name, description, color, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            category.id, category.name, category.description, category.color,
            category.sort_order, category.created_at, category.updated_at
          ]);
        }
      }

      // 恢复标签
      if (backup.data.tags) {
        for (const tag of backup.data.tags) {
          await db.run(`
            INSERT OR REPLACE INTO tags 
            (id, name, description, color, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            tag.id, tag.name, tag.description, tag.color,
            tag.created_at, tag.updated_at
          ]);
        }
      }

      // 恢复文章
      if (backup.data.articles) {
        for (const article of backup.data.articles) {
          await db.run(`
            INSERT OR REPLACE INTO articles 
            (id, title, content, excerpt, status, category_id, view_count, 
             is_featured, meta_title, meta_description, slug, created_at, updated_at, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            article.id, article.title, article.content, article.excerpt,
            article.status, article.category_id, article.view_count,
            article.is_featured, article.meta_title, article.meta_description,
            article.slug, article.created_at, article.updated_at, article.published_at
          ]);
        }
      }

      // 恢复文章标签关联
      if (backup.data.article_tags) {
        for (const articleTag of backup.data.article_tags) {
          await db.run(`
            INSERT OR REPLACE INTO article_tags (article_id, tag_id)
            VALUES (?, ?)
          `, [articleTag.article_id, articleTag.tag_id]);
        }
      }

      // 恢复图片（如果有）
      if (backup.data.images) {
        for (const image of backup.data.images) {
          await db.run(`
            INSERT OR REPLACE INTO images 
            (id, filename, original_name, file_path, file_size, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            image.id, image.filename, image.original_name, image.file_path,
            image.file_size, image.mime_type, image.created_at
          ]);
        }
      }

      // 恢复设置
        if (backup.data.settings && backup.data.settings.length > 0) {
          for (const setting of backup.data.settings) {
            // 只恢复数据库表中存在的字段
            await db.run(
              'INSERT OR REPLACE INTO settings (key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
              [setting.key, setting.value, setting.description || null, setting.created_at, setting.updated_at]
            );
          }
        }

        await db.run('COMMIT');
        res.json({ success: true, message: '数据恢复成功' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('数据恢复失败:', error);
    res.status(500).json({ success: false, message: '数据恢复失败' });
  }
});

// 获取备份文件列表
router.get('/backups/list', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const backupDir = process.env.BACKUPS_PATH || path.join(process.cwd(), 'backups');
    
    try {
      await stat(backupDir);
    } catch {
      return res.json({ success: true, data: [] });
    }

    const fs = require('fs');
    const files = fs.readdirSync(backupDir)
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created_at: stats.birthtime.toISOString(),
          modified_at: stats.mtime.toISOString()
        };
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, data: files });
  } catch (error) {
    console.error('获取备份文件列表失败:', error);
    res.status(500).json({ success: false, message: '获取备份文件列表失败' });
  }
});

// 下载备份文件
router.get('/backups/download/:filename', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.env.BACKUPS_PATH || path.join(process.cwd(), 'backups'), filename);
    
    // 检查文件是否存在
    try {
      await stat(backupPath);
    } catch {
      return res.status(404).json({ success: false, message: '备份文件不存在' });
    }

    // 设置响应头，让浏览器下载文件
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 读取并发送文件内容
    const { readFile } = require('fs').promises;
    const fileContent = await readFile(backupPath, 'utf8');
    
    res.send(fileContent);
  } catch (error) {
    console.error('下载备份文件失败:', error);
    res.status(500).json({ success: false, message: '下载备份文件失败' });
  }
});

// 删除备份文件
router.delete('/backups/:filename', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.env.BACKUPS_PATH || path.join(process.cwd(), 'backups'), filename);
    
    // 检查文件是否存在
    try {
      await stat(backupPath);
    } catch {
      return res.status(404).json({ success: false, message: '备份文件不存在' });
    }

    // 删除文件
    const unlink = promisify(fs.unlink);
    await unlink(backupPath);

    res.json({ success: true, message: '备份文件删除成功' });
  } catch (error) {
    console.error('删除备份文件失败:', error);
    res.status(500).json({ success: false, message: '删除备份文件失败' });
  }
});

export default router;