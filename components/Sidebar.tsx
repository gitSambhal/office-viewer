import React from 'react';
import { useAppContext } from '../context/AppContext';
import {
  formatBytes,
  getFileIcon,
  getMetaIcon,
  getColorClass,
} from '../utils/helpers';

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);

  const activeMetadata = React.useMemo(() => {
    if (!activeTab) return null;

    const meta: {
      label: string;
      value: string | number;
      icon?: string;
      color?: string;
      badge?: boolean;
    }[] = [{ label: 'File Name', value: activeTab.name }];

    // Format badge
    meta.push({
      label: 'Format',
      value: activeTab.type.toUpperCase(),
      badge: true,
      color:
        activeTab.type === 'xlsx'
          ? 'emerald'
          : activeTab.type === 'docx'
            ? 'blue'
            : activeTab.type === 'pdf'
              ? 'rose'
              : activeTab.type === 'dbf'
                ? 'orange'
                : activeTab.type === 'sqlite'
                  ? 'sky'
                  : activeTab.type === 'mdb'
                    ? 'teal'
                    : 'zinc',
    });

    meta.push({ label: 'Size', value: formatBytes(activeTab.size) });
    meta.push({
      label: 'Modified',
      value: new Date(activeTab.lastModified).toLocaleDateString(),
    });

    // Data-specific metadata
    if (activeTab.type === 'xlsx') {
      const sheets = activeTab.data || {};
      meta.push({ label: 'Sheets', value: Object.keys(sheets).length });
      if (activeTab.activeSheet && sheets[activeTab.activeSheet]) {
        meta.push({ label: 'Active Sheet', value: activeTab.activeSheet });
      }
    }

    // Table count and active table for SQLite and MDB
    if (
      (activeTab.type === 'sqlite' || activeTab.type === 'mdb') &&
      activeTab.tableCount !== null
    ) {
      meta.push({
        label: 'Tables',
        value: activeTab.tableCount,
        icon: 'table',
      });
    }

    // Active table name for SQLite and MDB
    if (
      (activeTab.type === 'sqlite' || activeTab.type === 'mdb') &&
      activeTab.activeTable
    ) {
      meta.push({ label: 'Active Table', value: activeTab.activeTable });
    }

    // Table data counts with UI cues
    if (
      activeTab.type === 'xlsx' ||
      activeTab.type === 'dbf' ||
      activeTab.type === 'sqlite' ||
      activeTab.type === 'mdb'
    ) {
      const filteredRows =
        activeTab.filteredCount !== null
          ? activeTab.filteredCount
          : activeTab.totalRows || 0;
      const visibleColumns = activeTab.visibleColumns || 0;

      // Show filtered rows count
      meta.push({
        label: 'Rows',
        value: filteredRows,
        icon: filteredRows < (activeTab.totalRows || 0) ? 'filter' : 'table',
      });

      // Show filtered count badge when rows are filtered
      if (filteredRows < (activeTab.totalRows || 0)) {
        meta.push({
          label: 'Filtered',
          value: `${(activeTab.totalRows || 0) - filteredRows} hidden`,
          color: 'amber',
          icon: 'filter',
        });
      }

      meta.push({
        label: 'Columns',
        value: visibleColumns,
        icon: 'columns',
      });

      // Sort state
      if (activeTab.sortConfig?.key) {
        const sortDir = activeTab.sortConfig.direction === 'asc' ? '↑' : '↓';
        meta.push({
          label: 'Sorted',
          value: `${activeTab.sortConfig.key} ${sortDir}`,
          color: 'violet',
          icon: 'sort',
        });
      }

      // Search/Filter state
      if (activeTab.searchTerm) {
        meta.push({
          label: 'Search',
          value: `"${activeTab.searchTerm}"`,
          color: 'amber',
          icon: 'search',
        });
      }
    }

    if (activeTab.type === 'txt' || activeTab.type === 'md') {
      const content = String(activeTab.data || '');
      meta.push({
        label: 'Words',
        value: content.trim() ? content.trim().split(/\s+/).length : 0,
      });
      meta.push({ label: 'Chars', value: content.length });
    }

    return meta;
  }, [activeTab]);

  if (!activeTab) {
    return null;
  }

  return (
    <aside
      className={`hide-in-zen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 shadow-2xl z-40 ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}
    >
      <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              Properties
            </h3>
            <button
              onClick={() =>
                dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })
              }
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
          {activeMetadata && (
            <div className="space-y-5">
              {activeMetadata.map((m, i) => (
                <div
                  key={i}
                  className="group animate-in fade-in slide-in-from-left duration-300"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {m.icon && (
                      <span
                        className={`p-1 rounded-md ${getColorClass(m.color)}`}
                      >
                        {getMetaIcon(m.icon)}
                      </span>
                    )}
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-violet-500 transition-colors">
                      {m.label}
                    </div>
                  </div>
                  {m.badge ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getColorClass(m.color)}`}
                    >
                      {m.value}
                    </span>
                  ) : (
                    <div className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200 break-words leading-snug pl-1">
                      {m.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed">
            Safety: Local Workstation
          </p>
          <p className="text-[8px] text-zinc-300 dark:text-zinc-600 mt-1 uppercase">
            No data is sent to servers.
          </p>
        </div>
      </div>
    </aside>
  );
};
