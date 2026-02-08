import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TableData, TabStateChange } from '../types';
import { ActionButton } from './ActionButton';
import { ExportButton } from './ExportButton';
import { useAppContext } from '../context/AppContext';

// Icons
const IconColumns = () => (
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
      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
    />
  </svg>
);
const IconSort = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);
const IconSlicer = () => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const ROW_HEIGHT = 44;
const OVER_SCAN = 10;

interface SlicerSettings {
  mode: 'all' | 'first' | 'last' | 'range';
  value: number;
  endValue: number;
}

interface DbfViewerProps {
  tableData: TableData;
  onStateChange?: (state: TabStateChange) => void;
  isTypeAwareEnabled?: boolean;
  registerCloseActionPopups?: (callback: () => void) => void;
  globalSearchTerm?: string;
}

const DbfViewer: React.FC<DbfViewerProps> = ({
  tableData: initialData,
  onStateChange,
  isTypeAwareEnabled: propTypeAware,
  registerCloseActionPopups,
  globalSearchTerm,
}) => {
  const { state, dispatch } = useAppContext();
  const [tableData] = useState<TableData | null>(initialData);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [slicer, setSlicer] = useState<SlicerSettings>({
    mode: 'all',
    value: 100,
    endValue: 200,
  });
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const resizeRef = useRef<{
    colIdx: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  // Observe container height for virtualization
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    const initialHeight =
      el.clientHeight || el.parentElement?.clientHeight || 400;
    setContainerHeight(initialHeight);
    return () => observer.disconnect();
  }, []);

  // Update container height when data changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setContainerHeight(el.clientHeight);
    }
  }, [tableData]);

  // Register close action popups callback for ESC key
  useEffect(() => {
    if (registerCloseActionPopups) {
      registerCloseActionPopups(() => {
        setIsSlicerOpen(false);
        setIsColumnManagerOpen(false);
        setIsExportOpen(false);
      });
    }
  }, [registerCloseActionPopups]);

  const [filteredData, setFilteredData] = useState<
    { row: any[]; originalIndex: number }[]
  >([]);

  // Async filtering
  useEffect(() => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    
    // Use setTimeout to allow UI to update with loading indicator
    const timer = setTimeout(() => {
      if (!tableData) {
        setFilteredData([]);
        dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
        return;
      }

      const rows = tableData.rows;
      let indices: number[] = Array.from({ length: rows.length }, (_, i) => i);

      // Global search
      if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        indices = indices.filter((i) => {
          const row = rows[i];
          return row.some((cell) =>
            String(cell ?? '')
              .toLowerCase()
              .includes(term)
          );
        });
      }

      // 1. Sorting
      if (sortConfig.key && sortConfig.direction) {
        const colIndex = tableData.columns.indexOf(sortConfig.key);
        if (colIndex !== -1) {
          indices.sort((idxA, idxB) => {
            const valA = rows[idxA][colIndex];
            const valB = rows[idxB][colIndex];
            const isEmptyA =
              valA === null || valA === undefined || String(valA).trim() === '';
            const isEmptyB =
              valB === null || valB === undefined || String(valB).trim() === '';
            if (isEmptyA && isEmptyB) return 0;
            if (isEmptyA) return 1;
            if (isEmptyB) return -1;

            let res = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
              res = valA - valB;
            } else {
              const strA = String(valA).trim().replace(/,/g, '');
              const strB = String(valB).trim().replace(/,/g, '');
              const numA = parseFloat(strA);
              const numB = parseFloat(strB);
              const isNumA = !isNaN(numA) && /^-?\d*(\.\d+)?$/.test(strA);
              const isNumB = !isNaN(numB) && /^-?\d*(\.\d+)?$/.test(strB);

              if (isNumA && isNumB) {
                res = numA - numB;
              } else {
                res = strA.localeCompare(strB, undefined, {
                  numeric: true,
                  sensitivity: 'base',
                });
              }
            }
            return (sortConfig.direction === 'asc' ? res : -res) || idxA - idxB;
          });
        }
      }

      // 2. Slicer
      if (slicer.mode === 'first') {
        indices = indices.slice(0, Math.max(0, slicer.value));
      } else if (slicer.mode === 'last') {
        indices = indices.slice(-Math.max(0, slicer.value));
      } else if (slicer.mode === 'range') {
        indices = indices.slice(
          Math.max(0, slicer.value - 1),
          Math.max(0, slicer.endValue)
        );
      }

      const result = indices.map((idx) => ({ row: rows[idx], originalIndex: idx }));
      setFilteredData(result);
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }, 50);

    return () => clearTimeout(timer);
  }, [tableData, sortConfig, slicer, globalSearchTerm, dispatch]);

  // Keep ref updated with latest callback
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChangeRef.current) {
      const visibleColCount = tableData
        ? tableData.columns.filter((_, i) => !hiddenColumns.has(i)).length
        : 0;
      onStateChangeRef.current({
        sortConfig: sortConfig.key ? sortConfig : null,
        searchTerm: '',
        filteredCount: filteredData.length,
        totalRows: tableData?.rows.length ?? 0,
        visibleColumns: visibleColCount,
      });
    }
  }, [sortConfig, filteredData.length, hiddenColumns, tableData]);

  const handleToggleSort = (columnKey: string) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc')
          return { key: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVER_SCAN
  );
  const endIndex = Math.min(
    filteredData.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVER_SCAN
  );
  const visibleRows = filteredData.slice(startIndex, endIndex);

  const effectiveVisibleRows =
    visibleRows.length === 0 && filteredData.length > 0
      ? filteredData.slice(
          0,
          Math.min(
            filteredData.length,
            Math.ceil(containerHeight / ROW_HEIGHT) + OVER_SCAN
          )
        )
      : visibleRows;

  const handleResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    const startWidth = columnWidths[colIndex] || 150;
    const resizeData = { colIdx: colIndex, startX: e.clientX, startWidth };
    resizeRef.current = resizeData;

    const handleMouseMove = (me: MouseEvent) => {
      if (resizeData) {
        const newWidth = Math.max(
          50,
          resizeData.startWidth + (me.clientX - resizeData.startX)
        );
        setColumnWidths((prev) => ({ ...prev, [resizeData.colIdx]: newWidth }));
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

  const toggleColumnVisibility = (colIdx: number) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colIdx)) next.delete(colIdx);
      else next.add(colIdx);
      return next;
    });
  };

  const renderCell = (value: any) => {
    const isNull =
      value === null || value === undefined || String(value).trim() === '';
    const isNumber =
      (propTypeAware ?? true) &&
      !isNull &&
      (typeof value === 'number' || (!isNaN(Number(value)) && value !== ''));
    const isBoolean =
      (propTypeAware ?? true) &&
      !isNull &&
      (typeof value === 'boolean' ||
        String(value).toLowerCase() === 'true' ||
        String(value).toLowerCase() === 'false');

    return (
      <div
        className={`px-3 py-2 text-zinc-800 dark:text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis text-sm ${isNumber ? 'justify-end font-mono font-bold text-violet-600 dark:text-violet-400' : ''} ${isBoolean ? 'justify-center' : ''} ${isNull ? 'italic text-zinc-300 dark:text-zinc-700' : ''}`}
      >
        {isBoolean ? (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 self-start mt-0.5">
            {String(value)}
          </span>
        ) : (
          <span className="w-full block truncate">
            {isNull ? '—' : String(value ?? '')}
          </span>
        )}
      </div>
    );
  };

  if (!tableData) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-3 p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-30">
        <div className="flex items-center gap-1 shrink-0">
          <ActionButton
            icon={<IconSlicer />}
            title="Filter and Slice Dataset"
            isActive={slicer.mode !== 'all'}
            onClick={() => {
              setIsColumnManagerOpen(false);
              setIsExportOpen(false);
            }}
            registerCloseActionPopups={registerCloseActionPopups}
          >
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400">
                View Slicer
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['all', 'first', 'last', 'range'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      setSlicer((s) => ({ ...s, mode: mode as any }))
                    }
                    className={`text-[10px] font-black uppercase tracking-tighter py-2 rounded-md transition-all ${slicer.mode === mode ? 'bg-violet-600 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {slicer.mode !== 'all' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-zinc-400">
                      {slicer.mode === 'range' ? 'Start' : 'Count'}
                    </span>
                    <input
                      type="number"
                      className="w-16 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-bold"
                      value={slicer.value}
                      onChange={(e) =>
                        setSlicer((s) => ({
                          ...s,
                          value: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  {slicer.mode === 'range' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-zinc-400">
                        End
                      </span>
                      <input
                        type="number"
                        className="w-16 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-bold"
                        value={slicer.endValue}
                        onChange={(e) =>
                          setSlicer((s) => ({
                            ...s,
                            endValue: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ActionButton>

          <ActionButton
            icon={<IconColumns />}
            title="Show / Hide Columns"
            isActive={hiddenColumns.size > 0}
            onClick={() => {
              setIsSlicerOpen(false);
              setIsExportOpen(false);
            }}
            registerCloseActionPopups={registerCloseActionPopups}
          >
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-40 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-700">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Layout
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHiddenColumns(new Set())}
                    className="text-[8px] font-black uppercase text-violet-500 hover:text-violet-600"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() =>
                      setHiddenColumns(
                        new Set(tableData.columns.map((_, i) => i))
                      )
                    }
                    className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-600"
                  >
                    Hide All
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {tableData.columns.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => toggleColumnVisibility(i)}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-all"
                  >
                    <span
                      className={`text-[10px] font-bold uppercase truncate max-w-[150px] ${hiddenColumns.has(i) ? 'text-zinc-300 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                    >
                      {h || `Col ${i + 1}`}
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${!hiddenColumns.has(i) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </ActionButton>

          <button
            title="Clear all filters and sorts"
            onClick={() => {
              setSortConfig({ key: '', direction: null });
              setSlicer({ mode: 'all', value: 100, endValue: 200 });
              setHiddenColumns(new Set());
              dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
            }}
            className="p-1.5 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-zinc-700 transition-all"
          >
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <ExportButton
          tableName={tableData.name}
          columns={tableData.columns}
          data={filteredData.map((d) => d.row)}
          registerCloseActionPopups={registerCloseActionPopups}
        />
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 relative custom-scrollbar"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {filteredData.length === 0 && state.isSearchLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Searching...
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: Math.max(filteredData.length * ROW_HEIGHT, containerHeight),
              position: 'relative',
            }}
          >
            <table className="w-full border-collapse table-fixed absolute top-0 left-0 right-0 bottom-0">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-12 border-r border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase py-2 text-zinc-400">
                    #
                  </th>
                  {tableData.columns.map(
                    (col, i) =>
                      !hiddenColumns.has(i) && (
                        <th
                          key={i}
                          style={{ width: columnWidths[i] || 150 }}
                          className={`relative px-3 py-2 text-left text-[10px] font-black border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 group transition-colors uppercase select-none ${sortConfig.key === col ? 'text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20' : 'text-zinc-500'}`}
                        >
                          <div
                            className="flex items-center justify-between h-full"
                            title={`Sort by ${col || 'Column'}`}
                            onClick={() => handleToggleSort(col)}
                          >
                            <span className="truncate pr-4">{col}</span>
                            <div
                              className={`${sortConfig.key === col ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} transition-opacity`}
                            >
                              <IconSort />
                            </div>
                          </div>
                          <div
                            onMouseDown={(e) => handleResizeStart(e, i)}
                            title="Drag to resize column"
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-violet-500 transition-colors z-30"
                          />
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-950">
                <tr
                  style={{ height: startIndex * ROW_HEIGHT }}
                  aria-hidden="true"
                />
                {effectiveVisibleRows.length > 0 ? (
                  effectiveVisibleRows.map((rowData, rowIndex) => (
                    <tr
                      key={startIndex + rowIndex}
                      className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <td className="text-center text-[10px] text-zinc-400 font-mono font-black border-r border-zinc-200 dark:border-zinc-800 py-2 select-none bg-zinc-50/50 dark:bg-zinc-900/30">
                        {startIndex + rowIndex + 1}
                      </td>
                      {rowData.row.map(
                        (cell, cellIndex) =>
                          !hiddenColumns.has(cellIndex) && (
                            <td
                              key={cellIndex}
                              className="p-0 border-r border-zinc-200 dark:border-zinc-800 align-top"
                            >
                              {renderCell(cell)}
                            </td>
                          )
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableData.columns.length + 1}
                      className="py-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                          No records found
                        </p>
                        <button
                          onClick={() => {
                            setSortConfig({ key: '', direction: null });
                            setSlicer({ mode: 'all', value: 100, endValue: 200 });
                            setHiddenColumns(new Set());
                            dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
                          }}
                          className="px-6 py-2 border border-zinc-200 dark:border-zinc-800 rounded-full text-[9px] font-black uppercase text-violet-500 hover:bg-violet-50 transition-all"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  style={{
                    height: (filteredData.length - endIndex) * ROW_HEIGHT,
                  }}
                  aria-hidden="true"
                />
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center p-1.5 z-20 overflow-x-auto no-scrollbar">
        <div className="ml-auto flex items-center gap-4 px-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            {filteredData.length}{' '}
            <span className="text-[8px] opacity-60">Records</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default DbfViewer;
