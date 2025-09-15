const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'blog.db');

async function testTagAssociation() {
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    console.log('🧪 开始测试标签关联功能...');
    
    // 1. 检查现有数据
    console.log('\n📊 检查现有数据:');
    const articles = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM articles', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`文章数量: ${articles.length}`);
    
    const tags = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tags', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`标签数量: ${tags.length}`);
    
    const articleTags = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM article_tags', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`文章标签关联数量: ${articleTags.length}`);
    
    // 2. 创建测试文章
    console.log('\n📝 创建测试文章...');
    const now = new Date().toISOString();
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO articles (
          title, content, excerpt, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        '测试文章标签关联',
        '这是一篇用于测试标签关联功能的文章',
        '测试摘要',
        'draft',
        now,
        now
      ], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    const articleId = result.lastID;
    console.log(`创建文章成功，ID: ${articleId}`);
    
    // 3. 关联标签
    console.log('\n🏷️ 关联标签...');
    if (tags.length > 0) {
      const tagIds = tags.slice(0, 3).map(tag => tag.id); // 取前3个标签
      
      for (const tagId of tagIds) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
            [articleId, tagId],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });
        console.log(`关联标签 ${tagId} 成功`);
      }
    }
    
    // 4. 验证关联结果
    console.log('\n✅ 验证关联结果...');
    const associatedTags = await new Promise((resolve, reject) => {
      db.all(`
        SELECT at.*, t.name as tag_name, t.color as tag_color
        FROM article_tags at
        JOIN tags t ON at.tag_id = t.id
        WHERE at.article_id = ?
      `, [articleId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`文章 ${articleId} 关联的标签:`);
    associatedTags.forEach(tag => {
      console.log(`  - ${tag.tag_name} (ID: ${tag.tag_id}, 颜色: ${tag.tag_color})`);
    });
    
    // 5. 测试更新标签关联
    console.log('\n🔄 测试更新标签关联...');
    // 删除现有关联
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM article_tags WHERE article_id = ?', [articleId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 重新关联不同的标签
    if (tags.length > 2) {
      const newTagIds = tags.slice(2, 5).map(tag => tag.id); // 取不同的标签
      
      for (const tagId of newTagIds) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
            [articleId, tagId],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });
      }
      
      console.log('标签关联更新成功');
    }
    
    // 6. 最终验证
    const finalTags = await new Promise((resolve, reject) => {
      db.all(`
        SELECT at.*, t.name as tag_name
        FROM article_tags at
        JOIN tags t ON at.tag_id = t.id
        WHERE at.article_id = ?
      `, [articleId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\n🎉 最终关联结果:');
    finalTags.forEach(tag => {
      console.log(`  - ${tag.tag_name} (ID: ${tag.tag_id})`);
    });
    
    console.log('\n✅ 标签关联功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    db.close();
  }
}

testTagAssociation();