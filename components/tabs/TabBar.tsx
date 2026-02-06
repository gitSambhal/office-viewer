import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getFileIcon } from '../../utils/helpers';
import { ContextMenu } from '../ContextMenu';

const IconX = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const TabBar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showScrollArrows, setShowScrollArrows] = useState(false);
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
    tabIndex: number;
  } | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (tabBarRef.current) {
        setShowScrollArrows(
          tabBarRef.current.scrollWidth > tabBarRef.current.clientWidth
        );
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [state.tabs]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      tabBarRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const closeTab = (id: string) => {
    dispatch({ type: 'CLOSE_TAB', payload: id });
  };

  const closeOtherTabs = (tabId: string) => {
    state.tabs.forEach((tab) => {
      if (tab.id !== tabId) {
        dispatch({ type: 'CLOSE_TAB', payload: tab.id });
      }
    });
  };

  const closeTabsToRight = (tabIndex: number) => {
    state.tabs.slice(tabIndex + 1).forEach((tab) => {
      dispatch({ type: 'CLOSE_TAB', payload: tab.id });
    });
  };

  const closeTabsToLeft = (tabIndex: number) => {
    state.tabs.slice(0, tabIndex).forEach((tab) => {
      dispatch({ type: 'CLOSE_TAB', payload: tab.id });
    });
  };

  const closeAllTabs = () => {
    state.tabs.forEach((tab) => {
      dispatch({ type: 'CLOSE_TAB', payload: tab.id });
    });
  };

  return (
    <>
      <div className="flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-20">
        {/* Tab Search Input - Fixed position outside scroll area */}
        {state.tabs.length > 0 && (
          <div className="flex-shrink-0 px-3 border-r border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <svg
                className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tabs..."
                value={tabSearchTerm}
                onChange={(e) => setTabSearchTerm(e.target.value)}
                className="w-32 pl-8 pr-6 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              />
              {tabSearchTerm && (
                <button
                  onClick={() => setTabSearchTerm('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
                >
                  <IconX />
                </button>
              )}
            </div>
          </div>
        )}
        {showScrollArrows && (
          <button
            onClick={() => handleScrollTabs('left')}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
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
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div
          ref={tabBarRef}
          className="flex-1 flex flex-nowrap overflow-x-auto scrollbar-none items-center"
        >
          {state.tabs
            .filter((tab) =>
              tab.name.toLowerCase().includes(tabSearchTerm.toLowerCase())
            )
            .map((tab, index) => (
              <div
                key={tab.id}
                onClick={() =>
                  dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    tabId: tab.id,
                    tabIndex: index,
                  });
                }}
                className={`flex flex-shrink-0 items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer min-w-[100px] sm:min-w-[140px] max-w-[200px] sm:max-w-[280px] select-none group transition-all relative ${state.activeTabId === tab.id ? 'bg-zinc-50 dark:bg-zinc-950 shadow-inner' : 'hover:bg-zinc-50/50'}`}
              >
                {state.activeTabId === tab.id && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600" />
                )}
                {getFileIcon(tab.type)}
                <span
                  className={`text-[10px] sm:text-[11px] truncate font-black uppercase tracking-tight flex-1 ${state.activeTabId === tab.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
                >
                  {tab.name}
                </span>
                <button
                  title="Close Tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all text-zinc-400"
                >
                  <IconX />
                </button>
              </div>
            ))}
          {tabSearchTerm &&
            state.tabs.filter((tab) =>
              tab.name.toLowerCase().includes(tabSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="flex-shrink-0 px-4 py-2 text-xs text-zinc-400 font-medium">
                No tabs found
              </div>
            )}
        </div>
        {showScrollArrows && (
          <button
            onClick={() => handleScrollTabs('right')}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
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
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Close Tab',
              onClick: () => closeTab(contextMenu.tabId),
            },
            {
              label: 'Close Other Tabs',
              onClick: () => closeOtherTabs(contextMenu.tabId),
            },
            {
              label: 'Close Tabs to Right',
              onClick: () => closeTabsToRight(contextMenu.tabIndex),
            },
            {
              label: 'Close Tabs to Left',
              onClick: () => closeTabsToLeft(contextMenu.tabIndex),
            },
            {
              divider: true,
            },
            {
              label: 'Close All Tabs',
              onClick: () => closeAllTabs(),
            },
          ]}
        />
      )}
    </>
  );
};
