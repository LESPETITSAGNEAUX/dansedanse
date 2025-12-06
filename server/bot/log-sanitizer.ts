
/**
 * Module de sanitisation des logs pour masquer les données sensibles
 */

const SENSITIVE_PATTERNS = {
  apiKey: /api[_-]?key["\s:=]+["']?([a-zA-Z0-9_-]{16,})/gi,
  password: /password["\s:=]+["']?([^"'\s,}]+)/gi,
  token: /token["\s:=]+["']?([a-zA-Z0-9._-]{20,})/gi,
  secret: /secret["\s:=]+["']?([^"'\s,}]+)/gi,
  authorization: /authorization["\s:]+bearer\s+([a-zA-Z0-9._-]+)/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  privateKey: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
  heroCards: /(hero_cards|heroCards)["\s:=]+\[([^\]]+)\]/gi,
};

const MASK = "***MASKED***";

/**
 * Sanitise un message de log
 */
export function sanitizeLog(message: string): string {
  let sanitized = message;

  // Masquer les patterns sensibles
  for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    sanitized = sanitized.replace(pattern, (match, captured) => {
      if (key === "heroCards") {
        return match.replace(captured, MASK);
      }
      return match.replace(captured, MASK);
    });
  }

  return sanitized;
}

/**
 * Sanitise un objet (pour JSON.stringify)
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeLog(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Masquer les clés sensibles
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("apikey") ||
        lowerKey.includes("api_key") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("authorization") ||
        lowerKey === "herocards" ||
        lowerKey === "hero_cards"
      ) {
        sanitized[key] = MASK;
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeObject(value);
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeLog(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  return obj;
}

/**
 * Logger sécurisé qui sanitise automatiquement
 */
export class SecureLogger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  log(message: string, ...args: any[]): void {
    console.log(`[${this.prefix}]`, sanitizeLog(message), ...args.map(sanitizeObject));
  }

  info(message: string, data?: any): void {
    console.log(`[${this.prefix}] INFO:`, sanitizeLog(message), data ? sanitizeObject(data) : "");
  }

  warn(message: string, data?: any): void {
    console.warn(`[${this.prefix}] WARN:`, sanitizeLog(message), data ? sanitizeObject(data) : "");
  }

  error(message: string, error?: any): void {
    console.error(`[${this.prefix}] ERROR:`, sanitizeLog(message), error ? sanitizeObject(error) : "");
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${this.prefix}] DEBUG:`, sanitizeLog(message), data ? sanitizeObject(data) : "");
    }
  }
}

export function createSecureLogger(prefix: string): SecureLogger {
  return new SecureLogger(prefix);
}
