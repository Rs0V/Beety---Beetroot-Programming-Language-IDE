
const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');
const { ipcMain, dialog } = require('electron');
const { eventNames } = require('process');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';


let settingsWin = null;
// Create the main window
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Beety IDE',
        width: isDev ? 1140 : 1024,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
    });
    mainWindow.setIcon('assets/Beety(icon)-fin.ico');

    // Open devtools if in developer environment
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

    ipcMain.on('getOpenFolder', (event) => {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            if (!result.canceled)
                event.sender.send('openFolder', result.filePaths[0]);
        }).catch(err => {
            console.log(err);
        });
    });

    ipcMain.on('closeApp', (event) => {
        mainWindow.close();
    });
    ipcMain.on('maxApp', (event) => {
        mainWindow.maximize();
    });
    ipcMain.on('unmaxApp', (event) => {
        mainWindow.unmaximize();
    });
    ipcMain.on('minApp', (event) => {
        mainWindow.minimize();
    });
    ipcMain.on('openSettings', (event) => {
        if (settingsWin && settingsWin.isDestroyed())
            settingsWin = null;
        if (settingsWin === null)
            createSettingsWindow();
    });
}

// Create about window
function createSettingsWindow() {
    settingsWin = new BrowserWindow({
        title: 'Beety - Settings',
        width: 960,
        height: 640,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
    });
    settingsWin.setIcon('assets/Beety(icon)-fin.ico');
    settingsWin.removeMenu();
    if (isDev) {
        settingsWin.webContents.openDevTools();
    }

    settingsWin.loadFile(path.join(__dirname, './renderer/settings.html'));

    ipcMain.on('closeSettings', (event) => {
        settingsWin.close();
    });
    ipcMain.on('maxSettings', (event) => {
        settingsWin.maximize();
    });
    ipcMain.on('unmaxSettings', (event) => {
        settingsWin.unmaximize();
    });
    ipcMain.on('minSettings', (event) => {
        settingsWin.minimize();
    });
}

// App is ready
app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    // Menu.setApplicationMenu(mainMenu);
    Menu.setApplicationMenu(null);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Menu template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [{
                label: 'About',
                click: createSettingsWindow
            }]
        }]
    : []),
    {
        role: 'fileMenu',
        // label: 'File',
        // submenu: [
        //     {
        //         label: 'Quit',
        //         click: () => app.quit(),
        //         accelerator: 'CmdOrCtrl+W'
        //     }
        // ]
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click: createSettingsWindow
            }]
        }]
    : [])
];

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});
