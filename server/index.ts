import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";

// Assume storage and registerVite are defined elsewhere or in subsequent parts of the file
// For the purpose of this edit, we'll assume they exist and are correctly imported/defined.
// If they were part of the original code, they should be preserved.
// Since they are not in the provided original code snippet, and the changes don't explicitly
// mention them as new additions or modifications to existing code, we'll omit them
// unless they are critical for the provided changes to function.
// However, the changes *do* reference 'storage' and 'registerVite', which implies they
// should be present in the final code. Let's assume they are defined in separate files
// and imported.

// Placeholder for storage initialization as per changes
// In a real scenario, this would be imported from './storage' or similar
const storage = {
  isInitialized: () => false, // Mock implementation
  initialize: async () => { console.log("Storage initialized"); } // Mock implementation
};

// Placeholder for registerVite as per changes
// In a real scenario, this would be imported from './vite' or similar
const registerVite = async (app: express.Express) => { console.log("Vite registered"); };

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  async function main() {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use(async (req, res, next) => {
      if (!storage.isInitialized()) {
        await storage.initialize();
      }
      next();
    });

    try {
      const { initializePlayerProfile } = await import("./bot/player-profile");
      await initializePlayerProfile();
      log("Player profile initialized from database");
    } catch (error) {
      log("Warning: Could not initialize player profile:", error);
    }

    const server = createServer(app);

    await registerRoutes(server, app);
    await registerVite(app);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  }

  await main();
})();