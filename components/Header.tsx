import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useUrlHandler } from '../hooks/useUrlHandler';
import { useFileHandler } from '../hooks/useFileHandler';
import { FILE_ACCEPT, STORAGE_KEYS } from '../constants';

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
const IconDark = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const IconLight = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707"
    />
  </svg>
);
const IconFullscreen = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
    />
  </svg>
);

export const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { setShowUrlModal } = useUrlHandler();
  const { handleFiles } = useFileHandler();

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <header className="hide-in-zen flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none z-30 shadow-sm shrink-0 gap-2 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-6">
        <div
          title="Go to Dashboard"
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: null })}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform italic">
            S
          </div>
          <h1 className="font-black text-zinc-800 dark:text-white hidden sm:block tracking-tighter text-lg">
            Suhail{' '}
            <span className="text-violet-600 dark:text-violet-400">Viewer</span>
          </h1>
        </div>
        {state.activeTabId && (
          <nav className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg sm:rounded-xl p-1 gap-1">
            <button
              title="Sidebar"
              onClick={() =>
                dispatch({
                  type: 'SET_SIDEBAR_OPEN',
                  payload: !state.isSidebarOpen,
                })
              }
              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${state.isSidebarOpen ? 'bg-white dark:bg-zinc-700 shadow-md text-violet-600' : 'text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-700/50'}`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <button
              title="Toggle Visual Type Highlighting"
              onClick={() => {
                const newValue = !state.isTypeAwareEnabled;
                localStorage.setItem(STORAGE_KEYS.TYPE_AWARE, String(newValue));
                dispatch({ type: 'SET_TYPE_AWARE_ENABLED', payload: newValue });
              }}
              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all border ${state.isTypeAwareEnabled ? 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-white/50'}`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h10M10 7v10m4-10v10M7 17h10"
                />
              </svg>
            </button>
            <button
              title="Toggle Theme"
              onClick={() =>
                dispatch({ type: 'SET_DARK_MODE', payload: !state.darkMode })
              }
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-500"
            >
              {state.darkMode ? <IconLight /> : <IconDark />}
            </button>
            <button
              title="Zen Mode"
              onClick={() =>
                dispatch({ type: 'SET_ZEN_MODE', payload: !state.zenMode })
              }
              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all ${state.zenMode ? 'text-violet-600 bg-white dark:bg-zinc-700 shadow-md' : 'text-zinc-500'}`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              title="Fullscreen"
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-500"
            >
              <IconFullscreen />
            </button>
          </nav>
        )}
      </div>

      {/* Global Search - hidden on mobile to save space */}
      {state.tabs.length > 0 && (
        <div className="hidden sm:block flex-1 max-w-md relative">
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
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
              placeholder="Search databases..."
              value={state.globalSearchTerm}
              onChange={(e) =>
                dispatch({
                  type: 'SET_GLOBAL_SEARCH_TERM',
                  payload: e.target.value,
                })
              }
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            {state.globalSearchTerm && (
              <button
                onClick={() =>
                  dispatch({ type: 'SET_GLOBAL_SEARCH_TERM', payload: '' })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
              >
                <IconX />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Always show the URL button */}
        <label className="group relative inline-flex items-center gap-2 sm:gap-3 cursor-pointer bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white dark:text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.02] active:scale-95">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Open Files</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept={FILE_ACCEPT}
          />
        </label>
        <button
          onClick={() => setShowUrlModal(true)}
          className="group relative inline-flex items-center gap-2 sm:gap-3 cursor-pointer bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:scale-[1.02] active:scale-95"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span>Open from URL</span>
        </button>
      </div>
    </header>
  );
};
