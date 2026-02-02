import React, { useEffect, useRef, useState, useCallback } from 'react';

declare const pdfjsLib: any;

interface Props {
  data: ArrayBuffer;
}

export const PdfViewer: React.FC<Props> = ({ data }) => {
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [scale, setScale] = useState<number>(1.2);

  const safeDataRef = useRef<ArrayBuffer | null>(null);

  const renderPdf = useCallback(async (pwd?: string) => {
    if (typeof pdfjsLib === 'undefined') {
      setError('PDF engine (pdf.js) is not loaded.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      if (!safeDataRef.current) {
        safeDataRef.current = data.slice(0);
      }
      
      const attemptBuffer = safeDataRef.current.slice(0);
      const uint8Data = new Uint8Array(attemptBuffer);
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: uint8Data,
        password: pwd,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });

      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      setNeedsPassword(false);
      
      const container = pagesContainerRef.current;
      if (!container) return;
      container.innerHTML = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        if (!pagesContainerRef.current) break;

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-8 flex flex-col items-center group relative mx-auto pdf-page';
        wrapper.dataset.pageNumber = i.toString();
        wrapper.style.width = `${viewport.width}px`;

        const pageContent = document.createElement('div');
        pageContent.className = 'relative shadow-2xl rounded border border-slate-200 dark:border-slate-800 bg-white overflow-hidden';
        pageContent.style.width = `${viewport.width}px`;
        pageContent.style.height = `${viewport.height}px`;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'absolute top-0 left-0';
        
        const textLayer = document.createElement('div');
        textLayer.className = 'textLayer absolute top-0 left-0';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.setProperty('--scale-factor', scale.toString());

        pageContent.appendChild(canvas);
        pageContent.appendChild(textLayer);
        wrapper.appendChild(pageContent);
        container.appendChild(wrapper);

        const renderTask = page.render({ canvasContext: context, viewport });
        const textContent = await page.getTextContent();
        const textLayerTask = pdfjsLib.renderTextLayer({
          textContent,
          container: textLayer,
          viewport,
          textDivs: []
        });

        await Promise.all([
          renderTask.promise,
          textLayerTask.promise
        ]);
      }
    } catch (err: any) {
      console.error('PDF Render Error:', err);
      const isPasswordError = err.name === 'PasswordException' || err.message?.toLowerCase().includes('password') || err.code === 1;
      if (isPasswordError) {
        setNeedsPassword(true);
        if (pwd) setError('Incorrect password. Access denied.');
        else setError(null);
      } else {
        setError(`Critical Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [data, scale]);

  useEffect(() => {
    safeDataRef.current = null;
    renderPdf();
  }, [data, renderPdf]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const pages = container.querySelectorAll('.pdf-page');
    let current = 1;
    pages.forEach((page: any) => {
      if (page.offsetTop <= container.scrollTop + 100) {
        current = parseInt(page.dataset.pageNumber);
      }
    });
    setCurrentPage(current);
  };

  const jumpToPage = (pageNum: number) => {
    const page = pagesContainerRef.current?.querySelector(`[data-page-number="${pageNum}"]`) as HTMLElement;
    if (page) {
      pagesContainerRef.current?.parentElement?.scrollTo({
        top: page.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
      <div className="p-2 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20 select-none shadow-sm">
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <button 
               onClick={() => jumpToPage(currentPage - 1)}
               disabled={currentPage <= 1}
               className="p-1.5 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 rounded-md transition-all"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div className="px-3 flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Page</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{currentPage}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">/ {numPages || '-'}</span>
             </div>
             <button 
               onClick={() => jumpToPage(currentPage + 1)}
               disabled={currentPage >= numPages}
               className="p-1.5 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 rounded-md transition-all"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
             </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <button 
               onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
               className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
               title="Zoom Out"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
             </button>
             <span className="px-3 text-[10px] font-black text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
               {Math.round(scale * 100)}%
             </span>
             <button 
               onClick={() => setScale(s => Math.min(3, s + 0.2))}
               className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
               title="Zoom In"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </button>
             <button 
               onClick={() => setScale(1.2)}
               className="ml-1 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-[10px] font-black uppercase tracking-widest px-2"
               title="Reset Zoom"
             >
               Reset
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-12 relative custom-scrollbar" onScroll={handleScroll}>
        {loading && (
          <div className="sticky top-1/2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-40">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4 shadow-xl"></div>
          </div>
        )}
        
        {needsPassword && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-100 dark:bg-slate-950 px-6">
            <div className="max-w-md w-full p-10 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">Protected File</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-8 font-medium">Enter document password to decrypt.</p>
              
              <form onSubmit={(e) => { e.preventDefault(); renderPdf(password); }} className="space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Password"
                  className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 ${error ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl outline-none focus:ring-4 ring-indigo-500/20 text-sm font-bold text-center transition-all`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest animate-pulse">{error}</p>}
                <button type="submit" className="w-full bg-slate-950 dark:bg-indigo-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20">
                  Unlock Content
                </button>
              </form>
            </div>
          </div>
        )}

        <div ref={pagesContainerRef} className="flex flex-col items-center" />
      </div>
    </div>
  );
};