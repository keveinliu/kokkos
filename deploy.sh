#!/bin/bash

# 芥子博客部署脚本
# 用于构建和打包项目，生成可部署的完整包

set -e  # 遇到错误时退出

echo "🚀 开始构建芥子博客项目..."

# 检查必要的命令
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装 Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ 需要安装 npm"; exit 1; }

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf dist dist-api deploy-package

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 构建前端
echo "🏗️ 构建前端项目..."
npm run build

# 构建后端API
echo "🔧 构建后端API..."
node build-api.cjs

# 创建部署包目录
echo "📁 创建部署包目录..."
mkdir -p deploy-package

# 复制必要文件到部署包
echo "📋 复制文件到部署包..."

# 复制构建后的文件
cp -r dist deploy-package/
cp -r dist-api deploy-package/

# 复制配置文件
cp package.production.json deploy-package/package.json
cp package-lock.json deploy-package/ 2>/dev/null || echo "⚠️ package-lock.json 不存在，跳过"
cp pnpm-lock.yaml deploy-package/ 2>/dev/null || echo "⚠️ pnpm-lock.yaml 不存在，跳过"
cp .env.example deploy-package/
cp frontend-server.cjs deploy-package/
cp README.md deploy-package/ 2>/dev/null || echo "⚠️ README.md 不存在，跳过"

# 创建必要的目录
mkdir -p deploy-package/data
mkdir -p deploy-package/uploads
mkdir -p deploy-package/backups

# 复制现有数据（如果存在）
#if [ -d "data" ]; then
#    echo "📊 复制现有数据..."
#    cp -r data/* deploy-package/data/ 2>/dev/null || echo "⚠️ 数据目录为空"
#fi
#
#if [ -d "uploads" ]; then
#    echo "🖼️ 复制上传文件..."
#    cp -r uploads/* deploy-package/uploads/ 2>/dev/null || echo "⚠️ uploads目录为空"
#fi
#
#if [ -d "backups" ]; then
#    echo "💾 复制备份文件..."
#    cp -r backups/* deploy-package/backups/ 2>/dev/null || echo "⚠️ backups目录为空"
#fi

# 创建部署说明文件
cat > deploy-package/DEPLOY.md << 'EOF'
# 芥子博客部署说明

## 部署步骤

1. 将整个 deploy-package 目录上传到服务器
2. 在服务器上进入项目目录
3. 复制 .env.example 为 .env 并根据实际环境修改配置
4. 安装生产依赖：`npm install --production`
5. 启动后端服务：`node dist-api/api/server.cjs`
6. 启动前端服务：`node frontend-server.cjs`

## 环境变量配置

请根据实际部署环境修改 .env 文件中的配置：

- `PORT`: 后端API服务端口（默认3001）
- `DB_PATH`: 数据库文件路径（默认./data/blog.db）
- `UPLOADS_PATH`: 上传文件存储路径（默认./uploads）
- `BACKUPS_PATH`: 备份文件存储路径（默认./backups）

## 目录结构

- `dist/`: 前端构建文件
- `dist-api/`: 后端构建文件
- `data/`: 数据库文件目录
- `uploads/`: 上传文件目录
- `backups/`: 备份文件目录
- `frontend-server.cjs`: 前端服务器
- `.env.example`: 环境变量配置示例

## 注意事项

1. 确保服务器已安装 Node.js (推荐版本 >= 18)
2. 确保相关端口未被占用
3. 建议使用 PM2 等进程管理工具管理服务
4. 定期备份数据库和上传文件
EOF

# 创建启动脚本
cat > deploy-package/start.sh << 'EOF'
#!/bin/bash

# 芥子博客启动脚本

echo "🚀 启动芥子博客..."

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️ 未找到 .env 文件，使用默认配置"
    echo "💡 建议复制 .env.example 为 .env 并根据实际环境修改配置"
fi

# 启动后端服务（后台运行）
echo "🔧 启动后端API服务..."
nohup node dist-api/api/server.cjs > api.log 2>&1 &
API_PID=$!
echo "后端服务PID: $API_PID"

# 等待后端服务启动
sleep 3

# 启动前端服务（后台运行）
echo "🌐 启动前端服务..."
nohup node frontend-server.cjs > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务PID: $FRONTEND_PID"

echo "✅ 服务启动完成！"
echo "📊 后端API: http://localhost:3001"
echo "🌐 前端页面: http://localhost:4173"
echo "📝 日志文件: api.log, frontend.log"
echo "🛑 停止服务: kill $API_PID $FRONTEND_PID"

# 保存PID到文件
echo "$API_PID" > api.pid
echo "$FRONTEND_PID" > frontend.pid
EOF

# 创建停止脚本
cat > deploy-package/stop.sh << 'EOF'
#!/bin/bash

# 芥子博客停止脚本

echo "🛑 停止芥子博客服务..."

# 停止后端服务
if [ -f "api.pid" ]; then
    API_PID=$(cat api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        kill $API_PID
        echo "✅ 后端服务已停止 (PID: $API_PID)"
    else
        echo "⚠️ 后端服务未运行"
    fi
    rm -f api.pid
fi

# 停止前端服务
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo "⚠️ 前端服务未运行"
    fi
    rm -f frontend.pid
fi

echo "🏁 所有服务已停止"
EOF

# 设置脚本执行权限
chmod +x deploy-package/start.sh
chmod +x deploy-package/stop.sh

# 创建压缩包
echo "📦 创建部署压缩包..."
tar -czf jiezi-blog-deploy.tar.gz -C deploy-package .

echo "✅ 构建完成！"
echo "📁 部署包目录: deploy-package/"
echo "📦 压缩包文件: jiezi-blog-deploy.tar.gz"
echo ""
echo "🚀 部署说明:"
echo "1. 将 jiezi-blog-deploy.tar.gz 上传到服务器"
echo "2. 解压: tar -xzf jiezi-blog-deploy.tar.gz"
echo "3. 配置环境变量: cp .env.example .env && vi .env"
echo "4. 安装依赖: npm install --production"
echo "5. 启动服务: ./start.sh"
echo "6. 停止服务: ./stop.sh"
