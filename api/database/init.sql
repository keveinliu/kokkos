-- 芥子博客数据库初始化脚本
-- 创建时间: 2024

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007AFF',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT, -- 文章摘要
    category_id INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')), -- draft, published
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE, -- 是否精选
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 图片表
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);

-- 插入默认分类
INSERT OR IGNORE INTO categories (name, description, color) VALUES 
('技术', '技术相关文章', '#007AFF'),
('生活', '生活感悟和日常', '#34C759'),
('思考', '个人思考和观点', '#FF9500'),
('随笔', '随意记录的文字', '#AF52DE');

-- 插入默认标签
INSERT OR IGNORE INTO tags (name, color) VALUES 
('JavaScript', '#F7DF1E'),
('React', '#61DAFB'),
('TypeScript', '#3178C6'),
('Node.js', '#339933'),
('前端', '#FF6B6B'),
('后端', '#4ECDC4'),
('数据库', '#336791'),
('随想', '#FFB6C1');

-- 插入默认系统设置
INSERT OR IGNORE INTO settings (key, value, description) VALUES 
('site_title', '芥子博客', '网站标题'),
('site_description', '一个简洁优雅的个人博客', '网站描述'),
('posts_per_page', '10', '每页文章数量'),
('theme_color', '#007AFF', '主题色'),
('backup_enabled', 'true', '是否启用自动备份'),
('backup_interval', '24', '备份间隔（小时）'),
('author_name', '博主', '作者姓名'),
('author_email', 'admin@example.com', '作者邮箱');