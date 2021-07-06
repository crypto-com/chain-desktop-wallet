import { app, BrowserWindow, nativeImage, Menu } from 'electron';
const { ipcMain } = require('electron');


import * as path from 'path';

import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { IpcMain } from './IpcMain';
import {autoUpdater} from "electron-updater";
const log = require('electron-log');


const { getGAnalyticsCode, getUACode, actionEvent, transactionEvent, pageView } = require('./UsageAnalytics');

(global as any).actionEvent = actionEvent;
(global as any).transactionEvent = transactionEvent;
(global as any).pageView = pageView;
(global as any).getUACode = getUACode;
(global as any).getGAnalyticsCode = getGAnalyticsCode;


let win: BrowserWindow | null = null;
let ipcmain: IpcMain | null = null;
// const isDev = process.env.NODE_ENV === 'development'; // change true, in developing mode
const isDev = true

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
    minWidth: 1080,
    minHeight: 702,
    webPreferences: {
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

  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  // Open default browser when direct to external
  win.webContents.on('new-window', function(e, url) {
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

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

app.on('ready', function()  {
  createWindow()
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  console.log('update-available')
  win?.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  console.log('update-downloaded')
  win?.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


