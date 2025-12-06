
import type { Frame, NormalizedFrame } from '../types';

/**
 * Convertit un buffer RGBA en RGB
 */
export function rgbaToRgb(buffer: Buffer, width: number, height: number): Buffer {
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, j = 0; i < buffer.length; i += 4, j += 3) {
    rgb[j] = buffer[i];     // R
    rgb[j + 1] = buffer[i + 1]; // G
    rgb[j + 2] = buffer[i + 2]; // B
  }
  return rgb;
}

/**
 * Convertit un buffer RGB/RGBA en grayscale
 */
export function toGrayscale(buffer: Buffer, format: 'rgb' | 'rgba'): Buffer {
  const bytesPerPixel = format === 'rgba' ? 4 : 3;
  const pixels = buffer.length / bytesPerPixel;
  const grayscale = Buffer.alloc(pixels);
  
  for (let i = 0; i < pixels; i++) {
    const offset = i * bytesPerPixel;
    const r = buffer[offset];
    const g = buffer[offset + 1];
    const b = buffer[offset + 2];
    grayscale[i] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  }
  
  return grayscale;
}

/**
 * Convertit une frame en PNG pour export/debug
 */
export function frameToPNG(frame: Frame | NormalizedFrame): Buffer {
  // TODO: Utiliser sharp ou jimp pour convertir en PNG
  throw new Error('Not implemented - use sharp.fromBuffer().png()');
}
