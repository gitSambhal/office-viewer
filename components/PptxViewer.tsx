import React, { useEffect, useRef, useState } from 'react';
import { PPTXViewer } from 'pptx-viewer';
import { useAppContext } from '../context/AppContext';

interface Props {
  data: ArrayBuffer;
}

export const PptxViewer: React.FC<Props> = ({ data }) => {
  const { state, dispatch } = useAppContext();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(3000);
  const [isPaused, setIsPaused] = useState(false);
  const [slideshowEnded, setSlideshowEnded] = useState(false);
  const viewerRef = useRef<PPTXViewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSlideRef = useRef(0);
  const slideshowEndedRef = useRef<HTMLDivElement>(null);

  // Focus slideshow ended popup when it appears
  useEffect(() => {
    if (slideshowEnded && slideshowEndedRef.current) {
      slideshowEndedRef.current.focus();
    }
  }, [slideshowEnded]);

  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  useEffect(() => {
    let isMounted = true;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events from inputs/textareas to allow typing (e.g. in AI chat)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (viewerRef.current) {
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            if (isSlideshowActive) {
              if (slideshowEnded) {
                startSlideshow();
              } else {
                togglePause();
              }
            } else {
              handleNext();
            }
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
          case 'PageUp':
            e.preventDefault();
            handlePrevious();
            break;
          case 'Home':
            e.preventDefault();
            viewerRef.current.goToSlide(0);
            break;
          case 'End':
            e.preventDefault();
            viewerRef.current.goToSlide(slideCount - 1);
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            handleToggleFullscreen();
            break;
          case 's':
          case 'S':
            e.preventDefault();
            toggleSlideshow();
            break;
          case ' ':
            e.preventDefault();
            if (isSlideshowActive) {
              if (slideshowEnded) {
                startSlideshow();
              } else {
                togglePause();
              }
            } else {
              handleNext();
            }
            break;
          case 'Escape':
            e.preventDefault();
            if (slideshowEnded) {
              // Close slideshow ended popup
              stopSlideshow();
            } else if (isSlideshowActive) {
              // Stop active slideshow
              stopSlideshow();
            } else if (isFullscreen) {
              // Exit fullscreen
              handleToggleFullscreen();
            }
            break;
        }
      }
    };

    const initViewer = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!containerRef.current) {
          throw new Error('Viewer container not found');
        }

        // Initialize the PPTX viewer with built-in controls
        const viewer = new PPTXViewer(containerRef.current, {
          initialSlide: 0,
          showControls: false,
          keyboardNavigation: false,
          onSlideChange: (index) => {
            if (isMounted) {
              setCurrentSlide(index);
            }
          },
          onLoad: (presentation) => {
            if (isMounted) {
              setSlideCount(presentation.slides.length);
              setLoading(false);
            }
          },
          onError: (err) => {
            if (isMounted) {
              console.error('PPTX Viewer Error:', err);
              setError(
                `Failed to process PowerPoint file: ${err.message || 'Unknown error'}`
              );
              setLoading(false);
            }
          },
        });

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);
        viewerRef.current = viewer;

        // Load the presentation data
        await viewer.load(data);
      } catch (err: any) {
        if (isMounted) {
          console.error('PPTX Loading Error:', err);
          // Handle specific error types
          let errorMessage = 'Failed to process PowerPoint file';
          if (err.message && err.message.includes('invalid magic number')) {
            errorMessage =
              'This file is in an unsupported PowerPoint format. Please use modern .pptx files.';
          } else if (err.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [data]);

  const handleNext = () => {
    if (viewerRef.current) {
      viewerRef.current.next();
    }
  };

  const handlePrevious = () => {
    if (viewerRef.current) {
      viewerRef.current.previous();
    }
  };

  const handleGoToSlide = (index: number) => {
    if (viewerRef.current && index >= 0 && index < slideCount) {
      viewerRef.current.goToSlide(index);
    }
  };

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } else {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    }
  };

  const startSlideshow = () => {
    setIsSlideshowActive(true);
    setIsPaused(false);
    setSlideshowEnded(false);

    // Start from first slide
    if (viewerRef.current) {
      viewerRef.current.goToSlide(0);
    }

    // Start slide navigation (no automatic fullscreen)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (!isPaused && viewerRef.current) {
        const current = currentSlideRef.current;
        console.log('Current slide:', current, 'Total slides:', slideCount);
        if (current < slideCount - 1) {
          viewerRef.current.next();
        } else {
          // Slideshow ended
          console.log('Slideshow ended');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setSlideshowEnded(true);
        }
      }
    }, slideshowInterval);
  };

  const stopSlideshow = () => {
    setIsSlideshowActive(false);
    setIsPaused(false);
    setSlideshowEnded(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Exit fullscreen mode if needed
    if (isFullscreen) {
      handleToggleFullscreen();
    }
  };

  const toggleSlideshow = async () => {
    if (isSlideshowActive) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSlideshowInterval(parseInt(e.target.value));
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative">
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
            POWERPOINT PRESENTATION
          </span>
          {slideCount > 0 && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-zinc-500">
              SLIDE {currentSlide + 1} of {slideCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={loading || currentSlide === 0}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold rounded-md transition-colors"
          >
            PREV
          </button>
          <button
            onClick={handleNext}
            disabled={loading || currentSlide === slideCount - 1}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold rounded-md transition-colors"
          >
            NEXT
          </button>
          <button
            onClick={toggleSlideshow}
            disabled={loading}
            className="px-3 py-1 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold text-green-700 dark:text-green-300 rounded-md transition-colors"
          >
            {isSlideshowActive ? 'STOP SLIDESHOW' : 'SLIDESHOW'}
          </button>
          <select
            value={slideshowInterval}
            onChange={handleIntervalChange}
            disabled={loading || isSlideshowActive}
            className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-[10px] font-bold text-zinc-700 dark:text-zinc-300"
          >
            <option value={2000}>2 sec</option>
            <option value={3000}>3 sec</option>
            <option value={5000}>5 sec</option>
            <option value={10000}>10 sec</option>
          </select>
          <button
            onClick={handleToggleFullscreen}
            disabled={loading}
            className="px-3 py-1 bg-violet-100 dark:bg-violet-900 hover:bg-violet-200 dark:hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold text-violet-700 dark:text-violet-300 rounded-md transition-colors"
          >
            {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest animate-pulse">
              Loading Presentation...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="max-w-xl p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center shadow-xl">
              <svg
                className="w-12 h-12 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-bold mb-2 uppercase tracking-wide">
                Unsupported Format
              </p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {slideshowEnded && (
          <div
            ref={slideshowEndedRef}
            className="fixed inset-0 flex flex-col items-center justify-center z-[9999] bg-black/80 backdrop-blur-sm outline-none"
            style={{ position: 'fixed', zIndex: 9999 }}
            onKeyDown={(e) => {
              console.log('🚀 ~ :363 ~ PptxViewer ~ e:', e);
              if (e.key === 'Escape') {
                e.preventDefault();
                stopSlideshow();
              }
            }}
            tabIndex={0}
          >
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-lg font-bold text-white mb-2">
                Slideshow Complete!
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                You have reached the end of the presentation
              </p>
              <div className="flex gap-3">
                <button
                  onClick={startSlideshow}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors"
                >
                  Restart Slideshow
                </button>
                <button
                  onClick={stopSlideshow}
                  className="px-6 py-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Slide navigation dots */}
      {slideCount > 1 && !loading && !error && !slideshowEnded && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-full z-10">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleGoToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-violet-500 w-6 rounded'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              title={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {!loading && !error && !slideshowEnded && (
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg z-10">
          <p className="text-[8px] text-white/70 uppercase tracking-wide">
            Keyboard: ←/→ or ↓/↑ to navigate, F for fullscreen
          </p>
        </div>
      )}
    </div>
  );
};
