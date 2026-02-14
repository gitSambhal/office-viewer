import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { SheetData, TabStateChange } from '../types';
import { ActionButton } from './ActionButton';
import { ExportButton } from './ExportButton';
import { DatabaseActionButtons } from './DatabaseActionButtons';
import { useAppContext } from '../context/AppContext';
import * as XLSX from 'xlsx';

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
const IconTextWrap = () => (
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
      d="M4 6h16M4 12h16M4 18h7"
    />
  </svg>
);
const IconTextWrapOff = () => (
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
      d="M4 6h16M4 12h10M4 18h16"
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
  onStateChange?: (state: TabStateChange) => void;
  isTypeAwareEnabled?: boolean;
  registerCloseActionPopups?: (callback: () => void) => void;
  globalSearchTerm?: string;
}

export const SpreadsheetViewer: React.FC<Props> = ({
  sheets,
  activeSheet,
  onSheetChange,
  onUpdate,
  columnWidths,
  onResizeColumn,
  onStateChange,
  isTypeAwareEnabled: propTypeAware,
  registerCloseActionPopups,
  globalSearchTerm,
}) => {
  const { state, dispatch } = useAppContext();
  const data = sheets[activeSheet] || { headers: [], rows: [] };
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: number;
    direction: 'asc' | 'desc' | null;
  }>({ key: -1, direction: null });
  const [editingCell, setEditingCell] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [slicer, setSlicer] = useState<SlicerSettings>({
    mode: 'all',
    value: 100,
    endValue: 200,
  });
  const [cellHistory, setCellHistory] = useState<Record<string, CellChange>>(
    {}
  );
  const [filteredData, setFilteredData] = useState<
    { row: any[]; originalIndex: number }[]
  >([]);
  const [wrapText, setWrapText] = useState(false);
  const [cellPreview, setCellPreview] = useState<{
    row: number;
    col: number;
    x: number;
    y: number;
  } | null>(null);
  const [fillWidth, setFillWidth] = useState(true);

  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Pagination for very large datasets
  const [pageSize, setPageSize] = useState(1000);
  const [currentPage, setCurrentPage] = useState(0);

  const resizeRef = useRef<{
    colIdx: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const onStateChangeRef = useRef(onStateChange);

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

  useEffect(() => {
    setSortConfig({ key: -1, direction: null });
    setSlicer({ mode: 'all', value: 100, endValue: 200 });
    setHiddenColumns(new Set());
    setEditingCell(null);
    setIsExportOpen(false);
    setIsSlicerOpen(false);
    setIsColumnManagerOpen(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeSheet]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
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

  // Async filtering with optimized performance for large datasets
  useEffect(() => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });

    // Debounce search by 150ms for responsive typing
    const timer = setTimeout(() => {
      const rows = data.rows;
      const rowCount = rows.length;

      // Skip processing if no search term and all rows are visible
      if (!globalSearchTerm && slicer.mode === 'all' && sortConfig.key === -1) {
        const result = Array.from({ length: rowCount }, (_, i) => ({
          row: rows[i],
          originalIndex: i,
        }));
        setFilteredData(result);
        dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
        return;
      }

      // Process in chunks to avoid blocking
      let indices: number[] = [];

      // Optimal chunk size for responsive performance
      const chunkSize = 10000;
      for (let i = 0; i < rowCount; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkIndices = chunk.map((_, index) => i + index);

        // Filter chunk
        let filteredChunk = chunkIndices;
        if (globalSearchTerm) {
          const term = globalSearchTerm.toLowerCase();
          filteredChunk = chunkIndices.filter((idx) => {
            const row = rows[idx];
            return row.some((cell) =>
              String(cell ?? '')
                .toLowerCase()
                .includes(term)
            );
          });
        }

        indices = indices.concat(filteredChunk);
      }

      // 1. Sorting (optimized for large datasets)
      if (sortConfig.key !== -1 && sortConfig.direction) {
        const { key, direction } = sortConfig;
        indices.sort((idxA, idxB) => {
          const valA = rows[idxA][key];
          const valB = rows[idxB][key];
          const isEmptyA =
            valA === null || valA === undefined || String(valA).trim() === '';
          const isEmptyB =
            valB === null || valB === undefined || String(valB).trim() === '';
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
            res = strA.localeCompare(strB, undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }
          return (direction === 'asc' ? res : -res) || idxA - idxB;
        });
      }

      // 2. Slicer (Fast slice)
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

      // 3. Map to object structure for view
      const result = indices.map((idx) => ({ row: rows[idx], originalIndex: idx }));
      setFilteredData(result);
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }, 150); // 150ms debounce for responsive typing

    return () => clearTimeout(timer);
  }, [data.rows, sortConfig, slicer, globalSearchTerm, dispatch]);

  // Keep ref updated with latest callback
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChangeRef.current) {
      const sortKey =
        sortConfig.key !== -1
          ? data.headers[sortConfig.key] || String(sortConfig.key)
          : '';
      const visibleColCount = data.headers.filter(
        (_, i) => !hiddenColumns.has(i)
      ).length;
      onStateChangeRef.current({
        sortConfig: sortKey
          ? { key: sortKey, direction: sortConfig.direction }
          : null,
        searchTerm: '',
        filteredCount: filteredData.length,
        totalRows: data.rows.length,
        visibleColumns: visibleColCount,
      });
    }
  }, [
    sortConfig,
    filteredData.length,
    hiddenColumns,
    data.headers,
    data.rows.length,
  ]);

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVER_SCAN
  );
  const endIndex = Math.min(
    filteredData.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVER_SCAN
  );
  const visibleRows = filteredData.slice(startIndex, endIndex);

  const toggleColumnVisibility = (colIdx: number) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colIdx)) next.delete(colIdx);
      else next.add(colIdx);
      return next;
    });
  };

  const handleToggleSort = (colIdx: number) => {
    setSortConfig((prev) => {
      if (prev.key !== colIdx) return { key: colIdx, direction: 'asc' };
      if (prev.direction === 'asc') return { key: colIdx, direction: 'desc' };
      return { key: -1, direction: null };
    });
  };

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startWidth = columnWidths[index] || 150;
    resizeRef.current = { colIdx: index, startX: e.clientX, startWidth };
    const handleMouseMove = (me: MouseEvent) => {
      if (resizeRef.current) {
        const delta = me.clientX - resizeRef.current.startX;
        onResizeColumn(
          activeSheet,
          resizeRef.current.colIdx,
          Math.max(50, resizeRef.current.startWidth + delta)
        );
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
    const isEditing =
      editingCell?.r === originalRowIndex && editingCell?.c === cIdx;
    const history = cellHistory[`${originalRowIndex}_${cIdx}`];

    const isNull =
      value === null || value === undefined || String(value).trim() === '';
    const cellText = isNull ? '—' : String(value ?? '');

    if (isEditing) {
      return (
        <textarea
          autoFocus
          className="w-full h-full p-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none ring-2 ring-violet-500 font-medium resize-none min-h-[44px]"
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
            if (e.key === 'Escape') {
              e.stopPropagation();
              setEditingCell(null);
            }
          }}
        />
      );
    }

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

    const handleMouseEnter = (e: React.MouseEvent) => {
      if (!wrapText && !isNull) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCellPreview({
          row: originalRowIndex,
          col: cIdx,
          x: rect.left,
          y: rect.top,
        });
      }
    };

    const handleMouseLeave = () => {
      setCellPreview(null);
    };

    return (
      <div
        className={`px-3 py-2.5 cursor-text hover:bg-violet-50/70 dark:hover:bg-violet-900/30 text-zinc-700 dark:text-zinc-200 flex relative transition-all ${wrapText ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'} text-sm leading-normal ${isNumber ? 'justify-end font-mono font-semibold text-violet-600 dark:text-violet-400' : ''} ${isBoolean ? 'justify-center' : ''} ${isNull ? 'italic text-zinc-200 dark:text-zinc-700' : ''}`}
        onDoubleClick={() => setEditingCell({ r: originalRowIndex, c: cIdx })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={wrapText ? undefined : (isNull ? '' : String(value ?? ''))}
      >
        {isBoolean ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 self-center">
            {String(value)}
          </span>
        ) : (
          <span className={`w-full block ${wrapText ? 'whitespace-normal break-words' : 'truncate'}`}>
            {isNull ? '—' : String(value ?? '')}
          </span>
        )}
        {history && (
          <div
            title={`Original: ${history.oldValue}`}
            className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-amber-500 rounded-tr"
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
      <DatabaseActionButtons
        slicer={slicer}
        setSlicer={setSlicer}
        isSlicerOpen={isSlicerOpen}
        setIsSlicerOpen={setIsSlicerOpen}
        hiddenColumns={hiddenColumns}
        toggleColumnVisibility={toggleColumnVisibility}
        setHiddenColumns={setHiddenColumns}
        columns={data.headers}
        onClearFilters={() => {
          setSortConfig({ key: -1, direction: null });
          setSlicer({ mode: 'all', value: 100, endValue: 200 });
          setHiddenColumns(new Set());
          dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
        }}
        wrapText={wrapText}
        setWrapText={setWrapText}
        exportTableName={activeSheet}
        exportColumns={data.headers}
        exportData={filteredData.map((d) => d.row)}
        registerCloseActionPopups={registerCloseActionPopups}
        dispatch={dispatch}
        fillWidth={fillWidth}
        setFillWidth={setFillWidth}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 relative custom-scrollbar"
        onScroll={handleScroll}
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
              height: filteredData.length * ROW_HEIGHT,
              position: 'relative',
            }}
          >
            <table className={`${fillWidth ? 'w-full' : 'w-min'} border-collapse table-fixed absolute top-0 left-0`}>
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-12 border-r border-zinc-200 dark:border-zinc-800 text-[9px] text-zinc-400 font-black uppercase py-2">
                    #
                  </th>
                  {data.headers.map(
                    (header, i) =>
                      !hiddenColumns.has(i) && (
                        <th
                          key={i}
                          style={{ width: columnWidths[i] || 150 }}
                          className={`relative px-3 py-3 text-left text-[10px] font-black border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 group transition-all select-none ${sortConfig.key === i ? 'text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-900/30' : 'text-zinc-500'}`}
                        >
                          <div
                            className="flex items-center justify-between h-full gap-2"
                            title={`Sort by ${header || 'Column'}`}
                            onClick={() => handleToggleSort(i)}
                          >
                            <span className="truncate pr-2 flex items-center gap-2">
                              {header || `Col ${i + 1}`}
                            </span>
                            <div
                              className={`${sortConfig.key === i ? 'opacity-100 text-violet-600 dark:text-violet-400' : 'opacity-0 group-hover:opacity-50'} transition-all flex-shrink-0`}
                            >
                              <IconSort />
                            </div>
                          </div>
                          <div
                            onMouseDown={(e) => handleResizeStart(e, i)}
                            title="Drag to resize column"
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-violet-500/30 transition-colors rounded-l"
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
                {visibleRows.length > 0
                  ? visibleRows.map(({ row, originalIndex }) => (
                      <tr
                        key={originalIndex}
                        className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all duration-150"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <td className="w-12 text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-black border-r border-zinc-200 dark:border-zinc-800 py-2 select-none bg-zinc-50/50 dark:bg-zinc-900/30 group-hover:bg-violet-100/30 dark:group-hover:bg-violet-900/20 transition-colors">
                          {originalIndex + 1}
                        </td>
                        {row.map(
                          (cell, cIdx) =>
                            !hiddenColumns.has(cIdx) && (
                              <td
                                key={cIdx}
                                className="p-0 border-r border-zinc-100 dark:border-zinc-800 align-top relative overflow-hidden"
                              >
                                {renderCell(cell, originalIndex, cIdx)}
                              </td>
                            )
                        )}
                      </tr>
                    ))
                  : filteredData.length === 0 && (
                      <tr>
                        <td
                          colSpan={data.headers.length + 1}
                          className="py-32 text-center"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121zM12 9V5a3 3 0 00-3-3 3 3 0 00-3 3v4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                              No records found
                            </p>
                            <button
                              onClick={() => {
                                setSortConfig({ key: -1, direction: null });
                                setSlicer({
                                  mode: 'all',
                                  value: 100,
                                  endValue: 200,
                                });
                                setHiddenColumns(new Set());
                                dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
                              }}
                              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                            >
                              Clear Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                <tr
                  style={{
                    height: Math.max(
                      0,
                      (filteredData.length - endIndex) * ROW_HEIGHT
                    ),
                  }}
                  aria-hidden="true"
                />
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
          className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center px-4 py-2 z-20 shrink-0"
        >
          <div className="flex items-center gap-3 mr-4 shrink-0">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {filteredData.length}{' '}
              <span className="text-[10px] opacity-60">rows</span>
            </span>
          </div>
        {Object.keys(sheets).length > 5 && (
          <button
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 mr-1 touch-manipulation"
            title="Scroll left"
            onClick={() => {
              const container = document.getElementById('sheets-tabs-container');
              if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div id="sheets-tabs-container" className="flex gap-0 overflow-x-auto no-scrollbar flex-1">
          {Object.keys(sheets).map((name) => (
            <button
              key={name}
              title={`Switch to ${name}`}
              onClick={() => onSheetChange(name)}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 relative ${activeSheet === name ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-900/20 font-black shadow-sm' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              {name}
              {activeSheet === name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t"></div>
              )}
            </button>
          ))}
        </div>
        {Object.keys(sheets).length > 5 && (
          <button
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 ml-1 touch-manipulation"
            title="Scroll right"
            onClick={() => {
              const container = document.getElementById('sheets-tabs-container');
              if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Cell Preview Tooltip */}
      {cellPreview && !wrapText && (
        <div
          className="fixed z-50 px-3 py-2 bg-zinc-900 dark:bg-zinc-700 text-white dark:text-zinc-100 text-sm rounded-lg shadow-2xl max-w-md break-words pointer-events-none animate-in fade-in duration-150"
          style={{
            left: Math.min(cellPreview.x + 10, window.innerWidth - 300),
            top: Math.min(cellPreview.y + 10, window.innerHeight - 100),
          }}
        >
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
            Row {cellPreview.row + 1}, Col {cellPreview.col + 1}
          </div>
          {data.rows[cellPreview.row]?.[cellPreview.col] ?? '—'}
        </div>
      )}
    </div>
  );
};
