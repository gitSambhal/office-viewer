import React from 'react';
import { useUrlHandler } from '../hooks/useUrlHandler';

const IconX = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

export const UrlModal: React.FC = () => {
  const {
    showUrlModal,
    setShowUrlModal,
    urlInput,
    setUrlInput,
    isLoadingUrl,
    handleUrlOpen
  } = useUrlHandler();

  return (
    <>
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">Open from URL</h3>
              <button
                onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
              >
                <IconX />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  File URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && urlInput.trim()) {
                      handleUrlOpen();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                  className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUrlOpen}
                  disabled={!urlInput.trim() || isLoadingUrl}
                  className={`flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${(!urlInput.trim() || isLoadingUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoadingUrl ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Open File'
                  )}
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              Supports PDF, Excel, Word, RTF, Text, Images, SQLite, MDB, and more.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
