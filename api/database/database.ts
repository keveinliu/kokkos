import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
// 类型导入
type Article = import('../../shared/types').Article;
type Category = import('../../shared/types').Category;
type Tag = import('../../shared/types').Tag;
type ArticleStatus = import('../../shared/types').ArticleStatus;

// 在CommonJS环境中，__dirname和__filename是全局可用的
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// 数据库文件路径 - 支持环境变量配置
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'blog.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class DatabaseManager {
  private db: ReturnType<typeof Database> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 不在构造函数中自动连接，等待显式调用init
  }

  // 公共初始化方法
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this.connect();
    return this.initPromise;
  }

  private async connect(): Promise<void> {
    try {
      this.db = new Database(DB_PATH);
      console.log('数据库连接成功:', DB_PATH);
      await this.initialize();
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
    }
  }

  // 解析SQL语句的方法
  private parseSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    const lines = sql.split('\n');
    let currentStatement = '';
    let inStatement = false;
    
    for (const line of lines) {
      let processedLine = line.trim();
      
      // 跳过空行和纯注释行
      if (!processedLine || processedLine.startsWith('--')) {
        continue;
      }
      
      // 移除行内注释
      const commentIndex = processedLine.indexOf('--');
      if (commentIndex !== -1) {
        processedLine = processedLine.substring(0, commentIndex).trim();
        // 如果移除注释后为空，但我们在语句中间，就跳过这行但不重置状态
        if (!processedLine && inStatement) {
          continue;
        }
        if (!processedLine) continue;
      }
      
      // 检查是否是SQL语句的开始
      if (!inStatement && (processedLine.toUpperCase().startsWith('CREATE') || 
                          processedLine.toUpperCase().startsWith('INSERT') ||
                          processedLine.toUpperCase().startsWith('UPDATE') ||
                          processedLine.toUpperCase().startsWith('DELETE') ||
                          processedLine.toUpperCase().startsWith('ALTER'))) {
        inStatement = true;
        currentStatement = processedLine;
      } else if (inStatement && processedLine) {
        currentStatement += ' ' + processedLine;
      }
      
      // 检查语句是否结束
      if (inStatement && processedLine.endsWith(';')) {
        statements.push(currentStatement.slice(0, -1).trim()); // 移除末尾的分号
        currentStatement = '';
        inStatement = false;
      }
    }
    
    return statements;
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.db) throw new Error('数据库未连接');
      
      // 启用外键约束
      this.db.pragma('foreign_keys = ON');
      
      // 读取并执行初始化SQL
      const initSqlPath = path.join(__dirname, 'init.sql');
      console.log('初始化SQL文件路径:', initSqlPath);
      console.log('文件是否存在:', fs.existsSync(initSqlPath));
      
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      console.log('SQL文件内容长度:', initSql.length);
      
      // 更智能地分割SQL语句
      const statements = this.parseSqlStatements(initSql);

      console.log('要执行的SQL语句数量:', statements.length);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`执行第${i + 1}条SQL语句:`, statement.substring(0, 50) + '...');
        console.log(`完整SQL语句:`, statement);
        try {
          this.db.exec(statement);
          console.log(`✅ 第${i + 1}条SQL语句执行成功`);
        } catch (error) {
          console.error(`❌ 第${i + 1}条SQL语句执行失败:`, error);
          throw error;
        }
      }
      
      console.log('数据库初始化完成');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  // 执行SQL语句（无返回结果）
  run(sql: string, params: any[] = []): any {
    if (!this.db) {
      throw new Error('数据库未连接');
    }
    return this.db.prepare(sql).run(params);
  }

  // 查询单行数据
  get<T = any>(sql: string, params: any[] = []): T | undefined {
    if (!this.db) {
      throw new Error('数据库未连接');
    }
    return this.db.prepare(sql).get(params) as T | undefined;
  }

  // 查询多行数据
  all<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) {
      throw new Error('数据库未连接');
    }
    return this.db.prepare(sql).all(params) as T[];
  }

  // 开始事务
  beginTransaction(): void {
    this.run('BEGIN TRANSACTION');
  }

  // 提交事务
  commit(): void {
    this.run('COMMIT');
  }

  // 回滚事务
  rollback(): void {
    this.run('ROLLBACK');
  }

  // 关闭数据库连接
  close(): void {
    if (this.db) {
      this.db.close();
      console.log('数据库连接已关闭');
      this.db = null;
    }
  }

  // 备份数据库
  async backup(backupPath: string): Promise<void> {
    try {
      // 确保备份目录存在
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // 复制数据库文件
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`数据库备份完成: ${backupPath}`);
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw error;
    }
  }

  // 恢复数据库
  async restore(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('备份文件不存在');
      }
      
      // 关闭当前连接
      this.close();
      
      // 恢复数据库文件
      fs.copyFileSync(backupPath, DB_PATH);
      
      // 重新连接
      await this.connect();
      
      console.log(`数据库恢复完成: ${backupPath}`);
    } catch (error) {
      console.error('数据库恢复失败:', error);
      throw error;
    }
  }
}

// 创建数据库实例
const database = new DatabaseManager();

// ES模块导出
export default database;
export { DatabaseManager };