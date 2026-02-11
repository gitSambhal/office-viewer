import { FileType, SheetData } from '../types';

declare const XLSX: any;

// File type detection
const EXTENSION_MAP: Record<string, FileType> = {
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

const getFileType = (fileName: string): FileType => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || 'unknown';
};

const processExcel = (buffer: ArrayBuffer) => {
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
      });

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
};

// Listen for messages from main thread
self.addEventListener('message', async (e) => {
  const { file, fileName } = e.data;

  try {
    const type = getFileType(fileName);

    if (type === 'xlsx') {
      const buffer = await file.arrayBuffer();
      const result = processExcel(buffer);
      self.postMessage({
        success: true,
        data: { type, data: result },
        fileName
      });
    } else if (type === 'docx' || type === 'pdf' || type === 'rtf' || type === 'pptx') {
      const buffer = await file.arrayBuffer();
      self.postMessage({
        success: true,
        data: { type, data: buffer },
        fileName
      });
    } else if (type === 'txt' || type === 'md') {
      const text = await file.text();
      self.postMessage({
        success: true,
        data: { type, data: text },
        fileName
      });
    } else {
      self.postMessage({
        success: true,
        data: { type: 'unknown', data: null },
        fileName
      });
    }
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file content',
      fileName
    });
  }
});

export { };
