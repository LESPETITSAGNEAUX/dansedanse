const fs = require('fs');
const path = require('path');
const os = require('os');

let logDir = null;
let electronLogStream = null;
let serverLogStream = null;

function getLogDirectory() {
  if (logDir) return logDir;
  
  // Priorité: APPDATA > Documents > temp
  const appName = 'GTO Poker Bot';
  
  if (process.env.APPDATA) {
    logDir = path.join(process.env.APPDATA, appName, 'logs');
  } else if (os.homedir()) {
    logDir = path.join(os.homedir(), 'Documents', appName, 'logs');
  } else {
    logDir = path.join(os.tmpdir(), appName, 'logs');
  }
  
  // Créer le dossier s'il n'existe pas
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
  
  return logDir;
}

function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTimestamp() {
  return new Date().toISOString();
}

function getLogFilePath(type) {
  const dir = getLogDirectory();
  const date = getDateString();
  return path.join(dir, `${type}-${date}.log`);
}

function ensureLogStream(type) {
  const filePath = getLogFilePath(type);
  
  if (type === 'electron') {
    if (!electronLogStream || electronLogStream.path !== filePath) {
      if (electronLogStream) electronLogStream.end();
      electronLogStream = fs.createWriteStream(filePath, { flags: 'a' });
    }
    return electronLogStream;
  } else {
    if (!serverLogStream || serverLogStream.path !== filePath) {
      if (serverLogStream) serverLogStream.end();
      serverLogStream = fs.createWriteStream(filePath, { flags: 'a' });
    }
    return serverLogStream;
  }
}

function formatMessage(level, args) {
  const timestamp = getTimestamp();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  
  return `[${timestamp}] [${level}] ${message}\n`;
}

function appendLog(type, level, ...args) {
  try {
    const stream = ensureLogStream(type);
    const formatted = formatMessage(level, args);
    stream.write(formatted);
    
    // Aussi écrire dans un fichier "combined" pour tout voir
    const combinedPath = path.join(getLogDirectory(), `combined-${getDateString()}.log`);
    fs.appendFileSync(combinedPath, `[${type.toUpperCase()}] ${formatted}`);
  } catch (err) {
    // Fallback silencieux
  }
}

function captureConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  console.log = function(...args) {
    appendLog('electron', 'INFO', ...args);
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    appendLog('electron', 'ERROR', ...args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    appendLog('electron', 'WARN', ...args);
    originalWarn.apply(console, args);
  };
  
  console.info = function(...args) {
    appendLog('electron', 'INFO', ...args);
    originalInfo.apply(console, args);
  };
  
  console.debug = function(...args) {
    appendLog('electron', 'DEBUG', ...args);
    originalDebug.apply(console, args);
  };
  
  // Capturer les erreurs fatales
  process.on('uncaughtException', (error) => {
    const errorMsg = `FATAL UNCAUGHT EXCEPTION:\n${error.stack || error.message || error}`;
    appendLog('electron', 'FATAL', errorMsg);
    originalError.call(console, errorMsg);
    
    // Écrire de manière synchrone pour s'assurer que c'est enregistré
    try {
      const crashPath = path.join(getLogDirectory(), `crash-${Date.now()}.log`);
      fs.writeFileSync(crashPath, `${getTimestamp()}\n${errorMsg}\n`);
    } catch (e) {}
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = `UNHANDLED REJECTION:\n${reason?.stack || reason}`;
    appendLog('electron', 'FATAL', errorMsg);
    originalError.call(console, errorMsg);
  });
}

function logStartup() {
  const separator = '='.repeat(80);
  appendLog('electron', 'INFO', separator);
  appendLog('electron', 'INFO', 'APPLICATION STARTING');
  appendLog('electron', 'INFO', `Date: ${new Date().toISOString()}`);
  appendLog('electron', 'INFO', `Platform: ${process.platform}`);
  appendLog('electron', 'INFO', `Node version: ${process.version}`);
  appendLog('electron', 'INFO', `Log directory: ${getLogDirectory()}`);
  appendLog('electron', 'INFO', separator);
}

module.exports = {
  getLogDirectory,
  appendLog,
  captureConsole,
  logStartup
};
