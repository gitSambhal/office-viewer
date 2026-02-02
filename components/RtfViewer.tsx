
import React, { useEffect, useRef, useState } from 'react';

declare const RTFJS: any;

interface Props {
  data: ArrayBuffer;
}

const IconExport = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export const RtfViewer: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const renderRtf = async () => {
      if (typeof RTFJS === 'undefined') {
        setError('RTF engine not loaded.');
        return;
      }
      try {
        if (containerRef.current) containerRef.current.innerHTML = '';
        const doc = new RTFJS.Document(data);
        const elements = await doc.render();
        if (containerRef.current) {
          if (Array.isArray(elements)) {
            elements.forEach(el => { 
              if (el instanceof Node) containerRef.current?.appendChild(el); 
            });
          } else if (elements instanceof Node) {
            containerRef.current.appendChild(elements);
          }
        }
      } catch (err: any) {
        console.error('RTF Error:', err);
        setError(`Failed to parse RTF content.`);
      }
    };
    renderRtf();
  }, [data]);

  const handleExportPdf = () => {
    if (!containerRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { padding: 40px; font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid #ddd; padding: 8px; }
          </style>
        </head>
        <body>${containerRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    setIsExportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">RTF SOURCE VIEW</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <button onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
               <IconExport /> Export
             </button>
             {isExportOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in duration-150">
                 <button onClick={handleExportPdf} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Export as PDF</button>
               </div>
             )}
           </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-sm p-12 md:p-16 prose dark:prose-invert prose-slate ring-1 ring-slate-200 dark:ring-slate-800 min-h-[11in] rtf-container">
          {error ? (
            <div className="text-rose-500 text-xs font-bold py-12 text-center uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-inner">
              {error}
            </div>
          ) : (
            <div ref={containerRef} />
          )}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .rtf-container table { width: 100% !important; border-collapse: collapse !important; margin: 1em 0 !important; }
          .rtf-container td, .rtf-container th { border: 1px solid #cbd5e1 !important; padding: 8px !important; }
          .dark .rtf-container td, .dark .rtf-container th { border-color: #334155 !important; }
          .rtf-container p { margin-bottom: 0.5em !important; }
          .rtf-container * { max-width: 100% !important; }
        `}} />
      </div>
    </div>
  );
};
