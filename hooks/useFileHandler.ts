import { useCallback, useState } from 'react';
import { FileProcessor } from '../services/fileProcessor';
import { DBFParser } from '../services/dbfParser';
import { FileType, TableData, Tab } from '../types';
import { useAppContext } from '../context/AppContext';

export const useFileHandler = () => {
  const { dispatch } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const newTabs: Tab[] = [];

    // Track recent files
    try {
      const recentFiles = JSON.parse(localStorage.getItem('suhail_recent_files') || '[]');
      const updatedRecentFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Check if file already exists in recent files
        const existingIndex = recentFiles.findIndex((f: any) => f.name === file.name && f.size === file.size);
        if (existingIndex !== -1) {
          recentFiles.splice(existingIndex, 1);
        }
        updatedRecentFiles.unshift({
          name: file.name,
          type: file.type,
          size: file.size,
          timestamp: Date.now()
        });
      }
      // Keep only last 5 recent files
      localStorage.setItem('suhail_recent_files', JSON.stringify(updatedRecentFiles.slice(0, 5)));
    } catch (error) {
      console.error('Failed to track recent files:', error);
    }

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];

        // Pre-process DBF files with cached parsing
        if (file.name.toLowerCase().endsWith('.dbf')) {
          const buffer = await file.arrayBuffer();
          const dbfData = await DBFParser.parse(buffer, file.name);
          const tableData: TableData = {
            id: dbfData.id,
            name: file.name.replace(/.[^/.]+$/, ''),
            columns: dbfData.header.fields.map(f => f.name),
            rows: dbfData.rows.map((r: Record<string, any>) => dbfData.header.fields.map((f: any) => r[f.name]))
          };
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: 'dbf',
            lastModified: file.lastModified,
            size: file.size,
            data: tableData,
            active: false,
            columnSettings: {},
            sortConfig: null,
            searchTerm: '',
            filteredCount: tableData.rows.length,
            totalRows: tableData.rows.length,
            visibleColumns: tableData.columns.length,
            tableCount: null
          });
          continue;
        }

        if (file.name.toLowerCase().endsWith('.mdb') || file.name.toLowerCase().endsWith('.accdb')) {
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: 'mdb',
            lastModified: file.lastModified,
            size: file.size,
            data: file,
            active: false,
            columnSettings: {},
            sortConfig: null,
            searchTerm: '',
            filteredCount: null,
            totalRows: null,
            visibleColumns: null,
            tableCount: null,
            activeTable: null
          });
          continue;
        }

        if (file.name.toLowerCase().endsWith('.sqlite') || file.name.toLowerCase().endsWith('.db') || file.name.toLowerCase().endsWith('.db3')) {
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: 'sqlite',
            lastModified: file.lastModified,
            size: file.size,
            data: file,
            active: false,
            columnSettings: {},
            sortConfig: null,
            searchTerm: '',
            filteredCount: null,
            totalRows: null,
            visibleColumns: null,
            tableCount: null,
            activeTable: null
          });
          continue;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
        const result = await FileProcessor.process(file);
        if (result.type !== 'unknown') {
          const sheets = result.type === 'xlsx' ? result.data : {};
          const firstSheetRows = result.type === 'xlsx' && Object.keys(sheets).length > 0 ? sheets[Object.keys(sheets)[0]]?.rows?.length || 0 : 0;
          const firstSheetCols = result.type === 'xlsx' && Object.keys(sheets).length > 0 ? Object.keys(sheets[Object.keys(sheets)[0]]?.rows?.[0] || {}).length : 0;
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: result.type,
            lastModified: file.lastModified,
            size: file.size,
            data: result.data,
            activeSheet: result.type === 'xlsx' ? Object.keys(result.data)[0] : undefined,
            active: false,
            columnSettings: {},
            sortConfig: null,
            searchTerm: '',
            filteredCount: firstSheetRows,
            totalRows: firstSheetRows,
            visibleColumns: firstSheetCols,
            tableCount: null
          });
        }
      } catch (err: any) {
        console.error("Error processing file:", files[i].name, err);
        setErrorMessage(`Could not open "${files[i].name}". The file might be too large for browser memory.`);
      }
    }

    if (newTabs.length > 0) {
      dispatch({ type: 'ADD_TABS', payload: newTabs });
    }
    setIsProcessing(false);
  }, [dispatch]);

  return { handleFiles, isProcessing, errorMessage, setErrorMessage };
};
