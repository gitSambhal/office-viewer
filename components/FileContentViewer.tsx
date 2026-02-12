import React, { useCallback, useRef, useEffect, useState } from 'react';
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
import { AIAssistant } from './AIAssistant';
import { TextExtractor } from '../services/textExtractor';

// Shared action toolbar component
const ActionToolbar: React.FC<{
  onOpenAI: () => void;
  isAIOpen: boolean;
  fileType: string;
  fileName: string;
}> = ({ onOpenAI, isAIOpen, fileType, fileName }) => {
  if (fileType === 'image') return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenAI}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAIOpen
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
        {isAIOpen ? 'AI Open' : 'AI Insights'}
      </button>
    </div>
  );
};

export const FileContentViewer: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  const [isExtracting, setIsExtracting] = useState(false);
  const previousTabIdRef = useRef<string | null>(null);

  // Handle tab switching effects (SEO only)
  useEffect(() => {
    if (!activeTab) {
      updateSEO(null);
      return;
    }

    // Check if we switched tabs
    const switchedTabs = previousTabIdRef.current !== activeTab.id;
    previousTabIdRef.current = activeTab.id;

    updateSEO(activeTab.type, activeTab.name);

  }, [activeTab?.id, activeTab?.type, activeTab?.name]);

  // Handle opening AI insights
  const handleOpenAI = useCallback(async () => {
    if (!activeTab || activeTab.type === 'image') return;

    // Update isAIOpen immediately for better UX
    dispatch({
      type: 'UPDATE_TAB',
      payload: { id: activeTab.id, updates: { isAIInsightsOpen: true } },
    });

    if (activeTab.aiExtractedText) {
      // Content already exists, panel will open via re-render
      return;
    }

    // Extract text first
    setIsExtracting(true);
    try {
      const activeKey = activeTab.activeSheet || activeTab.activeTable;
      const text = await TextExtractor.extractText(activeTab.type, activeTab.data, activeKey, {
        fileName: activeTab.name,
        fileSize: activeTab.size,
        lastModified: activeTab.lastModified
      });

      dispatch({
        type: 'UPDATE_TAB',
        payload: {
          id: activeTab.id,
          updates: {
            aiExtractedText: text,
            isAIInsightsOpen: true,
          },
        },
      });
    } catch (err) {
      console.error('Extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  }, [activeTab, dispatch]);

  // Handle closing AI sidebar
  const handleCloseAI = useCallback(() => {
    if (!activeTab) return;
    dispatch({
      type: 'UPDATE_TAB',
      payload: {
        id: activeTab.id,
        updates: { isAIInsightsOpen: false },
      },
    });
  }, [activeTab, dispatch]);

  // Handle AI summary update
  const handleSummaryUpdate = useCallback((summary: string) => {
    if (!activeTab) return;
    dispatch({
      type: 'UPDATE_TAB',
      payload: {
        id: activeTab.id,
        updates: { aiSummary: summary },
      },
    });
  }, [activeTab, dispatch]);

  // Handle AI messages update
  const handleMessagesUpdate = useCallback((messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    if (!activeTab) return;
    dispatch({
      type: 'UPDATE_TAB',
      payload: {
        id: activeTab.id,
        updates: { aiMessages: messages },
      },
    });
  }, [activeTab, dispatch]);

  // Callback to close action popups
  const closeActionPopupsRef = React.useRef<(() => void) | null>(null);
  const registerCloseActionPopups = useCallback(
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

  // Render the content based on file type
  const renderContent = () => {
    switch (activeTab.type) {
      case 'xlsx':
        return (
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
            columnWidths={(activeTab.columnSettings || {})[activeTab.activeSheet!] || {}}
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
        );
      case 'pdf':
        return <PdfViewer key={activeTab.id} data={activeTab.data} />;
      case 'docx':
        return <DocxViewer key={activeTab.id} data={activeTab.data} name={activeTab.name} />;
      case 'rtf':
        return <RtfViewer key={activeTab.id} data={activeTab.data} />;
      case 'txt':
        return <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={false} globalSearchTerm={state.globalSearchTerm} />;
      case 'md':
        return <TextViewer key={activeTab.id} content={activeTab.data} isMarkdown={true} globalSearchTerm={state.globalSearchTerm} />;
      case 'image':
        return <ImageViewer key={activeTab.id} src={activeTab.data} />;
      case 'mdb':
        return (
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
        );
      case 'sqlite':
        return (
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
        );
      case 'dbf':
        return (
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
        );
      case 'pptx':
        return <PptxViewer key={activeTab.id} data={activeTab.data} />;
      default:
        return null;
    }
  };

  const isAIOpen = activeTab.isAIInsightsOpen === true;

  return (
    <div className="flex-1 h-full w-full animate-in fade-in duration-300 relative flex overflow-hidden">
      {/* Loading overlay */}
      {isExtracting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Digitalizing Document</p>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest">Preparing context for AI Analysis...</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content area with embedded AI panel */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {activeTab.type.toUpperCase()}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">
              {activeTab.name}
            </span>
          </div>
          <ActionToolbar
            onOpenAI={handleOpenAI}
            isAIOpen={isAIOpen}
            fileType={activeTab.type}
            fileName={activeTab.name}
          />
        </div>

        {/* Split view: content + AI panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* File content */}
          <div className={`flex-1 overflow-hidden ${isAIOpen ? 'hidden lg:block lg:w-[60%]' : 'w-full'}`}>
            {renderContent()}
          </div>

          {/* AI Assistant panel - embedded in viewer, moves with tab */}
          {isAIOpen && activeTab && activeTab.aiExtractedText && (
            <div key={activeTab.id} className="w-full lg:w-[40%] h-full border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden animate-in slide-in-from-right duration-300">
              <AIAssistant
                content={activeTab.aiExtractedText}
                fileName={activeTab.name}
                isVisible={true}
                initialSummary={activeTab.aiSummary || ''}
                initialMessages={activeTab.aiMessages || []}
                onClose={handleCloseAI}
                onSummaryUpdate={handleSummaryUpdate}
                onMessagesUpdate={handleMessagesUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
