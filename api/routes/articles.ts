import express from 'express';
import type { Article, ArticleStatus } from '../../shared/types';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// 获取文章列表
router.get('/', async (req, res) => {
  try {
    const db = (req as any).db;
    const {
      page = 1,
      limit = 10,
      status,
      category_id,
      tag_id,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (category_id) {
      whereClause += ' AND a.category_id = ?';
      params.push(Number(category_id));
    }

    if (tag_id) {
      whereClause += ' AND a.id IN (SELECT article_id FROM article_tags WHERE tag_id = ?)';
      params.push(Number(tag_id));
    }

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.content LIKE ? OR a.excerpt LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT 
        a.*,
        c.name as category_name,
        c.color as category_color,
        c.description as category_description
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), offset);
    const articles = await db.all(query, params);

    // 获取每篇文章的标签
    for (const article of articles) {
      const tags = await db.all(`
        SELECT t.* FROM tags t
        JOIN article_tags at ON t.id = at.tag_id
        WHERE at.article_id = ?
      `, [article.id]);
      article.tags = tags;
      
      // 构建分类对象
      if (article.category_name) {
        article.category = {
          id: article.category_id,
          name: article.category_name,
          color: article.category_color,
          description: article.category_description
        };
      }
      
      // 清理临时字段
      delete article.category_name;
      delete article.category_color;
      delete article.category_description;
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // 移除 limit 和 offset
    const totalResult = await db.get(countQuery, countParams);
    const total = totalResult.total;

    res.json({
      success: true,
      data: articles,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
});

// 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    const article = await db.get(`
      SELECT 
        a.*,
        c.name as category_name,
        c.color as category_color,
        c.description as category_description
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    // 获取文章标签
    const tags = await db.all(`
      SELECT t.* FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
    `, [id]);
    article.tags = tags;

    // 构建分类对象
    if (article.category_name) {
      article.category = {
        id: article.category_id,
        name: article.category_name,
        color: article.category_color,
        description: article.category_description
      };
    }

    // 清理临时字段
    delete article.category_name;
    delete article.category_color;
    delete article.category_description;

    // 增加浏览量
    db.run('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
    article.view_count += 1;

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({ success: false, message: '获取文章失败' });
  }
});

// 创建文章
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const {
      title,
      content,
      excerpt,
      category_id,
      tag_ids = [],
      status = 'draft',
      is_featured = false,
      meta_title,
      meta_description,
      slug
    } = req.body;

    // 兼容处理：支持 tags 和 tag_ids 两种字段名
    const tags = req.body.tags || req.body.tag_ids || tag_ids;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const now = new Date().toISOString();
    const publishedAt = status === 'published' ? now : null;

    const result = db.run(`
      INSERT INTO articles (
        title, content, excerpt, category_id, status, is_featured,
        meta_title, meta_description, slug, created_at, updated_at, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, content, excerpt, category_id || null, status, is_featured ? 1 : 0,
      meta_title || null, meta_description || null, slug || null,
      now, now, publishedAt
    ]);

    const articleId = result.lastInsertRowid;
    
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        db.run(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [articleId, tagId]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { id: articleId },
      message: '文章创建成功'
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ success: false, message: '创建文章失败' });
  }
});

// 更新文章
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category_id,
      tag_ids = [],
      status,
      is_featured,
      meta_title,
      meta_description,
      slug
    } = req.body;

    // 兼容处理：支持 tags 和 tag_ids 两种字段名
    const tags = req.body.tags || req.body.tag_ids || tag_ids;

    // 检查文章是否存在
    const existingArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const now = new Date().toISOString();
    let publishedAt = existingArticle.published_at;

    // 如果状态从非发布改为发布，设置发布时间
    if (status === 'published' && existingArticle.status !== 'published') {
      publishedAt = now;
    }

    db.run(`
      UPDATE articles SET
        title = ?, content = ?, excerpt = ?, category_id = ?,
        status = ?, is_featured = ?, meta_title = ?, meta_description = ?,
        slug = ?, updated_at = ?, published_at = ?
      WHERE id = ?
    `, [
      title, content, excerpt, category_id || null,
      status, is_featured ? 1 : 0, meta_title || null, meta_description || null,
      slug || null, now, publishedAt, id
    ]);

    // 更新标签关联
    db.run('DELETE FROM article_tags WHERE article_id = ?', [id]);
    
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        db.run(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        );
      }
    }

    res.json({ success: true, message: '文章更新成功' });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({ success: false, message: '更新文章失败' });
  }
});

// 删除文章
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    // 检查文章是否存在
    const existingArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    // 删除标签关联
    db.run('DELETE FROM article_tags WHERE article_id = ?', [id]);
    
    // 删除文章
    db.run('DELETE FROM articles WHERE id = ?', [id]);

    res.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ success: false, message: '删除文章失败' });
  }
});

// 批量操作
router.post('/batch', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { action, ids } = req.body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '参数无效' });
    }

    const placeholders = ids.map(() => '?').join(',');

    switch (action) {
      case 'delete':
        // 删除标签关联
        db.run(`DELETE FROM article_tags WHERE article_id IN (${placeholders})`, ids);
        // 删除文章
        db.run(`DELETE FROM articles WHERE id IN (${placeholders})`, ids);
        break;
      
      case 'publish':
        const now = new Date().toISOString();
        db.run(`
          UPDATE articles SET 
            status = 'published', 
            published_at = COALESCE(published_at, ?),
            updated_at = ?
          WHERE id IN (${placeholders})
        `, [now, now, ...ids]);
        break;
      
      case 'draft':
        db.run(`
          UPDATE articles SET 
            status = 'draft',
            updated_at = ?
          WHERE id IN (${placeholders})
        `, [new Date().toISOString(), ...ids]);
        break;
      
      default:
        return res.status(400).json({ success: false, message: '不支持的操作' });
    }

    res.json({ success: true, message: '批量操作成功' });
  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({ success: false, message: '批量操作失败' });
  }
});

export default router;