import { FileType, SheetData } from '../types';

declare const XLSX: any;

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
    pptx: 'unknown', // Not fully supported yet
    ppt: 'unknown', // Not fully supported yet
  };

  static getFileType(fileName: string): FileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return this.EXTENSION_MAP[ext] || 'unknown';
  }

  static async process(file: File): Promise<{ type: FileType; data: any }> {
    const type = this.getFileType(file.name);

    try {
      if (type === 'xlsx') {
        const buffer = await file.arrayBuffer();
        return { type, data: this.processExcel(buffer) };
      }

      if (type === 'docx' || type === 'pdf' || type === 'rtf') {
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

  private static processExcel(buffer: ArrayBuffer) {
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
      });

      sheets[name] = {
        headers: (jsonData[0] as string[]) || [],
        rows: jsonData.slice(1),
      };
    });

    return sheets;
  }
}
