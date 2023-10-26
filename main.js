
const path = require('path');
const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const { ipcMain, dialog } = require('electron');


let settingsWin = null;
// Create the main window
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Beety IDE',
        icon: path.join(__dirname, './assets/Beety(icon)-fin.ico'),
        width: 1024,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false,
            // devTools: true,
        },
        frame: false,
    });

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
    // mainWindow.webContents.openDevTools()

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
        icon: path.join(__dirname, './assets/Beety(icon)-fin.ico'),
        width: 860,
        height: 640,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false,
        },
        frame: false,
    });
    settingsWin.removeMenu();

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
    globalShortcut.register('Control+Shift+I', () => {
        return false;
    });

    createMainWindow();

    // Disable app menu
    Menu.setApplicationMenu(null);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
