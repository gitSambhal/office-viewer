import React from 'react';

export const PreviewPdfContent: React.FC = () => (
  <div className="relative z-10 h-48 sm:h-64">
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 text-rose-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">
            report.pdf
          </span>
        </div>
        <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Page 1 of 3
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <div className="w-full h-4 sm:h-6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="w-1/2 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 sm:my-3"></div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="w-full h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-5/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-4/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-full h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 sm:my-3"></div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="w-3/4 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-5/6 h-3 sm:h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);
