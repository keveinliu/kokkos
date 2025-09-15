import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';

const router = express.Router();
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// 配置 multer 使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp, svg)'));
    }
  }
});

// 确保上传目录存在
const ensureUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const imagesDir = path.join(uploadDir, 'images');
  
  try {
    await stat(uploadDir);
  } catch {
    await mkdir(uploadDir, { recursive: true });
  }
  
  try {
    await stat(imagesDir);
  } catch {
    await mkdir(imagesDir, { recursive: true });
  }
  
  return imagesDir;
};

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}_${hash}${ext}`;
};

// 上传单个图片
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const db = (req as any).db;
    const imagesDir = await ensureUploadDir();
    const fileName = generateFileName(req.file.originalname);
    const filePath = path.join(imagesDir, fileName);
    const relativePath = `/uploads/images/${fileName}`;

    // 保存文件到磁盘
    await writeFile(filePath, req.file.buffer);

    // 保存文件信息到数据库
    const now = new Date().toISOString();
    const result = await db.run(`
      INSERT INTO images (
        filename, original_name, file_path, file_size, mime_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      fileName,
      req.file.originalname,
      relativePath,
      req.file.size,
      req.file.mimetype,
      now
    ]);

    const imageData = {
      id: result.lastID,
      filename: fileName,
      original_name: req.file.originalname,
      file_path: relativePath,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      url: relativePath,
      created_at: now
    };

    res.status(201).json({
      success: true,
      data: imageData,
      message: '图片上传成功'
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({ success: false, message: '图片上传失败' });
  }
});

// 批量上传图片
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const db = (req as any).db;
    const imagesDir = await ensureUploadDir();
    const uploadedImages = [];
    const now = new Date().toISOString();

    // 使用事务处理批量上传
    await db.run('BEGIN TRANSACTION');

    try {
      for (const file of files) {
        const fileName = generateFileName(file.originalname);
        const filePath = path.join(imagesDir, fileName);
        const relativePath = `/uploads/images/${fileName}`;

        // 保存文件到磁盘
        await writeFile(filePath, file.buffer);

        // 保存文件信息到数据库
        const result = await db.run(`
          INSERT INTO images (
            filename, original_name, file_path, file_size, mime_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          fileName,
          file.originalname,
          relativePath,
          file.size,
          file.mimetype,
          now
        ]);

        uploadedImages.push({
          id: result.lastID,
          filename: fileName,
          original_name: file.originalname,
          file_path: relativePath,
          file_size: file.size,
          mime_type: file.mimetype,
          url: relativePath,
          created_at: now
        });
      }

      await db.run('COMMIT');
      
      res.status(201).json({
        success: true,
        data: uploadedImages,
        message: `成功上传 ${uploadedImages.length} 张图片`
      });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('批量上传图片失败:', error);
    res.status(500).json({ success: false, message: '批量上传图片失败' });
  }
});

// 获取图片列表
router.get('/', async (req, res) => {
  try {
    const db = (req as any).db;
    const {
      page = 1,
      limit = 20,
      search,
      mime_type
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (original_name LIKE ? OR filename LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (mime_type) {
      whereClause += ' AND mime_type LIKE ?';
      params.push(`${mime_type}%`);
    }

    const query = `
      SELECT * FROM images
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), offset);
    const images = await db.all(query, params);

    // 为每个图片添加完整的 URL
    images.forEach((image: any) => {
      image.url = image.file_path;
    });

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM images ${whereClause}`;
    const countParams = params.slice(0, -2); // 移除 limit 和 offset
    const totalResult = await db.get(countQuery, countParams);
    const total = totalResult.total;

    res.json({
      success: true,
      data: images,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ success: false, message: '获取图片列表失败' });
  }
});

// 获取单个图片信息
router.get('/:id', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    const image = await db.get('SELECT * FROM images WHERE id = ?', [id]);
    
    if (!image) {
      return res.status(404).json({ success: false, message: '图片不存在' });
    }

    image.url = image.file_path;

    res.json({ success: true, data: image });
  } catch (error) {
    console.error('获取图片信息失败:', error);
    res.status(500).json({ success: false, message: '获取图片信息失败' });
  }
});

// 删除图片
router.delete('/:id', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    // 获取图片信息
    const image = await db.get('SELECT * FROM images WHERE id = ?', [id]);
    
    if (!image) {
      return res.status(404).json({ success: false, message: '图片不存在' });
    }

    // 删除物理文件
    const fullPath = path.join(process.cwd(), 'uploads', 'images', image.filename);
    try {
      await unlink(fullPath);
    } catch (error) {
      console.warn('删除物理文件失败:', error);
      // 继续删除数据库记录，即使物理文件删除失败
    }

    // 删除数据库记录
    await db.run('DELETE FROM images WHERE id = ?', [id]);

    res.json({ success: true, message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ success: false, message: '删除图片失败' });
  }
});

// 批量删除图片
router.post('/batch-delete', async (req, res) => {
  try {
    const db = (req as any).db;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '参数无效' });
    }

    // 获取要删除的图片信息
    const placeholders = ids.map(() => '?').join(',');
    const images = await db.all(`SELECT * FROM images WHERE id IN (${placeholders})`, ids);

    // 删除物理文件
    for (const image of images) {
      const fullPath = path.join(process.cwd(), 'uploads', 'images', image.filename);
      try {
        await unlink(fullPath);
      } catch (error) {
        console.warn(`删除物理文件失败: ${image.filename}`, error);
      }
    }

    // 删除数据库记录
    await db.run(`DELETE FROM images WHERE id IN (${placeholders})`, ids);

    res.json({ success: true, message: `成功删除 ${images.length} 张图片` });
  } catch (error) {
    console.error('批量删除图片失败:', error);
    res.status(500).json({ success: false, message: '批量删除图片失败' });
  }
});

// 获取图片统计信息
router.get('/stats/summary', async (req, res) => {
  try {
    const db = (req as any).db;

    const stats = {
      total_images: 0,
      total_size: 0,
      by_type: {},
      recent_uploads: []
    };

    // 总数和总大小
    const totalStats = await db.get(`
      SELECT 
        COUNT(*) as total_images,
        SUM(file_size) as total_size
      FROM images
    `);
    
    stats.total_images = totalStats.total_images;
    stats.total_size = totalStats.total_size || 0;

    // 按类型统计
    const typeStats = await db.all(`
      SELECT 
        mime_type,
        COUNT(*) as count,
        SUM(file_size) as size
      FROM images
      GROUP BY mime_type
      ORDER BY count DESC
    `);
    
    stats.by_type = typeStats.reduce((acc: any, stat: any) => {
      acc[stat.mime_type] = {
        count: stat.count,
        size: stat.size
      };
      return acc;
    }, {});

    // 最近上传
    const recentUploads = await db.all(`
      SELECT id, filename, original_name, file_size, created_at
      FROM images
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    stats.recent_uploads = recentUploads;

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取图片统计失败:', error);
    res.status(500).json({ success: false, message: '获取图片统计失败' });
  }
});

export default router;