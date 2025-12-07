const { app, BrowserWindow, ipcMain, Tray, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let serverStarted = false;

// Charger .env depuis le bon emplacement
function loadEnvFile() {
  // Obtenir le chemin de l'exécutable
  const exePath = process.execPath;
  const exeDir = path.dirname(exePath);
  
  // Pour les exécutables pkg, resources est souvent dans le même dossier
  const possibleEnvPaths = [
    path.join(exeDir, '.env'), // Même dossier que l'exe (priorité absolue)
    path.join(exeDir, '..', '.env'), // Dossier parent de l'exe
    path.join(process.cwd(), '.env'), // Dossier courant
    path.join(__dirname, '.env'), // Dossier du script
    path.join(__dirname, '..', '.env'), // Dossier parent du script
  ];
  
  // Ajouter app.getPath seulement si app est prêt
  if (app.isReady()) {
    possibleEnvPaths.push(path.join(app.getPath('exe'), '..', '.env'));
    possibleEnvPaths.push(path.join(app.getPath('userData'), '.env'));
  }

  console.log('[Electron] Recherche .env dans:');
  console.log('[Electron] - Exe path:', exePath);
  console.log('[Electron] - Exe dir:', exeDir);
  console.log('[Electron] - CWD:', process.cwd());
  console.log('[Electron] - __dirname:', __dirname);

  for (const envPath of possibleEnvPaths) {
    console.log(`[Electron] Vérification: ${envPath}`);
    if (fs.existsSync(envPath)) {
      console.log(`[Electron] ✅ Fichier .env trouvé: ${envPath}`);
      require('dotenv').config({ path: envPath });
      return true;
    }
  }

  console.error('[Electron] ❌ Aucun fichier .env trouvé dans:', possibleEnvPaths);
  return false;
}

// Charger .env avant tout
const envLoaded = loadEnvFile();

const isDev = !app.isPackaged;
const PORT = process.env.PORT || 5000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false,
    backgroundColor: '#1a1a2e'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Ouvrir Dashboard', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Ouvrir dans le navigateur', 
      click: () => {
        shell.openExternal(`http://localhost:${PORT}`);
      }
    },
    { type: 'separator' },
    { 
      label: 'Quitter', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('GTO Poker Bot');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function startServer() {
  if (serverStarted) {
    console.log('[Server] Already started');
    return;
  }

  const serverPath = path.join(__dirname, '..', 'dist', 'index.cjs');
  const envPath = path.join(__dirname, '..', '.env'); // Ce chemin n'est plus utilisé pour la vérification initiale

  // Vérifier si .env existe (cette vérification est maintenant gérée par loadEnvFile)
  // if (!require('fs').existsSync(envPath)) { ... }

  process.env.NODE_ENV = 'production';
  process.env.PORT = PORT.toString();

  console.log('[Server] Loading server from:', serverPath);
  console.log('[Server] Working directory:', path.join(__dirname, '..'));

  try {
    // Changer le working directory pour le serveur
    process.chdir(path.join(__dirname, '..'));

    // Charger le serveur directement (pas de spawn)
    require(serverPath);

    serverStarted = true;
    console.log('[Server] Started successfully');
  } catch (error) {
    console.error('[Server] Failed to start:', error);

    // Afficher une erreur si la BDD n'est pas accessible
    if (error.message && (error.message.includes('DATABASE_URL') || error.message.includes('ECONNREFUSED'))) {
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Erreur de base de données',
        'Impossible de se connecter à la base de données PostgreSQL.\n\n' +
        'Vérifiez que:\n' +
        '1. PostgreSQL est installé et démarré\n' +
        '2. Le fichier .env contient DATABASE_URL\n' +
        '3. La base de données "poker_bot" existe\n\n' +
        'Lancez "INIT-DATABASE.bat" pour configurer automatiquement.\n\n' +
        'Erreur: ' + error.message
      );
      app.quit();
      return;
    }

    // Retry après 3 secondes pour autres erreurs
    if (!app.isQuitting) {
      setTimeout(() => {
        serverStarted = false;
        startServer();
      }, 3000);
    }
  }
}

app.whenReady().then(() => {
  // Vérifier que .env est chargé
  if (!envLoaded) {
    const { dialog } = require('electron');
    const exeDir = path.dirname(process.execPath);
    dialog.showErrorBox(
      'Configuration manquante',
      'Le fichier .env est manquant.\n\n' +
      'Veuillez:\n' +
      '1. Exécuter script\\INIT-DATABASE.bat\n' +
      '2. Copier le fichier .env dans le MÊME DOSSIER que l\'exécutable\n\n' +
      'Dossier de l\'exécutable: ' + exeDir + '\n' +
      'Fichier attendu: ' + path.join(exeDir, '.env') + '\n\n' +
      'Note: Le .env doit être directement à côté du fichier .exe'
    );
    return;
  }

  startServer();

  setTimeout(() => {
    createWindow();
    createTray();
  }, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Ne pas quitter l'app sur Windows
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

ipcMain.handle('get-server-status', () => {
  return {
    running: serverStarted,
    port: PORT
  };
});

ipcMain.handle('restart-server', () => {
  // Le serveur tourne dans le même processus, pas besoin de restart
  return { success: true, message: 'Server runs in-process' };
});