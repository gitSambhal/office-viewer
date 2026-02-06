import React, { useState } from 'react';
import { ActionButton } from './ActionButton';

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

interface ExportButtonProps {
  tableName: string;
  columns: string[];
  data: any[][];
  registerCloseActionPopups?: (callback: () => void) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  tableName,
  columns,
  data,
  registerCloseActionPopups,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Properly escape CSV cells
  const escapeCsvCell = (value: any): string => {
    const str = String(value ?? '');
    if (
      str.includes('"') ||
      str.includes(',') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = (type: 'xlsx' | 'csv' | 'json') => {
    if (type === 'json') {
      const jsonData = data.map((row) => {
        const obj: any = {};
        columns.forEach((h, i) => {
          obj[h || `Col_${i + 1}`] = row[i];
        });
        return obj;
      });
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}.json`;
      a.click();
    } else if (type === 'csv') {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [
          columns.join(','),
          ...data.map((row) => row.map(escapeCsvCell).join(',')),
        ].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${tableName}.csv`);
      document.body.appendChild(link);
      link.click();
    } else if (type === 'xlsx') {
      // Check if XLSX library is available (from SpreadsheetViewer)
      // @ts-ignore - XLSX is declared globally
      if (typeof XLSX !== 'undefined') {
        // @ts-ignore - XLSX is declared globally
        const ws = XLSX.utils.aoa_to_sheet([columns, ...data]);
        // @ts-ignore - XLSX is declared globally
        const wb = XLSX.utils.book_new();
        // @ts-ignore - XLSX is declared globally
        XLSX.utils.book_append_sheet(wb, ws, tableName);
        // @ts-ignore - XLSX is declared globally
        XLSX.writeFile(wb, `${tableName}.xlsx`);
      } else {
        console.error('XLSX library not available');
      }
    }
    setIsExportOpen(false);
  };

  return (
    <div className="relative ml-auto shrink-0">
      <button
        title="Download current view"
        onClick={() => setIsExportOpen(!isExportOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all active:scale-95 shadow-violet-500/20"
      >
        <IconExport /> Export
      </button>
      {isExportOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl py-1.5 z-40 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => handleExport('xlsx')}
            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            CSV File
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-bold"
          >
            JSON Mapping
          </button>
        </div>
      )}
    </div>
  );
};
