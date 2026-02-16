import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Buffer } from 'buffer';
import MDBReader from 'mdb-reader';
import { TableData, SortConfig, ColumnWidths, TabStateChange } from '../types';
import { ActionButton } from './ActionButton';
import { ExportButton } from './ExportButton';
import { DatabaseActionButtons } from './DatabaseActionButtons';
import { useAppContext } from '../context/AppContext';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  FileSpreadsheet,
} from 'lucide-react';

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

const ROW_HEIGHT = 44; // px
const OVER_SCAN = 10; // extra rows for smoother scrolling

interface SlicerSettings {
  mode: 'all' | 'first' | 'last' | 'range';
  value: number;
  endValue: number;
}

interface MdbViewerProps {
  file: File;
  onStateChange?: (state: TabStateChange & { tableCount?: number }) => void;
  isTypeAwareEnabled?: boolean;
  registerCloseActionPopups?: (callback: () => void) => void;
  globalSearchTerm?: string;
}

const MdbViewer: React.FC<MdbViewerProps> = ({
  file,
  onStateChange,
  isTypeAwareEnabled: propTypeAware,
  registerCloseActionPopups,
  globalSearchTerm,
}) => {
  const { state, dispatch } = useAppContext();
  const [tables, setTables] = useState<TableData[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: number;
    direction: 'asc' | 'desc' | null;
  }>({ key: -1, direction: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [slicer, setSlicer] = useState<SlicerSettings>({
    mode: 'all',
    value: 100,
    endValue: 200,
  });
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const resizeRef = useRef<{
    colIdx: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = Buffer.from(e.target?.result as ArrayBuffer);
          const mdb = new MDBReader(buffer);
          const tableNames = mdb.getTableNames();

          const allTables = tableNames.map((name) => {
            const table = mdb.getTable(name);
            const columns = table.getColumns().map((col) => col.name);
            const data = table.getData();
            const rowsAsArrays = data.map((row) =>
              columns.map((col) => row[col])
            );
            return {
              id: name,
              name: name,
              columns: columns,
              rows: rowsAsArrays,
            };
          });

          setTables(allTables);
          if (allTables.length > 0) {
            setActiveTableId(allTables[0].id);
          }
        } catch (err: any) {
          setError(
            'Failed to parse MDB file. Please ensure it is a valid Access database file.'
          );
          console.error(err);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => {
    setSortConfig({ key: -1, direction: null });
    setHiddenColumns(new Set());
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeTableId]);

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

  const activeTable = useMemo(
    () => tables.find((t) => t.id === activeTableId),
    [tables, activeTableId]
  );

  const [filteredData, setFilteredData] = useState<
    { row: any[]; originalIndex: number }[]
  >([]);
  const [wrapText, setWrapText] = useState(false);
  const [fillWidth, setFillWidth] = useState(true);

  // Async filtering
  useEffect(() => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });

    // Use setTimeout to allow UI to update with loading indicator
    const timer = setTimeout(() => {
      if (!activeTable) {
        setFilteredData([]);
        dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
        return;
      }

      const rows = activeTable.rows;
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

          let res = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            res = valA - valB;
          } else {
            res = String(valA).localeCompare(String(valB), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }
          return (direction === 'asc' ? res : -res) || idxA - idxB;
        });
      }

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

      const result = indices.map((idx) => ({
        row: rows[idx],
        originalIndex: idx,
      }));
      setFilteredData(result);
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTable, sortConfig, slicer, globalSearchTerm, dispatch]);

  // Keep ref updated with latest callback
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChangeRef.current && activeTable) {
      const sortKey =
        sortConfig.key !== -1
          ? activeTable.columns[sortConfig.key] || String(sortConfig.key)
          : '';
      const visibleColCount = activeTable.columns.filter(
        (_, i) => !hiddenColumns.has(i)
      ).length;
      onStateChangeRef.current({
        sortConfig: sortKey
          ? { key: sortKey, direction: sortConfig.direction }
          : null,
        searchTerm: '',
        filteredCount: filteredData.length,
        totalRows: activeTable.rows.length,
        visibleColumns: visibleColCount,
        tableCount: tables.length,
        activeTable: activeTableId,
      });
    }
  }, [
    sortConfig,
    filteredData.length,
    hiddenColumns,
    activeTable,
    tables.length,
    activeTableId,
  ]);

  const handleToggleSort = (colIdx: number) => {
    setSortConfig((prev) => {
      if (prev.key !== colIdx) return { key: colIdx, direction: 'asc' };
      if (prev.direction === 'asc') return { key: colIdx, direction: 'desc' };
      return { key: -1, direction: null };
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

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startWidth = columnWidths[index] || 150;
    resizeRef.current = { colIdx: index, startX: e.clientX, startWidth };
    const handleMouseMove = (me: MouseEvent) => {
      if (resizeRef.current) {
        const newWidth = Math.max(
          50,
          resizeRef.current.startWidth + (me.clientX - resizeRef.current.startX)
        );
        setColumnWidths((prev) => ({
          ...prev,
          [resizeRef.current!.colIdx]: newWidth,
        }));
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
        className={`px-3 py-2 text-zinc-800 dark:text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis text-sm ${wrapText ? 'whitespace-normal break-words' : ''} ${isNumber ? 'justify-end font-mono font-bold text-violet-600 dark:text-violet-400' : ''} ${isBoolean ? 'justify-center' : ''} ${isNull ? 'italic text-zinc-200 dark:text-zinc-700' : ''}`}
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

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!activeTable) return <div className="p-4">Loading database...</div>;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-zinc-50 dark:bg-zinc-950">
      <DatabaseActionButtons
        slicer={slicer}
        setSlicer={setSlicer}
        isSlicerOpen={isSlicerOpen}
        setIsSlicerOpen={setIsSlicerOpen}
        hiddenColumns={hiddenColumns}
        toggleColumnVisibility={toggleColumnVisibility}
        setHiddenColumns={setHiddenColumns}
        columns={activeTable.columns}
        onClearFilters={() => {
          setSortConfig({ key: -1, direction: null });
          setSlicer({ mode: 'all', value: 100, endValue: 200 });
          setHiddenColumns(new Set());
          dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
        }}
        wrapText={wrapText}
        setWrapText={setWrapText}
        exportTableName={activeTable.name}
        exportColumns={activeTable.columns}
        exportData={filteredData.map((d) => d.row)}
        registerCloseActionPopups={registerCloseActionPopups}
        dispatch={dispatch}
        fillWidth={fillWidth}
        setFillWidth={setFillWidth}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative"
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
              height: filteredData.length * ROW_HEIGHT,
              position: 'relative',
            }}
          >
            <table
              className={`${fillWidth ? 'w-full' : 'w-min'} border-collapse table-fixed absolute top-0 left-0 right-0`}
            >
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-12 border-r border-zinc-200 dark:border-zinc-800 text-[9px] text-zinc-400 font-black uppercase py-2">
                    #
                  </th>
                  {activeTable.columns.map(
                    (header, i) =>
                      !hiddenColumns.has(i) && (
                        <th
                          key={i}
                          style={{ width: columnWidths[i] || 150 }}
                          className="relative px-3 py-2 text-left text-[10px] font-black border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 group uppercase select-none"
                        >
                          <div
                            className="flex items-center justify-between h-full"
                            onClick={() => handleToggleSort(i)}
                          >
                            <span className="truncate pr-4">{header}</span>
                            <div
                              className={`${sortConfig.key === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} transition-opacity`}
                            >
                              <IconSort />
                            </div>
                          </div>
                          <div
                            onMouseDown={(e) => handleResizeStart(e, i)}
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-violet-500 z-30"
                          />
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-950">
                <tr style={{ height: startIndex * ROW_HEIGHT }} />
                {visibleRows.map(({ row, originalIndex }) => (
                  <tr
                    key={originalIndex}
                    className="group border-b border-zinc-100 dark:border-zinc-900"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <td className="w-8 min-w-[32px] text-center text-[10px] text-zinc-400 font-mono border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                      {originalIndex + 1}
                    </td>
                    {row.map(
                      (cell, cIdx) =>
                        !hiddenColumns.has(cIdx) && (
                          <td
                            key={cIdx}
                            className="p-0 border-r border-zinc-200 dark:border-zinc-800 align-top"
                          >
                            {renderCell(cell)}
                          </td>
                        )
                    )}
                  </tr>
                ))}
                <tr
                  style={{
                    height: (filteredData.length - endIndex) * ROW_HEIGHT,
                  }}
                />
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center px-4 py-2 z-20 shrink-0">
        <div className="flex items-center gap-3 mr-4 shrink-0">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {filteredData.length}{' '}
            <span className="text-[10px] opacity-60">records</span>
          </span>
        </div>
        {tables.length > 5 && (
          <button
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 mr-1 touch-manipulation"
            title="Scroll left"
            onClick={() => {
              const container = document.getElementById(
                'tables-tabs-container'
              );
              if (container)
                container.scrollBy({ left: -200, behavior: 'smooth' });
            }}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div
          id="tables-tabs-container"
          className="flex gap-0 overflow-x-auto no-scrollbar flex-1"
        >
          {tables.map((table) => (
            <button
              key={table.id}
              title={`Switch to ${table.name}`}
              onClick={() => setActiveTableId(table.id)}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 relative ${activeTableId === table.id ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              {table.name}
              {activeTableId === table.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t"></div>
              )}
            </button>
          ))}
        </div>
        {tables.length > 5 && (
          <button
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 ml-1 touch-manipulation"
            title="Scroll right"
            onClick={() => {
              const container = document.getElementById(
                'tables-tabs-container'
              );
              if (container)
                container.scrollBy({ left: 200, behavior: 'smooth' });
            }}
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default MdbViewer;
