import React, { useEffect, useRef, useState } from 'react';

declare const docx: any;
declare const mammoth: any;

interface Props {
  data: ArrayBuffer;
  name?: string;
}

const IconExport = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

export const DocxViewer: React.FC<Props> = ({ data, name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'layout' | 'speed'>('layout');
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderDoc = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        containerRef.current.innerHTML = '';

        if (viewMode === 'layout') {
          const renderer =
            typeof docx !== 'undefined' ? docx : (window as any).docx;
          if (!renderer || !renderer.renderAsync)
            throw new Error('Layout engine missing.');

          const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });
          await renderer.renderAsync(blob, containerRef.current, undefined, {
            className: 'docx-inner',
            inWrapper: false,
            ignoreWidth: false,
            breakPages: true,
            useBase64URL: true,
            renderChanges: true,
          });
        } else {
          // Speed mode using Mammoth for high-performance text-first rendering
          const result = await mammoth.convertToHtml({ arrayBuffer: data });
          containerRef.current.innerHTML = `<div class="prose dark:prose-invert max-w-none p-12 bg-white dark:bg-zinc-900 shadow-2xl rounded-lg">${result.value}</div>`;
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`Engine Error: ${err.message}. Switching to speed mode...`);
          if (viewMode === 'layout') setViewMode('speed');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    renderDoc();
    return () => {
      isMounted = false;
    };
  }, [data, viewMode]);

  const handlePrint = () => {
    if (!containerRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((s) => s.outerHTML)
      .join('');
    printWindow.document.write(
      `<html><head><title>${name || 'Document'}</title>${styles}<style>body { background: white !important; padding: 2cm; } .docx-inner, .prose { box-shadow: none !important; margin: 0 auto !important; }</style></head><body>${containerRef.current.innerHTML}</body></html>`
    );
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    setIsExportOpen(false);
  };

  const handleDownload = () => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'document.docx';
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-20 shadow-sm hide-in-print">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('layout')}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'layout' ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm' : 'text-zinc-500'}`}
            >
              Layout Fidelity
            </button>
            <button
              onClick={() => setViewMode('speed')}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'speed' ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm' : 'text-zinc-500'}`}
            >
              High Speed
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all active:scale-95 shadow-violet-500/10"
            >
              <IconExport /> Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in duration-150">
                <button
                  onClick={handleDownload}
                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  Download .docx
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  Print / Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="max-w-2xl mx-auto p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-3xl border border-rose-200 text-center mb-8">
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}
        <div
          ref={containerRef}
          className="max-w-5xl mx-auto docx-preview-container"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .docx-inner { background: white !important; padding: 2cm !important; margin: 0 auto !important; font-family: sans-serif !important; }
          .dark .docx-inner { background: #18181b !important; color: #f4f4f5 !important; }
          .dark .docx-inner p, .dark .docx-inner span, .dark .docx-inner td { color: #f4f4f5 !important; }
          .prose { margin: 0 auto; }
        `,
          }}
        />
      </div>
    </div>
  );
};
