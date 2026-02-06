import React from 'react';
import { useFileHandler } from '../hooks/useFileHandler';
import { FILE_ACCEPT, STORAGE_KEYS, UI_CONSTANTS } from '../constants';

export const RecentFiles: React.FC = () => {
  const { handleFiles } = useFileHandler();

  try {
    const recentFiles = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]'
    );
    if (recentFiles.length > 0) {
      return (
        <div className="mb-12 sm:mb-16 mt-8 sm:mt-12">
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 sm:mb-6 text-center">
            Recent Files
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {recentFiles.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/30 transition-all cursor-pointer group overflow-hidden"
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = FILE_ACCEPT;
                  fileInput.onchange = (e) =>
                    handleFiles((e.target as HTMLInputElement).files);
                  fileInput.click();
                }}
              >
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/20 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all shrink-0">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div
                    className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 truncate"
                    title={file.name}
                  >
                    {file.name}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400">
                    {file.type}
                  </div>
                </div>
                <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-600">
                  {new Date(file.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('Failed to load recent files:', error);
  }
  return null;
};
