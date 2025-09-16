# 芥子博客

一个基于 React + TypeScript + Electron 的现代化个人博客系统，支持 Markdown 编辑、文章管理、分类标签、图片上传等功能。
Powered by (TRAE)[https://www.trae.ai/]

## 功能特性

- 📝 **文章管理**：支持 Markdown 编辑器，实时预览
- 🏷️ **分类标签**：灵活的文章分类和标签系统
- 🖼️ **图片上传**：支持本地图片上传和管理
- 🔍 **搜索功能**：全文搜索文章内容
- 💾 **数据备份**：支持数据库备份和恢复
- 🎨 **iOS 风格 UI**：现代化的用户界面设计
- 🖥️ **跨平台**：支持 Web 和桌面应用

## 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **React Router** - 客户端路由

### 后端
- **Express.js** - Node.js Web 框架
- **SQLite3** - 轻量级数据库
- **Multer** - 文件上传中间件

### 桌面应用
- **Electron** - 跨平台桌面应用框架

## 开发环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd 芥子博客
```

### 2. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 3. 启动开发服务器

```bash
# 启动前端开发服务器
pnpm dev

# 启动后端 API 服务器
pnpm dev:api

# 启动 Electron 桌面应用
pnpm electron:dev
```

### 4. 访问应用

- Web 版本：http://localhost:5173
- API 服务：http://localhost:3001

## 项目结构

```
芥子博客/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义 Hooks
│   ├── services/          # API 服务
│   └── lib/               # 工具函数
├── api/                   # 后端源码
│   ├── routes/            # API 路由
│   ├── database/          # 数据库相关
│   └── app.ts             # Express 应用
├── electron/              # Electron 主进程
├── shared/                # 共享类型定义
├── public/                # 静态资源
└── dist/                  # 构建输出
```

## 打包部署

### Web 应用部署

#### 1. 构建项目

```bash
# 安装依赖
pnpm install

# 构建前端和后端
pnpm run build
```

#### 2. 部署文件

构建完成后，需要上传以下文件到服务器：

```
├── dist/                  # 前端构建文件
├── dist-api/              # 后端构建文件
├── package.json           # 项目配置
├── pnpm-lock.yaml        # 依赖锁定文件
├── api/database/init.sql  # 数据库初始化脚本
└── data/                  # 数据目录（可选）
```

#### 3. 服务器部署步骤

```bash
# 1. 安装 Node.js 和 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# 2. 安装生产依赖
pnpm install --prod

# 3. 启动 API 服务器
node dist-api/api/server.cjs

# 4. 配置 Nginx 代理（可选）
# 将前端文件部署到 Nginx，API 请求代理到 Node.js 服务
```

#### 4. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist-api/api/server.cjs --name "blog-api"

# 设置开机自启
pm2 startup
pm2 save
```

### 桌面应用打包

```bash
# 构建桌面应用
pnpm run electron:build

# 打包文件位于 release/ 目录
```

## 部署注意事项

### 服务器环境
- 确保服务器已安装 Node.js 18+ 和 pnpm
- 确保服务器有足够的磁盘空间存储数据库和上传文件

### 数据库文件
- SQLite 数据库文件默认位于 `data/blog.db`
- 确保应用有读写权限
- 定期备份数据库文件

### 文件夹权限
```bash
# 设置正确的文件夹权限
chmod -R 755 /path/to/your/app
chmod -R 777 /path/to/your/app/data
chmod -R 777 /path/to/your/app/uploads
```

### HTTPS 配置
- 生产环境建议使用 HTTPS
- 可以使用 Let's Encrypt 免费 SSL 证书

### 备份策略
- 定期备份 SQLite 数据库文件
- 备份上传的图片文件
- 使用应用内置的备份功能

## 开发脚本

```bash
# 开发模式
pnpm dev              # 启动前端开发服务器
pnpm dev:api          # 启动后端开发服务器
pnpm electron:dev     # 启动 Electron 开发模式

# 构建
pnpm build            # 构建前端和后端
pnpm electron:build   # 构建桌面应用

# 预览
pnpm preview          # 预览构建后的前端应用
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
