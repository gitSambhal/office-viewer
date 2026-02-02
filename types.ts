
export type FileType = 'xlsx' | 'docx' | 'pdf' | 'txt' | 'md' | 'image' | 'rtf' | 'unknown';

export interface SheetData {
  headers: string[];
  rows: any[][];
}

export interface Tab {
  id: string;
  name: string;
  type: FileType;
  lastModified: number;
  data: any; 
  activeSheet?: string;
  active: boolean;
  columnSettings?: { [sheetName: string]: { [colIndex: number]: number } };
}

export interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  darkMode: boolean;
  zenMode: boolean;
  isSidebarOpen: boolean;
}
