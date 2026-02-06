import React from 'react';

export const PreviewSpreadsheetContent: React.FC = () => (
  <div className="relative z-10 h-48 sm:h-64">
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 text-emerald-600">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </div>
        <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">budget.xlsx</span>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex gap-1">
          <div className="w-6 sm:w-8 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-16 sm:w-20 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-12 sm:w-16 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-6 sm:w-8 h-4 sm:h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
          <div className="flex-1 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-16 sm:w-20 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
          <div className="w-12 sm:w-16 h-4 sm:h-6 bg-zinc-50 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);
