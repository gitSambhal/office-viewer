import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from './context/AppContext';
import { useFileHandler } from './hooks/useFileHandler';
import { useUrlHandler } from './hooks/useUrlHandler';
import { Header } from './components/Header';
import { UrlModal } from './components/UrlModal';
import { TabBar } from './components/tabs/TabBar';
import { FileContentViewer } from './components/FileContentViewer';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { handleFiles, isProcessing, errorMessage, setErrorMessage } = useFileHandler();
  const { setShowUrlModal } = useUrlHandler();
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  const [scrolledPastMainCTA, setScrolledPastMainCTA] = useState(false);
  const mainCTARef = React.useRef<HTMLDivElement>(null);
  
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
        if (state.zenMode) {
          dispatch({ type: 'SET_ZEN_MODE', payload: false });
        }
        if (state.showUrlModal) {
          dispatch({ type: 'SET_SHOW_URL_MODAL', payload: false });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.zenMode, state.showUrlModal]);

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

  // Set handleFilesRef immediately with the current function
  useEffect(() => {
    handleFilesRef.current = handleFiles;
  }, [handleFiles]);

  const closeAllTabs = () => dispatch({ type: 'CLOSE_ALL_TABS' });

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
           </div>
        )}

        <UrlModal />

        <Header />

        <TabBar />

        <main className="flex-1 flex overflow-hidden relative">
          {state.zenMode && (
            <button
              onClick={() => dispatch({ type: 'SET_ZEN_MODE', payload: false })}
              className="fixed bottom-6 right-6 z-[100] px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              Exit Zen Mode
            </button>
          )}

          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
            {activeTab ? (
              <FileContentViewer />
            ) : (
              <Dashboard />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AppContent;
