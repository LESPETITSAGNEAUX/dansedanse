
/**
 * Dataset Validation and Cleaning Script
 * Vérifie l'intégrité des données d'entraînement
 */

import { getDataCollector } from '../server/bot/ml-ocr/data-collector';
import { promises as fs } from 'fs';
import path from 'path';

interface ValidationReport {
  totalSamples: number;
  validSamples: number;
  invalidSamples: number;
  duplicates: number;
  lowConfidence: number;
  missingImages: number;
  issues: Array<{
    sampleId: string;
    issue: string;
    severity: 'warning' | 'error';
  }>;
}

class DatasetValidator {
  private report: ValidationReport;
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'server/bot/ml-ocr/training-data');
    this.report = {
      totalSamples: 0,
      validSamples: 0,
      invalidSamples: 0,
      duplicates: 0,
      lowConfidence: 0,
      missingImages: 0,
      issues: []
    };
  }

  async validate(): Promise<void> {
    console.log('🔍 Validating training dataset...\n');
    
    const collector = await getDataCollector();
    const samples = collector.getSamples();
    
    this.report.totalSamples = samples.length;
    
    const seenHashes = new Set<string>();
    
    for (const sample of samples) {
      // Check image existence
      const imagePath = path.join(this.dataPath, 'images', `${sample.id}.png`);
      const exists = await this.fileExists(imagePath);
      
      if (!exists) {
        this.report.missingImages++;
        this.report.issues.push({
          sampleId: sample.id,
          issue: 'Image file missing',
          severity: 'error'
        });
        continue;
      }
      
      // Check confidence
      if (sample.confidence < 0.7) {
        this.report.lowConfidence++;
        this.report.issues.push({
          sampleId: sample.id,
          issue: `Low confidence: ${sample.confidence.toFixed(2)}`,
          severity: 'warning'
        });
      }
      
      // Check duplicates (basic hash of label + dimensions)
      const hash = `${sample.category}_${sample.label}_${sample.width}_${sample.height}`;
      if (seenHashes.has(hash)) {
        this.report.duplicates++;
      } else {
        seenHashes.add(hash);
      }
      
      // Check label validity
      if (!this.isValidLabel(sample.category, sample.label)) {
        this.report.invalidSamples++;
        this.report.issues.push({
          sampleId: sample.id,
          issue: `Invalid label "${sample.label}" for category ${sample.category}`,
          severity: 'error'
        });
        continue;
      }
      
      this.report.validSamples++;
    }
    
    this.printReport();
  }

  private isValidLabel(category: string, label: string): boolean {
    const validLabels: Record<string, string[]> = {
      rank: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
      suit: ['s', 'h', 'd', 'c'],
      digit: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', 'K', 'M', 'B', '$', '€']
    };
    
    return validLabels[category]?.includes(label) ?? false;
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  private printReport(): void {
    console.log('═══════════════════════════════════════');
    console.log('       DATASET VALIDATION REPORT');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`Total Samples: ${this.report.totalSamples}`);
    console.log(`Valid Samples: ${this.report.validSamples} ✅`);
    console.log(`Invalid Samples: ${this.report.invalidSamples} ❌`);
    console.log(`Duplicates: ${this.report.duplicates} ⚠️`);
    console.log(`Low Confidence: ${this.report.lowConfidence} ⚠️`);
    console.log(`Missing Images: ${this.report.missingImages} ❌\n`);
    
    if (this.report.issues.length > 0) {
      console.log('Issues Found:');
      const errors = this.report.issues.filter(i => i.severity === 'error');
      const warnings = this.report.issues.filter(i => i.severity === 'warning');
      
      if (errors.length > 0) {
        console.log(`\n  Errors (${errors.length}):`);
        errors.slice(0, 10).forEach(issue => {
          console.log(`    - ${issue.sampleId}: ${issue.issue}`);
        });
        if (errors.length > 10) {
          console.log(`    ... and ${errors.length - 10} more`);
        }
      }
      
      if (warnings.length > 0) {
        console.log(`\n  Warnings (${warnings.length}):`);
        warnings.slice(0, 10).forEach(issue => {
          console.log(`    - ${issue.sampleId}: ${issue.issue}`);
        });
        if (warnings.length > 10) {
          console.log(`    ... and ${warnings.length - 10} more`);
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════\n');
  }

  async saveReport(): Promise<void> {
    const reportPath = path.join(
      this.dataPath,
      `validation-report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`Report saved: ${reportPath}\n`);
  }
}

async function main() {
  const validator = new DatasetValidator();
  await validator.validate();
  await validator.saveReport();
}

if (require.main === module) {
  main();
}

export { DatasetValidator };
