export interface GtoConfig {
  enabled: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxCacheSize: number;
}

export const gtoConfig: GtoConfig = {
  enabled: process.env.GTO_ENABLED === 'true',
  apiEndpoint: process.env.GTO_API_ENDPOINT,
  apiKey: process.env.GTO_API_KEY,
  cacheEnabled: process.env.GTO_CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.GTO_CACHE_TTL || '3600000', 10),
  maxCacheSize: parseInt(process.env.GTO_MAX_CACHE_SIZE || '10000', 10),
};

export interface BotConfig {
  scanInterval: number;
  actionDelay: { min: number; max: number };
  humanization: {
    enabled: boolean;
    baseDelay: number;
    variancePercent: number;
    clickVariance: number;
  };
}

export const botConfig: BotConfig = {
  scanInterval: parseInt(process.env.BOT_SCAN_INTERVAL || '200', 10),
  actionDelay: {
    min: parseInt(process.env.BOT_ACTION_DELAY_MIN || '500', 10),
    max: parseInt(process.env.BOT_ACTION_DELAY_MAX || '2000', 10),
  },
  humanization: {
    enabled: process.env.BOT_HUMANIZATION !== 'false',
    baseDelay: parseInt(process.env.BOT_BASE_DELAY || '800', 10),
    variancePercent: parseFloat(process.env.BOT_VARIANCE_PERCENT || '0.3'),
    clickVariance: parseInt(process.env.BOT_CLICK_VARIANCE || '5', 10),
  },
};
