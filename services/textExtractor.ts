import { FileType, SheetData } from '../types';
import MDBReader from 'mdb-reader';
import initSqlJs from 'sql.js';
import { Buffer } from 'buffer';
import JSZip from 'jszip';

declare const mammoth: any;
declare const pdfjsLib: any;
declare const RTFJS: any;

const MAX_EXTRACT_LENGTH = 12000; // Limit total extraction to stay within AI context limits

export class TextExtractor {
    static async extractText(
        type: FileType,
        data: any,
        activeKey?: string,
        metadata?: { fileName?: string; fileSize?: number; lastModified?: number }
    ): Promise<string> {
        let content = '';
        try {
            switch (type) {
                case 'txt':
                case 'md':
                    content = typeof data === 'string' ? data : '';
                    break;

                case 'docx':
                    content = await this.extractFromDocx(data);
                    break;

                case 'pdf':
                    content = await this.extractFromPdf(data);
                    break;

                case 'xlsx':
                    content = this.extractFromExcel(data, activeKey);
                    break;

                case 'mdb':
                case 'accdb':
                    content = await this.extractFromMdb(data, activeKey);
                    break;

                case 'sqlite':
                    content = await this.extractFromSqlite(data, activeKey);
                    break;

                case 'rtf':
                    content = await this.extractFromRtf(data);
                    break;

                case 'dbf':
                    content = this.extractFromDatabase(data, 'DBF Database');
                    break;

                case 'pptx':
                    content = await this.extractFromPptx(data);
                    break;

                default:
                    content = '';
            }
        } catch (error) {
            console.error('Error extracting text:', error);
            content = '';
        }

        // Prepend metadata if available
        if (metadata) {
            let metaHeader = `=== FILE METADATA ===\n`;
            if (metadata.fileName) metaHeader += `Filename: ${metadata.fileName}\n`;
            if (metadata.fileSize) {
                const size = metadata.fileSize;
                const sizeStr = size < 1024 ? `${size} B` :
                    size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` :
                        `${(size / (1024 * 1024)).toFixed(1)} MB`;
                metaHeader += `Size: ${sizeStr} (${size} bytes)\n`;
            }
            if (metadata.lastModified) {
                metaHeader += `Last Modified: ${new Date(metadata.lastModified).toLocaleString()}\n`;
            }
            metaHeader += `=====================\n\n`;
            return metaHeader + content;
        }

        return content;
    }

    private static async extractFromDocx(data: ArrayBuffer): Promise<string> {
        if (typeof mammoth === 'undefined') {
            console.error('Mammoth library not available for DOCX extraction');
            return '';
        }
        try {
            const result = await mammoth.extractRawText({ arrayBuffer: data });
            return result.value || '';
        } catch (err) {
            console.error('Docx text extraction error:', err);
            return '';
        }
    }

    private static async extractFromPdf(data: ArrayBuffer): Promise<string> {
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not available for PDF extraction');
            return '';
        }
        try {
            // Create a copy of the ArrayBuffer to prevent "detached ArrayBuffer" errors
            // PDF.js may detach the buffer internally, so we pass a copy
            const pdfData = new Uint8Array(data.slice(0));
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                if (fullText.length > MAX_EXTRACT_LENGTH) break;
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            return fullText.substring(0, MAX_EXTRACT_LENGTH);
        } catch (err) {
            console.error('PDF text extraction error:', err);
            return '';
        }
    }

    private static extractFromExcel(sheets: Record<string, SheetData>, activeSheet?: string): string {
        if (!sheets || Object.keys(sheets).length === 0) return 'The Excel file is empty or has no recognizable data.';

        let fullText = '';

        // If activeSheet is provided, we only extract that one to maximize context room
        const sheetsToProcess = activeSheet && sheets[activeSheet]
            ? { [activeSheet]: sheets[activeSheet] }
            : sheets;

        for (const [sheetName, sheetData] of Object.entries(sheetsToProcess)) {
            if (fullText.length > MAX_EXTRACT_LENGTH) break;
            const rowCount = sheetData.rows.length;
            const colCount = sheetData.headers.length;
            if (!colCount && !rowCount) continue;

            fullText += `### [START SHEET: ${sheetName.toUpperCase()}] ###\n`;
            fullText += `CRITICAL_DOCUMENT_METADATA:\n`;
            fullText += `- TOTAL_COLUMNS: ${colCount} (Horizontal count of headers)\n`;
            fullText += `- TOTAL_ROWS: ${rowCount} (Vertical count of data records)\n\n`;

            fullText += `COLUMN HEADERS (${colCount}):\n`;
            if (colCount > 25) {
                const first10 = sheetData.headers.slice(0, 10).join(' | ');
                const last10 = sheetData.headers.slice(-10).join(' | ');
                fullText += `${first10} ... [+${colCount - 20} HIDDEN COLS] ... ${last10}\n`;
                fullText += `(Note to AI: The true total is ${colCount} columns. Trust the TOTAL_COLUMNS metadata above)\n`;
            } else {
                fullText += (sheetData.headers.join(' | ') || '(No headers found)') + '\n';
            }

            fullText += `\nDATA ROWS SAMPLE (First 50 of ${rowCount}):\n`;
            if (rowCount > 0) {
                const sheetText = sheetData.rows
                    .slice(0, 50)
                    .map((row) => row.slice(0, 15).join(' | ') + (row.length > 15 ? ` ... [+${row.length - 15} more cells]` : ''))
                    .join('\n');
                fullText += sheetText.substring(0, 3000) + '\n';
            } else {
                fullText += '(No data rows found)\n';
            }
            fullText += `### [END SHEET: ${sheetName.toUpperCase()}] ###\n\n`;
        }

        const finalOutput = fullText.trim() || 'No text content could be extracted from this Excel file.';
        return finalOutput.substring(0, MAX_EXTRACT_LENGTH);
    }

    private static async extractFromMdb(file: File | any, activeTable?: string): Promise<string> {
        try {
            let buffer: Buffer;
            if (file instanceof File) {
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } else if (file instanceof ArrayBuffer) {
                buffer = Buffer.from(file);
            } else {
                return this.extractFromDatabase(file, 'MDB/ACCDB Database');
            }

            const mdb = new MDBReader(buffer);
            let tableNames = mdb.getTableNames();

            // If activeTable is provided, we prioritize/only use that one
            if (activeTable && tableNames.includes(activeTable)) {
                tableNames = [activeTable];
            }

            let fullText = `### [DATABASE SUMMARY: ACCESS (MDB/ACCDB)] ###\n`;
            fullText += `Total Tables: ${mdb.getTableNames().length}\n\n`;

            for (const name of tableNames) {
                if (fullText.length > MAX_EXTRACT_LENGTH) break;
                try {
                    const table = mdb.getTable(name);
                    const columns = table.getColumns().map((col) => col.name);
                    const rows = table.getData();

                    fullText += `--- [TABLE: ${name}] ---\n`;
                    fullText += `Columns: ${columns.join(' | ')}\n`;
                    fullText += `Rows (count): ${rows.length}\n`;
                    fullText += `Data Preview (First 20):\n`;

                    const tableText = rows.slice(0, 20).map(row =>
                        columns.map(col => String(row[col] ?? '')).join(' | ')
                    ).join('\n');

                    fullText += tableText.substring(0, 2000) + '\n\n';
                } catch (e) {
                    fullText += `[Error reading table ${name}]\n\n`;
                }
            }
            return fullText.substring(0, MAX_EXTRACT_LENGTH);
        } catch (err) {
            console.error('MDB text extraction error:', err);
            return 'Failed to extract text from Access database.';
        }
    }

    private static async extractFromSqlite(file: File | any, activeTable?: string): Promise<string> {
        try {
            let uint8Data: Uint8Array;
            if (file instanceof File) {
                const arrayBuffer = await file.arrayBuffer();
                uint8Data = new Uint8Array(arrayBuffer);
            } else if (file instanceof Uint8Array) {
                uint8Data = file;
            } else {
                return this.extractFromDatabase(file, 'SQLite Database');
            }

            const SQL = await initSqlJs({ locateFile: (file) => `./${file}` });
            const db = new SQL.Database(uint8Data);

            const tableResult = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
            if (tableResult.length === 0) return 'No tables found in SQLite database.';

            let tableNames = tableResult[0].values.map(row => row[0] as string);

            // If activeTable is provided, prioritize it
            if (activeTable && tableNames.includes(activeTable)) {
                tableNames = [activeTable];
            }

            let fullText = `### [DATABASE SUMMARY: SQLITE] ###\n`;
            fullText += `Total Tables: ${tableResult[0].values.length}\n\n`;

            for (const name of tableNames) {
                if (fullText.length > MAX_EXTRACT_LENGTH) break;
                try {
                    const stmt = db.prepare(`SELECT * FROM "${name}" LIMIT 20`);
                    const columns = stmt.getColumnNames();
                    const rows: any[][] = [];
                    while (stmt.step()) rows.push(stmt.get());
                    stmt.free();

                    fullText += `--- [TABLE: ${name}] ---\n`;
                    fullText += `Columns: ${columns.join(' | ')}\n`;
                    fullText += `Data Preview (First 20):\n`;
                    const tableText = rows.map(r => r.join(' | ')).join('\n');
                    fullText += tableText.substring(0, 2000) + '\n\n';
                } catch (e) {
                    fullText += `[Error reading table ${name}]\n\n`;
                }
            }
            db.close();
            return fullText.substring(0, MAX_EXTRACT_LENGTH);
        } catch (err) {
            console.error('SQLite text extraction error:', err);
            return 'Failed to extract text from SQLite database.';
        }
    }

    private static async extractFromRtf(data: ArrayBuffer): Promise<string> {
        if (typeof RTFJS === 'undefined') return 'RTF engine not loaded';
        try {
            const doc = new RTFJS.Document(data);
            const elements = await doc.render();
            const tempDiv = document.createElement('div');
            if (Array.isArray(elements)) {
                elements.forEach((el) => {
                    if (el && typeof el === 'object' && 'cloneNode' in el) {
                        tempDiv.appendChild(el.cloneNode(true));
                    }
                });
            } else if (elements && typeof elements === 'object' && 'cloneNode' in elements) {
                tempDiv.appendChild(elements.cloneNode(true));
            }
            return tempDiv.innerText || tempDiv.textContent || '';
        } catch (err) {
            console.error('RTF text extraction error:', err);
            return '';
        }
    }

    private static extractFromDatabase(data: any, label: string = 'Database'): string {
        if (data && typeof data === 'object' && data.rows) {
            const tableText = `### [DATABASE SUMMARY: ${label}] ###\n` +
                `Table Data:\nHeaders: ${data.columns?.join(', ')}\n` +
                `Total Rows: ${data.rows.length}\n` +
                `Rows Preview (First 20):\n` +
                data.rows.slice(0, 20).map((r: any) => r.join(' | ')).join('\n');
            return tableText.substring(0, MAX_EXTRACT_LENGTH);
        }
        return `Database (${label}) content summary is not yet fully supported for AI analysis or file is empty.`;
    }

    private static async extractFromPptx(data: ArrayBuffer): Promise<string> {
        try {
            const zip = await new JSZip().loadAsync(data);

            // Find all slide XML files
            const slideFiles = Object.keys(zip.files).filter(name =>
                name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
            );

            // Sort slide files numerically (slide1, slide2, slide10...)
            slideFiles.sort((a, b) => {
                const matchA = a.match(/slide(\d+)\.xml/);
                const matchB = b.match(/slide(\d+)\.xml/);
                const numA = matchA ? parseInt(matchA[1]) : 0;
                const numB = matchB ? parseInt(matchB[1]) : 0;
                return numA - numB;
            });

            if (slideFiles.length === 0) {
                return 'No slides found in this PowerPoint presentation.';
            }

            let fullText = `### [POWERPOINT PRESENTATION SUMMARY] ###\n`;
            fullText += `Total Slides: ${slideFiles.length}\n\n`;

            for (const slideFile of slideFiles) {
                if (fullText.length > MAX_EXTRACT_LENGTH) break;

                const slideXml = await zip.file(slideFile)?.async('string');
                if (!slideXml) continue;

                // Parse XML using browser's DOMParser
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(slideXml, 'text/xml');

                // Extract text from <a:t> elements (text runs)
                const textNodes = xmlDoc.getElementsByTagName('a:t');

                let slideText = '';
                for (let i = 0; i < textNodes.length; i++) {
                    slideText += (textNodes[i].textContent || '') + ' ';
                }

                // Extract notes if present (optional, skipping for now to keep it simple)

                const slideNum = slideFile.match(/slide(\d+)\.xml/)?.[1] || '?';

                if (slideText.trim()) {
                    fullText += `--- [SLIDE ${slideNum}] ---\n`;
                    fullText += `${slideText.trim()}\n\n`;
                } else {
                    fullText += `--- [SLIDE ${slideNum}] ---\n(Empty slide or images only)\n\n`;
                }
            }

            return fullText.substring(0, MAX_EXTRACT_LENGTH);
        } catch (err) {
            console.error('PPTX text extraction error:', err);
            return 'Failed to extract text from PowerPoint file. It might be encrypted or corrupted.';
        }
    }
}
