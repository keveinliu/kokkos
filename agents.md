# 芥子博客 - 开发指南

## 项目概述

芥子博客是一个基于 React + TypeScript + Electron 的现代化个人博客系统，支持 Markdown 编辑、文章管理、分类标签、图片上传等功能。

## 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **React Router** - 客户端路由
- **Zustand** - 状态管理
- **React Markdown** - Markdown 渲染
- **Lucide React** - 图标库

### 后端
- **Express.js** - Node.js Web 框架
- **SQLite3** - 轻量级数据库
- **Multer** - 文件上传中间件
- **CORS** - 跨域资源共享

### 桌面应用
- **Electron** - 跨平台桌面应用框架

## 项目目录结构

```
芥子博客/
├── .trae/                     # Trae AI 配置目录
│   └── documents/             # 项目文档
│       ├── 芥子博客产品需求文档.md
│       └── 芥子博客技术架构文档.md
├── api/                       # 后端源码
│   ├── routes/                # API 路由
│   │   ├── articles.ts        # 文章相关 API
│   │   ├── auth.ts           # 认证相关 API
│   │   ├── categories.ts     # 分类相关 API
│   │   ├── images.ts         # 图片上传 API
│   │   ├── settings.ts       # 设置相关 API
│   │   └── tags.ts           # 标签相关 API
│   ├── database/             # 数据库相关
│   │   ├── database.ts       # 数据库连接
│   │   └── init.sql          # 数据库初始化脚本
│   ├── app.ts                # Express 应用配置
│   ├── index.ts              # 后端入口文件
│   └── server.ts             # 服务器启动文件
├── src/                      # 前端源码
│   ├── components/           # React 组件
│   │   ├── Empty.tsx         # 空状态组件
│   │   ├── ImageManager.tsx  # 图片管理组件
│   │   └── Layout.tsx        # 布局组件
│   ├── pages/                # 页面组件
│   │   ├── ArticleDetail.tsx # 文章详情页
│   │   ├── ArticleEdit.tsx   # 文章编辑页
│   │   ├── Categories.tsx    # 分类管理页
│   │   ├── Home.tsx          # 首页
│   │   └── Settings.tsx      # 设置页
│   ├── hooks/                # 自定义 Hooks
│   │   └── useTheme.ts       # 主题 Hook
│   ├── services/             # API 服务
│   │   └── api.ts            # API 请求封装
│   ├── lib/                  # 工具函数
│   │   └── utils.ts          # 通用工具函数
│   ├── App.tsx               # 主应用组件
│   ├── main.tsx              # 前端入口文件
│   └── index.css             # 全局样式
├── electron/                 # Electron 主进程
│   ├── main.ts               # Electron 主进程
│   └── preload.ts            # 预加载脚本
├── shared/                   # 共享类型定义
│   └── types.ts              # TypeScript 类型定义
├── data/                     # 数据目录
│   └── blog.db               # SQLite 数据库文件
├── uploads/                  # 上传文件目录
│   └── images/               # 图片文件
├── backups/                  # 备份文件目录
├── dist/                     # 前端构建输出
├── dist-api/                 # 后端构建输出
├── dist-electron/            # Electron 构建输出
├── release/                  # 桌面应用打包输出
├── tests/                    # 测试文件
├── public/                   # 静态资源
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── nodemon.json              # Nodemon 配置
└── vercel.json               # Vercel 部署配置
```

## 开发环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (推荐) 或 npm
- **操作系统**: Windows, macOS, Linux

## 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

## 应用构建

### 前端构建

```bash
# TypeScript 编译检查
pnpm run check
# 或
npm run check

# 构建前端应用
pnpm run build
# 或
npm run build
```

构建输出：
- `dist/` - 前端静态文件
- `dist-api/` - 后端编译文件

### 桌面应用构建

```bash
# 构建 Electron 应用
pnpm run electron:build
# 或
npm run electron:build
```

构建输出：
- `release/` - 桌面应用安装包

## 前端启动方法

### 开发模式

```bash
# 启动前端开发服务器 (Vite)
pnpm dev
# 或
npm run dev
```

- 访问地址: http://localhost:5173
- 支持热重载
- 自动代理 API 请求到后端

### 生产模式预览

```bash
# 构建后预览
pnpm run preview
# 或
npm run preview
```

### 静态文件服务

```bash
# 使用内置的前端服务器
pnpm run frontend:start
# 或
npm run frontend:start
```

## 后端启动方法

### 开发模式

```bash
# 使用 tsx 直接运行 TypeScript
npx tsx api/server.ts

# 或使用 nodemon 自动重启 (推荐)
npx nodemon
```

- API 地址: http://localhost:3001
- 支持热重载 (nodemon)
- 自动编译 TypeScript

### 生产模式

```bash
# 先构建项目
pnpm run build

# 运行编译后的 JavaScript
node dist-api/api/server.cjs
```

### 使用 PM2 管理 (生产环境推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist-api/api/server.cjs --name "blog-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs blog-api

# 重启应用
pm2 restart blog-api

# 停止应用
pm2 stop blog-api
```

## 桌面应用启动

### 开发模式

```bash
# 同时启动前端和 Electron
pnpm run electron:dev
# 或
npm run electron:dev
```

### 生产模式

```bash
# 先构建项目
pnpm run build

# 启动 Electron
pnpm run electron
# 或
npm run electron
```

## 常用开发命令

### 代码检查和格式化

```bash
# ESLint 代码检查
pnpm run lint
# 或
npm run lint

# TypeScript 类型检查
pnpm run check
# 或
npm run check
```

### 数据库操作

```bash
# 查看数据库文件
sqlite3 data/blog.db

# 重新初始化数据库
rm data/blog.db
# 重启后端服务，会自动创建新数据库
```

### 测试相关

```bash
# 运行测试脚本
node tests/test-api-tags.cjs
node tests/test-article-save.js
node tests/test-proxy.cjs
node tests/test-tag-association.cjs
```

## 环境变量配置

创建 `.env` 文件 (可选):

```env
# 后端端口
PORT=3001

# 数据库路径
DB_PATH=./data/blog.db

# 上传文件路径
UPLOAD_PATH=./uploads

# 开发环境
NODE_ENV=development
```

## 部署说明

### Web 应用部署

1. **构建项目**
   ```bash
   pnpm install
   pnpm run build
   ```

2. **上传文件**
   - `dist/` - 前端文件
   - `dist-api/` - 后端文件
   - `package.json`
   - `api/database/init.sql`

3. **服务器配置**
   ```bash
   # 安装依赖
   pnpm install --prod
   
   # 启动服务
   pm2 start dist-api/api/server.cjs --name "blog-api"
   ```

### Vercel 部署

项目已配置 `vercel.json`，支持一键部署到 Vercel:

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 前端默认端口: 5173
   - 后端默认端口: 3001
   - 可通过环境变量修改

2. **数据库权限问题**
   ```bash
   chmod 755 data/
   chmod 644 data/blog.db
   ```

3. **文件上传问题**
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/images/
   ```

4. **依赖安装问题**
   ```bash
   # 清理缓存
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

### 日志查看

- **前端日志**: 浏览器开发者工具 Console
- **后端日志**: 终端输出或 PM2 日志
- **Electron 日志**: 开发者工具 Console

## 开发工作流

1. **启动开发环境**
   ```bash
   # 终端 1: 启动后端
   npx nodemon
   
   # 终端 2: 启动前端
   pnpm dev
   ```

2. **代码修改**
   - 前端代码修改会自动热重载
   - 后端代码修改会自动重启服务

3. **提交前检查**
   ```bash
   pnpm run check
   pnpm run lint
   pnpm run build
   ```

## 项目特性

- 📝 **文章管理**: Markdown 编辑器，支持实时预览
- 🏷️ **分类标签**: 灵活的文章分类和标签系统
- 🖼️ **图片上传**: 支持拖拽上传和图片管理
- 🔍 **搜索功能**: 全文搜索文章内容
- 💾 **数据备份**: 支持数据库备份和恢复
- 🎨 **现代 UI**: iOS 风格的用户界面设计
- 🖥️ **跨平台**: 支持 Web 和桌面应用
- ⚡ **高性能**: Vite 构建，快速开发体验

---

更多详细信息请参考项目根目录下的 `README.md` 文件。