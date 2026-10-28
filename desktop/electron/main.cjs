const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');
const isDev = Boolean(process.env.ICHESS_DEV_URL);
function createWindow() {
 const win = new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,title:'iChess Desktop',backgroundColor:'#101216',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.once('ready-to-show',()=>win.show());
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://')) shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{const allowed=isDev?url.startsWith(process.env.ICHESS_DEV_URL):url.startsWith('file://');if(!allowed)event.preventDefault();});
 if(isDev)win.loadURL(process.env.ICHESS_DEV_URL);else win.loadFile(path.join(__dirname,'..','dist','index.html'));
}
ipcMain.handle('ichess:version',()=>app.getVersion());
app.whenReady().then(()=>{app.setAppUserModelId('org.ichess.desktop');createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
