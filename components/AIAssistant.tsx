import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  summarizeText,
  askQuestion,
  stopGeneration,
  initializeAI,
  isAIInitialized,
  isAIInitializing,
  ExtendedInitProgressReport,
  cleanupAI,
  switchModel,
  cancelInitialization,
  getAvailableModels,
  getSelectedModel,
  isModelDownloaded,
  getCurrentModelId,
} from '../services/aiService';

interface AIAssistantProps {
  content: string;
  fileName: string;
  isVisible: boolean;
  onClose: () => void;
  initialSummary?: string;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onSummaryUpdate?: (summary: string) => void;
  onMessagesUpdate?: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  content,
  fileName,
  isVisible,
  onClose,
  initialSummary,
  initialMessages,
  onSummaryUpdate,
  onMessagesUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'qa'>('summary');
  const [summary, setSummary] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summaryStreaming, setSummaryStreaming] = useState<string>('');
  const [qaStreaming, setQaStreaming] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAIReady, setIsAIReady] = useState<boolean>(false);
  const [initReport, setInitReport] = useState<ExtendedInitProgressReport | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize state from props
  useEffect(() => {
    if (initialSummary !== undefined) {
      setSummary(initialSummary);
    }
    if (initialMessages !== undefined) {
      setMessages(initialMessages);
    }
  }, [initialSummary, initialMessages]);

  const availableModels = useMemo(() => getAvailableModels(), []);
  const currentModelInfo = useMemo(() => {
    const model = availableModels.find(m => m.id === selectedModel);
    return model || availableModels[0];
  }, [selectedModel, availableModels]);

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels;
    const searchLower = modelSearch.toLowerCase();
    return availableModels.filter(
      m =>
        m.displayName.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.size.toLowerCase().includes(searchLower) ||
        m.id.toLowerCase().includes(searchLower)
    );
  }, [modelSearch, availableModels]);

  // Initialize selected model from localStorage
  useEffect(() => {
    const savedModel = getSelectedModel();
    setSelectedModel(savedModel);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // AI initialization
  useEffect(() => {
    const checkAIStatus = async () => {
      if (isAIInitialized()) {
        setIsAIReady(true);
      } else if (!isAIInitializing()) {
        try {
          setIsLoading(true);
          await initializeAI(selectedModel, (report) => {
            setInitReport(report);
          });
          setIsAIReady(true);
        } catch (err) {
          console.error('[AI Assistant] Error initializing AI:', err);
          setError('Failed to initialize AI engine. Your browser might not support WebGPU.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isVisible && selectedModel) {
      checkAIStatus();
    } else {
      if (typeof cleanupAI === 'function') {
        cleanupAI().catch(err => console.error('Error during AI cleanup:', err));
      }
      setIsAIReady(false);
    }

    return () => {
      if (typeof cleanupAI === 'function') {
        cleanupAI().catch(err => console.error('Error during AI cleanup on unmount:', err));
      }
    };
  }, [isVisible, selectedModel]);

  // Auto-generate summary when AI is ready and on summary tab
  // Only generate if we have no existing summary AND no initialSummary was provided
  useEffect(() => {
    const shouldGenerate = isVisible && isAIReady && activeTab === 'summary' &&
      !summary && !summaryStreaming && !initialSummary;

    if (shouldGenerate) {
      generateSummary();
    }
  }, [isVisible, isAIReady, activeTab, summary, summaryStreaming, initialSummary]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, qaStreaming, isLoading]);

  const handleStop = async () => {
    await stopGeneration();
    setIsLoading(false);
  };

  const handleModelSelect = async (modelId: string) => {
    if (modelId === selectedModel) {
      setShowModelDropdown(false);
      return;
    }

    setShowModelDropdown(false);
    setModelSearch('');
    setSelectedModel(modelId);
    setIsAIReady(false);
    setSummary('');
    setSummaryStreaming('');
    setMessages([]);
    setError('');

    // Switch to the selected model
    try {
      setIsLoading(true);
      await switchModel(modelId, (report) => {
        setInitReport(report);
      });
      setIsAIReady(true);
    } catch (err) {
      console.error('[AI Assistant] Error switching model:', err);
      setError('Failed to load model. Please try again or select a different model.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDownload = () => {
    cancelInitialization();
    setIsLoading(false);
    setInitReport(null);
    setError('Download cancelled. Select a model to try again.');
  };

  const generateSummary = async () => {
    if (!isAIReady) return;

    setIsLoading(true);
    setError('');
    setSummaryStreaming('');

    try {
      const result = await summarizeText(content, (partial) => {
        setSummaryStreaming(partial);
      }, fileName);
      setSummary(result);
      setSummaryStreaming('');
      if (onSummaryUpdate) {
        onSummaryUpdate(result);
      }
    } catch (err: any) {
      if (err?.message?.includes('interrupted')) {
        console.log('[AI Assistant] Summary generation stopped');
      } else {
        console.error('[AI Assistant] Error generating summary:', err);
        setError(err?.message || 'Failed to generate summary. The document content might be too complex.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!isAIReady || !question.trim() || isLoading) return;

    const currentQuestion = question.trim();
    setQuestion('');

    const userMsg: Message = { role: 'user', content: currentQuestion };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (onMessagesUpdate) {
      onMessagesUpdate(updatedMessages);
    }
    setIsLoading(true);
    setError('');
    setQaStreaming('');

    try {
      const result = await askQuestion(content, currentQuestion, updatedMessages, (partial) => {
        setQaStreaming(partial);
      }, fileName);
      const assistantMsg: Message = { role: 'assistant', content: result };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setQaStreaming('');
      if (onMessagesUpdate) {
        onMessagesUpdate(finalMessages);
      }
    } catch (err: any) {
      if (err?.message?.includes('interrupted')) {
        console.log('[AI Assistant] QA generation stopped');
      } else {
        console.error('[AI Assistant] Error generating answer:', err);
        setError(err?.message || 'Failed to generate answer. The AI model might have reached its limit.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  const formatETA = (seconds?: number) => {
    if (seconds === undefined) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s remaining`;
  };

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: ExtendedInitProgressReport['status']) => {
    switch (status) {
      case 'downloading':
        return (
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        );
      case 'compiling':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'initializing':
        return (
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  const MarkdownRenderer = ({ text }: { text: string }) => (
    <div className="prose dark:prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({ node, ...props }) => <h3 className="font-black text-zinc-950 dark:text-white uppercase tracking-tighter text-sm pt-4 mb-2 flex items-center gap-2" {...props} />,
          p: ({ node, ...props }) => <p className="text-sm font-medium leading-relaxed mb-3" {...props} />,
          ul: ({ node, ...props }) => <ul className="space-y-2 mb-4 list-none" {...props} />,
          li: ({ node, ...props }) => (
            <li className="flex gap-3 pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0"></div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed" {...props} />
            </li>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Header - Matching Sidebar style */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
            AI Assistant
          </h3>
          {isAIReady && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Model Selector - Simplified */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-violet-500 dark:hover:border-violet-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-md border border-zinc-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider truncate">{currentModelInfo.displayName}</p>
                <p className="text-[9px] text-zinc-400 truncate">{currentModelInfo.size} • {currentModelInfo.performance}</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Content */}
          {showModelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Search Input */}
              <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative">
                  <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-0 rounded-md text-xs outline-none focus:ring-1 focus:ring-violet-500 placeholder-zinc-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Model List */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredModels.map((model) => {
                  const isDownloaded = isModelDownloaded(model.id);
                  const isSelected = model.id === selectedModel;

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isSelected ? 'bg-violet-50 dark:bg-violet-900/10 border-l-2 border-violet-500' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
                          {isDownloaded ? (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">{model.displayName}</p>
                            {model.isDefault && (
                              <span className="px-1 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[8px] font-black uppercase rounded">
                                Def
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-zinc-400 truncate">{model.size} • {model.minMemory}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900/50 mx-4 mt-4 rounded-xl">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${activeTab === 'summary' ? 'bg-white dark:bg-zinc-800 text-violet-600 shadow-md' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
          Summary
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${activeTab === 'qa' ? 'bg-white dark:bg-zinc-800 text-violet-600 shadow-md' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Interactive Q&A
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
        {/* Loading / Download Progress */}
        {!isAIReady && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-[6px] border-zinc-100 dark:border-zinc-800 rounded-3xl animate-pulse"></div>
              <div className="w-24 h-24 border-[6px] border-violet-600 border-t-transparent rounded-3xl animate-spin absolute top-0 left-0"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-violet-600">
                {initReport ? Math.round(initReport.progress * 100) : 0}%
              </div>
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase mb-2">
              {initReport?.status === 'downloading' ? 'Downloading Model' : 'Preparing AI'}
            </h3>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">
              {currentModelInfo.displayName} • {currentModelInfo.size}
            </p>

            {/* Progress Bar */}
            {initReport && (
              <div className="w-72 bg-zinc-100 dark:bg-zinc-900 h-3 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-violet-600 transition-all duration-300 shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                  style={{ width: `${initReport.progress * 100}%` }}
                ></div>
              </div>
            )}

            {/* Progress Details */}
            {initReport && (
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex items-center gap-2 text-violet-500">
                  {getStatusIcon(initReport.status)}
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {initReport.status.charAt(0).toUpperCase() + initReport.status.slice(1)}
                  </span>
                </div>
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">
                  {formatETA(initReport.eta)}
                </p>
                {initReport.downloadedBytes && initReport.totalBytes && (
                  <p className="text-[10px] text-zinc-400">
                    {formatBytes(initReport.downloadedBytes)} / {formatBytes(initReport.totalBytes)}
                  </p>
                )}
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleCancelDownload}
              className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Download
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center p-8">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-900/50">
              <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-black text-rose-600 uppercase mb-2">Analysis Failed</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-8 max-w-[280px]">{error}</p>
            <button
              onClick={() => {
                setError('');
                setSelectedModel(getSelectedModel());
              }}
              className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Summary Tab */}
        {isAIReady && !error && activeTab === 'summary' && (
          <div className="py-4 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Document Analysis</h4>
              {isLoading && (
                <button
                  onClick={handleStop}
                  className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <div className="w-2 h-2 bg-rose-600 rounded-sm"></div>
                  Stop Generation
                </button>
              )}
            </div>
            <MarkdownRenderer text={summary || summaryStreaming} />
            {isLoading && summaryStreaming && (
              <div className="inline-block w-2 h-4 bg-violet-600 animate-pulse ml-1 align-middle"></div>
            )}
            {!summary && !summaryStreaming && isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Reading between the lines...</p>
              </div>
            )}
          </div>
        )}

        {/* Q&A Tab */}
        {isAIReady && !error && activeTab === 'qa' && (
          <div className="flex flex-col h-full space-y-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Conversation History
              </h4>
              <div className="flex items-center gap-3">
                {isLoading && (
                  <button
                    onClick={handleStop}
                    className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <div className="w-2 h-2 bg-rose-600 rounded-sm"></div>
                    Stop
                  </button>
                )}
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear History
                  </button>
                )}
              </div>
            </div>

            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-sm font-black uppercase tracking-widest">Ask anything about this document</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none shadow-lg shadow-violet-600/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-800'}`}>
                  {msg.role === 'assistant' ? <MarkdownRenderer text={msg.content} /> : msg.content}
                </div>
              </div>
            ))}

            {isLoading && qaStreaming && (
              <div className="flex flex-col items-start space-y-2 animate-in fade-in duration-300">
                <div className="max-w-[90%] bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-5 py-3 rounded-2xl rounded-tl-none border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    Analysing...
                  </h4>
                  <MarkdownRenderer text={qaStreaming} />
                  <div className="inline-block w-2 h-4 bg-violet-600 animate-pulse ml-1 align-middle"></div>
                </div>
              </div>
            )}

            {!qaStreaming && isLoading && activeTab === 'qa' && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-900 px-6 py-4 rounded-2xl animate-pulse flex gap-2">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Area */}
      {activeTab === 'qa' && isAIReady && !error && (
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-3 px-1">
            <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11.5 2.5 3.32 6.72 7.42 1.08-5.37 5.23 1.27 7.39-6.64-3.49-6.64 3.49 1.27-7.39-5.37-5.23 7.42-1.08L11.5 2.5Z" /></svg>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
              Note: AI can generate incorrect info. Always verify.
            </p>
          </div>
          <div className="relative group">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask a factual question..."
              className="w-full pl-6 pr-14 py-4 bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-violet-600 dark:focus:border-violet-500 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-zinc-500"
              disabled={isLoading}
            />
            {isLoading ? (
              <button
                onClick={handleStop}
                className="absolute right-2 top-2 p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center"
                title="Stop Generation"
              >
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </button>
            ) : (
              <button
                onClick={handleAskQuestion}
                disabled={!question.trim()}
                className="absolute right-2 top-2 p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 active:scale-95 transition-all shadow-lg shadow-violet-600/20"
                title="Send Question"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">
        Powered by WebLLM • {currentModelInfo.displayName}
      </div>
    </div>
  );
};
