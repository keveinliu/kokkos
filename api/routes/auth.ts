import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import database from '../database/database.js';
// 类型导入
type User = import('../../shared/types').User;
type LoginRequest = import('../../shared/types').LoginRequest;
type RegisterRequest = import('../../shared/types').RegisterRequest;
type AuthResponse = import('../../shared/types').AuthResponse;
type JWTPayload = import('../../shared/types').JWTPayload;
import { authenticateToken } from '../middleware/auth.js';

type Request = any;
type Response = any;

const router = Router();

// JWT密钥获取函数 - 在运行时获取环境变量
function getJWTSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
}
const JWT_EXPIRES_IN = '7d';

// 生成JWT token
function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, getJWTSecret(), { expiresIn: JWT_EXPIRES_IN });
}

// 验证JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJWTSecret()) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// 检查是否有用户存在
router.get('/check-users', async (req: Request, res: Response) => {
  try {
    database.init();
    const userCount = database.get('SELECT COUNT(*) as count FROM users');
    const adminCount = database.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    
    res.json({
      success: true,
      data: {
        hasUsers: (userCount?.count || 0) > 0,
        userCount: userCount?.count || 0,
        hasAdmin: (adminCount?.count || 0) > 0,
        adminCount: adminCount?.count || 0
      }
    });
  } catch (error) {
    console.error('检查用户失败:', error);
    res.status(500).json({
      success: false,
      message: '检查用户失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email, display_name }: RegisterRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        success: false,
        message: '用户名长度必须在3-50个字符之间'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度不能少于6个字符'
      });
    }

    database.init();

    // 检查用户名是否已存在
    const existingUser = database.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = database.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }

    // 检查是否已存在管理员用户
    const adminCount = database.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    const hasAdmin = (adminCount?.count || 0) > 0;
    
    // 确定用户角色：如果没有管理员则创建管理员，否则创建普通用户
    const userRole = hasAdmin ? 'user' : 'admin';

    // 加密密码
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const result = database.run(
      'INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email || null, passwordHash, display_name || null, userRole]
    );

    // 获取创建的用户信息
    const user = database.get(
      'SELECT id, username, email, display_name, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    if (!user) {
      throw new Error('用户创建失败');
    }

    // 生成JWT token
    const token = generateToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 更新最后登录时间
    database.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const response: AuthResponse = {
      user,
      token,
      expires_at: expiresAt
    };

    res.status(201).json({
      success: true,
      data: response,
      message: userRole === 'admin' ? '管理员账户创建成功' : '用户注册成功'
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    database.init();

    // 查找用户
    const user = database.get(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 移除密码哈希
    const { password_hash, ...userWithoutPassword } = user;

    // 生成JWT token
    const token = generateToken(userWithoutPassword);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 更新最后登录时间
    database.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const response: AuthResponse = {
      user: userWithoutPassword,
      token,
      expires_at: expiresAt
    };

    res.json({
      success: true,
      data: response,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 验证token并获取用户信息
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    
    database.init();
    
    // 获取最新的用户信息
    const user = database.get(
      'SELECT id, username, email, display_name, avatar_url, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = ? AND is_active = 1',
      [payload.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 验证token
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  // 如果中间件通过，说明token有效
  res.json({
    success: true,
    message: 'Token有效'
  });
});

// 用户登出
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // JWT是无状态的，登出主要在前端处理（删除token）
  // 这里可以记录登出日志或清理会话相关数据
  res.json({
    success: true,
    message: '登出成功'
  });
});

export default router;