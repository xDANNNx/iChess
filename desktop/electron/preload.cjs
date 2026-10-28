const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ichessDesktop', Object.freeze({ version: () => ipcRenderer.invoke('ichess:version') }));
