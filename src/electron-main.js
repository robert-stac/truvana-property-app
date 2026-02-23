const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Truvana Holdings. Management",
    // This allows the app to remember its size and state
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the live URL. 
  // The PWA Service Worker will handle the offline storage automatically.
  win.loadURL('https://your-app-name.netlify.app');

  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);