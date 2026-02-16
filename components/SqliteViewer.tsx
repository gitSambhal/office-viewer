import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import initSqlJs, { Database } from 'sql.js';
import { TableData, SortConfig, ColumnWidths, TabStateChange } from '../types';
import { useAppContext } from '../context/AppContext';
import { DatabaseActionButtons } from './DatabaseActionButtons';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  FileSpreadsheet,
} from 'lucide-react';

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

interface SqliteViewerProps {
  file: File;
  onStateChange?: (state: TabStateChange & { tableCount?: number }) => void;
  isTypeAwareEnabled?: boolean;
  registerCloseActionPopups?: (callback: () => void) => void;
  globalSearchTerm?: string;
}

const SqliteViewer: React.FC<SqliteViewerProps> = ({
  file,
  onStateChange,
  isTypeAwareEnabled: propTypeAware,
  registerCloseActionPopups,
  globalSearchTerm,
}) => {
  const { state, dispatch } = useAppContext();
  const [db, setDb] = useState<Database | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [activeTableName, setActiveTableName] = useState<string | null>(null);
  const [currentTableData, setCurrentTableData] = useState<TableData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
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
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const resizeRef = useRef<{
    colIdx: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  // Initialize sql.js and load the database
  useEffect(() => {
    const loadDb = async () => {
      try {
        // Locate wasm file: Vite copies it to the root of the dist folder
        const SQL = await initSqlJs({ locateFile: (file) => `./${file}` });
        const buffer = await file.arrayBuffer();
        const dbInstance = new SQL.Database(new Uint8Array(buffer));
        setDb(dbInstance);

        const result = dbInstance.exec(
          "SELECT name FROM sqlite_master WHERE type='table';"
        );
        if (result.length > 0) {
          const names = result[0].values.map((row) => row[0] as string);
          setTableNames(names);
          if (names.length > 0) {
            setActiveTableName(names[0]);
          }
        }
      } catch (err) {
        console.error('Error loading SQLite DB:', err);
        setError(
          `Failed to load SQLite file. Ensure it is a valid SQLite database. Details: ${err.message || err}`
        );
      }
    };
    loadDb();
  }, [file]);

  // Load active table data when db or activeTableName changes
  useEffect(() => {
    if (db && activeTableName) {
      try {
        const stmt = db.prepare(`SELECT * FROM "${activeTableName}"`);
        const columns = stmt.getColumnNames();
        const rows: any[][] = [];
        while (stmt.step()) {
          rows.push(stmt.get());
        }
        setCurrentTableData({
          id: activeTableName,
          name: activeTableName,
          columns,
          rows,
        });
        stmt.free();

        // Reset view settings for new table
        setSortConfig({ key: '', direction: null });
        setHiddenColumns(new Set());
        setSlicer({ mode: 'all', value: 100, endValue: 200 });
        setColumnWidths({}); // Reset column widths
        if (scrollContainerRef.current)
          scrollContainerRef.current.scrollTop = 0;
      } catch (err) {
        console.error(`Error reading table "${activeTableName}":`, err);
        setError(
          `Failed to read table "${activeTableName}". It might be corrupted or inaccessible. Details: ${err.message || err}`
        );
      }
    }
  }, [db, activeTableName]);

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
    // Set initial height with a fallback
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
  }, [currentTableData]);

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
  const [wrapText, setWrapText] = useState(false);
  const [fillWidth, setFillWidth] = useState(true);

  // Async filtering
  useEffect(() => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });

    // Use setTimeout to allow UI to update with loading indicator
    const timer = setTimeout(() => {
      if (!currentTableData) {
        setFilteredData([]);
        dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
        return;
      }

      const rows = currentTableData.rows;
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
        const colIndex = currentTableData.columns.indexOf(sortConfig.key);
        if (colIndex !== -1) {
          indices.sort((idxA, idxB) => {
            const valA = rows[idxA][colIndex];
            const valB = rows[idxB][colIndex];
            const isEmptyA =
              valA === null || valA === undefined || String(valA).trim() === '';
            const isEmptyB =
              valB === null || valB === undefined || String(valB).trim() === '';
            if (isEmptyA && isEmptyB) return 0;
            if (isEmptyA) return 1; // Empty values go to the end
            if (isEmptyB) return -1; // Empty values go to the end

            let res = 0;
            // Attempt numeric comparison first
            if (typeof valA === 'number' && typeof valB === 'number') {
              res = valA - valB;
            } else {
              // Fallback to locale-aware string comparison
              res = String(valA).localeCompare(String(valB), undefined, {
                numeric: true,
                sensitivity: 'base',
              });
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

      const result = indices.map((idx) => ({
        row: rows[idx],
        originalIndex: idx,
      }));
      setFilteredData(result);
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }, 50);

    return () => clearTimeout(timer);
  }, [currentTableData, sortConfig, slicer, globalSearchTerm, dispatch]);

  // Keep ref updated with latest callback
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChangeRef.current && currentTableData) {
      const visibleColCount = currentTableData.columns.filter(
        (_, i) => !hiddenColumns.has(i)
      ).length;
      onStateChangeRef.current({
        sortConfig: sortConfig.key ? sortConfig : null,
        searchTerm: '',
        filteredCount: filteredData.length,
        totalRows: currentTableData.rows.length,
        visibleColumns: visibleColCount,
        tableCount: tableNames.length,
        activeTable: activeTableName,
      });
    }
  }, [
    sortConfig,
    filteredData.length,
    hiddenColumns,
    currentTableData,
    tableNames.length,
    activeTableName,
  ]);

  const handleToggleSort = (columnKey: string) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc')
          return { key: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null }; // Clear sort
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

  // Ensure we always show at least some rows if data exists
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
    resizeRef.current = { colIdx: colIndex, startX: e.clientX, startWidth };
    const handleMouseMove = (me: MouseEvent) => {
      if (resizeRef.current) {
        const newWidth = Math.max(
          50,
          resizeRef.current.startWidth + (me.clientX - resizeRef.current.startX)
        );
        const colIdx = resizeRef.current.colIdx;
        setColumnWidths((prev) => ({ ...prev, [colIdx]: newWidth }));
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
  if (!db || !activeTableName || !currentTableData)
    return <div className="p-4">Loading database...</div>;

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
        columns={currentTableData.columns}
        onClearFilters={() => {
          setSortConfig({ key: '', direction: null });
          setSlicer({ mode: 'all', value: 100, endValue: 200 });
          setHiddenColumns(new Set());
          dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' });
        }}
        wrapText={wrapText}
        setWrapText={setWrapText}
        exportTableName={currentTableData.name}
        exportColumns={currentTableData.columns}
        exportData={filteredData.map((d) => d.row)}
        registerCloseActionPopups={registerCloseActionPopups}
        dispatch={dispatch}
        fillWidth={fillWidth}
        setFillWidth={setFillWidth}
      />

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
              height: Math.max(
                filteredData.length * ROW_HEIGHT,
                containerHeight
              ),
              position: 'relative',
            }}
          >
            <table
              className={`${fillWidth ? 'w-full' : 'w-min'} border-collapse table-fixed absolute top-0 left-0 right-0 bottom-0`}
            >
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-12 border-r border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase py-2">
                    #
                  </th>
                  {currentTableData.columns.map(
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
                  effectiveVisibleRows.map((rowData, rowIndex) => {
                    return (
                      <tr
                        key={startIndex + rowIndex}
                        className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <td className="w-12 text-center text-[10px] text-zinc-400 font-mono font-black border-r border-zinc-200 dark:border-zinc-800 py-2 select-none bg-zinc-50/50 dark:bg-zinc-900/30">
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
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={currentTableData.columns.length + 1}
                      className="py-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                          No records found
                        </p>
                        <button
                          onClick={() => {
                            setSortConfig({ key: '', direction: null });
                            setSlicer({
                              mode: 'all',
                              value: 100,
                              endValue: 200,
                            });
                            setHiddenColumns(new Set());
                            dispatch({
                              type: 'SET_GLOBAL_SEARCH_TERM',
                              payload: '',
                            });
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
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center px-4 py-2 z-20 shrink-0">
        <div className="flex items-center gap-3 mr-4 shrink-0">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {filteredData.length}{' '}
            <span className="text-[10px] opacity-60">records</span>
          </span>
        </div>
        {tableNames.length > 5 && (
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
          {tableNames.map((name) => (
            <button
              key={name}
              title={`Switch to ${name}`}
              onClick={() => setActiveTableName(name)}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 relative ${activeTableName === name ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              {name}
              {activeTableName === name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t"></div>
              )}
            </button>
          ))}
        </div>
        {tableNames.length > 5 && (
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

export default SqliteViewer;
