const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 递归遍历目录并处理文件
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      // 重命名 .js 文件为 .cjs
      const newPath = filePath.replace(/\.js$/, '.cjs');
      fs.renameSync(filePath, newPath);
      
      // 修复文件内容中的导入路径
      fixImportPaths(newPath);
    }
  }
}

// 修复文件中的导入路径
function fixImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复相对路径导入，添加 .cjs 扩展名
  content = content.replace(/require\(["'](\.\/.+?)(["'])\)/g, (match, path, quote) => {
    // 如果路径已经有扩展名，先移除
    const cleanPath = path.replace(/\.(js|cjs)$/, '');
    return `require(${quote}${cleanPath}.cjs${quote})`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// 拷贝文件
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

console.log('开始构建 API...');

try {
  // 1. 清理输出目录
  if (fs.existsSync('dist-api')) {
    fs.rmSync('dist-api', { recursive: true, force: true });
  }
  
  // 2. 编译 TypeScript
  console.log('编译 TypeScript...');
  execSync('npx tsc -p tsconfig.api.json', { stdio: 'inherit' });
  
  // 检查编译后是否有文件
  if (!fs.existsSync('dist-api')) {
    console.log('警告: dist-api 目录不存在，TypeScript 编译可能失败');
    return;
  }
  
  const files = fs.readdirSync('dist-api', { recursive: true });
  console.log('编译后的文件:', files);
  
  // 3. 处理生成的 .js 文件
  console.log('处理文件扩展名和导入路径...');
  processDirectory('dist-api');
  
  // 检查处理后的文件
  const processedFiles = fs.readdirSync('dist-api', { recursive: true });
  console.log('处理后的文件:', processedFiles);
  
  // 4. 拷贝 init.sql 文件
  console.log('拷贝数据库初始化文件...');
  copyFile('api/database/init.sql', 'dist-api/api/database/init.sql');
  
  console.log('API 构建完成!');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}