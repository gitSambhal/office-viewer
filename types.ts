export type FileType = 'xlsx' | 'docx' | 'pdf' | 'image' | 'rtf' | 'txt' | 'md' | 'mdb' | 'accdb' | 'sqlite' | 'unknown';

export interface Tab {
  id: string;
  name: string;
  type: FileType;
  lastModified: number;
  size: number;
  data: any;
  activeSheet?: string;
  active: boolean;
  columnSettings: { [key: string]: { [key: number]: number } };
}

export interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  darkMode: boolean;
  zenMode: boolean;
  isSidebarOpen: boolean;
}

export interface TableData {
  id: string;
  name: string;
  columns: string[];
  rows: any[];
}

export interface DatabaseFile {
  id:string;
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