import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function getDistPath(): string {
  // En mode production Electron (asar), utiliser process.resourcesPath
  const resourcesPath = (process as any).resourcesPath as string | undefined;
  if (resourcesPath && resourcesPath.includes('app.asar')) {
    const asarPath = path.join(resourcesPath, 'app.asar', 'dist', 'public');
    console.log('[static.ts] Mode Electron asar, distPath:', asarPath);
    return asarPath;
  }
  
  // Fallback: utiliser le répertoire courant ou __dirname si disponible
  // @ts-ignore - __dirname peut être défini par esbuild ou Node
  const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const distPath = path.resolve(baseDir, "public");
  console.log('[static.ts] Mode standard, distPath:', distPath);
  return distPath;
}

export function serveStatic(app: Express) {
  const distPath = getDistPath();
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
