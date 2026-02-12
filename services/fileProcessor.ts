import { FileType, SheetData } from '../types';
import * as XLSX from 'xlsx';

export class FileProcessor {
  private static EXTENSION_MAP: Record<string, FileType> = {
    xlsx: 'xlsx',
    xls: 'xlsx',
    csv: 'xlsx',
    docx: 'docx',
    doc: 'docx',
    pdf: 'pdf',
    txt: 'txt',
    md: 'md',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    rtf: 'rtf',
    pptx: 'pptx',
  };

  static getFileType(fileName: string): FileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return this.EXTENSION_MAP[ext] || 'unknown';
  }

  /**
   * Process file using web worker for heavy operations to avoid blocking the main thread
   */
  static async process(file: File): Promise<{ type: FileType; data: any }> {
    // Check if web workers are supported
    if (typeof Worker !== 'undefined') {
      try {
        return await this.processWithWorker(file);
      } catch (workerError) {
        console.warn('Web worker processing failed, falling back to main thread:', workerError);
        return this.processInMainThread(file);
      }
    }

    // Fallback to main thread if workers not supported
    return this.processInMainThread(file);
  }

  /**
   * Process file in web worker to avoid blocking the main thread
   */
  private static async processWithWorker(file: File): Promise<{ type: FileType; data: any }> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./fileProcessor.worker.ts', import.meta.url));

      // Set timeout for worker processing to prevent hanging
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(`File processing timed out. "${file.name}" may be too large or corrupt.`));
      }, 30000); // 30 second timeout

      worker.postMessage({ file, fileName: file.name });

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        if (e.data.success) {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.error || `Failed to process "${file.name}"`));
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Worker error:', error);
        reject(new Error(`Error processing "${file.name}". Please try again.`));
        worker.terminate();
      };
    });
  }

  /**
   * Process file directly in main thread (fallback option)
   */
  private static async processInMainThread(file: File): Promise<{ type: FileType; data: any }> {
    const type = this.getFileType(file.name);

    try {
      if (type === 'xlsx') {
        const buffer = await file.arrayBuffer();
        return { type, data: this.processExcel(buffer) };
      }

      if (type === 'docx' || type === 'pdf' || type === 'rtf' || type === 'pptx') {
        const buffer = await file.arrayBuffer();
        return { type, data: buffer };
      }

      if (type === 'image') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ type, data: e.target?.result });
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });
      }

      if (type === 'txt' || type === 'md') {
        const text = await file.text();
        return { type, data: text };
      }
    } catch (err: any) {
      console.error(`Error processing ${file.name}:`, err);
      throw new Error(err.message || 'Failed to parse file content');
    }

    return { type: 'unknown', data: null };
  }

  /**
   * Process Excel files with memory optimizations
   */
  private static processExcel(buffer: ArrayBuffer) {
    try {
      const workbook = XLSX.read(new Uint8Array(buffer), {
        type: 'array',
        dense: true,
        cellStyles: false,
        cellHTML: false,
        cellFormula: false,
      });

      const sheets: { [name: string]: SheetData } = {};

      workbook.SheetNames.forEach((name: string) => {
        const worksheet = workbook.Sheets[name];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: true,
        }) as any[][];

        sheets[name] = {
          headers: (jsonData[0] as string[]) || [],
          rows: jsonData.slice(1),
        };
      });

      return sheets;
    } catch (error) {
      console.error('Excel processing error:', error);
      throw new Error('Failed to process Excel file');
    }
  }
}
