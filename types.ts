export type FileType =
  | 'xlsx'
  | 'docx'
  | 'pdf'
  | 'image'
  | 'rtf'
  | 'txt'
  | 'md'
  | 'mdb'
  | 'accdb'
  | 'sqlite'
  | 'dbf'
  | 'unknown';

export interface SheetData {
  headers: string[];
  rows: any[][];
}

export interface TabStateChange {
  sortConfig: { key: string; direction: 'asc' | 'desc' | null } | null;
  searchTerm: string;
  filteredCount: number | null;
  totalRows: number | null;
  visibleColumns: number | null;
  tableCount?: number;
  activeTable?: string;
}

export interface Tab {
  id: string;
  name: string;
  type: FileType;
  lastModified: number;
  size: number;
  data: any;
  activeSheet?: string;
  activeTable?: string;
  active: boolean;
  columnSettings: { [key: string]: { [key: number]: number } };
  // State tracking for UI cues
  sortConfig: { key: string; direction: 'asc' | 'desc' | null } | null;
  searchTerm: string;
  filteredCount: number | null;
  totalRows: number | null;
  visibleColumns: number | null;
  tableCount: number | null;
}

export interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  darkMode: boolean;
  zenMode: boolean;
  isSidebarOpen: boolean;
  isTypeAwareEnabled: boolean;
  globalSearchTerm: string;
  showUrlModal: boolean;
}

export interface TableData {
  id: string;
  name: string;
  columns: string[];
  rows: any[];
}

export interface DatabaseFile {
  id: string;
  fileName: string;
  fileSize: number;
  tables: TableData[];
  activeTableId: string | null;
  lastModified: number;
}

export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface ColumnWidths {
  [key: string]: number;
}

export interface TabState {
  sortConfig: SortConfig | null;
  searchTerm: string;
  filteredCount: number;
  visibleColumns: number;
  isFiltered: boolean;
  isSorted: boolean;
}

export interface DBFField {
  name: string;
  type: string;
  length: number;
  decimalCount: number;
}

export interface DBFHeader {
  version: number;
  lastUpdate: Date;
  numberOfRecords: number;
  headerLength: number;
  recordLength: number;
  fields: DBFField[];
}

export type DBFRow = Record<string, any>;

export interface DBFData {
  id: string;
  header: DBFHeader;
  rows: DBFRow[];
  fileName: string;
  hiddenColumns: string[];
  changes?: Record<
    number,
    Record<string, { oldValue: any; newValue: any; updatedAt: number }>
  >;
}
