import React from 'react';

export const PreviewSqliteContent: React.FC = () => (
  <div className="relative z-10 h-48 sm:h-64">
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 text-sky-600">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-8h2v5h-2v-5zm0-3h2v2h-2V9z"/></svg>
        </div>
        <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">database.sqlite</span>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);
