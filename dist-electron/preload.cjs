"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露受保护的方法给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 获取应用版本
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // 获取应用路径
    getAppPath: (name) => electron_1.ipcRenderer.invoke('get-app-path', name),
    // 在文件夹中显示文件
    showItemInFolder: (fullPath) => electron_1.ipcRenderer.invoke('show-item-in-folder', fullPath),
    // 打开外部链接
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    // 平台信息
    platform: process.platform,
    // 检查是否在Electron环境中
    isElectron: true
});
