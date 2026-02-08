/**
 * Analytics Service
 * Analytics tracking for Suhail Viewer
 * Supports Google Analytics 4 and Microsoft Clarity
 */

// Analytics configuration using environment variables
const ANALYTICS_CONFIG = {
  googleAnalytics: {
    measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  },
  microsoftClarity: {
    projectId: import.meta.env.VITE_CLARITY_PROJECT_ID || 'XXXXXXXXXX',
  },
};

// Check if analytics should be enabled (respects Do Not Track)
const isAnalyticsEnabled = (): boolean => {
  // Check if Do Not Track is enabled
  const doNotTrack = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  
  if (doNotTrack === '1' || doNotTrack === 'yes') {
    console.log('[Analytics] Tracking disabled by Do Not Track');
    return false;
  }

  // Check if user has explicitly disabled analytics (optional)
  try {
    const analyticsDisabled = localStorage.getItem('analytics_disabled');
    if (analyticsDisabled === 'true') {
      console.log('[Analytics] Tracking disabled by user preference');
      return false;
    }
  } catch (error) {
    console.error('[Analytics] Error checking user preference:', error);
  }

  return true;
};

// Google Analytics 4 tracking
export const trackGA4Event = (eventName: string, eventParams?: Record<string, any>) => {
  if (!isAnalyticsEnabled()) return;

  const measurementId = ANALYTICS_CONFIG.googleAnalytics.measurementId;
  
  if (measurementId && measurementId !== 'G-XXXXXXXXXX' && (window as any).gtag) {
    try {
      (window as any).gtag('event', eventName, eventParams || {});
      console.log('[Analytics] GA4 event tracked:', eventName, eventParams);
    } catch (error) {
      console.error('[Analytics] Error tracking GA4 event:', error);
    }
  }
};

// Microsoft Clarity tracking (automatically handled by Clarity script)
export const trackClarityEvent = (eventName: string, eventData?: any) => {
  if (!isAnalyticsEnabled()) return;

  const projectId = ANALYTICS_CONFIG.microsoftClarity.projectId;
  
  if (projectId && projectId !== 'XXXXXXXXXX' && (window as any).clarity) {
    try {
      (window as any).clarity('set', eventName, eventData);
      console.log('[Analytics] Clarity event tracked:', eventName, eventData);
    } catch (error) {
      console.error('[Analytics] Error tracking Clarity event:', error);
    }
  }
};

// Universal event tracker - tracks to all available analytics platforms
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!isAnalyticsEnabled()) return;

  // Track to each analytics platform based on configuration
  trackGA4Event(eventName, eventParams);
  trackClarityEvent(eventName, eventParams);
};

// Page view tracking
export const trackPageView = (pageTitle?: string, pagePath?: string) => {
  if (!isAnalyticsEnabled()) return;

  const title = pageTitle || document.title;
  const path = pagePath || window.location.pathname;

  // Track page view in GA4
  trackGA4Event('page_view', {
    page_title: title,
    page_location: window.location.href,
    page_path: path,
  });

  console.log('[Analytics] Page view tracked:', title, path);
};

// File opening tracking
export const trackFileOpen = (
  fileName: string,
  fileType: string,
  fileSize: number
) => {
  trackEvent('file_open', {
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    extension: fileType.toLowerCase().split('.').pop(),
  });
};

// File export tracking
export const trackFileExport = (
  fileName: string,
  fileType: string,
  exportFormat: string
) => {
  trackEvent('file_export', {
    file_name: fileName,
    file_type: fileType,
    export_format: exportFormat,
  });
};

// Share functionality tracking
export const trackShare = (
  shareMethod: string,
  fileName?: string,
  fileType?: string
) => {
  trackEvent('share', {
    share_method: shareMethod,
    file_name: fileName,
    file_type: fileType,
  });
};

// UI interaction tracking
export const trackUIInteraction = (
  element: string,
  action: string,
  details?: Record<string, any>
) => {
  trackEvent('ui_interaction', {
    element,
    action,
    ...details,
  });
};

// Error tracking
export const trackError = (
  errorMessage: string,
  errorType: string,
  details?: Record<string, any>
) => {
  trackEvent('error', {
    error_message: errorMessage,
    error_type: errorType,
    ...details,
  });

  // Also track error in GA4 with exception event
  trackGA4Event('exception', {
    description: errorMessage,
    fatal: false,
  });
};

// Performance tracking
export const trackPerformance = (
  metric: string,
  value: number,
  details?: Record<string, any>
) => {
  trackEvent('performance', {
    metric,
    value,
    ...details,
  });
};

// Initialize analytics
export const initializeAnalytics = () => {
  if (!isAnalyticsEnabled()) {
    console.log('[Analytics] Analytics initialization skipped (tracking disabled)');
    return;
  }

  console.log('[Analytics] Initializing analytics');

  // Track initial page view
  trackPageView();

  // Track app initialization timing
  const loadTime = performance.now();
  trackPerformance('app_load_time', loadTime);

  // Track user language
  trackGA4Event('user_language', {
    language: navigator.language,
  });

  // Track device information
  trackGA4Event('device_info', {
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    device_type: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  });
};

// Toggle analytics enable/disable
export const setAnalyticsEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem('analytics_disabled', String(!enabled));
    console.log('[Analytics] Tracking', enabled ? 'enabled' : 'disabled');
    
    if (enabled) {
      initializeAnalytics();
    }
  } catch (error) {
    console.error('[Analytics] Error setting analytics preference:', error);
  }
};

// Get analytics status
export const getAnalyticsStatus = (): boolean => {
  try {
    const analyticsDisabled = localStorage.getItem('analytics_disabled');
    return analyticsDisabled !== 'true';
  } catch (error) {
    console.error('[Analytics] Error getting analytics status:', error);
    return true; // Default to enabled if we can't check
  }
};

// Analytics helper functions
export const analyticsHelpers = {
  // Track time spent on page
  trackTimeOnPage: (pageName: string) => {
    const startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime;
      trackPerformance('time_on_page', timeOnPage, { page_name: pageName });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  },

  // Track scroll depth
  trackScrollDepth: () => {
    const scrollDepth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollDepth >= 0 && scrollDepth <= 100) {
      trackPerformance('scroll_depth', scrollDepth);
    }
  },

  // Track file type distribution
  trackFileTypeDistribution: (fileTypes: string[]) => {
    const typeCounts: Record<string, number> = {};
    
    fileTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    trackGA4Event('file_type_distribution', typeCounts);
  },
};

export default {
  trackEvent,
  trackPageView,
  trackFileOpen,
  trackFileExport,
  trackShare,
  trackUIInteraction,
  trackError,
  trackPerformance,
  initializeAnalytics,
  setAnalyticsEnabled,
  getAnalyticsStatus,
  ...analyticsHelpers,
};
