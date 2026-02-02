
import React, { useEffect, useRef, useState } from 'react';

// Using window.docx global provided by docx-preview.js
declare const docx: any;

interface Props {
  data: ArrayBuffer;
  name?: string;
}

const IconExport = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export const DocxViewer: React.FC<Props> = ({ data, name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderDoc = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);
      
      try {
        containerRef.current.innerHTML = '';
        const renderer = typeof docx !== 'undefined' ? docx : (window as any).docx;
        
        if (!renderer || !renderer.renderAsync) {
          throw new Error('Word Engine (docx-preview) failed to initialize.');
        }

        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        // Create a dedicated inner element for the body to satisfy the HTMLElement parameter requirement
        const bodyContainer = document.createElement('div');
        bodyContainer.className = "docx-body-wrapper";
        containerRef.current.appendChild(bodyContainer);

        await renderer.renderAsync(blob, containerRef.current, bodyContainer, {
          className: "docx-inner",
          inWrapper: false, 
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderChanges: true,
          debug: false
        });
      } catch (err: any) {
        console.error('Docx Preview Error:', err);
        if (isMounted) {
          setError(`Rendering failed: ${err.message || 'The document format may be unsupported.'}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    renderDoc();
    return () => { isMounted = false; };
  }, [data]);

  const handlePrint = () => {
    if (!containerRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        window.print(); // Fallback to global print if popup is blocked
        return;
    }
    
    // Clone styles and document content into a clean window for focused printing
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');
      
    printWindow.document.write(`
      <html>
        <head>
          <title>${name || 'Document'}</title>
          ${styles}
          <style>
            body { background: white !important; margin: 0; padding: 0; }
            .docx-inner { box-shadow: none !important; margin: 0 auto !important; }
          </style>
        </head>
        <body>
          <div class="docx-preview-container">
            ${containerRef.current.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsExportOpen(false);
  };

  const handleDownload = () => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || "document.docx";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20 shadow-sm hide-in-print">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">DOCX HI-FI ENGINE</span>
        </div>

        <div className="flex items-center gap-2">
           <div className="relative">
             <button onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-all">
               <IconExport /> Export
             </button>
             {isExportOpen && (
               <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in duration-150">
                 <button onClick={handleDownload} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download Original (.docx)
                 </button>
                 <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                 <button onClick={handlePrint} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                   Print / Save as PDF
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar bg-slate-100 dark:bg-slate-950">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Processing Office Layouts...</span>
          </div>
        )}
        
        {error && (
          <div className="max-w-4xl mx-auto p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-3xl border border-rose-200 dark:border-rose-800/50 mb-8 shadow-xl text-center">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">Engine Error</h3>
            <p className="text-sm font-medium opacity-80 mb-6 max-w-md mx-auto">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">Retry Engine</button>
          </div>
        )}

        <div 
          ref={containerRef}
          className="max-w-5xl mx-auto bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 docx-preview-container"
        />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .docx-preview-container { min-height: 11in; padding: 0 !important; }
          .docx-inner { background: white !important; box-shadow: none !important; padding: 2cm !important; margin: 0 auto !important; max-width: 100% !important; box-sizing: border-box !important; }
          .dark .docx-inner { background: #1e293b !important; color: #f1f5f9 !important; }
          .dark .docx-inner table, .dark .docx-inner td, .dark .docx-inner th { border-color: #475569 !important; }
          .dark .docx-inner p, .dark .docx-inner span { color: #f1f5f9 !important; }
        `}} />
      </div>
    </div>
  );
};
