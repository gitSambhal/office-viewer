import { useCallback, useState } from 'react';
import { FileProcessor } from '../services/fileProcessor';
import { DBFParser } from '../services/dbfParser';
import { TableData, Tab, FileType } from '../types';
import { useAppContext } from '../context/AppContext';
import analytics from '../utils/analytics';

export const useFileHandler = () => {
  const { dispatch } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingProgress(0);
      const newTabs: Tab[] = [];
      
      // Track file opening
      Array.from(files).forEach(file => {
        analytics.trackFileOpen(file.name, file.type, file.size);
      });

      // Track recent files
      try {
        const recentFiles = JSON.parse(
          localStorage.getItem('suhail_recent_files') || '[]'
        );
        const updatedRecentFiles = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Check if file already exists in recent files
          const existingIndex = recentFiles.findIndex(
            (f: any) => f.name === file.name && f.size === file.size
          );
          if (existingIndex !== -1) {
            recentFiles.splice(existingIndex, 1);
          }
          updatedRecentFiles.unshift({
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: Date.now(),
          });
        }
        // Keep only last 5 recent files
        localStorage.setItem(
          'suhail_recent_files',
          JSON.stringify(updatedRecentFiles.slice(0, 5))
        );
      } catch (error) {
        console.error('Failed to track recent files:', error);
      }

      // Process files with progress tracking
      // Add temporary loading tabs immediately for better UX
      const loadingTabs: Tab[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempTab: Tab = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'unknown',
          lastModified: file.lastModified,
          size: file.size,
          data: null,
          active: false,
          columnSettings: {},
          sortConfig: null,
          searchTerm: '',
          filteredCount: null,
          totalRows: null,
          visibleColumns: null,
          tableCount: null,
          isLoading: true, // Add loading state
        };
        loadingTabs.push(tempTab);
      }

      // Show loading tabs immediately
      dispatch({ type: 'ADD_TABS', payload: loadingTabs });

      // Process files in parallel with progress tracking
      const processingPromises = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempTab = loadingTabs[i];
        
        const processPromise = (async () => {
          try {
            // Update progress
            const progress = Math.round(((i + 1) / files.length) * 100);
            setProcessingProgress(progress);

            // Pre-process DBF files with cached parsing
            if (file.name.toLowerCase().endsWith('.dbf')) {
              const buffer = await file.arrayBuffer();
              const dbfData = await DBFParser.parse(buffer, file.name);
              const tableData: TableData = {
                id: dbfData.id,
                name: file.name.replace(/.[^/.]+$/, ''),
                columns: dbfData.header.fields.map((f) => f.name),
                rows: dbfData.rows.map((r: Record<string, any>) =>
                  dbfData.header.fields.map((f: any) => r[f.name])
                ),
              };
              return {
                ...tempTab,
                type: 'dbf' as const,
                data: tableData,
                isLoading: false,
                filteredCount: tableData.rows.length,
                totalRows: tableData.rows.length,
                visibleColumns: tableData.columns.length,
              };
            }

            if (
              file.name.toLowerCase().endsWith('.mdb') ||
              file.name.toLowerCase().endsWith('.accdb')
            ) {
              return {
                ...tempTab,
                type: 'mdb' as const,
                data: file,
                isLoading: false,
                activeTable: null,
              };
            }

            if (
              file.name.toLowerCase().endsWith('.sqlite') ||
              file.name.toLowerCase().endsWith('.db') ||
              file.name.toLowerCase().endsWith('.db3')
            ) {
              return {
                ...tempTab,
                type: 'sqlite' as const,
                data: file,
                isLoading: false,
                activeTable: null,
              };
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
            const result = await FileProcessor.process(file);
            if (result.type !== 'unknown') {
              const sheets = result.type === 'xlsx' ? result.data : {};
              const firstSheetRows =
                result.type === 'xlsx' && Object.keys(sheets).length > 0
                  ? sheets[Object.keys(sheets)[0]]?.rows?.length || 0
                  : 0;
              const firstSheetCols =
                result.type === 'xlsx' && Object.keys(sheets).length > 0
                  ? Object.keys(sheets[Object.keys(sheets)[0]]?.rows?.[0] || {}).length
                  : 0;
              return {
                ...tempTab,
                type: result.type as FileType,
                data: result.data,
                activeSheet:
                  result.type === 'xlsx'
                    ? Object.keys(result.data)[0]
                    : undefined,
                isLoading: false,
                filteredCount: firstSheetRows,
                totalRows: firstSheetRows,
                visibleColumns: firstSheetCols,
              };
            }
            return null;
          } catch (err: any) {
            console.error('Error processing file:', file.name, err);
            setErrorMessage(
              `Could not open "${file.name}". ${err.message || 'An unexpected error occurred.'}`
            );
            return null;
          }
        })();
        
        processingPromises.push(processPromise);
        
        // Update tab when processing completes
        processPromise.then((processedTab) => {
          if (processedTab) {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: processedTab.id,
                updates: processedTab,
              },
            });
          } else {
            // Remove failed tab
            dispatch({ type: 'CLOSE_TAB', payload: tempTab.id });
          }
        });
      }

      setIsProcessing(false);
      setProcessingProgress(0);
    },
    [dispatch]
  );

  return { 
    handleFiles, 
    isProcessing, 
    errorMessage, 
    setErrorMessage,
    processingProgress 
  };
};
