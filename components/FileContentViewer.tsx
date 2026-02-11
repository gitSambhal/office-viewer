import React, { useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { PdfViewer } from './PdfViewer';
import { DocxViewer } from './DocxViewer';
import { TextViewer } from './TextViewer';
import { ImageViewer } from './ImageViewer';
import { RtfViewer } from './RtfViewer';
import MdbViewer from './MdbViewer';
import SqliteViewer from './SqliteViewer';
import DbfViewer from './DbfViewer';
import { PptxViewer } from './PptxViewer';
import { updateSEO } from '../utils/helpers';

export const FileContentViewer: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);

  // Update SEO when active tab changes
  useEffect(() => {
    if (activeTab) {
      updateSEO(activeTab.type, activeTab.name);
    } else {
      updateSEO(null);
    }
  }, [activeTab]);

  // Callback to close action popups (used by child components)
  const closeActionPopupsRef = React.useRef<(() => void) | null>(null);
  const registerCloseActionPopups = React.useCallback(
    (callback: () => void) => {
      closeActionPopupsRef.current = callback;
    },
    []
  );

  if (!activeTab) {
    return null;
  }

  // Show loading indicator if tab is still loading
  if (activeTab.isLoading) {
    return (
      <div className="flex-1 h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Loading {activeTab.name}...
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Please wait while we process your file
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full animate-in fade-in duration-300">
      {activeTab.type === 'xlsx' && (
        <SpreadsheetViewer
          key={activeTab.id}
          sheets={activeTab.data}
          activeSheet={activeTab.activeSheet!}
          globalSearchTerm={state.globalSearchTerm}
          onSheetChange={(name) =>
            dispatch({
              type: 'UPDATE_TAB',
              payload: { id: activeTab.id, updates: { activeSheet: name } },
            })
          }
          onUpdate={(sheetName, newData) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  data: {
                    ...activeTab.data,
                    [sheetName]: {
                      ...activeTab.data[sheetName],
                      rows: newData,
                    },
                  },
                },
              },
            });
          }}
          columnWidths={
            (activeTab.columnSettings || {})[activeTab.activeSheet!] || {}
          }
          onResizeColumn={(sheetName, colIdx, width) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  columnSettings: {
                    ...activeTab.columnSettings,
                    [sheetName]: {
                      ...activeTab.columnSettings?.[sheetName],
                      [colIdx]: width,
                    },
                  },
                },
              },
            });
          }}
          isTypeAwareEnabled={state.isTypeAwareEnabled}
          registerCloseActionPopups={registerCloseActionPopups}
          onStateChange={(state) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  sortConfig: state.sortConfig,
                  searchTerm: state.searchTerm,
                  filteredCount: state.filteredCount,
                  totalRows: state.totalRows ?? activeTab.totalRows,
                  visibleColumns: state.visibleColumns,
                },
              },
            });
          }}
        />
      )}
      {activeTab.type === 'pdf' && (
        <PdfViewer key={activeTab.id} data={activeTab.data} />
      )}
      {activeTab.type === 'docx' && (
        <DocxViewer
          key={activeTab.id}
          data={activeTab.data}
          name={activeTab.name}
        />
      )}
      {activeTab.type === 'rtf' && (
        <RtfViewer key={activeTab.id} data={activeTab.data} />
      )}
      {activeTab.type === 'txt' && (
        <TextViewer
          key={activeTab.id}
          content={activeTab.data}
          isMarkdown={false}
        />
      )}
      {activeTab.type === 'md' && (
        <TextViewer
          key={activeTab.id}
          content={activeTab.data}
          isMarkdown={true}
        />
      )}
      {activeTab.type === 'image' && (
        <ImageViewer key={activeTab.id} src={activeTab.data} />
      )}
      {activeTab.type === 'mdb' && (
        <MdbViewer
          key={activeTab.id}
          file={activeTab.data}
          isTypeAwareEnabled={state.isTypeAwareEnabled}
          registerCloseActionPopups={registerCloseActionPopups}
          globalSearchTerm={state.globalSearchTerm}
          onStateChange={(state) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  sortConfig: state.sortConfig,
                  searchTerm: state.searchTerm,
                  filteredCount: state.filteredCount,
                  totalRows: state.totalRows ?? activeTab.totalRows,
                  visibleColumns: state.visibleColumns,
                  tableCount: state.tableCount,
                  activeTable: state.activeTable,
                },
              },
            });
          }}
        />
      )}
      {activeTab.type === 'sqlite' && (
        <SqliteViewer
          key={activeTab.id}
          file={activeTab.data}
          isTypeAwareEnabled={state.isTypeAwareEnabled}
          registerCloseActionPopups={registerCloseActionPopups}
          globalSearchTerm={state.globalSearchTerm}
          onStateChange={(state) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  sortConfig: state.sortConfig,
                  searchTerm: state.searchTerm,
                  filteredCount: state.filteredCount,
                  totalRows: state.totalRows ?? activeTab.totalRows,
                  visibleColumns: state.visibleColumns,
                  tableCount: state.tableCount,
                  activeTable: state.activeTable,
                },
              },
            });
          }}
        />
      )}
      {activeTab.type === 'dbf' && (
        <DbfViewer
          key={activeTab.id}
          tableData={activeTab.data}
          isTypeAwareEnabled={state.isTypeAwareEnabled}
          registerCloseActionPopups={registerCloseActionPopups}
          globalSearchTerm={state.globalSearchTerm}
          onStateChange={(state) => {
            dispatch({
              type: 'UPDATE_TAB',
              payload: {
                id: activeTab.id,
                updates: {
                  sortConfig: state.sortConfig,
                  searchTerm: state.searchTerm,
                  filteredCount: state.filteredCount,
                  totalRows: state.totalRows ?? activeTab.totalRows,
                  visibleColumns: state.visibleColumns,
                },
              },
            });
          }}
        />
      )}
      {activeTab.type === 'pptx' && (
        <PptxViewer key={activeTab.id} data={activeTab.data} />
      )}
    </div>
  );
};
