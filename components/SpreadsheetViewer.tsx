
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { SheetData } from '../types';

declare const XLSX: any;

const IconSearch = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconColumns = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;
const IconExport = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const IconSort = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
const IconType = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M10 7v10m4-10v10M7 17h10" /></svg>;
const IconSlicer = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;

const ROW_HEIGHT = 44; // px
const OVER_SCAN = 10; // extra rows for smoother scrolling

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' | null }>({ key: -1, direction: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);
  const [isTypeAwareEnabled, setIsTypeAwareEnabled] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [slicer, setSlicer] = useState<SlicerSettings>({ mode: 'all', value: 100, endValue: 200 });
  const [cellHistory, setCellHistory] = useState<Record<string, CellChange>>({});
  
  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const resizeRef = useRef<{ colIdx: number, startX: number, startWidth: number } | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingCell(null);
        setIsExportMenuOpen(false);
        setIsSlicerOpen(false);
        setIsColumnManagerOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    setSortConfig({ key: -1, direction: null });
    setSearchTerm('');
    setSlicer({ mode: 'all', value: 100, endValue: 200 });
    setHiddenColumns(new Set());
    setEditingCell(null);
    setIsExportMenuOpen(false);
    setIsSlicerOpen(false);
    setIsColumnManagerOpen(false);
    // Reset scroll when switching sheets
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeSheet]);

  // Observer for container height to maintain virtualization accuracy
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const filteredData = useMemo(() => {
    let processed = data.rows.map((row, index) => ({ row, originalIndex: index }));
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      processed = processed.filter(({ row }) => 
        row.some(cell => String(cell ?? '').toLowerCase().includes(term))
      );
    }

    if (sortConfig.key !== -1 && sortConfig.direction) {
      const { key, direction } = sortConfig;
      processed = [...processed].sort((a, b) => {
        const valA = a.row[key];
        const valB = b.row[key];
        const isEmptyA = valA === null || valA === undefined || String(valA).trim() === '';
        const isEmptyB = valB === null || valB === undefined || String(valB).trim() === '';
        if (isEmptyA && isEmptyB) return 0;
        if (isEmptyA) return 1;
        if (isEmptyB) return -1;
        const strA = String(valA).trim().replace(/,/g, '');
        const strB = String(valB).trim().replace(/,/g, '');
        const numA = parseFloat(strA);
        const numB = parseFloat(strB);
        const isNumA = !isNaN(numA) && /^-?\d*(\.\d+)?$/.test(strA);
        const isNumB = !isNaN(numB) && /^-?\d*(\.\d+)?$/.test(strB);
        let res = 0;
        if (isNumA && isNumB) {
          res = numA - numB;
        } else {
          res = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        }
        return (direction === 'asc' ? res : -res) || (a.originalIndex - b.originalIndex);
      });
    }

    if (slicer.mode === 'first') processed = processed.slice(0, Math.max(0, slicer.value));
    else if (slicer.mode === 'last') processed = processed.slice(-Math.max(0, slicer.value));
    else if (slicer.mode === 'range') processed = processed.slice(Math.max(0, slicer.value - 1), Math.max(0, slicer.endValue));

    return processed;
  }, [data.rows, searchTerm, sortConfig, slicer]);

  // Virtualization window calculations
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVER_SCAN);
  const endIndex = Math.min(filteredData.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVER_SCAN);
  const visibleRows = filteredData.slice(startIndex, endIndex);

  // Fix: Added missing toggleColumnVisibility function to handle column visibility toggling.
  const toggleColumnVisibility = (colIdx: number) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(colIdx)) {
        next.delete(colIdx);
      } else {
        next.add(colIdx);
      }
      return next;
    });
  };

  const handleToggleSort = (colIdx: number) => {
    setSortConfig(prev => {
      if (prev.key !== colIdx) return { key: colIdx, direction: 'asc' };
      if (prev.direction === 'asc') return { key: colIdx, direction: 'desc' };
      return { key: -1, direction: null };
    });
  };

  const handleExport = (type: 'xlsx' | 'csv' | 'json') => {
    if (typeof XLSX === 'undefined') return;
    const exportData = filteredData.map(d => d.row);
    if (type === 'json') {
      const jsonData = exportData.map(row => {
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
      const ws = XLSX.utils.aoa_to_sheet([data.headers, ...exportData]);
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
          className="w-full h-full p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none ring-2 ring-violet-500 font-medium resize-none min-h-[44px]"
          defaultValue={value}
          onBlur={(e) => {
            if (e.target.value !== String(value ?? '')) {
              const newRows = [...data.rows];
              newRows[originalRowIndex] = [...newRows[originalRowIndex]];
              newRows[originalRowIndex][cIdx] = e.target.value;
              onUpdate?.(activeSheet, newRows);
            }
            setEditingCell(null);
          }}
          onKeyDown={(e) => { 
            if (e.key === 'Enter' && !e.shiftKey) e.currentTarget.blur();
            if (e.key === 'Escape') { e.stopPropagation(); setEditingCell(null); }
          }}
        />
      );
    }

    const isNull = value === null || value === undefined || String(value).trim() === '';
    const isNumber = isTypeAwareEnabled && !isNull && (typeof value === 'number' || (!isNaN(Number(value)) && value !== ''));
    const isBoolean = isTypeAwareEnabled && !isNull && (typeof value === 'boolean' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'false');

    return (
      <div 
        className={`px-3 py-2 cursor-text hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 flex relative transition-colors whitespace-nowrap overflow-hidden text-ellipsis text-sm leading-normal ${isNumber ? 'justify-end font-mono font-bold text-violet-600 dark:text-violet-400' : ''} ${isBoolean ? 'justify-center' : ''} ${isNull ? 'italic text-zinc-300 dark:text-zinc-700' : ''}`} 
        onDoubleClick={() => setEditingCell({ r: originalRowIndex, c: cIdx })}
      >
        {isBoolean ? (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 self-start mt-0.5">
            {String(value)}
          </span>
        ) : (
          <span className="w-full block truncate">{isNull ? '—' : String(value ?? '')}</span>
        )}
        {history && <div title={`Original: ${history.oldValue}`} className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-50 overflow-visible">
        <div className="relative flex-1 min-w-[180px] max-w-xs shrink-0">
          <input 
            type="text" 
            placeholder="Search cells..." 
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 shadow-sm transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <div className="absolute left-2.5 top-2 text-zinc-400"><IconSearch /></div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button 
            title="Toggle Visual Type Highlighting"
            onClick={() => setIsTypeAwareEnabled(!isTypeAwareEnabled)} 
            className={`p-1.5 rounded-lg transition-all border ${isTypeAwareEnabled ? 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}
          >
            <IconType />
          </button>

          <div className="relative">
            <button 
              title="Filter and Slice Dataset"
              onClick={() => { setIsSlicerOpen(!isSlicerOpen); setIsColumnManagerOpen(false); setIsExportMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-all border ${slicer.mode !== 'all' ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}
            >
              <IconSlicer />
            </button>
            {isSlicerOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-[100] animate-in fade-in slide-in-from-top-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400">View Slicer</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['all', 'first', 'last', 'range'].map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => setSlicer(s => ({ ...s, mode: mode as any }))} 
                      className={`text-[10px] font-black uppercase tracking-tighter py-2 rounded-md transition-all ${slicer.mode === mode ? 'bg-violet-600 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {slicer.mode !== 'all' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-zinc-400">{slicer.mode === 'range' ? 'Start' : 'Count'}</span>
                      <input 
                        type="number" 
                        className="w-16 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-bold" 
                        value={slicer.value} 
                        onChange={(e) => setSlicer(s => ({ ...s, value: parseInt(e.target.value) || 0 }))} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              title="Show / Hide Columns"
              onClick={() => { setIsColumnManagerOpen(!isColumnManagerOpen); setIsSlicerOpen(false); setIsExportMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-all border ${hiddenColumns.size > 0 ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}
            >
              <IconColumns />
            </button>
            {isColumnManagerOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-[100] max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-700">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Layout</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setHiddenColumns(new Set())} className="text-[8px] font-black uppercase text-violet-500 hover:text-violet-600">Show All</button>
                    <button onClick={() => setHiddenColumns(new Set(data.headers.map((_, i) => i)))} className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-600">Hide All</button>
                  </div>
                </div>
                <div className="space-y-1">
                  {data.headers.map((h, i) => (
                    <button key={i} onClick={() => toggleColumnVisibility(i)} className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-all">
                      <span className={`text-[10px] font-bold uppercase truncate max-w-[150px] ${hiddenColumns.has(i) ? 'text-zinc-300 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{h || `Col ${i+1}`}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${!hiddenColumns.has(i) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            title="Clear all filters and sorts"
            onClick={() => {
              setSearchTerm('');
              setSortConfig({ key: -1, direction: null });
              setSlicer({ mode: 'all', value: 100, endValue: 200 });
              setHiddenColumns(new Set());
            }} 
            className="p-1.5 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-zinc-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        <div className="relative ml-auto shrink-0">
          <button title="Download current view" onClick={() => { setIsExportMenuOpen(!isExportMenuOpen); setIsSlicerOpen(false); setIsColumnManagerOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all active:scale-95 shadow-violet-500/20">
            <IconExport /> Export
          </button>
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl py-1.5 z-[100] animate-in slide-in-from-top-2 duration-200">
              <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">Excel (.xlsx)</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">CSV File</button>
              <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-bold">JSON Mapping</button>
            </div>
          )}
        </div>
      </div>

      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 relative custom-scrollbar"
        onScroll={handleScroll}
      >
        <div style={{ height: filteredData.length * ROW_HEIGHT, position: 'relative' }}>
          <table className="w-full border-collapse table-fixed absolute top-0 left-0 right-0">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-12 border-r border-zinc-200 dark:border-zinc-800 text-[9px] text-zinc-400 font-black uppercase py-2">#</th>
                {data.headers.map((header, i) => !hiddenColumns.has(i) && (
                  <th key={i} style={{ width: columnWidths[i] || 150 }} className={`relative px-3 py-2 text-left text-[10px] font-black border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 group transition-colors uppercase select-none ${sortConfig.key === i ? 'text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20' : 'text-zinc-500'}`}>
                    <div className="flex items-center justify-between h-full" title={`Sort by ${header || 'Column'}`} onClick={() => handleToggleSort(i)}>
                      <span className="truncate pr-4">{header || `Col ${i+1}`}</span>
                      <div className={`${sortConfig.key === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} transition-opacity`}><IconSort /></div>
                    </div>
                    <div onMouseDown={(e) => handleResizeStart(e, i)} title="Drag to resize column" className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-violet-500 transition-colors z-30" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-950">
              <tr style={{ height: startIndex * ROW_HEIGHT }} aria-hidden="true" />
              {visibleRows.length > 0 ? (
                visibleRows.map(({ row, originalIndex }) => (
                  <tr key={originalIndex} className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors" style={{ height: ROW_HEIGHT }}>
                    <td className="text-center text-[10px] text-zinc-400 font-mono font-black border-r border-zinc-200 dark:border-zinc-800 py-2 select-none bg-zinc-50/50 dark:bg-zinc-900/30">{originalIndex + 1}</td>
                    {row.map((cell, cIdx) => !hiddenColumns.has(cIdx) && (
                      <td key={cIdx} className="p-0 border-r border-zinc-200 dark:border-zinc-800 align-top">{renderCell(cell, originalIndex, cIdx)}</td>
                    ))}
                  </tr>
                ))
              ) : filteredData.length === 0 && (
                <tr>
                  <td colSpan={data.headers.length + 1} className="py-32 text-center">
                     <div className="flex flex-col items-center gap-4">
                       <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">No records found</p>
                       <button onClick={() => setSearchTerm('')} className="px-6 py-2 border border-zinc-200 dark:border-zinc-800 rounded-full text-[9px] font-black uppercase text-violet-500 hover:bg-violet-50 transition-all">Clear Filters</button>
                     </div>
                  </td>
                </tr>
              )}
              <tr style={{ height: Math.max(0, (filteredData.length - endIndex) * ROW_HEIGHT) }} aria-hidden="true" />
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center p-1.5 overflow-x-auto no-scrollbar z-20 shrink-0">
        <div className="flex gap-1 px-1">
          {Object.keys(sheets).map(name => (
            <button key={name} title={`Switch to ${name}`} onClick={() => onSheetChange(name)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border whitespace-nowrap ${activeSheet === name ? 'bg-violet-600 text-white border-violet-600 shadow-md scale-105' : 'text-zinc-500 border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>{name}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4 px-4 border-l border-zinc-200 dark:border-zinc-800">
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{filteredData.length} <span className="text-[8px] opacity-60">Records</span></span>
        </div>
      </div>
    </div>
  );
};
