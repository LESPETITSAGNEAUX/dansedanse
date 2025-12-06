import type { Frame, NormalizedFrame, PreprocessingStep } from '../types';

export interface NormalizationConfig {
  targetWidth?: number;
  targetHeight?: number;
  targetFormat?: Frame['format'];
  steps?: PreprocessingStep[];
  contrastEnhancement?: number;
  brightnessAdjustment?: number;
}

const DEFAULT_CONFIG: NormalizationConfig = {
  targetFormat: 'grayscale',
  steps: ['grayscale', 'contrast_enhance'],
  contrastEnhancement: 1.2,
  brightnessAdjustment: 0,
};

export class FrameNormalizer {
  private config: NormalizationConfig;

  constructor(config: Partial<NormalizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  normalize(frame: Frame): NormalizedFrame {
    let data = Buffer.from(frame.data);
    let width = frame.width;
    let height = frame.height;
    let format = frame.format;
    let scaleFactor = 1;

    const steps = this.config.steps || [];

    for (const step of steps) {
      switch (step) {
        case 'grayscale':
          if (format !== 'grayscale') {
            data = this.toGrayscale(data, format);
            format = 'grayscale';
          }
          break;
        case 'threshold':
          data = this.applyThreshold(data, 128);
          break;
        case 'adaptive_threshold':
          data = this.applyAdaptiveThreshold(data, width, height);
          break;
        case 'contrast_enhance':
          data = this.enhanceContrast(data, this.config.contrastEnhancement || 1.2);
          break;
        case 'denoise':
          data = this.denoise(data, width, height);
          break;
        case 'sharpen':
          data = this.sharpen(data, width, height);
          break;
        case 'scale_2x':
          const scaled2x = this.scale(data, width, height, 2);
          data = scaled2x.data;
          width = scaled2x.width;
          height = scaled2x.height;
          scaleFactor *= 2;
          break;
        case 'scale_4x':
          const scaled4x = this.scale(data, width, height, 4);
          data = scaled4x.data;
          width = scaled4x.width;
          height = scaled4x.height;
          scaleFactor *= 4;
          break;
        case 'invert':
          data = this.invert(data);
          break;
        case 'deskew':
          break;
        case 'remove_background':
          data = this.removeBackground(data, width, height);
          break;
      }
    }

    const histogram = this.calculateHistogram(data);
    const meanBrightness = this.calculateMeanBrightness(data);
    const contrast = this.calculateContrast(data);

    return {
      ...frame,
      data,
      width,
      height,
      format,
      normalized: true,
      originalWidth: frame.width,
      originalHeight: frame.height,
      scaleFactor,
      histogram,
      meanBrightness,
      contrast,
    };
  }

  private toGrayscale(data: Buffer, format: Frame['format']): Buffer {
    const bytesPerPixel = format === 'rgba' ? 4 : 3;
    const pixels = data.length / bytesPerPixel;
    const grayscale = Buffer.alloc(pixels);

    for (let i = 0; i < pixels; i++) {
      const offset = i * bytesPerPixel;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      grayscale[i] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    }

    return grayscale;
  }

  private applyThreshold(data: Buffer, threshold: number): Buffer {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] >= threshold ? 255 : 0;
    }
    return result;
  }

  private applyAdaptiveThreshold(data: Buffer, width: number, height: number, blockSize: number = 11): Buffer {
    const result = Buffer.alloc(data.length);
    const halfBlock = Math.floor(blockSize / 2);
    const C = 5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += data[ny * width + nx];
              count++;
            }
          }
        }

        const localThreshold = (sum / count) - C;
        const idx = y * width + x;
        result[idx] = data[idx] > localThreshold ? 255 : 0;
      }
    }

    return result;
  }

  private enhanceContrast(data: Buffer, factor: number): Buffer {
    const result = Buffer.alloc(data.length);
    const mid = 128;

    for (let i = 0; i < data.length; i++) {
      const val = Math.round((data[i] - mid) * factor + mid);
      result[i] = Math.max(0, Math.min(255, val));
    }

    return result;
  }

  private denoise(data: Buffer, width: number, height: number): Buffer {
    const result = Buffer.alloc(data.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors: number[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            neighbors.push(data[(y + dy) * width + (x + dx)]);
          }
        }
        neighbors.sort((a, b) => a - b);
        result[y * width + x] = neighbors[4];
      }
    }

    for (let x = 0; x < width; x++) {
      result[x] = data[x];
      result[(height - 1) * width + x] = data[(height - 1) * width + x];
    }
    for (let y = 0; y < height; y++) {
      result[y * width] = data[y * width];
      result[y * width + width - 1] = data[y * width + width - 1];
    }

    return result;
  }

  private sharpen(data: Buffer, width: number, height: number): Buffer {
    const result = Buffer.alloc(data.length);
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        let k = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += data[(y + dy) * width + (x + dx)] * kernel[k++];
          }
        }
        result[y * width + x] = Math.max(0, Math.min(255, sum));
      }
    }

    return result;
  }

  private scale(data: Buffer, width: number, height: number, factor: number): { data: Buffer; width: number; height: number } {
    const newWidth = width * factor;
    const newHeight = height * factor;
    const result = Buffer.alloc(newWidth * newHeight);

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x / factor);
        const srcY = Math.floor(y / factor);
        result[y * newWidth + x] = data[srcY * width + srcX];
      }
    }

    return { data: result, width: newWidth, height: newHeight };
  }

  private invert(data: Buffer): Buffer {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = 255 - data[i];
    }
    return result;
  }

  private removeBackground(data: Buffer, width: number, height: number): Buffer {
    const result = Buffer.alloc(data.length);
    const histogram = this.calculateHistogram(data);
    
    let bgThreshold = 0;
    let maxCount = 0;
    for (let i = 200; i < 256; i++) {
      if (histogram[i] > maxCount) {
        maxCount = histogram[i];
        bgThreshold = i;
      }
    }

    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] >= bgThreshold - 20 ? 255 : data[i];
    }

    return result;
  }

  private calculateHistogram(data: Buffer): number[] {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i++) {
      histogram[data[i]]++;
    }
    return histogram;
  }

  private calculateMeanBrightness(data: Buffer): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  }

  private calculateContrast(data: Buffer): number {
    const mean = this.calculateMeanBrightness(data);
    let variance = 0;
    for (let i = 0; i < data.length; i++) {
      variance += Math.pow(data[i] - mean, 2);
    }
    return Math.sqrt(variance / data.length);
  }

  updateConfig(config: Partial<NormalizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): NormalizationConfig {
    return { ...this.config };
  }
}
