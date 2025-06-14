const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { spawn } = require('child_process');
const os = require('os');

const userDataPath = app.getPath('userData');
const preferencesFilePath = path.join(userDataPath, 'preferences.json');
const gamesFilePath = path.join(userDataPath, 'games.json');

let isFirstRun = false;

async function initializeConfigFiles() {
    if (!fsSync.existsSync(userDataPath)) {
        await fs.mkdir(userDataPath, { recursive: true });
    }

    if (!fsSync.existsSync(preferencesFilePath)) {
        const defaultPreferences = {
            theme: "system",
            lang: "en-us"
        };
        await fs.writeFile(preferencesFilePath, JSON.stringify(defaultPreferences, null, 2));
        isFirstRun = true;
    }

    if (!fsSync.existsSync(gamesFilePath)) {
        const defaultGames = {
            games: []
        };
        await fs.writeFile(gamesFilePath, JSON.stringify(defaultGames, null, 2));
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'public', 'js', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: false,
        transparent: false
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
}

function createEditorWindow() {
    const editorWindow = new BrowserWindow({
        width: 900,
        height: 700,
        parent: BrowserWindow.getFocusedWindow(),
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'public', 'js', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: true
    });

    editorWindow.loadFile(path.join(__dirname, 'public', 'editor.html'));

    editorWindow.once('ready-to-show', () => {
        editorWindow.show();
    });
}

app.whenReady().then(async () => {
    await initializeConfigFiles();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('minimize-window', (event) => {
    BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.on('maximize-unmaximize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window.isMaximized()) {
        window.unmaximize();
    } else {
        window.maximize();
    }
});

ipcMain.on('close-window', (event) => {
    BrowserWindow.fromWebContents(event.sender).close();
});

ipcMain.handle('get-initial-data', async () => {
    const preferences = JSON.parse(await fs.readFile(preferencesFilePath, 'utf-8'));
    const games = JSON.parse(await fs.readFile(gamesFilePath, 'utf-8'));
    return { preferences, games, isFirstRun };
});

ipcMain.handle('save-preferences', async (event, newPreferences) => {
    await fs.writeFile(preferencesFilePath, JSON.stringify(newPreferences, null, 2));
    return true;
});

ipcMain.handle('read-games-data', async () => {
    return JSON.parse(await fs.readFile(gamesFilePath, 'utf-8'));
});

ipcMain.handle('save-games-data', async (event, newGamesData) => {
    await fs.writeFile(gamesFilePath, JSON.stringify(newGamesData, null, 2));
    return true;
});

ipcMain.handle('open-editor-window', () => {
    createEditorWindow();
});

ipcMain.handle('get-app-data-path', () => {
    return userDataPath;
});

function resolveEnvPath(filePath) {
    let resolved = filePath;
    if (process.platform === 'win32') {
        resolved = resolved.replace(/%([^%]+)%/g, (match, envVar) => {
            return process.env[envVar] || match;
        });
    } else {
        resolved = resolved.replace(/\$([a-zA-Z_]+)/g, (match, envVar) => {
            return process.env[envVar] || match;
        });
        resolved = resolved.replace(/^~/, os.homedir());
    }
    return resolved;
}

ipcMain.handle('scan-default-game-dirs', async () => {
    const defaultGameDirsUrl = 'https://steveow.vercel.app/pages/gamelauncher/defaultGameDirs.json';
    try {
        const response = await fetch(defaultGameDirsUrl);
        if (!response.ok) {
            throw new Error(`HTTP Status: ${response.status}`);
        }
        const defaultDirs = await response.json(); 

        let gamesData = JSON.parse(await fs.readFile(gamesFilePath, 'utf-8'));
        let newGamesAdded = 0;

        for (const dirPathWithEnv of defaultDirs) {
            const baseResolvedPath = resolveEnvPath(dirPathWithEnv);
            let pathsToScan = [];

            if (baseResolvedPath.includes('*')) {
                const parts = baseResolvedPath.split(path.sep);
                const wildcardIndex = parts.indexOf('*');
                
                if (wildcardIndex !== -1) {
                    const dirBeforeWildcard = path.join(...parts.slice(0, wildcardIndex));
                    const remainingPath = parts.slice(wildcardIndex + 1);

                    try {
                        const subDirs = await fs.readdir(dirBeforeWildcard, { withFileTypes: true });
                        for (const dirent of subDirs) {
                            if (dirent.isDirectory()) {
                                const potentialPath = path.join(dirBeforeWildcard, dirent.name, ...remainingPath);
                                pathsToScan.push(potentialPath);
                            }
                        }
                    } catch (err) {
                        console.warn(`Could not read directory for wildcard expansion: ${dirBeforeWildcard}. Error: ${err.message}`);
                    }
                }
            } else {
                pathsToScan.push(baseResolvedPath);
            }

            for (const finalPath of pathsToScan) {
                try {
                    await fs.access(finalPath, fsSync.constants.F_OK); 
                    console.log(`[Scan] Path exists: ${finalPath}`);

                    let gameName = path.basename(finalPath, path.extname(finalPath));
                    gameName = gameName.replace(/Client(?:-Win64-Shipping)?$/, '').trim();
                    gameName = gameName.replace(/Launcher$/, '').trim();
                    gameName = gameName.replace(/_/g, ' ').trim();


                    const isDuplicate = gamesData.games.some(game => game.path === finalPath);

                    if (!isDuplicate) {
                        gamesData.games.push({
                            name: gameName,
                            path: finalPath,
                            coverArt: `https://via.placeholder.com/150/0000FF/FFFFFF?text=${encodeURIComponent(gameName.substring(0, 2).toUpperCase())}`,
                            launch: [{ type: "Default Launch", command: finalPath }]
                        });
                        newGamesAdded++;
                    }
                } catch (error) {
                    console.log(`[Scan] Path "${finalPath}" not found or accessible.`);
                }
            }
        }

        await fs.writeFile(gamesFilePath, JSON.stringify(gamesData, null, 2));
        return { success: true, newGamesAdded, message: `Scanned and added ${newGamesAdded} new games.` };

    } catch (error) {
        console.error('Failed to scan for games:', error);
        return { success: false, message: `Failed to scan for games: ${error.message}` };
    }
});

ipcMain.handle('launch-game', async (event, gameCommand) => {
    try {
        if (gameCommand.startsWith('http://') || gameCommand.startsWith('https://') || gameCommand.includes('://')) {
            await shell.openExternal(gameCommand);
        } else {
            const parts = gameCommand.split(' ');
            const command = parts[0];
            const args = parts.slice(1);

            if (fsSync.existsSync(command)) {
                const child = spawn(command, args, { detached: true, stdio: 'ignore' });
                child.unref();
            } else {
                await shell.openPath(gameCommand);
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to launch game:', error);
        return { success: false, message: `Failed to launch game: ${error.message}` };
    }
});