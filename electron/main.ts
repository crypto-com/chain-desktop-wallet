import { app, BrowserWindow, nativeImage, ipcMain, session } from 'electron';
import * as remoteMain from '@electron/remote/main';

import * as path from 'path';

import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { IpcMain } from './IpcMain';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Big from 'big.js';
import Store from 'electron-store';
import { APP_PROTOCOL_NAME } from '../src/config/StaticConfig';

import { getGAnalyticsCode, getUACode, actionEvent, transactionEvent, pageView } from './UsageAnalytics';
import { isValidURL } from './utils';

remoteMain.initialize();

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
log.transports.file.level = 'debug';
autoUpdater.logger = log;
log.info('App starting...');

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(APP_PROTOCOL_NAME);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  if (commandLine.length >= 2) {
    const scheme = commandLine[2];
    win.webContents.send('open-url', scheme);
  }
  win.focus();
});

app.on('open-url', (event, url) => {
  win?.webContents.send('open-url', url);
});


function sendStatusToWindow(text: string) {
  log.info(text);
  win?.webContents.send(text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow(`Error in auto-updater. ${err}`);
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('update_available');
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('update_downloaded');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = `${log_message} - Downloaded ${Big(progressObj.percent).toFixed(2)}%`;
  log_message = `${log_message} (${progressObj.transferred}/${progressObj.total})`;

  sendStatusToWindow(log_message);
});

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
      nodeIntegrationInSubFrames: true,
      devTools: isDev,
      contextIsolation: false,
      webSecurity: !isDev,
    },
    resizable: true,
    icon: iconImage,
  });

  remoteMain.enable(win.webContents);

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
    const { isValid, finalURL } = isValidURL(url);
    if (!isValid) {
      return;
    }
    require('electron').shell.openExternal(finalURL);
  });


  win.webContents.on('did-start-navigation',(e, url, isInPlace, isMainFrame) => {
    e.preventDefault();
    const { isValid, finalURL } = isValidURL(url);
    if (!isValid) {
      return;
    }
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
    .then()
    .catch(err => console.log('An error occurred: ', err));

  if (isDev) {
    win.webContents.openDevTools();
  }

  actionEvent('App', 'Open', 'AppOpened', 0);
}

app.on('window-all-closed', () => {
  actionEvent('App', 'Close', 'AppClosed', 0);
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
  createWindow();

  await new Promise(resolve => setTimeout(resolve, 20_000));

  const autoUpdateExpireTime = store.get('autoUpdateExpireTime');
  if (!autoUpdateExpireTime) {
    autoUpdater.checkForUpdatesAndNotify();
  }


  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['\
default-src '+(isDev ? 'devtools: ':'')+'\'self\' http: https: ws: wss: \'unsafe-inline\' data: blob: ; \
script-src '+(isDev ? 'devtools: ':'')+'\'self\' http: https: ws: wss: \'unsafe-inline\' \'unsafe-eval\' ; \
']
      }
    })
  })

});

app.on('web-contents-created', (event, contents) => {

  if (contents.getType() == 'window') {
    contents.on('will-navigate', (event, url) => {
      const { isValid } = isValidURL(url);
      if (!isValid) {
        event.preventDefault();
        return;
      }
    })
  }

  if (contents.getType() == 'webview') {
    // blocks any new windows from being opened
    contents.setWindowOpenHandler((detail) => {
      const { isValid } = isValidURL(detail.url);

      if (isValid) {
        return { action: 'allow' };
      }

      console.log('open url reject, not valid', detail.url);
      return { action: 'deny' };
    })

    // new-window api deprecated, but still working for now
    contents.on('new-window', (event, url, frameName, disposition, options) => {
      options.webPreferences = {
        ...options.webPreferences,
        javascript: false,
      };

      const { isValid, finalURL } = isValidURL(url);

      if (!isValid) {
        event.preventDefault();
        return;
      }

      require('electron').shell.openExternal(finalURL);
    })

    contents.on('will-navigate', (event, url) => {
      const { isValid } = isValidURL(url);
      if (!isValid) {
        event.preventDefault();
      }
    })

    // blocks 301/302 redirect if the url is not valid
    contents.on('will-redirect', (event, url) => {
      const { isValid } = isValidURL(url);
      if (!isValid) {
        event.preventDefault();
      }
    })
  }
})

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
});
