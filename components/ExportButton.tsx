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
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        title="Download current view"
        onClick={() => setIsExportOpen(!isExportOpen)}
        className="p-1.5 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-zinc-700 transition-all"
      >
        <IconExport className="w-4 h-4" />
      </button>

      {isExportOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-col gap-0.5">
            {exportOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleExport(option.type)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${option.hoverBg} transition-all duration-150 group text-left`}
              >
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {option.label}
                </span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono ml-auto">
                  {option.extension}
                </span>
              </button>
            ))}
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
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
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
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
    <path d="M8 10H10V12H8V10Z" />
    <path d="M11 10H13V12H11V10Z" />
    <path d="M14 10H16V12H14V10Z" />
    <path d="M8 14H10V18H8V14Z" />
    <path d="M11 14H13V18H11V14Z" />
    <path d="M16 14H17V18H16V14Z" />
  </svg>
);
