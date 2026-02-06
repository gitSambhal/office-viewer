import React, { useState } from 'react';
import { FileType } from '../types';
import { getFileIcon } from '../utils/helpers';
import { PreviewPdfContent } from './preview/PreviewPdfContent';
import { PreviewSpreadsheetContent } from './preview/PreviewSpreadsheetContent';
import { PreviewMarkdownContent } from './preview/PreviewMarkdownContent';
import { PreviewSqliteContent } from './preview/PreviewSqliteContent';
import { PREVIEW_TABS } from '../constants';

export const DashboardPreview: React.FC = () => {
  const [previewActiveTab, setPreviewActiveTab] = useState(0);

  // Auto change tabs every 3 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPreviewActiveTab((prev) => (prev + 1) % PREVIEW_TABS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-4xl px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-[3rem] blur-3xl opacity-50"></div>
        <div className="relative bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 to-blue-50 dark:to-blue-900/20 opacity-50"></div>
          
          {/* Preview Content */}
          <div className="relative z-10">
            {/* Header Preview */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black italic">S</div>
                <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">Suhail Viewer</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500"></div>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500"></div>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500"></div>
              </div>
            </div>
            
            {/* Tabs Preview */}
            <div className="flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 mb-4 sm:mb-6 overflow-x-auto scrollbar-none">
              {PREVIEW_TABS.map((tab) => (
                <div
                  key={tab.index}
                  onClick={() => setPreviewActiveTab(tab.index)}
                  className={`flex flex-shrink-0 items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer min-w-[100px] sm:min-w-[140px] max-w-[200px] sm:max-w-[280px] select-none group transition-all relative ${
                    previewActiveTab === tab.index
                        ? 'bg-zinc-50 dark:bg-zinc-950 shadow-inner'
                        : 'hover:bg-zinc-50/50'
                  }`}
                >
                  {previewActiveTab === tab.index && <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600" />}
                  {getFileIcon(tab.type)}
                  <span className={`text-[10px] sm:text-[11px] truncate font-black uppercase tracking-tight flex-1 ${
                    previewActiveTab === tab.index
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400'
                  }`}>{tab.name}</span>
                  <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Active Tab Content Preview */}
            <div className="grid grid-cols-1 gap-4">
              {previewActiveTab === 0 && <PreviewPdfContent />}
              {previewActiveTab === 1 && <PreviewSpreadsheetContent />}
              {previewActiveTab === 2 && <PreviewMarkdownContent />}
              {previewActiveTab === 3 && <PreviewSqliteContent />}
            </div>
            
            {/* Preview Text */}
            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Preview: Open multiple files in tabs and switch instantly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
