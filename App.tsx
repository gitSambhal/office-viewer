
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Tab } from './types';
import { FileProcessor } from './services/fileProcessor';
import { SpreadsheetViewer } from './components/SpreadsheetViewer';
import { ContextMenu } from './components/ContextMenu';
import { PdfViewer } from './components/PdfViewer';
import { DocxViewer } from './components/DocxViewer';
import { TextViewer } from './components/TextViewer';
import { ImageViewer } from './components/ImageViewer';
import { RtfViewer } from './components/RtfViewer';

const IconX = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconDark = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const IconLight = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707" /></svg>;
const IconFullscreen = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    let darkMode = false;
    try { darkMode = localStorage.getItem('theme') === 'dark'; } catch (e) {}
    return { tabs: [], activeTabId: null, darkMode, zenMode: false, isSidebarOpen: true };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTabs: Tab[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await FileProcessor.process(files[i]);
        if (result.type !== 'unknown') {
          newTabs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: files[i].name,
            type: result.type,
            lastModified: files[i].lastModified,
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
        activeTabId: newTabs[newTabs.length - 1].id 
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
      const nextTabs = prev.tabs.filter(t => t.id !== id);
      const nextId = prev.activeTabId === id ? (nextTabs.length ? nextTabs[nextTabs.length - 1].id : null) : prev.activeTabId;
      return { ...prev, tabs: nextTabs, activeTabId: nextId };
    });
  };

  const closeTabsToLeft = (id: string) => {
    setState(prev => {
      const index = prev.tabs.findIndex(t => t.id === id);
      const nextTabs = prev.tabs.slice(index);
      return { ...prev, tabs: nextTabs, activeTabId: id };
    });
  };

  const closeTabsToRight = (id: string) => {
    setState(prev => {
      const index = prev.tabs.findIndex(t => t.id === id);
      const nextTabs = prev.tabs.slice(0, index + 1);
      return { ...prev, tabs: nextTabs, activeTabId: id };
    });
  };

  const closeAllTabs = () => setState(prev => ({ ...prev, tabs: [], activeTabId: null }));

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

  return (
    <div 
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden ${state.zenMode ? 'zen-mode' : ''} ${isDragging ? 'dropzone-active' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="dropzone-overlay">
        <div className="bg-white dark:bg-slate-900 p-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-300 border-2 border-indigo-100 dark:border-indigo-900/30">
           <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-indigo-500/40">
             <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
           </div>
           <div className="text-center">
             <h2 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white mb-2">Drop to Open</h2>
             <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px]">Word, Excel, PDF, Images</p>
           </div>
        </div>
      </div>

      <header className="hide-in-zen flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">O</div>
            <h1 className="font-black text-slate-800 dark:text-white hidden sm:block tracking-tighter text-lg">OmniDocs</h1>
          </div>
          <nav className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button title="Toggle Sidebar" onClick={() => setState(s => ({ ...s, isSidebarOpen: !s.isSidebarOpen }))} className={`p-2 rounded-lg transition-all ${state.isSidebarOpen ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <button title="Toggle Dark Mode" onClick={() => setState(s => ({ ...s, darkMode: !s.darkMode }))} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-500">
              {state.darkMode ? <IconLight /> : <IconDark />}
            </button>
            <button title="Zen Mode" onClick={() => setState(s => ({ ...s, zenMode: !s.zenMode }))} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all ${state.zenMode ? 'text-indigo-600 bg-white dark:bg-slate-700 shadow-md' : 'text-slate-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button title="Toggle Fullscreen" onClick={toggleFullscreen} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all ${isFullscreen ? 'text-indigo-600' : 'text-slate-500'}`}>
              <IconFullscreen />
            </button>
          </nav>
        </div>
        <label className="cursor-pointer bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 active:scale-95">
          Open Workspace
          <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </header>

      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none z-20 tab-bar-container">
        {state.tabs.map(tab => (
          <div key={tab.id} onClick={() => setState(s => ({ ...s, activeTabId: tab.id }))} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }} className={`flex items-center gap-3 px-5 py-3 border-r border-slate-200 dark:border-slate-800 cursor-pointer min-w-[160px] max-w-[280px] select-none group transition-all relative ${state.activeTabId === tab.id ? 'bg-slate-50 dark:bg-slate-950' : 'hover:bg-slate-50/50'}`}>
            {state.activeTabId === tab.id && <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 animate-in slide-in-from-left duration-300" />}
            <span className={`text-[11px] truncate font-black uppercase tracking-tight flex-1 ${state.activeTabId === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{tab.name}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded-lg transition-all text-slate-400"><IconX /></button>
          </div>
        ))}
      </div>

      <main className="flex-1 flex overflow-hidden">
        <aside className={`hide-in-zen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-2xl z-40 ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}>
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Current Workspace</h3>
              {activeTab ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">File Type</span>
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{activeTab.type.toUpperCase()} DOCUMENT</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Last Accessed</span>
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{new Date(activeTab.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">No File Active</p>
                </div>
              )}
            </section>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-y-auto custom-scrollbar">
               <div className="max-w-4xl w-full py-16">
                 <div className="mb-20">
                   <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-500/40 mx-auto mb-12 animate-bounce">O</div>
                   <h2 className="text-7xl font-black text-slate-800 dark:text-white mb-8 tracking-tighter leading-[1.1]">OmniDocs - Desktop Office Pro</h2>
                   <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                     A high-performance workstation for local documents. Built for speed, privacy, and desktop-class functionality.
                   </p>
                   
                   <label className="group relative inline-flex items-center gap-5 cursor-pointer bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-14 py-7 rounded-[2.5rem] font-black text-lg uppercase tracking-[0.1em] shadow-2xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95">
                     <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                     Upload or Drop Documents
                     <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                   </label>
                   
                   <div className="mt-12 flex items-center justify-center gap-4 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM9 13a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.447-7.894l.553 5a1 1 0 002 0l.553-5a1 1 0 00-2-2.212l-.553 5.53a1 1 0 002 0l.553-5.53z" clipRule="evenodd" /></svg>
                      100% Offline • Private Processing • Desktop Performance
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                   <div className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-b-indigo-500">
                     <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     </div>
                     <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Enterprise-Grade Security</h4>
                     <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Built for strict privacy requirements. No data ever leaves your computer. No cloud connections, no telemetry, no tracking.</p>
                   </div>
                   
                   <div className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-b-emerald-500">
                     <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                     </div>
                     <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Multi-Tab Workflow</h4>
                     <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">A true multitasking environment. Manage Excel, PDF, Word, and images simultaneously in a professional tabbed interface.</p>
                   </div>
                   
                   <div className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-b-blue-500">
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     </div>
                     <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Million-Row Performance</h4>
                     <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Our virtualized spreadsheet engine handles massive datasets with ease. Instant sorting, filtering, and type-aware rendering.</p>
                   </div>
                   
                   <div className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-b-rose-500">
                     <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                     </div>
                     <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Pixel-Perfect Rendering</h4>
                     <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Advanced document engine for DOCX, PDF, and RTF preserves layouts, styles, and complex formatting across platforms.</p>
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
            { label: 'Close Tab', onClick: () => closeTab(contextMenu.tabId) },
            { label: 'Close All Others', onClick: () => setState(s => ({ ...s, tabs: s.tabs.filter(t => t.id === contextMenu.tabId) })) },
            { divider: true },
            { label: 'Close to the Left', onClick: () => closeTabsToLeft(contextMenu.tabId) },
            { label: 'Close to the Right', onClick: () => closeTabsToRight(contextMenu.tabId) },
            { divider: true },
            { label: 'Close All Tabs', onClick: closeAllTabs }
          ]}
        />
      )}
    </div>
  );
};

export default App;
