
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Tab, FileType, TableData } from './types';
import { FileProcessor } from './services/fileProcessor';
import { SpreadsheetViewer } from './components/SpreadsheetViewer';
import { ContextMenu } from './components/ContextMenu';
import { PdfViewer } from './components/PdfViewer';
import { DocxViewer } from './components/DocxViewer';
import { TextViewer } from './components/TextViewer';
import { ImageViewer } from './components/ImageViewer';
import { RtfViewer } from './components/RtfViewer';
import MdbViewer from './components/MdbViewer';
import SqliteViewer from './components/SqliteViewer';
import DbfViewer from './components/DbfViewer';
import { DBFParser } from './services/dbfParser';

// Error Boundary using class component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: React.PropsWithChildren<{}>;
  
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-12 text-center">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">Application Crash</h1>
          <p className="text-zinc-500 max-w-md text-sm mb-8">{this.state.error?.message || 'An unexpected error occurred during initialization.'}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-zinc-200 transition-all">Reload Workstation</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const IconX = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconDark = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9 9 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const IconLight = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707" /></svg>;
const IconFullscreen = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileIcon = (type: FileType) => {
  switch (type) {
    case 'xlsx': return <div className="w-4 h-4 text-emerald-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>;
    case 'docx': return <div className="w-4 h-4 text-blue-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>;
    case 'pdf': return <div className="w-4 h-4 text-rose-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg></div>;
    case 'image': return <div className="w-4 h-4 text-violet-500"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>;
    case 'rtf': return <div className="w-4 h-4 text-amber-500"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM17 19H7v-2h10v2zm0-4H7v-2h10v2z"/></svg></div>;
    case 'mdb': return <div className="w-4 h-4 text-teal-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M2 5.52v12.96C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.52V5.52C22 4.12 20.88 3 19.5 3H4.5C3.12 3 2 4.12 2 5.52zM12 11H9v2h3v2H9v2H7V9h5v2zm4-2h-2v6h-2v-6h-2V9h6v2z"/></svg></div>;
    case 'sqlite': return <div className="w-4 h-4 text-sky-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-8h2v5h-2v-5zm0-3h2v2h-2V9z"/></svg></div>;
    case 'dbf': return <div className="w-4 h-4 text-orange-600"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>;
    default: return <div className="w-4 h-4 text-zinc-400"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg></div>;
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    let darkMode = false;
    let isTypeAwareEnabled = true;
    try { 
      darkMode = localStorage.getItem('suhail_theme') === 'dark'; 
      isTypeAwareEnabled = localStorage.getItem('suhail_type_aware') !== 'false';
    } catch (e) {}
    return { tabs: [], activeTabId: null, darkMode, zenMode: false, isSidebarOpen: true, isTypeAwareEnabled, globalSearchTerm: '' };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  const [showScrollArrows, setShowScrollArrows] = useState(false);
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  const tabBarRef = React.useRef<HTMLDivElement>(null);
  
  // Ref to store handleFiles callback for use in event listeners
  const handleFilesRef = React.useRef<((files: FileList | File[] | null) => void) | null>(null);
  
  // IndexedDB helper
  const openDB = React.useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('suhail-viewer-shared-files', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
    });
  }, []);
  
  // Function to retrieve shared files from IndexedDB
  const retrieveSharedFiles = React.useCallback(async (shareId: string): Promise<File[] | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('files', 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(shareId);
        
        request.onsuccess = () => {
          const fileData = request.result;
          if (fileData && fileData.files) {
            const fileArray: File[] = fileData.files.map((f: { name: string; type: string; size: number; blob: Blob }) => {
              return new File([f.blob], f.name, { type: f.type });
            });
            resolve(fileArray);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('[App] Error retrieving shared files:', err);
      return null;
    }
  }, [openDB]);
  
  // Function to clear shared files from IndexedDB
  const clearSharedFiles = React.useCallback(async (shareId: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(shareId);
    } catch (err) {
      console.error('[App] Error clearing shared files:', err);
    }
  }, [openDB]);
  
  // Handle share_target files (shared to PWA) - uses launchQueue API for Chrome 110+
  useEffect(() => {
    // Setup launchQueue API handler (correct API)
    const win = window as unknown as {
      launchQueue?: {
        setConsumer: (consumer: (params: { files: FileSystemFileHandle[] }) => void) => void
      }
    };
    
    // Process file handles from launchQueue
    const processFileHandles = async (handles: FileSystemFileHandle[]) => {
      const fileArray: File[] = [];
      for (const handle of handles) {
        try {
          const file = await handle.getFile();
          fileArray.push(file);
        } catch (err) {
          console.error('[App] Error getting file from handle:', err);
        }
      }
      if (fileArray.length > 0 && handleFilesRef.current) {
        console.log('[App] Processing', fileArray.length, 'files from launchQueue');
        handleFilesRef.current(fileArray as unknown as FileList);
      }
    };
    
    if (win.launchQueue) {
      win.launchQueue.setConsumer(async (params: any) => {
        console.log('[App] launchQueue setConsumer called with', params.files?.length || 0, 'files');
        if (params.files && params.files.length > 0) {
          await processFileHandles(params.files);
        }
      });
    }

    // Setup message listener for shared files from service worker
    const handleMessage = async (event: MessageEvent) => {
      console.log('[App] Message received:', event.data);
      if (event.data && event.data.type === 'SHARED_FILES') {
        const shareId = event.data.shareId;
        console.log('[App] Shared files received, shareId:', shareId);
        if (shareId && handleFilesRef.current) {
          const files = await retrieveSharedFiles(shareId);
          if (files && files.length > 0) {
            console.log('[App] Calling handleFiles with:', files.length, 'files');
            handleFilesRef.current(files as unknown as FileList);
            // Clean up: delete the file data from IndexedDB
            await clearSharedFiles(shareId);
          }
        }
      }
    };

    // Check for shared files on initial load (in case PWA was opened with files)
    const checkInitialSharedFiles = async () => {
      try {
        // Wait for handleFilesRef to be set
        if (!handleFilesRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (!handleFilesRef.current) {
            console.log('[App] handleFiles not available yet');
            return;
          }
        }

        const db = await openDB();
        const transaction = db.transaction('files', 'readonly');
        const store = transaction.objectStore('files');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const fileDataList = request.result as Array<{ id: string; files: Array<{ name: string; type: string; size: number; blob: Blob }> }>;
          if (fileDataList && fileDataList.length > 0 && handleFilesRef.current) {
            // Get the most recent file data
            const fileData = fileDataList[fileDataList.length - 1];
            const fileArray: File[] = fileData.files.map((f) => {
              return new File([f.blob], f.name, { type: f.type });
            });
            console.log('[App] Found shared files on load:', fileArray.length);
            handleFilesRef.current(fileArray as unknown as FileList);
            // Clean up
            clearSharedFiles(fileData.id);
          }
        };
      } catch (err) {
        console.error('[App] Error checking initial shared files:', err);
      }
    };
    
    // Check service worker status
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('[App] Service worker is ready and controlling:', registration.active?.state);
        // Check for shared files after service worker is ready
        checkInitialSharedFiles();
      }).catch(err => {
        console.log('[App] Service worker not ready:', err);
        // Still try to check for shared files
        checkInitialSharedFiles();
      });
    } else {
      checkInitialSharedFiles();
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [openDB, retrieveSharedFiles, clearSharedFiles]);

  // Callback to close action popups (used by child components)
  const closeActionPopupsRef = React.useRef<(() => void) | null>(null);
  const registerCloseActionPopups = React.useCallback((callback: () => void) => {
    closeActionPopupsRef.current = callback;
  }, []);

  // Sync dark mode class with root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.darkMode) {
      root.classList.add('dark');
      localStorage.setItem('suhail_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('suhail_theme', 'light');
    }
  }, [state.darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setState(prev => prev.zenMode ? { ...prev, zenMode: false } : prev);
        if (closeActionPopupsRef.current) {
          closeActionPopupsRef.current();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault(); toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (tabBarRef.current) {
        setShowScrollArrows(tabBarRef.current.scrollWidth > tabBarRef.current.clientWidth);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [state.tabs]);

  // Show confirm dialog before page refresh or navigation with open tabs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.tabs.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have open tabs. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.tabs.length]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      tabBarRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };


  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const newTabs: Tab[] = [];
    
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
      setState(prev => ({ 
        ...prev, 
        tabs: [...prev.tabs, ...newTabs], 
        activeTabId: newTabs[newTabs.length - 1].id,
        isSidebarOpen: prev.tabs.length === 0 ? true : prev.isSidebarOpen
      }));
    }
    setIsProcessing(false);
  }, []);

  // Set handleFilesRef immediately with the current function
  useEffect(() => {
    handleFilesRef.current = handleFiles;
  }, [handleFiles]);

  const closeTab = (id: string) => {
    setState(prev => {
      const nextTabs = prev.tabs.filter(t => t.id !== id);
      const nextId = prev.activeTabId === id ? (nextTabs.length ? nextTabs[nextTabs.length - 1].id : null) : prev.activeTabId;
      return { ...prev, tabs: nextTabs, activeTabId: nextId };
    });
  };

  const closeAllTabs = () => setState(prev => ({ ...prev, tabs: [], activeTabId: null }));

  const closeTabsToLeft = (tabId: string) => {
    setState(prev => {
      const tabIndex = prev.tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      const tabsToKeep = prev.tabs.slice(tabIndex);
      const newActiveTabId = tabsToKeep.some(t => t.id === prev.activeTabId) ? prev.activeTabId : (tabsToKeep.length > 0 ? tabsToKeep[0].id : null);
      return { ...prev, tabs: tabsToKeep, activeTabId: newActiveTabId };
    });
  };

  const closeTabsToRight = (tabId: string) => {
    setState(prev => {
      const tabIndex = prev.tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      const tabsToKeep = prev.tabs.slice(0, tabIndex + 1);
      const newActiveTabId = tabsToKeep.some(t => t.id === prev.activeTabId) ? prev.activeTabId : (tabsToKeep.length > 0 ? tabsToKeep[tabsToKeep.length - 1].id : null);
      return { ...prev, tabs: tabsToKeep, activeTabId: newActiveTabId };
    });
  };

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

  const activeMetadata = useMemo(() => {
    if (!activeTab) return null;
    
    const meta: { label: string; value: string | number; icon?: string; color?: string; badge?: boolean }[] = [
      { label: 'File Name', value: activeTab.name }
    ];
    
    // Format type badge
    meta.push({ 
      label: 'Format', 
      value: activeTab.type.toUpperCase(),
      badge: true,
      color: activeTab.type === 'xlsx' ? 'emerald' : 
            activeTab.type === 'docx' ? 'blue' : 
            activeTab.type === 'pdf' ? 'rose' : 
            activeTab.type === 'dbf' ? 'orange' :
            activeTab.type === 'sqlite' ? 'sky' :
            activeTab.type === 'mdb' ? 'teal' : 'zinc'
    });
    
    meta.push({ label: 'Size', value: formatBytes(activeTab.size) });
    meta.push({ label: 'Modified', value: new Date(activeTab.lastModified).toLocaleDateString() });
    
    // Data-specific metadata
    if (activeTab.type === 'xlsx') {
      const sheets = activeTab.data || {};
      meta.push({ label: 'Sheets', value: Object.keys(sheets).length });
      if (activeTab.activeSheet && sheets[activeTab.activeSheet]) {
        meta.push({ label: 'Active Sheet', value: activeTab.activeSheet });
      }
    }
    
    // Table count and active table for SQLite and MDB
    if ((activeTab.type === 'sqlite' || activeTab.type === 'mdb') && activeTab.tableCount !== null) {
      meta.push({ 
        label: 'Tables', 
        value: activeTab.tableCount,
        icon: 'table'
      });
    }
    
    // Active table name for SQLite and MDB
    if ((activeTab.type === 'sqlite' || activeTab.type === 'mdb') && activeTab.activeTable) {
      meta.push({ label: 'Active Table', value: activeTab.activeTable });
    }
    
    // Table data counts with UI cues
    if (activeTab.type === 'xlsx' || activeTab.type === 'dbf' || activeTab.type === 'sqlite' || activeTab.type === 'mdb') {
      const filteredRows = activeTab.filteredCount !== null ? activeTab.filteredCount : (activeTab.totalRows || 0);
      const visibleColumns = activeTab.visibleColumns || 0;
      
      // Show filtered rows count
      meta.push({ 
        label: 'Rows', 
        value: filteredRows,
        icon: filteredRows < (activeTab.totalRows || 0) ? 'filter' : 'table'
      });
      
      // Show filtered count badge when rows are filtered
      if (filteredRows < (activeTab.totalRows || 0)) {
        meta.push({
          label: 'Filtered',
          value: `${(activeTab.totalRows || 0) - filteredRows} hidden`,
          color: 'amber',
          icon: 'filter'
        });
      }
      
      meta.push({ 
        label: 'Columns', 
        value: visibleColumns,
        icon: 'columns'
      });
      
      // Sort state
      if (activeTab.sortConfig?.key) {
        const sortDir = activeTab.sortConfig.direction === 'asc' ? '↑' : '↓';
        meta.push({
          label: 'Sorted',
          value: `${activeTab.sortConfig.key} ${sortDir}`,
          color: 'violet',
          icon: 'sort'
        });
      }
      
      // Search/Filter state
      if (activeTab.searchTerm) {
        meta.push({
          label: 'Search',
          value: `"${activeTab.searchTerm}"`,
          color: 'amber',
          icon: 'search'
        });
      }
    }
    
    if (activeTab.type === 'txt' || activeTab.type === 'md') {
      const content = String(activeTab.data || '');
      meta.push({ label: 'Words', value: content.trim() ? content.trim().split(/\s+/).length : 0 });
      meta.push({ label: 'Chars', value: content.length });
    }
    
    return meta;
  }, [activeTab]);

  // Helper icons for metadata
  const getMetaIcon = (icon: string) => {
    switch (icon) {
      case 'filter':
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
      case 'sort':
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
      case 'search':
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
      case 'table':
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
      case 'columns':
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>;
      default:
        return null;
    }
  };

  const getColorClass = (color: string | undefined) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rose': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'amber': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'violet': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'sky': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      case 'teal': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <ErrorBoundary>
      <div 
        className={`flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 transition-colors overflow-hidden ${state.zenMode ? 'zen-mode' : ''} ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="dropzone-overlay">
          <div className="bg-white dark:bg-zinc-900 p-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-300 border-2 border-violet-100 dark:border-violet-900/30">
             <div className="w-32 h-32 bg-violet-600 rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-violet-500/40">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
             </div>
             <div className="text-center">
               <h2 className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-white mb-2">Drop to Open</h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[11px]">Secure Offline Processing</p>
             </div>
          </div>
        </div>

        {isProcessing && (
          <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
             <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center max-w-sm">
                <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Ingesting Data</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Parsing local records. Large files may take a few seconds.</p>
             </div>
          </div>
        )}

        {errorMessage && (
           <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4 duration-300">
              <div className="bg-rose-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-lg border-2 border-rose-500">
                 <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <p className="text-xs font-black uppercase tracking-tight leading-snug">{errorMessage}</p>
                 <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-700 rounded-lg transition-colors">
                    <IconX />
                 </button>
              </div>
           </div>
        )}

        <header className="hide-in-zen flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none z-30 shadow-sm shrink-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div title="Go to Dashboard" className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setState(s => ({ ...s, activeTabId: null }))}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform italic">S</div>
              <h1 className="font-black text-zinc-800 dark:text-white hidden sm:block tracking-tighter text-lg">Suhail <span className="text-violet-600 dark:text-violet-400">Viewer</span></h1>
            </div>
            <nav className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg sm:rounded-xl p-1 gap-1">
              <button title="Sidebar" onClick={() => setState(s => ({ ...s, isSidebarOpen: !s.isSidebarOpen }))} className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${state.isSidebarOpen ? 'bg-white dark:bg-zinc-700 shadow-md text-violet-600' : 'text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-700/50'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
              </button>
              <button 
                title="Toggle Visual Type Highlighting"
                onClick={() => {
                  setState(prev => {
                    const newValue = !prev.isTypeAwareEnabled;
                    localStorage.setItem('suhail_type_aware', String(newValue));
                    return { ...prev, isTypeAwareEnabled: newValue };
                  });
                }} 
                className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all border ${state.isTypeAwareEnabled ? 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-white/50'}`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M10 7v10m4-10v10M7 17h10" /></svg>
              </button>
              <button title="Toggle Theme" onClick={() => setState(s => ({ ...s, darkMode: !s.darkMode }))} className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-500">
                {state.darkMode ? <IconLight /> : <IconDark />}
              </button>
              <button title="Zen Mode" onClick={() => setState(s => ({ ...s, zenMode: !s.zenMode }))} className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all ${state.zenMode ? 'text-violet-600 bg-white dark:bg-zinc-700 shadow-md' : 'text-zinc-500'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
              <button title="Fullscreen" onClick={toggleFullscreen} className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all ${isFullscreen ? 'text-violet-600' : 'text-zinc-500'}`}>
                <IconFullscreen />
              </button>
            </nav>
          </div>
          
          {/* Global Search - hidden on mobile to save space */}
          {state.tabs.length > 0 && (
            <div className="hidden sm:block flex-1 max-w-md relative">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Search databases..."
                  value={state.globalSearchTerm}
                  onChange={(e) => setState(s => ({ ...s, globalSearchTerm: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                {state.globalSearchTerm && (
                  <button 
                    onClick={() => setState(s => ({ ...s, globalSearchTerm: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <label className="cursor-pointer bg-zinc-950 dark:bg-violet-600 hover:bg-zinc-800 dark:hover:bg-violet-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-violet-500/10 active:scale-95 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            <span className="hidden sm:inline">Open Documents</span>
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf" />
          </label>
        </header>

        <div className="flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-20">
          {showScrollArrows && <button onClick={() => handleScrollTabs('left')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>}
          <div ref={tabBarRef} className="flex-1 flex flex-nowrap overflow-x-auto scrollbar-none items-center">
            {/* Tab Search Input */}
            {state.tabs.length > 0 && (
              <div className="flex-shrink-0 px-3 border-r border-zinc-200 dark:border-zinc-800">
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search tabs..."
                    value={tabSearchTerm}
                    onChange={(e) => setTabSearchTerm(e.target.value)}
                    className="w-32 pl-8 pr-6 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  {tabSearchTerm && (
                    <button 
                      onClick={() => setTabSearchTerm('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            )}
            {state.tabs.filter(tab => tab.name.toLowerCase().includes(tabSearchTerm.toLowerCase())).map(tab => (
              <div 
                key={tab.id} 
                onClick={() => setState(s => ({ ...s, activeTabId: tab.id }))} 
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }} 
                className={`flex flex-shrink-0 items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer min-w-[100px] sm:min-w-[140px] max-w-[200px] sm:max-w-[280px] select-none group transition-all relative ${state.activeTabId === tab.id ? 'bg-zinc-50 dark:bg-zinc-950 shadow-inner' : 'hover:bg-zinc-50/50'}`}
              >
                {state.activeTabId === tab.id && <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600" />}
                {getFileIcon(tab.type)}
                <span className={`text-[10px] sm:text-[11px] truncate font-black uppercase tracking-tight flex-1 ${state.activeTabId === tab.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{tab.name}</span>
                <button title="Close Tab" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all text-zinc-400"><IconX /></button>
              </div>
            ))}
            {tabSearchTerm && state.tabs.filter(tab => tab.name.toLowerCase().includes(tabSearchTerm.toLowerCase())).length === 0 && (
              <div className="flex-shrink-0 px-4 py-2 text-xs text-zinc-400 font-medium">
                No tabs found
              </div>
            )}
          </div>
          {showScrollArrows && <button onClick={() => handleScrollTabs('right')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>}
        </div>

        <main className="flex-1 flex overflow-hidden relative">
          {state.zenMode && (
            <button 
              onClick={() => setState(s => ({ ...s, zenMode: false }))}
              className="fixed bottom-6 right-6 z-[100] px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              Exit Zen Mode
            </button>
          )}

          {activeTab && (
            <aside className={`hide-in-zen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 shadow-2xl z-40 ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}>
              <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
                <section>
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Properties</h3>
                    <button onClick={() => setState(s => ({...s, isSidebarOpen: false}))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>
                  {activeMetadata && (
                    <div className="space-y-5">
                      {activeMetadata.map((m, i) => (
                        <div key={i} className="group animate-in fade-in slide-in-from-left duration-300">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {m.icon && (
                              <span className={`p-1 rounded-md ${getColorClass(m.color)}`}>
                                {getMetaIcon(m.icon)}
                              </span>
                            )}
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-violet-500 transition-colors">{m.label}</div>
                          </div>
                          {m.badge ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getColorClass(m.color)}`}>
                              {m.value}
                            </span>
                          ) : (
                            <div className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200 break-words leading-snug pl-1">{m.value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed">Safety: Local Workstation</p>
                  <p className="text-[8px] text-zinc-300 dark:text-zinc-600 mt-1 uppercase">No data is sent to servers.</p>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
            {activeTab ? (
              <div className="flex-1 h-full w-full animate-in fade-in duration-300">
                {activeTab.type === 'xlsx' && (
                  <SpreadsheetViewer 
                    key={activeTab.id}
                    sheets={activeTab.data}
                    activeSheet={activeTab.activeSheet!}
                    globalSearchTerm={state.globalSearchTerm}
                    onSheetChange={(name) => setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, activeSheet: name } : t)}))}
                    onUpdate={(sheetName, newData) => {
                      setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, data: { ...t.data, [sheetName]: { ...t.data[sheetName], rows: newData } } } : t)}));
                    }}
                    columnWidths={(activeTab.columnSettings || {})[activeTab.activeSheet!] || {}}
                    onResizeColumn={(sheetName, colIdx, width) => {
                      setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, columnSettings: { ...t.columnSettings, [sheetName]: { ...t.columnSettings?.[sheetName], [colIdx]: width } } } : t)}));
                    }}
                    isTypeAwareEnabled={state.isTypeAwareEnabled}
                    registerCloseActionPopups={registerCloseActionPopups}
                    onStateChange={(state) => {
                      setState(prev => ({
                        ...prev,
                        tabs: prev.tabs.map(t => 
                          t.id === activeTab.id 
                            ? { 
                                ...t, 
                                sortConfig: state.sortConfig,
                                searchTerm: state.searchTerm,
                                filteredCount: state.filteredCount,
                                totalRows: state.totalRows ?? t.totalRows,
                                visibleColumns: state.visibleColumns
                              } 
                            : t
                        )
                      }));
                    }}
                  />
                )}
                {activeTab.type === 'pdf' && <PdfViewer key={activeTab.id} data={activeTab.data} />}
                {activeTab.type === 'docx' && <DocxViewer key={activeTab.id} data={activeTab.data} name={activeTab.name} />}
                {activeTab.type === 'rtf' && <RtfViewer key={activeTab.id} data={activeTab.data} />}
                {activeTab.type === 'txt' && <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={false} />}
                {activeTab.type === 'md' && <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={true} />}
                {activeTab.type === 'image' && <ImageViewer key={activeTab.id} src={activeTab.data} />}
                {activeTab.type === 'mdb' && <MdbViewer 
                  key={activeTab.id} 
                  file={activeTab.data} 
                  isTypeAwareEnabled={state.isTypeAwareEnabled}
                  registerCloseActionPopups={registerCloseActionPopups}
                  globalSearchTerm={state.globalSearchTerm}
                  onStateChange={(state) => {
                    setState(prev => ({
                      ...prev,
                      tabs: prev.tabs.map(t => 
                        t.id === activeTab.id 
                          ? { 
                              ...t, 
                              sortConfig: state.sortConfig,
                              searchTerm: state.searchTerm,
                              filteredCount: state.filteredCount,
                              totalRows: state.totalRows ?? t.totalRows,
                              visibleColumns: state.visibleColumns,
                              tableCount: state.tableCount,
                              activeTable: state.activeTable
                            } 
                          : t
                      )
                    }));
                  }}
                />}
                {activeTab.type === 'sqlite' && <SqliteViewer 
                  key={activeTab.id} 
                  file={activeTab.data} 
                  isTypeAwareEnabled={state.isTypeAwareEnabled}
                  registerCloseActionPopups={registerCloseActionPopups}
                  globalSearchTerm={state.globalSearchTerm}
                  onStateChange={(state) => {
                    setState(prev => ({
                      ...prev,
                      tabs: prev.tabs.map(t => 
                        t.id === activeTab.id 
                          ? { 
                              ...t, 
                              sortConfig: state.sortConfig,
                              searchTerm: state.searchTerm,
                              filteredCount: state.filteredCount,
                              totalRows: state.totalRows ?? t.totalRows,
                              visibleColumns: state.visibleColumns,
                              tableCount: state.tableCount,
                              activeTable: state.activeTable
                            } 
                          : t
                      )
                    }));
                  }}
                />}
                {activeTab.type === 'dbf' && <DbfViewer 
                  key={activeTab.id} 
                  tableData={activeTab.data as TableData} 
                  isTypeAwareEnabled={state.isTypeAwareEnabled}
                  registerCloseActionPopups={registerCloseActionPopups}
                  globalSearchTerm={state.globalSearchTerm}
                  onStateChange={(state) => {
                    setState(prev => ({
                      ...prev,
                      tabs: prev.tabs.map(t => 
                        t.id === activeTab.id 
                          ? { 
                              ...t, 
                              sortConfig: state.sortConfig,
                              searchTerm: state.searchTerm,
                              filteredCount: state.filteredCount,
                              totalRows: state.totalRows ?? t.totalRows,
                              visibleColumns: state.visibleColumns
                            } 
                          : t
                      )
                    }));
                  }}
                />}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-12 text-center overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-500">
                 <div className="max-w-5xl w-full py-8 sm:py-16">
                   <div className="mb-12 sm:mb-24">
                     <div className="w-16 h-16 sm:w-24 sm:h-24 bg-violet-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white text-3xl sm:text-5xl font-black shadow-2xl shadow-violet-500/40 mx-auto mb-8 sm:mb-12 italic transition-transform hover:rotate-6">S</div>
                     <h2 className="text-4xl sm:text-7xl font-black text-zinc-950 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[1.05]">Document <span className="text-violet-600">Workstation</span></h2>
                     <p className="text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                       Securely open and interact with professional documents locally.
                     </p>
                     
                     <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
                       {[
                         { name: 'PDF', icon: getFileIcon('pdf'), color: 'bg-rose-50 dark:bg-rose-900/10' },
                         { name: 'Word', icon: getFileIcon('docx'), color: 'bg-blue-50 dark:bg-blue-900/10' },
                         { name: 'RTF', icon: getFileIcon('rtf'), color: 'bg-amber-50 dark:bg-amber-900/10' },
                         { name: 'Markdown', icon: getFileIcon('md'), color: 'bg-zinc-100 dark:bg-zinc-800/50' },
                         { name: 'Excel', icon: getFileIcon('xlsx'), color: 'bg-emerald-50 dark:bg-emerald-900/10' },
                         { name: 'Access DB', icon: getFileIcon('mdb'), color: 'bg-teal-50 dark:bg-teal-900/10' },
                         { name: 'SQLite', icon: getFileIcon('sqlite'), color: 'bg-sky-50 dark:bg-sky-900/10' },
                          { name: 'DBF', icon: getFileIcon('dbf'), color: 'bg-orange-50 dark:bg-orange-900/10' },
                         { name: 'Images', icon: getFileIcon('image'), color: 'bg-violet-50 dark:bg-violet-900/10' }
                       ].map((fmt) => (
                         <span key={fmt.name} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl sm:rounded-2xl sm:px-5 sm:py-2.5 ${fmt.color} border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105`}>
                           {fmt.icon}
                           <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{fmt.name}</span>
                         </span>
                       ))}
                     </div>

                     <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 mb-12 sm:mb-20">
                      <label className="group relative inline-flex items-center gap-3 sm:gap-4 cursor-pointer bg-zinc-950 dark:bg-violet-600 hover:bg-zinc-800 dark:hover:bg-violet-500 text-white px-6 py-4 sm:px-10 sm:py-5 rounded-[1rem] sm:rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.1em] shadow-2xl shadow-violet-500/20 transition-all hover:scale-[1.05] active:scale-95">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                          Open Local Files
                          <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf" />
                      </label>
                      
                      <div className="flex items-center gap-2 py-3 px-4 sm:py-4 sm:px-6 bg-white dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-1000">
                         <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Designed & Crafted by</span>
                         <a href="https://www.linkedin.com/in/im-suhail-akhtar/" target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-[11px] font-black text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-widest flex items-center gap-2 group">
                            Suhail Akhtar
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         </a>
                      </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
                        {[
                          { title: 'Offline-First', desc: 'All files stay on your machine. No server uploads ever.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                          { title: 'Multi-Format', desc: 'Unified view for PDF, Spreadsheet, Word, and Documents.', icon: 'M4 6h16M4 12h16m-7 6h7' },
                          { title: 'Zen Focus', desc: 'Distraction-free interface with full-screen and Esc toggle.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                          { title: 'Tab Management', desc: 'Open and compare multiple documents simultaneously.', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
                        ].map((feature, i) => (
                          <div key={i} className="p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/30 transition-all group">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-50 dark:bg-zinc-800 text-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                            </div>
                            <h4 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white mb-2 tracking-tight">{feature.title}</h4>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{feature.desc}</p>
                          </div>
                        ))}
                     </div>
                   </div>
                 </div>
               </div>
            )}
          </div>
        </main>

        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              { label: 'Close This Tab', onClick: () => closeTab(contextMenu.tabId) },
              { label: 'Close Tabs to the Left', onClick: () => closeTabsToLeft(contextMenu.tabId) },
              { label: 'Close Tabs to the Right', onClick: () => closeTabsToRight(contextMenu.tabId) },
              { label: 'Close Other Tabs', onClick: () => setState(s => ({ ...s, tabs: s.tabs.filter(t => t.id === contextMenu.tabId) })) },
              { divider: true },
              { label: 'Close All Tabs', onClick: closeAllTabs }
            ]}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
