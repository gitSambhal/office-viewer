import React, { useState } from 'react';
import { FileType } from '../types';
import { getFileIcon } from '../utils/helpers';
import { PreviewPdfContent } from './preview/PreviewPdfContent';
import { PreviewSpreadsheetContent } from './preview/PreviewSpreadsheetContent';
import { PreviewMarkdownContent } from './preview/PreviewMarkdownContent';
import { PreviewSqliteContent } from './preview/PreviewSqliteContent';

export const DashboardPreview: React.FC = () => {
  const [previewActiveTab, setPreviewActiveTab] = useState(0);

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
            <div className="flex items-center mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-none">
              {[
                { name: 'report.pdf', type: 'pdf' as FileType, index: 0 },
                { name: 'budget.xlsx', type: 'xlsx' as FileType, index: 1 },
                { name: 'notes.md', type: 'md' as FileType, index: 2 },
                { name: 'database.sqlite', type: 'sqlite' as FileType, index: 3 }
              ].map((tab) => (
                <div
                  key={tab.index}
                  onClick={() => setPreviewActiveTab(tab.index)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mr-2 whitespace-nowrap transition-all cursor-pointer ${
                    previewActiveTab === tab.index
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {getFileIcon(tab.type)}
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[100px] sm:max-w-[120px] md:max-w-[160px]">{tab.name}</span>
                  {previewActiveTab === tab.index && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  )}
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
