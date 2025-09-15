/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
// 类型导入
type VercelRequest = import('@vercel/node').VercelRequest;
type VercelResponse = import('@vercel/node').VercelResponse;
const app = require('./app.js');

module.exports = (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};

// 将文件转换为模块以避免全局作用域冲突
export {};