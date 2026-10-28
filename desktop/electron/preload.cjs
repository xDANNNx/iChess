const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ichessDesktop', Object.freeze({ version: () => ipcRenderer.invoke('ichess:version'), openOnline: () => ipcRenderer.invoke('ichess:open-online') }));
