import { FileType, SheetData } from '../types';

declare const XLSX: any;

export class FileProcessor {
  private static EXTENSION_MAP: Record<string, FileType> = {
    'xlsx': 'xlsx',
    'xls': 'xlsx',
    'csv': 'xlsx',
    'docx': 'docx',
    'doc': 'docx',
    'pdf': 'pdf',
    'pptx': 'pptx',
    'ppt': 'pptx',
    'ppsx': 'pptx',
    'txt': 'txt',
    'md': 'md',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'webp': 'image',
    'rtf': 'rtf'
  };

  static getFileType(fileName: string): FileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return this.EXTENSION_MAP[ext] || 'unknown';
  }

  static async process(file: File): Promise<{ type: FileType; data: any }> {
    const type = this.getFileType(file.name);
    
    if (type === 'xlsx') {
      const buffer = await file.arrayBuffer();
      return { type, data: this.processExcel(buffer) };
    }
    
    if (type === 'docx' || type === 'pdf' || type === 'rtf' || type === 'pptx') {
      const buffer = await file.arrayBuffer();
      return { type, data: buffer };
    }

    if (type === 'image') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ type, data: e.target?.result });
        reader.readAsDataURL(file);
      });
    }

    if (type === 'txt' || type === 'md') {
      const text = await file.text();
      return { type, data: text };
    }

    return { type: 'unknown', data: null };
  }

  private static processExcel(buffer: ArrayBuffer) {
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheets: { [name: string]: SheetData } = {};
    workbook.SheetNames.forEach((name: string) => {
      const worksheet = workbook.Sheets[name];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      sheets[name] = {
        headers: (jsonData[0] as string[]) || [],
        rows: jsonData.slice(1)
      };
    });
    return sheets;
  }
}