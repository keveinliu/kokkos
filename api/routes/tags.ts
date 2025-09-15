import express from 'express';
// 类型导入
type Tag = import('../../shared/types').Tag;
import { authenticateToken, requireRole } from '../middleware/auth.js';
import database from '../database/database.js';

const router = express.Router();

// 获取标签列表
router.get('/', async (req, res) => {
  try {
    const db = (req as any).db;
    const { include_count = false, search } = req.query;

    let query = 'SELECT * FROM tags';
    const params: any[] = [];

    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name ASC';
    const tags = await db.all(query, params);

    // 如果需要包含文章数量
    if (include_count === 'true') {
      for (const tag of tags) {
        const countResult = await db.get(`
          SELECT COUNT(DISTINCT a.id) as count 
          FROM articles a
          JOIN article_tags at ON a.id = at.article_id
          WHERE at.tag_id = ? AND a.status = 'published'
        `, [tag.id]);
        tag.article_count = countResult.count;
      }
    }

    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({ success: false, message: '获取标签列表失败' });
  }
});

// 获取单个标签
router.get('/:id', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    const tag = await db.get('SELECT * FROM tags WHERE id = ?', [id]);
    
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    // 获取该标签下的文章数量
    const countResult = await db.get(`
      SELECT COUNT(DISTINCT a.id) as count 
      FROM articles a
      JOIN article_tags at ON a.id = at.article_id
      WHERE at.tag_id = ?
    `, [id]);
    tag.article_count = countResult.count;

    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ success: false, message: '获取标签失败' });
  }
});

// 创建标签
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { name, color, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: '标签名称不能为空'
      });
    }

    // 检查标签是否已存在
    const existingTag = await db.get(
      'SELECT id FROM tags WHERE name = ?',
      [name.trim()]
    );
    
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '标签已存在'
      });
    }

    const now = new Date().toISOString();
    const result = await db.run(`
      INSERT INTO tags (name, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `, [name.trim(), description || null, color || '#3B82F6', now, now]);

    res.json({
      success: true,
      data: {
        id: result.lastID,
        name: name.trim(),
        color: color || '#3B82F6'
      }
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      message: '创建标签失败'
    });
  }
});

// 更新标签
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;
    const { name, description, color } = req.body;

    // 检查标签是否存在
    const existingTag = await db.get('SELECT * FROM tags WHERE id = ?', [id]);
    if (!existingTag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    // 检查标签名称是否与其他标签重复
    if (name && name !== existingTag.name) {
      const duplicateTag = await db.get(
        'SELECT id FROM tags WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (duplicateTag) {
        return res.status(400).json({ success: false, message: '标签名称已存在' });
      }
    }

    const now = new Date().toISOString();
    await db.run(`
      UPDATE tags SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color),
        updated_at = ?
      WHERE id = ?
    `, [name, description, color, now, id]);

    res.json({ success: true, message: '标签更新成功' });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({ success: false, message: '更新标签失败' });
  }
});

// 删除标签
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    // 检查标签是否存在
    const existingTag = await db.get('SELECT * FROM tags WHERE id = ?', [id]);
    if (!existingTag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    // 删除文章标签关联
    await db.run('DELETE FROM article_tags WHERE tag_id = ?', [id]);
    
    // 删除标签
    await db.run('DELETE FROM tags WHERE id = ?', [id]);

    res.json({ success: true, message: '标签删除成功' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ success: false, message: '删除标签失败' });
  }
});

// 批量删除标签
router.post('/batch-delete', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '参数无效' });
    }

    const placeholders = ids.map(() => '?').join(',');
    
    // 删除文章标签关联
    await db.run(`DELETE FROM article_tags WHERE tag_id IN (${placeholders})`, ids);
    
    // 删除标签
    await db.run(`DELETE FROM tags WHERE id IN (${placeholders})`, ids);

    res.json({ success: true, message: '标签批量删除成功' });
  } catch (error) {
    console.error('批量删除标签失败:', error);
    res.status(500).json({ success: false, message: '批量删除标签失败' });
  }
});

// 获取标签统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    // 检查标签是否存在
    const tag = await db.get('SELECT * FROM tags WHERE id = ?', [id]);
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    // 获取统计信息
    const stats = {
      total_articles: 0,
      published_articles: 0,
      draft_articles: 0,
      total_views: 0,
      latest_article: null
    };

    // 文章数量统计
    const articleStats = await db.all(`
      SELECT 
        a.status,
        COUNT(DISTINCT a.id) as count,
        SUM(a.view_count) as total_views
      FROM articles a
      JOIN article_tags at ON a.id = at.article_id
      WHERE at.tag_id = ?
      GROUP BY a.status
    `, [id]);

    for (const stat of articleStats) {
      if (stat.status === 'published') {
        stats.published_articles = stat.count;
      } else if (stat.status === 'draft') {
        stats.draft_articles = stat.count;
      }
      stats.total_views += stat.total_views || 0;
    }
    
    stats.total_articles = stats.published_articles + stats.draft_articles;

    // 最新文章
    const latestArticle = await db.get(`
      SELECT a.id, a.title, a.created_at, a.status
      FROM articles a
      JOIN article_tags at ON a.id = at.article_id
      WHERE at.tag_id = ?
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [id]);
    
    stats.latest_article = latestArticle;

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取标签统计失败:', error);
    res.status(500).json({ success: false, message: '获取标签统计失败' });
  }
});

// 获取热门标签
router.get('/popular/list', async (req, res) => {
  try {
    const db = (req as any).db;
    const { limit = 10 } = req.query;

    const popularTags = await db.all(`
      SELECT 
        t.*,
        COUNT(DISTINCT a.id) as article_count,
        SUM(a.view_count) as total_views
      FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      JOIN articles a ON at.article_id = a.id
      WHERE a.status = 'published'
      GROUP BY t.id
      ORDER BY article_count DESC, total_views DESC
      LIMIT ?
    `, [Number(limit)]);

    res.json({ success: true, data: popularTags });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(500).json({ success: false, message: '获取热门标签失败' });
  }
});

// 搜索标签
router.get('/search/:keyword', async (req, res) => {
  try {
    const db = (req as any).db;
    const { keyword } = req.params;
    const { limit = 20 } = req.query;

    const tags = await db.all(`
      SELECT * FROM tags 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY 
        CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
        name ASC
      LIMIT ?
    `, [`%${keyword}%`, `%${keyword}%`, `${keyword}%`, Number(limit)]);

    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('搜索标签失败:', error);
    res.status(500).json({ success: false, message: '搜索标签失败' });
  }
});

export default router;