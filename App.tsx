
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
const IconDark = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
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
  const [previewActiveTab, setPreviewActiveTab] = useState(0);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [scrolledPastMainCTA, setScrolledPastMainCTA] = useState(false);
  const mainCTARef = React.useRef<HTMLDivElement>(null);
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
            const fileArray: File[] = fileData.files.map((f: { name: string; type: string; size: number; blob?: Blob; arrayBuffer?: ArrayBuffer }) => {
              const data = f.blob || f.arrayBuffer;
              if (!data) {
                console.log('[App] No data for file:', f.name);
                return null;
              }
              return new File([data], f.name, { type: f.type });
            }).filter(Boolean) as File[];
            
            console.log('[App] Retrieved files from IndexedDB:', fileArray.length, fileArray.map(f => f.name));
            resolve(fileArray);
          } else {
            console.log('[App] No file data found for shareId:', shareId);
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
    console.log('[App] Initializing PWA file handling');
    
    // Check for shared files on initial load (in case PWA was opened with files)
    const checkInitialSharedFiles = async () => {
      console.log('[App] Checking for initial shared files');
      try {
        // Wait for handleFilesRef to be set
        if (!handleFilesRef.current) {
          console.log('[App] handleFilesRef not available, waiting...');
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
          const fileDataList = request.result as Array<{ id: string; files: Array<{ name: string; type: string; size: number; blob?: Blob; arrayBuffer?: ArrayBuffer }> }>;
          if (fileDataList && fileDataList.length > 0 && handleFilesRef.current) {
            // Get the most recent file data
            const fileData = fileDataList[fileDataList.length - 1];
            const fileArray: File[] = fileData.files.map((f) => {
              const data = f.blob || f.arrayBuffer;
              if (!data) {
                console.log('[App] No data for file:', f.name);
                return null;
              }
              return new File([data], f.name, { type: f.type });
            }).filter(Boolean) as File[];
            
            console.log('[App] Found shared files on load:', fileArray.length, fileArray.map(f => f.name));
            handleFilesRef.current(fileArray as unknown as FileList);
            // Clean up
            clearSharedFiles(fileData.id);
          } else {
            console.log('[App] No shared files found in IndexedDB');
          }
        };
        
        request.onerror = () => {
          console.error('[App] Error getting shared files from IndexedDB:', request.error);
        };
      } catch (err) {
        console.error('[App] Error checking initial shared files:', err);
      }
    };
    
    // Setup launchQueue API handler (correct API)
    const win = window as unknown as {
      launchQueue?: {
        setConsumer: (consumer: (params: { files: FileSystemFileHandle[] }) => void) => void
      }
    };
    
    // Process file handles from launchQueue
    const processFileHandles = async (handles: FileSystemFileHandle[]) => {
      console.log('[App] Processing file handles:', handles.length);
      const fileArray: File[] = [];
      for (const handle of handles) {
        try {
          console.log('[App] Getting file from handle:', handle.name);
          const file = await handle.getFile();
          fileArray.push(file);
          console.log('[App] File obtained:', file.name, file.size);
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
      console.log('[App] launchQueue API available');
      win.launchQueue.setConsumer(async (params: any) => {
        console.log('[App] launchQueue setConsumer called with params:', params);
        if (params.files && params.files.length > 0) {
          await processFileHandles(params.files);
        } else {
          console.log('[App] No files in launchQueue params');
          // If no files in launchQueue, check IndexedDB for shared files
          checkInitialSharedFiles();
        }
      });
    } else {
      console.log('[App] launchQueue API not available');
      // Fallback to checking IndexedDB
      checkInitialSharedFiles();
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
    
    // Check service worker status
    if (navigator.serviceWorker) {
      console.log('[App] Service worker available, checking status...');
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
      console.log('[App] Service worker not available');
      checkInitialSharedFiles();
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [openDB, retrieveSharedFiles, clearSharedFiles]);

  // Scroll handler for header CTA visibility using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolledPastMainCTA(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (mainCTARef.current) {
      observer.observe(mainCTARef.current);
    }

    return () => observer.disconnect();
  }, []);

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
        setShowUrlModal(false);
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


  const handleUrlOpen = useCallback(async () => {
    if (!urlInput.trim()) return;
    
    setIsLoadingUrl(true);
    try {
      const response = await fetch(urlInput.trim());
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const blob = await response.blob();
      
      // Determine file extension and name from URL or content-type
      const urlPath = urlInput.split('/').pop() || 'downloaded-file';
      const extension = urlPath.split('.').pop()?.toLowerCase() || '';
      
      // Map extension to file type
      let fileType: FileType = 'unknown';
      let extensionForName = '';
      
      if (contentType.includes('pdf') || extension === 'pdf') {
        fileType = 'pdf';
        extensionForName = '.pdf';
      } else if (contentType.includes('spreadsheet') || contentType.includes('excel') || ['xlsx', 'xls'].includes(extension)) {
        fileType = 'xlsx';
        extensionForName = '.xlsx';
      } else if (contentType.includes('word') || contentType.includes('document') || ['docx', 'doc'].includes(extension)) {
        fileType = 'docx';
        extensionForName = '.docx';
      } else if (contentType.includes('rtf') || extension === 'rtf') {
        fileType = 'rtf';
        extensionForName = '.rtf';
      } else if (contentType.includes('text') || ['txt', 'md', 'markdown'].includes(extension)) {
        fileType = extension === 'md' || extension === 'markdown' ? 'md' : 'txt';
        extensionForName = extension === 'md' ? '.md' : extension === 'markdown' ? '.md' : '.txt';
      } else if (contentType.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
        fileType = 'image';
        const extMatch = extension.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        extensionForName = extMatch ? extMatch[0] : '.png';
      } else if (['sqlite', 'db'].includes(extension)) {
        fileType = 'sqlite';
        extensionForName = '.sqlite';
      } else if (['mdb', 'accdb'].includes(extension)) {
        fileType = 'mdb';
        extensionForName = '.' + extension;
      } else if (extension === 'dbf') {
        fileType = 'dbf';
        extensionForName = '.dbf';
      } else {
        extensionForName = '.' + (extension || 'bin');
      }
      
      const fileName = urlPath.includes('.') ? urlPath : `file${extensionForName}`;
      const file = new File([blob], fileName, { type: blob.type || contentType });
      
      await handleFiles([file]);
      setShowUrlModal(false);
      setUrlInput('');
    } catch (error) {
      console.error('Error opening URL:', error);
      setErrorMessage('Failed to open file from URL. Please check the URL and try again.');
    } finally {
      setIsLoadingUrl(false);
    }
  }, [urlInput, handleFiles]);

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
    
    // Format badge
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
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;
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

  // Preview content components
   const PreviewPdfContent = () => (
    <div className="relative z-10 h-48 sm:h-64">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 text-rose-600">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
            </div>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">report.pdf</span>
          </div>
          <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Page 1 of 3</div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <div className="w-full h-4 sm:h-6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-1/2 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 sm:my-3"></div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-full h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-5/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-4/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-full h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 sm:my-3"></div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-3/4 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-5/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const PreviewSpreadsheetContent = () => (
    <div className="relative z-10 h-48 sm:h-64">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 text-emerald-600">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">budget.xlsx</span>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex gap-1">
            <div className="w-6 sm:w-8 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-16 sm:w-20 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const PreviewMarkdownContent = () => (
    <div className="relative z-10 h-48 sm:h-64">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 text-zinc-500">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
          </div>
          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">notes.md</span>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="w-1/3 h-3 sm:h-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
          <div className="w-full h-2 sm:h-3 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-full h-2 sm:h-3 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-2/3 h-2 sm:h-3 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-1/3 h-3 sm:h-4 bg-zinc-300 dark:bg-zinc-700 rounded mt-2 sm:mt-3"></div>
          <div className="w-full h-2 sm:h-3 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-5/6 h-2 sm:h-3 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>
  );

  const PreviewSqliteContent = () => (
    <div className="relative z-10 h-48 sm:h-64">
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 text-sky-600">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-8h2v5h-2v-5zm0-3h2v2h-2V9z"/></svg>
          </div>
          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">database.sqlite</span>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div 
        className={`flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 transition-colors overflow-hidden ${state.zenMode ? 'zen-mode' : ''} ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          
          // Check if any dropped items are directories
          const entries = Array.from(e.dataTransfer.items)
            .map(item => (item as any).webkitGetAsEntry?.());
          
          const hasDirectories = entries.some(entry => entry && entry.isDirectory);
          const hasFiles = entries.some(entry => entry && entry.isFile);
          
          if (hasDirectories) {
            // Handle directory drop
            const processDirectory = async (entry: any): Promise<File[]> => {
              const files: File[] = [];
              const reader = entry.createReader();
              
              return new Promise((resolve, reject) => {
                const readEntries = () => {
                  reader.readEntries(async (subEntries: any[]) => {
                    if (subEntries.length === 0) {
                      resolve(files);
                      return;
                    }
                    
                    for (const subEntry of subEntries) {
                      if (subEntry.isDirectory) {
                        const subFiles = await processDirectory(subEntry);
                        files.push(...subFiles);
                      } else if (subEntry.isFile) {
                        const file = await new Promise<File>((resolveFile, rejectFile) => {
                          subEntry.file(resolveFile, rejectFile);
                        });
                        const supportedTypes = ['.xlsx', '.xls', '.csv', '.docx', '.doc', '.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.rtf', '.mdb', '.accdb', '.sqlite', '.db', '.db3', '.dbf'];
                        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                        if (supportedTypes.includes(fileExtension)) {
                          files.push(file);
                        }
                      }
                    }
                    
                    readEntries();
                  }, reject);
                };
                
                readEntries();
              });
            };
            
            const processAllEntries = async () => {
              const allFiles: File[] = [];
              
              for (const entry of entries) {
                if (entry) {
                  if (entry.isDirectory) {
                    const directoryFiles = await processDirectory(entry);
                    allFiles.push(...directoryFiles);
                  } else if (entry.isFile) {
                    const file = await new Promise<File>((resolveFile, rejectFile) => {
                      entry.file(resolveFile, rejectFile);
                    });
                    allFiles.push(file);
                  }
                }
              }
              
              // Filter supported files
              const supportedFiles = allFiles.filter(file => {
                const supportedTypes = ['.xlsx', '.xls', '.csv', '.docx', '.doc', '.pdf', '.txt', '.md', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.rtf', '.mdb', '.accdb', '.sqlite', '.db', '.db3', '.dbf'];
                const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                return supportedTypes.includes(fileExtension);
              });
              
              if (supportedFiles.length > 0) {
                // Ask for confirmation
                const confirmed = window.confirm(`Found ${supportedFiles.length} supported file${supportedFiles.length > 1 ? 's' : ''} in the dropped ${hasDirectories ? 'folder' : 'items'}. Do you want to open them?`);
                if (confirmed) {
                  handleFiles(supportedFiles);
                }
              } else {
                setErrorMessage('No supported files found in the dropped folder.');
              }
            };
            
            processAllEntries().catch(error => {
              console.error('Error processing directory:', error);
              setErrorMessage('Failed to process the dropped folder.');
            });
          } else if (hasFiles) {
            // Handle file drop directly
            handleFiles(e.dataTransfer.files);
          }
        }}
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

        {/* URL Modal */}
        {showUrlModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">Open from URL</h3>
                <button 
                  onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
                >
                  <IconX />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                    File URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/file.pdf"
                    className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && urlInput.trim()) {
                        handleUrlOpen();
                      }
                    }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUrlOpen}
                    disabled={!urlInput.trim() || isLoadingUrl}
                    className={`flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${(!urlInput.trim() || isLoadingUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoadingUrl ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Open File'
                    )}
                  </button>
                </div>
              </div>
              
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Supports PDF, Excel, Word, RTF, Text, Images, SQLite, MDB, and more.
              </p>
            </div>
          </div>
        )}

        <header className="hide-in-zen flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none z-30 shadow-sm shrink-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div title="Go to Dashboard" className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setState(s => ({ ...s, activeTabId: null }))}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform italic">S</div>
              <h1 className="font-black text-zinc-800 dark:text-white hidden sm:block tracking-tighter text-lg">Suhail <span className="text-violet-600 dark:text-violet-400">Viewer</span></h1>
            </div>
            {activeTab && (
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
            )}
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
          
           <div className="flex items-center gap-2">
             {(state.tabs.length > 0 || scrolledPastMainCTA) && (
               <>
                 <label className="group relative inline-flex items-center gap-2 sm:gap-3 cursor-pointer bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white dark:text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                   <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                   <span className="hidden xs:inline">Open Files</span>
                   <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf" />
                 </label>
                 <button 
                   onClick={() => setShowUrlModal(true)}
                   className="group relative inline-flex items-center gap-2 sm:gap-3 cursor-pointer bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:scale-[1.02] active:scale-95"
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                   <span className="hidden xs:inline">Open from URL</span>
                 </button>
               </>
             )}
           </div>
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
               <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-12 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-500">
                 <div className="max-w-5xl w-full py-8 sm:py-16">
                     <div className="mb-12 sm:mb-24">
                        {/* Hero Section Heading */}
                        <div className="text-center mb-12">
                          <h2 className="text-4xl sm:text-7xl font-black text-zinc-950 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[1.05]">The Universal File Viewer</h2>
                          <p className="text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            Open and switch between multiple documents, spreadsheets, and databases instantly. No installations, 100% local.
                          </p>
                        </div>
                        
                        {/* Chips Preview */}
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
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
                            <span key={fmt.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:px-4 sm:py-2 ${fmt.color} border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105`}>
                              {fmt.icon}
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{fmt.name}</span>
                            </span>
                          ))}
                        </div>

                        {/* CTA Buttons */}
                        <div ref={mainCTARef} id="main-cta-section" className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                           <label className="group relative inline-flex items-center gap-3 cursor-pointer bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                              Open Files
                              <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf" />
                          </label>

                          <button 
                            onClick={() => setShowUrlModal(true)}
                            className="group relative inline-flex items-center gap-3 cursor-pointer bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Open from URL
                          </button>
                        </div>
                       
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch('https://pdfobject.com/pdf/sample.pdf');
                              const blob = await response.blob();
                              const file = new File([blob], 'sample-document.pdf', { type: 'application/pdf' });
                              handleFiles([file]);
                            } catch (error) {
                              console.error('Failed to load sample file:', error);
                              setErrorMessage('Failed to load sample document. Please try again.');
                            }
                          }}
                          className="text-sm sm:text-base text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors underline underline-offset-4"
                        >
                          No file? Try a sample PDF
                        </button> 
                        </div>
                        
                         {/* App Preview with Tabs and Content */}
                         <div className="flex justify-center">
                           <div className="relative w-full max-w-4xl px-4">
                             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-[3rem] blur-3xl opacity-50"></div>
                             <div className="relative bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                               {/* Background Gradient */}
                               <div className="absolute inset-0 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 to-blue-50 dark:to-blue-900/20 opacity-50"></div>
                               
                               {/* Preview Content */}
                               <div className="relative z-10">
                                 {/* Header Preview */}
                                 <div className="flex items-center justify-between mb-4 sm:mb-6">
                                   <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black italic">S</div>
                                     <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">Suhail Viewer</span>
                                   </div>
                                   <div className="flex gap-1.5 sm:gap-2">
                                     <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500"></div>
                                     <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500"></div>
                                     <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500"></div>
                                   </div>
                                 </div>
                                 
                                 {/* Tabs Preview */}
                                 <div className="flex items-center mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-none">
                                   {[
                                     { name: 'report.pdf', type: 'pdf' as FileType, index: 0 },
                                     { name: 'budget.xlsx', type: 'xlsx' as FileType, index: 1 },
                                     { name: 'notes.md', type: 'md' as FileType, index: 2 },
                                     { name: 'database.sqlite', type: 'sqlite' as FileType, index: 3 }
                                   ].map((tab) => (
                                     <div 
                                       key={tab.index}
                                       onClick={() => setPreviewActiveTab(tab.index)}
                                       className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mr-2 whitespace-nowrap transition-all cursor-pointer ${
                                         previewActiveTab === tab.index 
                                             ? 'bg-violet-600 text-white shadow-lg' 
                                             : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                       }`}
                                     >
                                       {getFileIcon(tab.type)}
                                       <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[100px] sm:max-w-[120px] md:max-w-[160px]">{tab.name}</span>
                                       {previewActiveTab === tab.index && (
                                         <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                                 
                                 {/* Active Tab Content Preview */}
                                 <div className="grid grid-cols-1 gap-4">
                                   {previewActiveTab === 0 && <PreviewPdfContent />}
                                   {previewActiveTab === 1 && <PreviewSpreadsheetContent />}
                                   {previewActiveTab === 2 && <PreviewMarkdownContent />}
                                   {previewActiveTab === 3 && <PreviewSqliteContent />}
                                 </div>
                                 
                                 {/* Preview Text */}
                                 <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                   Preview: Open multiple files in tabs and switch instantly
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>

                     {/* Recent Files */}
                     {(() => {
                       try {
                         const recentFiles = JSON.parse(localStorage.getItem('suhail_recent_files') || '[]');
                         if (recentFiles.length > 0) {
                           return (
                             <div className="mb-12 sm:mb-16 mt-8 sm:mt-12">
                               <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 sm:mb-6 text-center">Recent Files</h3>
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                                 {recentFiles.map((file: any, index: number) => (
                                   <div 
                                     key={index} 
                                     className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/30 transition-all cursor-pointer group overflow-hidden"
                                     onClick={() => {
                                       const fileInput = document.createElement('input');
                                       fileInput.type = 'file';
                                       fileInput.accept = '.pdf,.xlsx,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf';
                                       fileInput.onchange = (e) => handleFiles((e.target as HTMLInputElement).files);
                                       fileInput.click();
                                     }}
                                   >
                                     <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/20 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all shrink-0">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                     </div>
                                     <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                       <div className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 truncate" title={file.name}>{file.name}</div>
                                       <div className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400">{file.type}</div>
                                     </div>
                                     <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-600">
                                       {new Date(file.timestamp).toLocaleDateString()}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         }
                       } catch (error) {
                         console.error('Failed to load recent files:', error);
                       }
                       return null;
                     })()}

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left mb-12 sm:mb-16">
                          {[
                            { title: 'Offline-First & Local Processing', desc: 'Your files are processed entirely on your device, ensuring privacy and security with absolutely no server uploads.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                            { title: 'Ad-Free Experience', desc: 'Enjoy a clean, uninterrupted viewing experience without any advertisements.', icon: 'M6 18L18 6M6 6l12 12' },
                            { title: 'Multi-Format Viewing', desc: 'Seamlessly open and view a wide range of documents including PDFs, Spreadsheets, Word files, various Databases (MDB, SQLite, DBF), Images, and more.', icon: 'M4 6h16M4 12h16m-7 6h7' },
                            { title: 'Tab Management', desc: 'Efficiently manage multiple open documents in a tabbed interface for easy comparison and multitasking.', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                            { title: 'Zen Focus Mode', desc: 'Eliminate distractions with a dedicated focus mode, including fullscreen viewing and quick toggles.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                            { title: 'Intuitive File Handling', desc: 'Easily load files via drag & drop (even entire folders), a traditional file picker, or by providing a URL.', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
                            { title: 'PWA File Sharing', desc: 'Directly receive and open files shared from other applications on your device when installed as a Progressive Web App.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                            { title: 'Type-Aware Visualization', desc: 'Automatic data type detection with color-coded visual highlighting for better data comprehension.', icon: 'M7 7h10M10 7v10m4-10v10M7 17h10' },
                            { title: 'Advanced Search & Filter', desc: 'Powerful search capabilities across all open tabs and databases with real-time filtering.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                            { title: 'Sorting & Organization', desc: 'Multi-column sorting and data organization for tables and spreadsheets.', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
                            { title: 'Real-time Metadata', desc: 'Detailed file information and metadata displayed in a customizable sidebar.', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                            { title: 'Responsive Design', desc: 'Optimized viewing experience across all device sizes from mobile to desktop.', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                            { title: 'Dark & Light Themes', desc: 'Toggle between dark and light themes for comfortable viewing in any environment.', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                            { title: 'Cross-Browser Support', desc: 'Works seamlessly on all modern browsers including Chrome, Firefox, Safari, and Edge.', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }
                          ].map((feature, i) => (
                            <div key={i} className="p-5 sm:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100/50 dark:border-zinc-800/50 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/30 transition-all group">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-100 dark:bg-zinc-800 text-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                              </div>
                              <h4 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white mb-2 tracking-tight">{feature.title}</h4>
                              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                          ))}
                       </div>

                     {/* Footer Credits */}
                     <div className="flex items-center justify-center gap-2 py-3 px-4 sm:py-4 sm:px-6 bg-white dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-1000">
                        <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Designed & Crafted by</span>
                        <a href="https://www.linkedin.com/in/im-suhail-akhtar/" target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-[11px] font-black text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-widest flex items-center gap-2 group">
                           Suhail Akhtar
                           <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
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
