
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Tab, FileType } from './types';
import { FileProcessor } from './services/fileProcessor';
import { SpreadsheetViewer } from './components/SpreadsheetViewer';
import { ContextMenu } from './components/ContextMenu';
import { PdfViewer } from './components/PdfViewer';
import { DocxViewer } from './components/DocxViewer';
import { TextViewer } from './components/TextViewer';
import { ImageViewer } from './components/ImageViewer';
import { RtfViewer } from './components/RtfViewer';

// Icons for Buttons & UI
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
    default: return <div className="w-4 h-4 text-zinc-400"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg></div>;
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    let darkMode = false;
    try { darkMode = localStorage.getItem('theme') === 'dark'; } catch (e) {}
    return { tabs: [], activeTabId: null, darkMode, zenMode: false, isSidebarOpen: true };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setState(prev => prev.zenMode ? { ...prev, zenMode: false } : prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTabs: Tab[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const result = await FileProcessor.process(file);
        if (result.type !== 'unknown') {
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: result.type,
            lastModified: file.lastModified,
            size: file.size,
            data: result.data,
            activeSheet: result.type === 'xlsx' ? Object.keys(result.data)[0] : undefined,
            active: false,
            columnSettings: {}
          });
        }
      } catch (err) {
        console.error("Error processing file:", files[i].name, err);
      }
    }
    if (newTabs.length > 0) {
      setState(prev => ({ 
        ...prev, 
        tabs: [...prev.tabs, ...newTabs], 
        activeTabId: newTabs[newTabs.length - 1].id,
        isSidebarOpen: true
      }));
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = document.body.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', state.darkMode ? 'dark' : 'light'); } catch (e) {}
  }, [state.darkMode]);

  const closeTab = (id: string) => {
    setState(prev => {
      const tabToClose = prev.tabs.find(t => t.id === id);
      if (tabToClose?.type === 'image' && typeof tabToClose.data === 'string' && tabToClose.data.startsWith('blob:')) {
        URL.revokeObjectURL(tabToClose.data);
      }
      const nextTabs = prev.tabs.filter(t => t.id !== id);
      const nextId = prev.activeTabId === id ? (nextTabs.length ? nextTabs[nextTabs.length - 1].id : null) : prev.activeTabId;
      return { ...prev, tabs: nextTabs, activeTabId: nextId };
    });
  };

  const closeAllTabs = () => setState(prev => ({ ...prev, tabs: [], activeTabId: null }));

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

  const activeMetadata = useMemo(() => {
    if (!activeTab) return null;
    const meta: { label: string; value: string | number }[] = [
      { label: 'File Name', value: activeTab.name },
      { label: 'Format Type', value: activeTab.type.toUpperCase() },
      { label: 'File Size', value: formatBytes(activeTab.size) },
      { label: 'Last Modified', value: new Date(activeTab.lastModified).toLocaleString() }
    ];

    if (activeTab.type === 'xlsx') {
      const sheets = activeTab.data || {};
      meta.push({ label: 'Total Sheets', value: Object.keys(sheets).length });
      if (activeTab.activeSheet && sheets[activeTab.activeSheet]) {
        meta.push({ label: 'Active Sheet', value: activeTab.activeSheet });
        meta.push({ label: 'Row Count', value: sheets[activeTab.activeSheet].rows?.length || 0 });
        meta.push({ label: 'Column Count', value: sheets[activeTab.activeSheet].headers?.length || 0 });
      }
    } else if (activeTab.type === 'txt' || activeTab.type === 'md') {
      const content = String(activeTab.data || '');
      meta.push({ label: 'Word Count', value: content.trim() ? content.trim().split(/\s+/).length : 0 });
      meta.push({ label: 'Character Count', value: content.length });
    }

    return meta;
  }, [activeTab]);

  return (
    <div 
      className={`flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 transition-colors overflow-hidden ${state.zenMode ? 'zen-mode' : ''} ${isDragging ? 'dropzone-active' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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

      <header className="hide-in-zen flex items-center justify-between px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div title="Go to Welcome Screen" className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setState(s => ({ ...s, activeTabId: null }))}>
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform italic">S</div>
            <h1 className="font-black text-zinc-800 dark:text-white hidden sm:block tracking-tighter text-lg">Suhail <span className="text-violet-600 dark:text-violet-400">Viewer</span></h1>
          </div>
          <nav className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
            <button 
              title="Toggle File Info Sidebar" 
              onClick={() => setState(s => ({ ...s, isSidebarOpen: !s.isSidebarOpen }))} 
              className={`p-2 rounded-lg transition-all ${state.isSidebarOpen ? 'bg-white dark:bg-zinc-700 shadow-md text-violet-600 dark:text-violet-400' : 'text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-700/50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <button title="Switch Theme" onClick={() => setState(s => ({ ...s, darkMode: !s.darkMode }))} className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-500">
              {state.darkMode ? <IconLight /> : <IconDark />}
            </button>
            <button title="Zen Mode (Esc to exit)" onClick={() => setState(s => ({ ...s, zenMode: !s.zenMode }))} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all ${state.zenMode ? 'text-violet-600 bg-white dark:bg-zinc-700 shadow-md' : 'text-zinc-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button title="Toggle Fullscreen" onClick={toggleFullscreen} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all ${isFullscreen ? 'text-violet-600' : 'text-zinc-500'}`}>
              <IconFullscreen />
            </button>
          </nav>
        </div>
        <label title="Choose local files to view" className="cursor-pointer bg-zinc-950 dark:bg-violet-600 hover:bg-zinc-800 dark:hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-violet-500/10 active:scale-95 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          Select Files
          <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </header>

      <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-none z-20 tab-bar-container hide-in-zen">
        {state.tabs.map(tab => (
          <div 
            key={tab.id} 
            title={`File: ${tab.name}`}
            onClick={() => setState(s => ({ ...s, activeTabId: tab.id }))} 
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }} 
            className={`flex items-center gap-2.5 px-5 py-3 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer min-w-[160px] max-w-[280px] select-none group transition-all relative ${state.activeTabId === tab.id ? 'bg-zinc-50 dark:bg-zinc-950 shadow-inner' : 'hover:bg-zinc-50/50'}`}
          >
            {state.activeTabId === tab.id && <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600 animate-in slide-in-from-left duration-300" />}
            {getFileIcon(tab.type)}
            <span className={`text-[11px] truncate font-black uppercase tracking-tight flex-1 ${state.activeTabId === tab.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{tab.name}</span>
            <button title="Close Tab" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1 rounded-lg transition-all text-zinc-400"><IconX /></button>
          </div>
        ))}
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        {state.zenMode && (
          <button 
            title="Exit Zen Mode"
            onClick={() => setState(s => ({ ...s, zenMode: false }))}
            className="fixed bottom-6 right-6 z-[100] px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            Exit Focus Mode
          </button>
        )}

        {activeTab && (
          <aside className={`hide-in-zen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 shadow-2xl z-40 ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}>
            <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Properties</h3>
                  <button onClick={() => setState(s => ({...s, isSidebarOpen: false}))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400" title="Hide Sidebar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>
                {activeMetadata && (
                  <div className="space-y-6">
                    {activeMetadata.map((m, i) => (
                      <div key={i} className="group animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 group-hover:text-violet-500 transition-colors">{m.label}</div>
                        <div className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200 break-words leading-snug">{m.value}</div>
                      </div>
                    ))}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed">Status: Encrypted & Private</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
          {activeTab ? (
            <div className="flex-1 h-full w-full">
              {activeTab.type === 'xlsx' && (
                <SpreadsheetViewer 
                  key={activeTab.id}
                  sheets={activeTab.data}
                  activeSheet={activeTab.activeSheet!}
                  onSheetChange={(name) => setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, activeSheet: name } : t)}))}
                  onUpdate={(sheetName, newData) => {
                    setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, data: { ...t.data, [sheetName]: { ...t.data[sheetName], rows: newData } } } : t)}));
                  }}
                  columnWidths={(activeTab.columnSettings || {})[activeTab.activeSheet!] || {}}
                  onResizeColumn={(sheetName, colIdx, width) => {
                    setState(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === activeTab.id ? { ...t, columnSettings: { ...t.columnSettings, [sheetName]: { ...t.columnSettings?.[sheetName], [colIdx]: width } } } : t)}));
                  }}
                />
              )}
              {activeTab.type === 'pdf' && <PdfViewer key={activeTab.id} data={activeTab.data} />}
              {activeTab.type === 'docx' && <DocxViewer key={activeTab.id} data={activeTab.data} name={activeTab.name} />}
              {activeTab.type === 'rtf' && <RtfViewer key={activeTab.id} data={activeTab.data} />}
              {activeTab.type === 'txt' && <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={false} />}
              {activeTab.type === 'md' && <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={true} />}
              {activeTab.type === 'image' && <ImageViewer key={activeTab.id} src={activeTab.data} />}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-start p-12 text-center overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-500">
               <div className="max-w-5xl w-full py-16">
                 <div className="mb-24">
                   <div className="w-24 h-24 bg-violet-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-violet-500/40 mx-auto mb-12 italic transition-transform hover:rotate-6">S</div>
                   <h2 className="text-7xl font-black text-zinc-950 dark:text-white mb-6 tracking-tighter leading-[1.05]">Secure Document <span className="text-violet-600">Workstation</span></h2>
                   <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                     Open and manage PDF, Excel (XLSX), Word (DOCX), RTF, Markdown, and Images directly in your browser. All processing is 100% local — your documents never leave your computer.
                   </p>
                   
                   <div className="flex flex-wrap justify-center gap-3 mb-16">
                     {['PDF', 'XLSX', 'DOCX', 'RTF', 'Markdown', 'JPG/PNG'].map((fmt) => (
                       <span key={fmt} className="px-4 py-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest border border-zinc-300/50 dark:border-zinc-700/50">
                         {fmt}
                       </span>
                     ))}
                   </div>

                   <div className="flex items-center justify-center gap-6 mb-20">
                    <label title="Choose local documents to begin" className="group relative inline-flex items-center gap-4 cursor-pointer bg-zinc-950 dark:bg-violet-600 hover:bg-zinc-800 dark:hover:bg-violet-500 text-white px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.1em] shadow-2xl shadow-violet-500/20 transition-all hover:scale-[1.05] active:scale-95">
                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                        Browse Local Documents
                        <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                    </label>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                      {[
                        { title: 'Local-Only Engine', desc: 'Secure, client-side processing. Zero network dependency for viewing files.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                        { title: 'Multi-Tab Workspace', desc: 'Read and compare multiple documents across formats in one unified view.', icon: 'M4 6h16M4 12h16m-7 6h7' },
                        { title: 'Zen & Focus Mode', desc: 'Distraction-free interface with full-screen support and ESC-to-exit convenience.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                        { title: 'Installable PWA', desc: 'High-performance offline app. Desktop-class document management in a web browser.', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' }
                      ].map((feature, i) => (
                        <div key={i} className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/30 transition-all group">
                          <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 text-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                          </div>
                          <h4 className="text-lg font-black text-zinc-950 dark:text-white mb-2 tracking-tight">{feature.title}</h4>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{feature.desc}</p>
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
            { label: 'Close Other Tabs', onClick: () => setState(s => ({ ...s, tabs: s.tabs.filter(t => t.id === contextMenu.tabId) })) },
            { divider: true },
            { label: 'Close All Tabs', onClick: closeAllTabs }
          ]}
        />
      )}
    </div>
  );
};

export default App;
