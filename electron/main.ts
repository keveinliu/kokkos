import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';

// 保持对窗口对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，窗口会被自动地关闭
let mainWindow: BrowserWindow | null = null;
let apiServer: ChildProcess | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 启动API服务器
function startApiServer() {
  if (isDev) {
    // 开发模式下，假设API服务器已经在运行
    return;
  }

  // 生产模式下启动API服务器
  const apiPath = join(__dirname, '../api/server.js');
  apiServer = spawn('node', [apiPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  apiServer.on('error', (error) => {
    console.error('API服务器启动失败:', error);
  });

  apiServer.on('exit', (code) => {
    console.log(`API服务器退出，退出码: ${code}`);
  });
}

// 停止API服务器
function stopApiServer() {
  if (apiServer) {
    apiServer.kill();
    apiServer = null;
  }
}

async function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'hiddenInset', // macOS风格的标题栏
    show: false, // 先不显示，等加载完成后再显示
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 开发模式下打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 当窗口被关闭时发出
  mainWindow.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 阻止导航到外部URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = new URL(mainWindow!.webContents.getURL());
    
    if (parsedUrl.origin !== currentUrl.origin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// 设置应用菜单
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '芥子博客',
      submenu: [
        {
          label: '关于芥子博客',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: '服务',
          role: 'services'
        },
        { type: 'separator' },
        {
          label: '隐藏芥子博客',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: '隐藏其他',
          accelerator: 'Command+Shift+H',
          role: 'hideOthers'
        },
        {
          label: '显示全部',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'Command+Z',
          role: 'undo'
        },
        {
          label: '重做',
          accelerator: 'Shift+Command+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: '剪切',
          accelerator: 'Command+X',
          role: 'cut'
        },
        {
          label: '复制',
          accelerator: 'Command+C',
          role: 'copy'
        },
        {
          label: '粘贴',
          accelerator: 'Command+V',
          role: 'paste'
        },
        {
          label: '全选',
          accelerator: 'Command+A',
          role: 'selectAll'
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'Command+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: '强制重新加载',
          accelerator: 'Command+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          label: '切换开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        {
          label: '实际大小',
          accelerator: 'Command+0',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.zoomLevel = 0;
            }
          }
        },
        {
          label: '放大',
          accelerator: 'Command+Plus',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.zoomLevel += 0.5;
            }
          }
        },
        {
          label: '缩小',
          accelerator: 'Command+-',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.zoomLevel -= 0.5;
            }
          }
        },
        { type: 'separator' },
        {
          label: '切换全屏',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        }
      ]
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'Command+M',
          role: 'minimize'
        },
        {
          label: '关闭',
          accelerator: 'Command+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: '前置所有窗口',
          role: 'front'
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于芥子博客',
          click: () => {
            shell.openExternal('https://github.com/your-username/jiezi-blog');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  // 启动API服务器
  startApiServer();
  
  // 创建窗口
  createWindow();
  
  // 创建菜单
  createMenu();

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当全部窗口关闭时退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    stopApiServer();
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  stopApiServer();
});

// IPC 处理程序
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', (event, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('show-item-in-folder', (event, fullPath: string) => {
  shell.showItemInFolder(fullPath);
});

ipcMain.handle('open-external', (event, url: string) => {
  shell.openExternal(url);
});

// 在这个文件中，你可以包含应用程序剩余的所有主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。