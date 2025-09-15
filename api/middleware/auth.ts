import jwt from 'jsonwebtoken';
import express from 'express';
// 类型导入
type JWTPayload = import('../../shared/types').JWTPayload;

type Request = import('express').Request;
type Response = import('express').Response;
type NextFunction = import('express').NextFunction;

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问被拒绝，需要登录'
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  console.log('🔍 Auth middleware JWT_SECRET:', jwtSecret ? '已设置' : '未设置');
  console.log('🔍 Auth middleware JWT_SECRET value:', jwtSecret);
  console.log('🔍 Token to verify:', token.substring(0, 50) + '...');

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log('❌ JWT验证失败:', err.message);
    }
    if (err) {
      return res.status(403).json({
        success: false,
        message: '无效的访问令牌'
      });
    }

    req.user = decoded as JWTPayload;
    next();
  });
};

/**
 * 可选的认证中间件
 * 如果有 token 则验证，没有则继续
 */
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (!err) {
      req.user = decoded as JWTPayload;
    }
    next();
  });
};

/**
 * 检查用户角色权限
 */
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

// ES模块导出
export { authenticateToken, optionalAuth, requireRole };