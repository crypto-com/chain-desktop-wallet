import { app, BrowserWindow, nativeImage, Menu } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

let win: BrowserWindow | null = null;

function createWindow() {
  const iconPath = path.join(__dirname, '/public/icon.png').replace(/\\/g, '\\\\');
  const iconImage = nativeImage.createFromPath(iconPath);
  iconImage.setTemplateImage(true);

  win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1280,
    height: 800,
    minWidth: 1080,
    minHeight: 702,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
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
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
