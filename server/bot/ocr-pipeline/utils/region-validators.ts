
import type { Region, Bounds } from '../types';

/**
 * Valide qu'une région est dans les limites de la frame
 */
export function isRegionValid(region: Region, frameWidth: number, frameHeight: number): boolean {
  const { x, y, width, height } = region.bounds;
  
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    return false;
  }
  
  if (x + width > frameWidth || y + height > frameHeight) {
    return false;
  }
  
  return true;
}

/**
 * Calcule l'intersection de deux régions
 */
export function getRegionIntersection(r1: Bounds, r2: Bounds): Bounds | null {
  const x = Math.max(r1.x, r2.x);
  const y = Math.max(r1.y, r2.y);
  const width = Math.min(r1.x + r1.width, r2.x + r2.width) - x;
  const height = Math.min(r1.y + r1.height, r2.y + r2.height) - y;
  
  if (width <= 0 || height <= 0) {
    return null;
  }
  
  return { x, y, width, height };
}

/**
 * Vérifie si deux régions se chevauchent
 */
export function doRegionsOverlap(r1: Bounds, r2: Bounds): boolean {
  return getRegionIntersection(r1, r2) !== null;
}
