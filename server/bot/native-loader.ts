import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Compatible CommonJS et ESM
// @ts-ignore - __dirname peut être défini par esbuild en mode CJS
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Créer require de manière compatible CJS/ESM
let esmRequire: NodeRequire;
try {
  // En ESM, utiliser createRequire
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    // @ts-ignore
    esmRequire = createRequire(import.meta.url);
  } else {
    // En CJS, utiliser require directement
    // @ts-ignore
    esmRequire = typeof require !== 'undefined' ? require : createRequire(__filename || process.cwd());
  }
} catch {
  // Fallback absolu
  // @ts-ignore
  esmRequire = require;
}

const IS_ELECTRON = !!(process as any).resourcesPath || !!process.env.ELECTRON_RUN_AS_NODE;
const IS_PACKAGED = IS_ELECTRON && !process.argv[0]?.includes('node_modules');

function getResourcesPath(): string {
  if ((process as any).resourcesPath) {
    return (process as any).resourcesPath;
  }
  return '';
}

function getUnpackedModulePath(moduleName: string): string | null {
  const resourcesPath = getResourcesPath();
  if (!resourcesPath) return null;
  
  const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', moduleName);
  
  if (!fs.existsSync(unpackedPath)) {
    console.log(`[native-loader] Unpacked path does not exist: ${unpackedPath}`);
    return null;
  }
  
  return unpackedPath;
}

function extractDefaultExport(moduleExport: any): any {
  if (moduleExport && typeof moduleExport === 'object' && moduleExport.__esModule && moduleExport.default) {
    return moduleExport.default;
  }
  if (moduleExport && typeof moduleExport === 'object' && moduleExport.default) {
    return moduleExport.default;
  }
  return moduleExport;
}

export async function loadNativeModule<T>(moduleName: string): Promise<T | null> {
  console.log(`[native-loader] Loading ${moduleName}... (isElectron: ${IS_ELECTRON}, isPackaged: ${IS_PACKAGED})`);
  
  if (IS_PACKAGED) {
    const unpackedPath = getUnpackedModulePath(moduleName);
    if (unpackedPath) {
      try {
        const resolvedPath = esmRequire.resolve(moduleName, { paths: [unpackedPath] });
        console.log(`[native-loader] Resolved ${moduleName} to: ${resolvedPath}`);
        const mod = esmRequire(resolvedPath);
        const result = extractDefaultExport(mod);
        console.log(`[native-loader] ✓ Loaded ${moduleName} from unpacked`);
        return result as T;
      } catch (e: any) {
        console.error(`[native-loader] Failed to load ${moduleName} from unpacked:`, e.message);
        
        try {
          console.log(`[native-loader] Fallback: direct require of ${unpackedPath}`);
          const mod = esmRequire(unpackedPath);
          const result = extractDefaultExport(mod);
          console.log(`[native-loader] ✓ Loaded ${moduleName} via fallback`);
          return result as T;
        } catch (e2: any) {
          console.error(`[native-loader] Fallback also failed:`, e2.message);
        }
      }
    }
  }
  
  try {
    console.log(`[native-loader] Trying createRequire for ${moduleName}`);
    const mod = esmRequire(moduleName);
    const result = extractDefaultExport(mod);
    console.log(`[native-loader] ✓ Loaded ${moduleName} via createRequire`);
    return result as T;
  } catch (e: any) {
    console.error(`[native-loader] Failed to load ${moduleName} via createRequire:`, e.message);
  }
  
  try {
    console.log(`[native-loader] Trying dynamic import for ${moduleName}`);
    const mod = await import(moduleName);
    const result = extractDefaultExport(mod);
    console.log(`[native-loader] ✓ Loaded ${moduleName} via dynamic import`);
    return result as T;
  } catch (e: any) {
    console.error(`[native-loader] Failed to load ${moduleName} via import:`, e.message);
  }
  
  console.error(`[native-loader] ❌ All attempts failed for ${moduleName}`);
  return null;
}

export function requireNativeModule<T>(moduleName: string): T | null {
  console.log(`[native-loader] requireNativeModule ${moduleName}...`);
  
  if (IS_PACKAGED) {
    const unpackedPath = getUnpackedModulePath(moduleName);
    if (unpackedPath) {
      try {
        const mod = esmRequire(unpackedPath);
        return extractDefaultExport(mod) as T;
      } catch (e: any) {
        console.error(`[native-loader] Sync load failed for ${moduleName}:`, e.message);
      }
    }
  }
  
  try {
    const mod = esmRequire(moduleName);
    return extractDefaultExport(mod) as T;
  } catch (e: any) {
    console.error(`[native-loader] createRequire failed for ${moduleName}:`, e.message);
    return null;
  }
}

export { IS_ELECTRON, IS_PACKAGED };
