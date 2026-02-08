// DBF Parser Web Worker for performant background parsing

interface ParsingMessage {
  type: 'PARSE';
  buffer: ArrayBuffer;
  fileName: string;
}

interface ProgressMessage {
  type: 'PROGRESS';
  progress: number;
  stage: string;
}

interface ResultMessage {
  type: 'RESULT';
  data: {
    id: string;
    columns: string[];
    rows: any[];
    totalRecords: number;
  };
}

interface ErrorMessage {
  type: 'ERROR';
  error: string;
}

type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage;

// DBF Types
interface DBFField {
  name: string;
  type: string;
  length: number;
  decimalCount: number;
}

interface DBFHeader {
  version: number;
  lastUpdate: Date;
  numberOfRecords: number;
  headerLength: number;
  recordLength: number;
  fields: DBFField[];
}

interface DBFData {
  id: string;
  header: DBFHeader;
  rows: any[];
  fileName: string;
}

self.onmessage = async (e: MessageEvent<ParsingMessage>) => {
  if (e.data.type !== 'PARSE') return;

  const { buffer, fileName } = e.data;

  try {
    const view = new DataView(buffer);
    const decoder = new TextDecoder('windows-1252');

    // Report progress
    self.postMessage({
      type: 'PROGRESS',
      progress: 0,
      stage: 'Parsing header...',
    });

    // 1. Parse Header
    const version = view.getUint8(0);
    const yearRaw = view.getUint8(1);
    const year =
      yearRaw < 70
        ? 2000 + yearRaw
        : yearRaw < 100
          ? 1900 + yearRaw
          : 1900 + yearRaw;
    const month = view.getUint8(2) - 1;
    const day = view.getUint8(3);
    const lastUpdate = new Date(year, month, day);
    const numberOfRecords = view.getUint32(4, true);
    const headerLength = view.getUint16(8, true);
    const recordLength = view.getUint16(10, true);

    self.postMessage({
      type: 'PROGRESS',
      progress: 10,
      stage: 'Parsing fields...',
    });

    // 2. Parse Fields
    const fields: DBFField[] = [];
    let offset = 32;
    while (offset < headerLength - 1 && view.getUint8(offset) !== 0x0d) {
      const nameBytes = new Uint8Array(buffer.slice(offset, offset + 11));
      const name = decoder.decode(nameBytes).split('\0')[0].trim();
      const type = String.fromCharCode(
        view.getUint8(offset + 11)
      ).toUpperCase();
      const length = view.getUint8(offset + 16);
      const decimalCount = view.getUint8(offset + 17);

      fields.push({ name, type, length, decimalCount });
      offset += 32;
    }

    const header: DBFHeader = {
      version,
      lastUpdate,
      numberOfRecords,
      headerLength,
      recordLength,
      fields,
    };

    // 3. Parse Records with chunking for performance
    self.postMessage({
      type: 'PROGRESS',
      progress: 20,
      stage: 'Parsing records...',
    });

    const rows: any[] = [];
    const CHUNK_SIZE = 5000;
    let recordOffset = headerLength;
    let processedRecords = 0;

    // Pre-calculate field info for faster parsing
    const fieldInfos = fields.map((f) => ({
      name: f.name,
      type: f.type,
      isBinary: ['I', 'B', 'T', 'Y'].includes(f.type),
      offset: 0, // will be calculated per record
    }));

    while (processedRecords < numberOfRecords) {
      const chunkEnd = Math.min(processedRecords + CHUNK_SIZE, numberOfRecords);

      for (let i = processedRecords; i < chunkEnd; i++) {
        if (recordOffset + recordLength > buffer.byteLength) break;

        const statusByte = view.getUint8(recordOffset);
        const isDeleted = statusByte === 0x2a;

        if (!isDeleted) {
          const row: any = {};
          let fieldOffset = recordOffset + 1;

          for (const field of fields) {
            let value: any;

            // Binary Types (optimized)
            if (field.type === 'I') {
              value = field.length >= 4 ? view.getInt32(fieldOffset, true) : 0;
            } else if (field.type === 'B') {
              value =
                field.length >= 8 ? view.getFloat64(fieldOffset, true) : 0;
            } else if (field.type === 'T') {
              if (field.length >= 8) {
                const julianDay = view.getInt32(fieldOffset, true);
                const ms = view.getInt32(fieldOffset + 4, true);
                if (julianDay === 0) {
                  value = null;
                } else {
                  const unixMs = (julianDay - 2440588) * 86400000 + ms;
                  const d = new Date(unixMs);
                  value = isNaN(d.getTime())
                    ? '[Invalid Date]'
                    : d.toISOString().replace('T', ' ').split('.')[0];
                }
              } else {
                value = null;
              }
            } else if (field.type === 'Y') {
              if (field.length >= 8) {
                const rawInt = view.getBigInt64(fieldOffset, true);
                value = Number(rawInt) / 10000;
              } else {
                value = 0;
              }
            } else {
              // Text-based Types
              const fieldBytes = new Uint8Array(
                buffer,
                fieldOffset,
                field.length
              );
              const valueRaw = decoder.decode(fieldBytes).trim();

              if (field.type === 'N' || field.type === 'F') {
                const parsed = parseFloat(valueRaw.replace(/,/g, ''));
                value = isNaN(parsed)
                  ? valueRaw === ''
                    ? 0
                    : valueRaw
                  : parsed;
              } else if (field.type === 'L') {
                value = ['Y', 'y', 'T', 't'].includes(valueRaw);
              } else if (field.type === 'D') {
                const cleanDate = valueRaw.replace(/\D/g, '');
                if (cleanDate.length === 8) {
                  const y = parseInt(cleanDate.substring(0, 4));
                  const m = parseInt(cleanDate.substring(4, 6)) - 1;
                  const d = parseInt(cleanDate.substring(6, 8));
                  const dateObj = new Date(y, m, d);
                  value = !isNaN(dateObj.getTime())
                    ? dateObj.toISOString().split('T')[0]
                    : '';
                }
              } else if (field.type === 'M') {
                value = valueRaw ? `[Memo Pointer: ${valueRaw}]` : '';
              } else {
                value = valueRaw;
              }
            }

            row[field.name] = value;
            fieldOffset += field.length;
          }
          rows.push(row);
        }
        recordOffset += recordLength;
      }

      processedRecords = chunkEnd;

      // Report progress (20% to 90% for records)
      const progress =
        20 + Math.floor((processedRecords / numberOfRecords) * 70);
      self.postMessage({
        type: 'PROGRESS',
        progress,
        stage: `Parsed ${processedRecords}/${numberOfRecords} records...`,
      });

      // Yield to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    self.postMessage({
      type: 'PROGRESS',
      progress: 90,
      stage: 'Finalizing...',
    });

    // Convert to array format for the table
    const columns = fields.map((f) => f.name);
    const tableRows = rows.map((r: any) => fields.map((f: any) => r[f.name]));

    self.postMessage({ type: 'PROGRESS', progress: 100, stage: 'Complete!' });

    self.postMessage({
      type: 'RESULT',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        columns,
        rows: tableRows,
        totalRecords: numberOfRecords,
      },
    });
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message || 'Unknown error' });
  }
};

export {};
