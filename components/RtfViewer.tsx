import React, { useEffect, useRef, useState } from 'react';

declare const RTFJS: any;

interface Props {
  data: ArrayBuffer;
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

export const RtfViewer: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const renderRtf = async () => {
      if (typeof RTFJS === 'undefined') {
        setError('RTF engine missing.');
        return;
      }
      RTFJS.loggingEnabled(false);
      try {
        if (containerRef.current) containerRef.current.innerHTML = '';
        const doc = new RTFJS.Document(data);
        const elements = await doc.render();
        if (containerRef.current) {
          if (Array.isArray(elements)) {
            elements.forEach((el) => {
              if (el && typeof el === 'object' && 'nodeType' in el) {
                containerRef.current?.appendChild(el);
              } else if (typeof el === 'string') {
                const textNode = document.createTextNode(el);
                containerRef.current?.appendChild(textNode);
              }
            });
          } else if (
            elements &&
            typeof elements === 'object' &&
            'nodeType' in elements
          ) {
            containerRef.current.appendChild(elements);
          } else if (typeof elements === 'string') {
            const textNode = document.createTextNode(elements);
            containerRef.current?.appendChild(textNode);
          } else {
            console.warn(
              'RTF render returned unexpected type:',
              typeof elements,
              elements
            );
            setError('Failed to render RTF content');
          }
        }
      } catch (err: any) {
        console.error('RTF parsing error:', err);
        setError(`Parsing failed: ${err.message || 'Unknown error'}`);
      }
    };
    renderRtf();
  }, [data]);

  const handleExportPdf = () => {
    if (!containerRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(
      `<html><body>${containerRef.current.innerHTML}</body></html>`
    );
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    setIsExportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
            RTF RICH VIEW
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all active:scale-95"
            >
              <IconExport /> Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in duration-150">
                <button
                  onClick={handleExportPdf}
                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar">
        <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 shadow-2xl rounded-sm p-12 md:p-16 prose dark:prose-invert prose-zinc ring-1 ring-zinc-200 dark:ring-zinc-800 min-h-[11in] rtf-container">
          {error ? (
            <div className="text-rose-500 text-xs font-bold py-12 text-center uppercase tracking-widest">
              {error}
            </div>
          ) : (
            <div ref={containerRef} />
          )}
        </div>
      </div>
    </div>
  );
};
