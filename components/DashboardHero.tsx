import React, { useEffect, useState, useRef } from 'react';
import { useFileHandler } from '../hooks/useFileHandler';
import { useUrlHandler } from '../hooks/useUrlHandler';
import { FileType } from '../types';
import { getFileIcon } from '../utils/helpers';
import { DashboardPreview } from './DashboardPreview';
import { RecentFiles } from './RecentFiles';
import { FILE_ACCEPT, PREVIEW_DATA, FEATURES, FILE_TYPE_EXTENSIONS, SUPPORTED_EXTENSIONS } from '../constants';
import { CREDITS } from '../utils/credits';
// import { CreditsPopup } from './CreditsPopup';
import { useAppContext } from '../context/AppContext';
import { FILE_TYPE_SEO } from '../constants';
import analytics from '../utils/analytics';

interface Props {
  deferredPrompt?: Event | null;
  onInstall?: () => void;
}

// Function to detect query type from search query
const getQueryType = (query: string): FileType | null => {
  const lowerQuery = query.toLowerCase().trim();
  
  if (lowerQuery.includes('pdf') || lowerQuery.includes('pdf viewer') || lowerQuery.includes('pdf reader')) {
    return 'pdf';
  }
  if (lowerQuery.includes('excel') || lowerQuery.includes('sheet') || lowerQuery.includes('xlsx') || lowerQuery.includes('xls') || lowerQuery.includes('spreadsheet')) {
    return 'xlsx';
  }
  if (lowerQuery.includes('word') || lowerQuery.includes('doc') || lowerQuery.includes('docx') || lowerQuery.includes('document')) {
    return 'docx';
  }
  if (lowerQuery.includes('image') || lowerQuery.includes('photo') || lowerQuery.includes('jpg') || lowerQuery.includes('png') || lowerQuery.includes('gif')) {
    return 'image';
  }
  if (lowerQuery.includes('rtf') || lowerQuery.includes('rich text')) {
    return 'rtf';
  }
  if (lowerQuery.includes('md') || lowerQuery.includes('markdown')) {
    return 'md';
  }
  if (lowerQuery.includes('txt') || lowerQuery.includes('text file')) {
    return 'txt';
  }
  if (lowerQuery.includes('access') || lowerQuery.includes('mdb') || lowerQuery.includes('accdb')) {
    return 'mdb';
  }
  if (lowerQuery.includes('sqlite') || lowerQuery.includes('db') || lowerQuery.includes('sql')) {
    return 'sqlite';
  }
  if (lowerQuery.includes('dbf') || lowerQuery.includes('dbase')) {
    return 'dbf';
  }
  if (lowerQuery.includes('powerpoint') || lowerQuery.includes('pptx') || lowerQuery.includes('presentation') || lowerQuery.includes('slide')) {
    return 'pptx';
  }
  
  return null;
};

export const DashboardHero: React.FC<Props> = ({ deferredPrompt, onInstall }) => {
  const { handleFiles } = useFileHandler();
  const { setShowUrlModal } = useUrlHandler();
  const { state, dispatch } = useAppContext();
  const [queryType, setQueryType] = useState<FileType | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>(FILE_ACCEPT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileSupported = (fileName: string): boolean => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    return SUPPORTED_EXTENSIONS.some(ext => 
      fileName.toLowerCase().endsWith(ext.toLowerCase())
    );
  };

  const handleChipClick = () => {
    setErrorMessage(null);
    setFileTypeFilter(FILE_ACCEPT);
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check for unsupported files
    const unsupportedFiles = Array.from(files).filter(file => !isFileSupported(file.name));
    if (unsupportedFiles.length > 0) {
      const fileNames = unsupportedFiles.map(f => f.name).join(', ');
      setErrorMessage(`Unsupported file format: ${fileNames}. Please select a supported file type.`);
      e.target.value = '';
      return;
    }

    setErrorMessage(null);
    handleFiles(files);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewerType = searchParams.get('viewer');
    if (viewerType) {
      const type = getQueryType(viewerType);
      setQueryType(type);
    }
  }, []);

  return (
    <div className="max-w-5xl w-full py-8 sm:py-16">
      <div className="mb-12 sm:mb-24">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() =>
              dispatch({ type: 'SET_DARK_MODE', payload: !state.darkMode })
            }
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {state.darkMode ? (
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
            ) : (
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
            )}
          </button>
        </div>

        {/* Hero Section Heading */}
        <div className="text-center mb-12">
          {queryType && FILE_TYPE_SEO[queryType] ? (
            <>
              <h2 className="text-4xl sm:text-7xl font-black text-zinc-950 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[1.05]">
                {FILE_TYPE_SEO[queryType].title}
              </h2>
              <p className="text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                {FILE_TYPE_SEO[queryType].description}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl sm:text-7xl font-black text-zinc-950 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[1.05]">
                The Universal File Viewer
              </h2>
              <p className="text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                Open and switch between multiple documents, spreadsheets, and
                databases instantly. No installations, 100% local.
              </p>
            </>
          )}
        </div>

        {/* Chips Preview */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
          {[
            {
              name: 'PDF',
              type: 'pdf',
              icon: getFileIcon('pdf'),
              color: 'bg-rose-50 dark:bg-rose-900/10',
            },
            {
              name: 'Word',
              type: 'docx',
              icon: getFileIcon('docx'),
              color: 'bg-blue-50 dark:bg-blue-900/10',
            },
            {
              name: 'RTF',
              type: 'rtf',
              icon: getFileIcon('rtf'),
              color: 'bg-amber-50 dark:bg-amber-900/10',
            },
            {
              name: 'Markdown',
              type: 'md',
              icon: getFileIcon('md'),
              color: 'bg-zinc-100 dark:bg-zinc-800/50',
            },
            {
              name: 'Excel',
              type: 'xlsx',
              icon: getFileIcon('xlsx'),
              color: 'bg-emerald-50 dark:bg-emerald-900/10',
            },
            {
              name: 'Access DB',
              type: 'mdb',
              icon: getFileIcon('mdb'),
              color: 'bg-teal-50 dark:bg-teal-900/10',
            },
            {
              name: 'SQLite',
              type: 'sqlite',
              icon: getFileIcon('sqlite'),
              color: 'bg-sky-50 dark:bg-sky-900/10',
            },
            {
              name: 'DBF',
              type: 'dbf',
              icon: getFileIcon('dbf'),
              color: 'bg-orange-50 dark:bg-orange-900/10',
            },
            {
              name: 'Images',
              type: 'image',
              icon: getFileIcon('image'),
              color: 'bg-violet-50 dark:bg-violet-900/10',
            },
            {
              name: 'PowerPoint',
              type: 'pptx',
              icon: getFileIcon('pptx'),
              color: 'bg-orange-50 dark:bg-orange-900/10',
            },
          ].map((fmt) => (
            <button
              key={fmt.name}
              type="button"
              onClick={() => handleChipClick()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:px-4 sm:py-2 ${fmt.color} border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
              title={`Click to open ${fmt.name} files`}
            >
              {fmt.icon}
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                {fmt.name}
              </span>
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          id="main-cta-section"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
        >
          {errorMessage && (
            <div className="w-full max-w-md mb-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full p-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div
          id="main-cta-section"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <label className="group relative inline-flex items-center gap-3 cursor-pointer bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <svg
              className="w-5 h-5 group-hover:rotate-12 transition-transform"
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
            Open Files
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              accept={fileTypeFilter}
            />
          </label>

          <button
            onClick={() => {
              analytics.trackUIInteraction('open_from_url_button', 'click');
              setShowUrlModal(true);
            }}
            className="group relative inline-flex items-center gap-3 cursor-pointer bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:scale-[1.02] active:scale-95"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
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
            Open from URL
          </button>
        </div>

        {/* Install App Button */}
        {deferredPrompt && onInstall && (
          <div className="flex justify-center mb-12">
            <button
              onClick={onInstall}
              className="group relative inline-flex items-center gap-3 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-indigo-500 hover:border-indigo-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Install App for Offline Use
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={async () => {
              analytics.trackUIInteraction('sample_pdf_button', 'click');
              try {
                const response = await fetch(PREVIEW_DATA.SAMPLE_PDF_URL);
                const blob = await response.blob();
                const file = new File([blob], PREVIEW_DATA.SAMPLE_PDF_NAME, {
                  type: 'application/pdf',
                });
                handleFiles([file]);
              } catch (error) {
                console.error('Failed to load sample file:', error);
              }
            }}
            className="text-sm sm:text-base text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors underline underline-offset-4"
          >
            No file? Try a sample PDF
          </button>
        </div>

        {/* How it Works Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-lg mb-12">
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-6 text-center">
            How to Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">
                1
              </div>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2">
                Select Files
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Click "Open Files" to choose documents from your device or drag & drop them directly
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">
                2
              </div>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2">
                View Instantly
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Files open in tabs - switch between them instantly and view content without installation
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">
                3
              </div>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2">
                Work Offline
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                All processing happens locally on your device. Your files stay private and secure
              </p>
            </div>
          </div>
        </div>

        {/* App Preview with Tabs and Content */}
        <div className="mb-12">
          <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white mb-6 text-center">
            See It In Action
          </h3>
          <DashboardPreview />
        </div>
      </div>

      {/* Recent Files */}
      <RecentFiles />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left mb-12 sm:mb-16">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="p-5 sm:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100/50 dark:border-zinc-800/50 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/30 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-100 dark:bg-zinc-800 text-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={feature.icon}
                />
              </svg>
            </div>
            <h4 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white mb-2 tracking-tight">
              {feature.title}
            </h4>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Credits */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 sm:py-4 sm:px-6 bg-white dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-1000">
        <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Designed & Crafted by
        </span>
        <a
          href={CREDITS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] sm:text-[11px] font-black text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-widest flex items-center gap-2 group"
        >
          {CREDITS.name}
          <svg
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        {/* <span className="text-[9px] sm:text-[10px] font-black text-zinc-400">|</span> */}
        {/* <CreditsPopup /> */}
      </div>
    </div>
  );
};
