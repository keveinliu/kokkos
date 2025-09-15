import { contextBridge, ipcRenderer } from 'electron';

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 获取应用路径
  getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
  
  // 在文件夹中显示文件
  showItemInFolder: (fullPath: string) => ipcRenderer.invoke('show-item-in-folder', fullPath),
  
  // 打开外部链接
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // 平台信息
  platform: process.platform,
  
  // 检查是否在Electron环境中
  isElectron: true
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppPath: (name: string) => Promise<string>;
      showItemInFolder: (fullPath: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      platform: string;
      isElectron: boolean;
    };
  }
}