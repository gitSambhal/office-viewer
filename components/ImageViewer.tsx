import React, { useState } from 'react';

interface Props {
  src: string;
}

export const ImageViewer: React.FC<Props> = ({ src }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-2xl z-20 gap-2">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Zoom Out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 12H4"
            />
          </svg>
        </button>
        <span className="text-[10px] font-black text-slate-500 min-w-[50px] text-center uppercase tracking-widest">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Zoom In"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Rotate"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
        <button
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
          className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all"
        >
          Reset View
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
        <div
          className="relative transition-transform duration-300 ease-out shadow-2xl rounded-lg ring-4 ring-white dark:ring-slate-800"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        >
          <img
            src={src}
            alt="Preview"
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
