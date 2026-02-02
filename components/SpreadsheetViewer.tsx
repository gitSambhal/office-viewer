
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SheetData } from '../types';

declare const XLSX: any;

const IconSearch = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconFindReplace = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconColumns = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;
const IconExport = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const IconSort = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
const IconType = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M10 7v10m4-10v10M7 17h10" /></svg>;

interface FilterCondition {
  columnIdx: number;
  value: string;
  type: 'include' | 'exclude' | 'greaterThan' | 'lessThan' | 'equals';
}

interface SlicerSettings {
  mode: 'all' | 'first' | 'last' | 'range';
  value: number;
  endValue: number;
}

interface CellChange {
  oldValue: any;
  newValue: any;
  timestamp: number;
}

interface Props {
  sheets: { [name: string]: SheetData };
  activeSheet: string;
  onSheetChange: (name: string) => void;
  onUpdate?: (sheetName: string, newRows: any[][]) => void;
  columnWidths: { [colIndex: number]: number };
  onResizeColumn: (sheetName: string, colIndex: number, width: number) => void;
}

export const SpreadsheetViewer: React.FC<Props> = ({ 
  sheets, 
  activeSheet, 
  onSheetChange, 
  onUpdate,
  columnWidths,
  onResizeColumn,
}) => {
  const data = sheets[activeSheet] || { headers: [], rows: [] };
  const prevRowsRef = useRef<any[][]>(data.rows);
  
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' | null }>({ key: -1, direction: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);
  const [isTypeAwareEnabled, setIsTypeAwareEnabled] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [hiddenColumns] = useState<Set<number>>(new Set());
  const [filters] = useState<FilterCondition[]>([]);
  const [slicer] = useState<SlicerSettings>({ mode: 'all', value: 100, endValue: 200 });
  
  const [cellHistory, setCellHistory] = useState<Record<string, CellChange>>({});
  const resizeRef = useRef<{ colIdx: number, startX: number, startWidth: number } | null>(null);

  useEffect(() => {
    if (prevRowsRef.current !== data.rows) {
      const newHistory: Record<string, CellChange> = { ...cellHistory };
      let changedCount = 0;
      data.rows.forEach((row, rIdx) => {
        const prevRow = prevRowsRef.current[rIdx];
        if (prevRow) {
          row.forEach((cell, cIdx) => {
            if (cell !== prevRow[cIdx]) {
              newHistory[`${rIdx}_${cIdx}`] = { oldValue: prevRow[cIdx], newValue: cell, timestamp: Date.now() };
              changedCount++;
            }
          });
        }
      });
      if (changedCount > 0) setCellHistory(newHistory);
      prevRowsRef.current = data.rows;
    }
  }, [data.rows]);

  const filteredData = useMemo(() => {
    let processed = data.rows.map((row, index) => ({ row, originalIndex: index }));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      processed = processed.filter(({ row }) => row.some(cell => String(cell ?? '').toLowerCase().includes(term)));
    }
    if (filters.length > 0) {
      processed = processed.filter(({ row }) => {
        return filters.every(filter => {
          const val = row[filter.columnIdx];
          const cellValue = String(val ?? '').toLowerCase();
          const filterValue = filter.value.toLowerCase();
          const numCellValue = parseFloat(cellValue);
          const numFilterValue = parseFloat(filterValue);
          switch (filter.type) {
            case 'include': return cellValue.includes(filterValue);
            case 'exclude': return !cellValue.includes(filterValue);
            case 'equals': return cellValue === filterValue;
            case 'greaterThan': return !isNaN(numCellValue) && numCellValue > numFilterValue;
            case 'lessThan': return !isNaN(numCellValue) && numCellValue < numFilterValue;
            default: return true;
          }
        });
      });
    }
    if (sortConfig.key !== -1 && sortConfig.direction) {
      processed.sort((a, b) => {
        const valA = a.row[sortConfig.key];
        const valB = b.row[sortConfig.key];
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        const strA = String(valA ?? '');
        const strB = String(valB ?? '');
        if (strA === strB) return 0;
        const res = strA < strB ? -1 : 1;
        return sortConfig.direction === 'asc' ? res : -res;
      });
    }
    if (slicer.mode === 'first') processed = processed.slice(0, Math.max(0, slicer.value));
    else if (slicer.mode === 'last') processed = processed.slice(-Math.max(0, slicer.value));
    else if (slicer.mode === 'range') processed = processed.slice(Math.max(0, slicer.value - 1), Math.max(0, slicer.endValue));
    return processed;
  }, [data.rows, searchTerm, sortConfig, filters, slicer]);

  const handleExport = (type: 'xlsx' | 'csv' | 'json') => {
    if (typeof XLSX === 'undefined') return;
    if (type === 'json') {
      const jsonData = data.rows.map(row => {
        const obj: any = {};
        data.headers.forEach((h, i) => { obj[h || `Col_${i+1}`] = row[i]; });
        return obj;
      });
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSheet}.json`;
      a.click();
    } else {
      const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeSheet);
      XLSX.writeFile(wb, `${activeSheet}.${type}`, { bookType: type });
    }
    setIsExportMenuOpen(false);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startWidth = columnWidths[index] || 150;
    resizeRef.current = { colIdx: index, startX: e.clientX, startWidth };
    const handleMouseMove = (me: MouseEvent) => {
      if (resizeRef.current) {
        const delta = me.clientX - resizeRef.current.startX;
        onResizeColumn(activeSheet, resizeRef.current.colIdx, Math.max(50, resizeRef.current.startWidth + delta));
      }
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderCell = (value: any, originalRowIndex: number, cIdx: number) => {
    const isEditing = editingCell?.r === originalRowIndex && editingCell?.c === cIdx;
    const history = cellHistory[`${originalRowIndex}_${cIdx}`];
    
    if (isEditing) {
      return (
        <textarea
          autoFocus
          className="w-full h-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none ring-2 ring-indigo-500 font-medium resize-none min-h-[44px]"
          defaultValue={value}
          onBlur={(e) => {
            if (e.target.value !== String(value ?? '')) {
              const newRows = data.rows.map((row, idx) => idx === originalRowIndex ? [...row] : row);
              newRows[originalRowIndex][cIdx] = e.target.value;
              onUpdate?.(activeSheet, newRows);
            }
            setEditingCell(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.currentTarget.blur(); }}
        />
      );
    }

    const isNull = value === null || value === undefined || String(value).trim() === '';
    const isNumber = isTypeAwareEnabled && !isNull && (typeof value === 'number' || (!isNaN(Number(value)) && value !== ''));
    const isBoolean = isTypeAwareEnabled && !isNull && (typeof value === 'boolean' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'false');

    return (
      <div 
        className={`px-3 py-2 cursor-text hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-100 flex relative transition-colors whitespace-nowrap overflow-hidden text-ellipsis text-sm leading-normal ${isNumber ? 'justify-end font-mono font-bold text-blue-600 dark:text-blue-400' : ''} ${isBoolean ? 'justify-center' : ''} ${isNull ? 'italic text-slate-300 dark:text-slate-700' : ''}`} 
        onDoubleClick={() => setEditingCell({ r: originalRowIndex, c: cIdx })}
      >
        {isBoolean ? (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 self-start mt-0.5">
            {String(value)}
          </span>
        ) : (
          <span className="w-full block truncate">{isNull ? '—' : String(value ?? '')}</span>
        )}
        {history && (
          <div 
            className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500" 
            title={`Changed (Previous: ${history.oldValue})`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3 p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-30">
        <div className="relative flex-1 max-w-xs">
          <input type="text" placeholder="Filter sheet..." className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="absolute left-2.5 top-2 text-slate-400"><IconSearch /></div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsTypeAwareEnabled(!isTypeAwareEnabled)} 
            className={`p-1.5 rounded-lg transition-all border ${isTypeAwareEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
            title="Toggle Type-Aware Display"
          >
            <IconType />
          </button>
        </div>

        <div className="relative ml-auto">
          <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white shadow transition-all">
            <IconExport /> Export
          </button>
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-[60] animate-in slide-in-from-top-2 duration-200">
              <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Excel (XLSX)</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">CSV</button>
              <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700">JSON Data</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 border-r border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 font-black uppercase py-2">#</th>
              {data.headers.map((header, i) => !hiddenColumns.has(i) && (
                <th key={i} style={{ width: columnWidths[i] || 150 }} className="relative px-3 py-2 text-left text-[10px] font-black text-slate-500 border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-200 group transition-colors uppercase select-none">
                  <div className="flex items-center justify-between" onClick={() => setSortConfig(p => ({ key: i, direction: p.key === i && p.direction === 'asc' ? 'desc' : 'asc' }))}>
                    <span className="truncate pr-4">{header}</span>
                    <IconSort />
                  </div>
                  <div onMouseDown={(e) => handleResizeStart(e, i)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 transition-colors z-30" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-950">
            {filteredData.map(({ row, originalIndex }) => (
              <tr key={originalIndex} className="group border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-900/40">
                <td className="text-center text-[10px] text-slate-400 font-mono font-black border-r border-slate-200 dark:border-slate-800 py-2 align-top">{originalIndex + 1}</td>
                {row.map((cell, cIdx) => !hiddenColumns.has(cIdx) && (
                  <td key={cIdx} className="p-0 border-r border-slate-200 dark:border-slate-800 align-top">{renderCell(cell, originalIndex, cIdx)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center p-1.5 overflow-x-auto scrollbar-none z-20">
        <div className="flex gap-1 px-1">
          {Object.keys(sheets).map(name => (
            <button key={name} onClick={() => onSheetChange(name)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border ${activeSheet === name ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{name}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
