import React from 'react';
import { ActionButton } from './ActionButton';
import { ExportButton } from './ExportButton';

const IconSlicer = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const IconColumns = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const IconTextWrap = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const IconTextWrapOff = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconExpand = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

interface SlicerSettings {
  mode: 'all' | 'first' | 'last' | 'range';
  value: number;
  endValue: number;
}

interface DatabaseActionButtonsProps {
  // Slicer
  slicer: SlicerSettings;
  setSlicer: React.Dispatch<React.SetStateAction<SlicerSettings>>;
  isSlicerOpen: boolean;
  setIsSlicerOpen: (open: boolean) => void;
  
  // Columns
  hiddenColumns: Set<number>;
  toggleColumnVisibility: (colIdx: number) => void;
  setHiddenColumns: React.Dispatch<React.SetStateAction<Set<number>>>;
  columns: string[];
  
  // Clear filters
  onClearFilters: () => void;
  
  // Wrap text
  wrapText: boolean;
  setWrapText: (wrap: boolean) => void;
  
  // Export
  exportTableName: string;
  exportColumns: string[];
  exportData: any[][];
  
  // Fill width toggle
  fillWidth?: boolean;
  setFillWidth?: (fill: boolean) => void;
  
  // Shared
  registerCloseActionPopups?: (callback: () => void) => void;
  dispatch: React.Dispatch<any>;
}

export const DatabaseActionButtons: React.FC<DatabaseActionButtonsProps> = ({
  slicer,
  setSlicer,
  isSlicerOpen,
  setIsSlicerOpen,
  hiddenColumns,
  toggleColumnVisibility,
  setHiddenColumns,
  columns,
  onClearFilters,
  wrapText,
  setWrapText,
  exportTableName,
  exportColumns,
  exportData,
  registerCloseActionPopups,
  dispatch,
  fillWidth = true,
  setFillWidth,
}) => {
  return (
    <div className="flex items-center gap-3 p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-30">
      <div className="flex items-center gap-1 shrink-0">
        {/* Slicer - Data filtering */}
        <ActionButton
          icon={<IconSlicer />}
          title="Filter and Slice Dataset"
          isActive={slicer.mode !== 'all'}
          onClick={() => {
            setIsSlicerOpen(!isSlicerOpen);
          }}
          registerCloseActionPopups={registerCloseActionPopups}
        >
          <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400">
              View Slicer
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['all', 'first', 'last', 'range'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSlicer((s: SlicerSettings) => ({ ...s, mode }))}
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
                    onChange={(e) => setSlicer((s: SlicerSettings) => ({ ...s, value: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                {slicer.mode === 'range' && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-zinc-400">End</span>
                    <input
                      type="number"
                      className="w-16 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-bold"
                      value={slicer.endValue}
                      onChange={(e) => setSlicer((s: SlicerSettings) => ({ ...s, endValue: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ActionButton>

        {/* Clear Filters - Reset */}
        <button
          title="Clear all filters and sorts"
          onClick={onClearFilters}
          className="p-1.5 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-zinc-700 transition-all"
        >
          <IconRefresh />
        </button>

        {/* Columns - Column visibility */}
        <ActionButton
          icon={<IconColumns />}
          title="Show / Hide Columns"
          isActive={hiddenColumns.size > 0}
          onClick={() => {
            setIsSlicerOpen(false);
          }}
          registerCloseActionPopups={registerCloseActionPopups}
        >
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-40 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-700">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Layout</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setHiddenColumns(new Set())}
                  className="text-[8px] font-black uppercase text-violet-500 hover:text-violet-600"
                >
                  Show All
                </button>
                <button
                  onClick={() => setHiddenColumns(new Set(columns.map((_, i) => i)))}
                  className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-600"
                >
                  Hide All
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {columns.map((h, i) => (
                <button
                  key={i}
                  onClick={() => toggleColumnVisibility(i)}
                  className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-all"
                >
                  <span className={`text-[10px] font-bold uppercase truncate max-w-[150px] ${hiddenColumns.has(i) ? 'text-zinc-300 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                    {h || `Col ${i + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </ActionButton>

        {/* Wrap Text - Cell display */}
        <ActionButton
          icon={wrapText ? <IconTextWrapOff /> : <IconTextWrap />}
          title={wrapText ? 'Disable text wrapping' : 'Enable text wrapping'}
          isActive={wrapText}
          onClick={() => setWrapText(!wrapText)}
          registerCloseActionPopups={registerCloseActionPopups}
        />

        {/* Fill Width - Table display */}
        {setFillWidth && (
          <ActionButton
            icon={<IconExpand />}
            title={fillWidth ? 'Disable fill width' : 'Enable fill width'}
            isActive={fillWidth}
            onClick={() => setFillWidth(!fillWidth)}
            registerCloseActionPopups={registerCloseActionPopups}
          />
        )}
      </div>

      {/* Export - Data export */}
      <ExportButton
        tableName={exportTableName}
        columns={exportColumns}
        data={exportData}
        registerCloseActionPopups={registerCloseActionPopups}
      />
    </div>
  );
};
