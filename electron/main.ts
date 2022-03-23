import { app, BrowserWindow, nativeImage, Menu, ipcMain } from 'electron';

import * as path from 'path';

import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { IpcMain } from './IpcMain';
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import Big from "big.js";
import Store from "electron-store";

import { getGAnalyticsCode, getUACode, actionEvent, transactionEvent, pageView } from './UsageAnalytics';

(global as any).actionEvent = actionEvent;
(global as any).transactionEvent = transactionEvent;
(global as any).pageView = pageView;
(global as any).getUACode = getUACode;
(global as any).getGAnalyticsCode = getGAnalyticsCode;


let win: BrowserWindow | null = null;
let ipcmain: IpcMain | null = null;
const isDev = process.env.NODE_ENV === 'development'; // change true, in developing mode
const store = new Store();

// Updater log setup
log.transports.file.level = "debug"
autoUpdater.logger = log
log.info('App starting...');

function sendStatusToWindow(text: string) {
  log.info(text);
  win?.webContents.send(text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})

autoUpdater.on('error', (err) => {
  sendStatusToWindow(`Error in auto-updater. ${err}`);
})

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('update_available');
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('update_downloaded');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = `${log_message} - Downloaded ${Big(progressObj.percent).toFixed(2)}%`;
  log_message = `${log_message} (${progressObj.transferred}/${progressObj.total})`;

  sendStatusToWindow(log_message);
})

function createWindow() {
  const iconPath = path.join(__dirname, '/public/icon.png').replace(/\\/g, '\\\\');
  const iconImage = nativeImage.createFromPath(iconPath);
  iconImage.setTemplateImage(true);
  ipcmain = new IpcMain();
  ipcmain.setup();

  win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 702,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      devTools: isDev,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    resizable: true,
    icon: iconImage,
  });

  // Note that all efforts to hide menus only work on Windows and Linux
  // The option Menu.setApplicationMenu(null) seemed to have worked on all platforms, but it had some breaking behaviors
  // It killed the clipboard copying capability and added a delay on startup
  win.setMenuBarVisibility(false);
  win.removeMenu();


  if (isDev) {
    win.loadURL('http://localhost:3000/index.html');
  } else {
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  win.on('closed', () => (win = null));

  // Open default browser when direct to external
  win.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Hot Reloading
  if (isDev) {
    // 'node_modules/.bin/electronPath'
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      forceHardReset: true,
      hardResetMethod: 'exit',
    });
  }


  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));

  if (isDev) {
    win.webContents.openDevTools();
  }

  actionEvent('App', 'Open', 'AppOpened', 0)
}

app.on('window-all-closed', () => {
  actionEvent('App', 'Close', 'AppClosed', 0)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {

  if (win === null) {
    createWindow();
  }

});

app.on('ready', async function () {
  app.allowRendererProcessReuse = false
  createWindow();

  await new Promise(resolve => setTimeout(resolve, 20_000));

  const autoUpdateExpireTime = store.get('autoUpdateExpireTime');
  if(!autoUpdateExpireTime) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

ipcMain.handle('get_auto_update_expire_time', (event) => {
  return store.get('autoUpdateExpireTime');
});

ipcMain.on('set_auto_update_expire_time', (event, arg) => {
  store.set('autoUpdateExpireTime', arg);
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('auto_updater_restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('restart_app', () => {
  app.relaunch();
  app.exit(0);
})


