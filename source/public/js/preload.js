const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences),
  readGamesData: () => ipcRenderer.invoke('read-games-data'),
  saveGamesData: (gamesData) => ipcRenderer.invoke('save-games-data', gamesData),
  openEditorWindow: () => ipcRenderer.invoke('open-editor-window'),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  scanDefaultGameDirs: () => ipcRenderer.invoke('scan-default-game-dirs'),
  launchGame: (command) => ipcRenderer.invoke('launch-game', command),
  // Window control APIs - These use ipcRenderer.send for one-way communication
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeUnmaximizeWindow: () => ipcRenderer.send('maximize-unmaximize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
});