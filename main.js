
const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');
const { ipcMain, dialog } = require('electron');
const { eventNames } = require('process');

const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin';


let settingsWin = null;
// Create the main window
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Beety IDE',
        width: isDev ? 1024 : 960,
        height: 640,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        // titleBarStyle: 'hidden',
        frame: false,
        /* looks nice but using title-bar buttons looks too choppy */
        // transparent: true,
        // backgroundColor: '#00000000',
    });
    mainWindow.setIcon('assets/Beety(icon)-fin.ico');

    // Open devtools if in developer environment
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

    // const { ipcMain, dialog } = require('electron');
    // ipcMain.handle('ShowMessage', (event, message) => {
    //     dialog.showDialog(mainWindow, message);
    // });

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

    ipcMain.on('closeWindow', (event) => {
        mainWindow.close();
    })
    ipcMain.on('maxWindow', (event) => {
        mainWindow.maximize();
    })
    ipcMain.on('unmaxWindow', (event) => {
        mainWindow.unmaximize();
    })
    ipcMain.on('minWindow', (event) => {
        mainWindow.minimize();
    })
    ipcMain.on('openSettings', (event) => {
        if (settingsWin && settingsWin.isDestroyed())
            settingsWin = null;
        if (settingsWin === null)
            settingsWin = createSettingsWindow();
    })
}

// Create about window
function createSettingsWindow() {
    const settingsWindow = new BrowserWindow({
        title: 'Beety - Settings',
        width: 480,
        height: 360
    });

    settingsWindow.loadFile(path.join(__dirname, './renderer/settings.html'));
    return settingsWindow;
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
