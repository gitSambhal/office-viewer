import React, { useState, useMemo, useRef } from 'react';

declare const marked: any;

interface Props {
  content: string;
  isMarkdown: boolean;
  globalSearchTerm?: string;
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

export const TextViewer: React.FC<Props> = ({ content, isMarkdown, globalSearchTerm }) => {
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const htmlContent = useMemo(
    () =>
      isMarkdown && typeof marked !== 'undefined'
        ? marked.parse(content)
        : null,
    [content, isMarkdown]
  );

  const highlightedContent = useMemo(() => {
    if (!globalSearchTerm || isMarkdown || !content) return content;

    try {
      // Safe regex escape
      const escapedTerm = globalSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      const parts = content.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-300 dark:bg-yellow-600/50 text-black dark:text-white rounded-[2px] shadow-sm">{part}</span>
        ) : (
          part
        )
      );
    } catch (e) {
      return content;
    }
  }, [content, globalSearchTerm, isMarkdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    if (!containerRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <body style="padding:40px; font-family: sans-serif;">
          <div style="white-space: pre-wrap;">${isMarkdown ? htmlContent : content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    setIsExportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
            {isMarkdown ? 'MARKDOWN RAW' : 'PLAINTEXT SOURCE'}
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

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all text-[10px] font-bold px-2"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(32, s + 1))}
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all text-[10px] font-bold px-2"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-900 dark:bg-zinc-800 text-white shadow-lg'}`}
          >
            {copied ? 'Copied' : 'Copy Content'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar">
        <div
          ref={containerRef}
          className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-10 ring-1 ring-zinc-200 dark:ring-zinc-800"
          style={{ fontSize: `${fontSize}px` }}
        >
          {isMarkdown ? (
            <div
              className="prose dark:prose-invert prose-zinc max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed">
              {highlightedContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
