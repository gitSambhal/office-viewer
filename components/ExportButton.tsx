import React, { useState, useRef, useEffect } from 'react';
import analytics from '../utils/analytics';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    // Track export event
    analytics.trackFileExport(tableName, 'table', type);
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

  // Register ESC key handler
  useEffect(() => {
    if (registerCloseActionPopups) {
      registerCloseActionPopups(() => setIsExportOpen(false));
    }
  }, [registerCloseActionPopups]);

  // Handle click outside and ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const exportOptions = [
    {
      type: 'xlsx' as const,
      label: 'Excel',
      extension: '.xlsx',
      description: 'Microsoft Excel format',
      icon: <IconExcel />,
      bgColor: 'bg-emerald-500',
      hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    },
    {
      type: 'csv' as const,
      label: 'CSV',
      extension: '.csv',
      description: 'Comma separated values',
      icon: <IconCSV />,
      bgColor: 'bg-blue-500',
      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
    },
    {
      type: 'json' as const,
      label: 'JSON',
      extension: '.json',
      description: 'JavaScript object notation',
      icon: <IconJSON />,
      bgColor: 'bg-amber-500',
      hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
    },
  ];

  return (
    <div className="relative ml-auto shrink-0">
      <button
        ref={buttonRef}
        title="Download current view"
        onClick={() => setIsExportOpen(!isExportOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300 transition-all border border-zinc-200 dark:border-zinc-700"
      >
        <IconExport className="w-4 h-4" />
        <span>Export</span>
        <IconChevron
          className={`w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isExportOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-violet-500/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Export Format
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Choose how you want to export "{tableName}"
            </p>
          </div>

          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleExport(option.type)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${option.hoverBg} transition-all duration-200 group`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${option.bgColor} bg-opacity-10 flex items-center justify-center text-${option.bgColor.replace('bg-', '')} group-hover:scale-110 transition-transform`}
                >
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {option.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {option.extension}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {option.description}
                  </p>
                </div>
                <IconArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-violet-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">ESC</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const IconExport = ({ className }: { className?: string }) => (
  <svg
    className={className}
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

const IconChevron = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const IconArrowRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const IconExcel = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H13V15H11V18H8L12 22L16 18ZM13 13H11V10H13V13ZM16 10H13V7H16V10Z" />
  </svg>
);

const IconCSV = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
    <path d="M8 8H10V10H8V8Z" />
    <path d="M11 8H13V10H11V8Z" />
    <path d="M14 8H16V10H14V8Z" />
    <path d="M8 12H10V14H8V12Z" />
    <path d="M11 12H13V14H11V12Z" />
    <path d="M14 12H16V14H14V12Z" />
    <path d="M8 16H10V18H8V16Z" />
    <path d="M11 16H13V18H11V16Z" />
  </svg>
);

const IconJSON = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
    <path d="M8 10H10V12H8V10Z" />
    <path d="M11 10H13V12H11V10Z" />
    <path d="M14 10H16V12H14V10Z" />
    <path d="M8 14H10V18H8V14Z" />
    <path d="M11 14H13V18H11V14Z" />
    <path d="M16 14H17V18H16V14Z" />
  </svg>
);
