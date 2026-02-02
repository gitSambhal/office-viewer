
import React, { useEffect, useRef, useState } from 'react';

declare const $: any;

interface Props {
  data: ArrayBuffer;
}

export const PptxViewer: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderPptx = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);
      
      try {
        const id = 'pptx-' + Math.random().toString(36).substr(2, 9);
        containerRef.current.id = id;
        
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
        const file = new File([blob], "presentation.pptx");

        if (typeof $ !== 'undefined' && $.fn.pptxToHtml) {
          $(`#${id}`).pptxToHtml({
            file: file,
            slidesScale: "80%",
            slideMode: false,
            keyBoardShortCut: true,
            onDone: () => { if (isMounted) setLoading(false); },
            onProcess: () => {},
            onError: (err: any) => { if (isMounted) setError(`PowerPoint render failed: ${err}`); }
          });
        } else {
          throw new Error("PPTX engine not found.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`Error: ${err.message}`);
          setLoading(false);
        }
      }
    };

    renderPptx();
    return () => { isMounted = false; };
  }, [data]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-20 shadow-sm">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">POWERPOINT PREVIEW</span>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="max-w-2xl mx-auto p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-3xl border border-rose-200 text-center">
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
        <div ref={containerRef} className="max-w-6xl mx-auto pptx-wrapper" />
      </div>
    </div>
  );
};
