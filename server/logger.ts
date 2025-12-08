
import * as fs from "fs";
import * as path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

type LogLevel = "info" | "warning" | "error" | "debug" | "session";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

class Logger {
  private logFile: string;
  private sessionFile: string;

  constructor() {
    const date = new Date().toISOString().split("T")[0];
    this.logFile = path.join(LOGS_DIR, `bot-${date}.log`);
    this.sessionFile = path.join(LOGS_DIR, `session-${date}.log`);
  }

  private writeLog(entry: LogEntry, toSessionFile = false): void {
    const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${entry.data ? ` | DATA: ${JSON.stringify(entry.data)}` : ""}\n`;
    
    // Console
    console.log(logLine.trim());
    
    // Fichier principal
    fs.appendFileSync(this.logFile, logLine);
    
    // Fichier session si demandé
    if (toSessionFile) {
      fs.appendFileSync(this.sessionFile, logLine);
    }
  }

  info(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "info",
      component,
      message,
      data,
    });
  }

  warning(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "warning",
      component,
      message,
      data,
    });
  }

  error(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      component,
      message,
      data,
    });
  }

  debug(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "debug",
      component,
      message,
      data,
    });
  }

  session(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "session",
      component,
      message,
      data,
    }, true);
  }

  getRecentLogs(lines: number = 100): string[] {
    try {
      const content = fs.readFileSync(this.logFile, "utf-8");
      const allLines = content.split("\n").filter(l => l.trim());
      return allLines.slice(-lines);
    } catch {
      return [];
    }
  }

  getSessionLogs(): string[] {
    try {
      const content = fs.readFileSync(this.sessionFile, "utf-8");
      return content.split("\n").filter(l => l.trim());
    } catch {
      return [];
    }
  }
}

export const logger = new Logger();
