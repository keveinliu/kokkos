import express from 'express';
// 类型导入
type Category = import('../../shared/types').Category;
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 获取分类列表
router.get('/', async (req, res) => {
  try {
    const db = (req as any).db;
    const { include_count = false } = req.query;

    let query = 'SELECT * FROM categories ORDER BY sort_order ASC, created_at DESC';
    const categories = await db.all(query);

    // 如果需要包含文章数量
    if (include_count === 'true') {
      for (const category of categories) {
        const countResult = await db.get(
          'SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND status = \'published\'',
          [category.id]
        );
        category.article_count = countResult.count;
      }
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

// 获取单个分类
router.get('/:id', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    // 获取该分类下的文章数量
    const countResult = await db.get(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );
    category.article_count = countResult.count;

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

// 创建分类
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { name, description, color, sort_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    // 检查分类名称是否已存在
    const existingCategory = await db.get(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );
    
    if (existingCategory) {
      return res.status(400).json({ success: false, message: '分类名称已存在' });
    }

    const now = new Date().toISOString();
    const result = db.run(`
      INSERT INTO categories (name, description, color, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description || null, color || '#3B82F6', sort_order, now, now]);

    res.status(201).json({
      success: true,
      data: { id: result.lastID },
      message: '分类创建成功'
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ success: false, message: '创建分类失败' });
  }
});

// 更新分类
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;
    const { name, description, color, sort_order } = req.body;

    // 检查分类是否存在
    const existingCategory = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    // 检查分类名称是否与其他分类重复
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await db.get(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (duplicateCategory) {
        return res.status(400).json({ success: false, message: '分类名称已存在' });
      }
    }

    const now = new Date().toISOString();
    db.run(`
      UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color),
        sort_order = COALESCE(?, sort_order),
        updated_at = ?
      WHERE id = ?
    `, [name, description, color, sort_order, now, id]);

    res.json({ success: true, message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

// 删除分类
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;
    const { move_to_category_id } = req.query;

    // 检查分类是否存在
    const existingCategory = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    // 检查是否有文章使用该分类
    const articlesCount = await db.get(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );

    if (articlesCount.count > 0) {
      if (move_to_category_id) {
        // 将文章移动到指定分类
        const targetCategory = await db.get(
          'SELECT id FROM categories WHERE id = ?',
          [move_to_category_id]
        );
        
        if (!targetCategory) {
          return res.status(400).json({ success: false, message: '目标分类不存在' });
        }

        db.run(
          'UPDATE articles SET category_id = ?, updated_at = ? WHERE category_id = ?',
          [move_to_category_id, new Date().toISOString(), id]
        );
      } else {
        // 将文章的分类设为空
        db.run(
          'UPDATE articles SET category_id = NULL, updated_at = ? WHERE category_id = ?',
          [new Date().toISOString(), id]
        );
      }
    }

    // 删除分类
    db.run('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// 批量更新分类排序
router.post('/reorder', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = (req as any).db;
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    const now = new Date().toISOString();
    
    // 使用事务更新排序
    db.run('BEGIN TRANSACTION');
    try {
      for (const category of categories) {
        if (category.id && typeof category.sort_order === 'number') {
          db.run(
            'UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?',
            [category.sort_order, now, category.id]
          );
        }
      }
      db.run('COMMIT');
      res.json({ success: true, message: '分类排序更新成功' });
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('更新分类排序失败:', error);
    res.status(500).json({ success: false, message: '更新分类排序失败' });
  }
});

// 获取分类统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const db = (req as any).db;
    const { id } = req.params;

    // 检查分类是否存在
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
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
        status,
        COUNT(*) as count,
        SUM(view_count) as total_views
      FROM articles 
      WHERE category_id = ?
      GROUP BY status
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
      SELECT id, title, created_at, status
      FROM articles 
      WHERE category_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);
    
    stats.latest_article = latestArticle;

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({ success: false, message: '获取分类统计失败' });
  }
});

export default router;