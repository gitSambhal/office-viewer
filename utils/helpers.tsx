import { FileType } from '../types';
import { FILE_TYPE_SEO } from '../constants';

// Function to detect query type from search query
const getQueryType = (query: string): FileType | null => {
  const lowerQuery = query.toLowerCase().trim();

  // Check for document type keywords
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

// SEO optimization utility
export const updateSEO = (fileType: FileType | null, fileName?: string, viewerType?: string) => {
  // Check if we have a viewer type to optimize for
  if (viewerType) {
    const queryType = getQueryType(viewerType);
    if (queryType) {
      fileType = queryType;
    }
  }
  if (!fileType) {
    // Reset to default SEO when no file is open
    document.title = 'Suhail Viewer - AI-Powered Local Document & Database Viewer';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'High-performance local viewer for PDF, Excel (XLS/XLSX), Word (DOC/DOCX), PowerPoint (PPT/PPTX), Access databases (MDB/ACCDB), SQLite databases (DB/SQLite3), RTF, Markdown, and Images. Secure, offline-first app with Zen Mode and multi-tab support.'
      );
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute(
        'content',
        'document viewer, pdf viewer, excel viewer, word viewer, database viewer, office viewer, file viewer'
      );
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute(
        'content',
        'Suhail Viewer - Professional Document & Database Viewer'
      );
    }
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute(
        'content',
        'High-performance local viewer for PDF, Excel (XLS/XLSX), Word (DOC/DOCX), PowerPoint (PPT/PPTX), Access databases (MDB/ACCDB), SQLite databases (DB/SQLite3), RTF, Markdown, and Images.'
      );
    }
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute(
        'content',
        'Suhail Viewer - Professional Document & Database Viewer'
      );
    }
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute(
        'content',
        'High-performance local viewer for PDF, Excel, Word, PowerPoint, Access, SQLite, RTF, Markdown, and Images.'
      );
    }
    return;
  }

  // Get SEO metadata for the specific file type
  const seoData = FILE_TYPE_SEO[fileType];
  if (!seoData) {
    console.warn(`No SEO data found for file type: ${fileType}`);
    return;
  }

  // Update page title
  const pageTitle = fileName
    ? `${fileName} - ${seoData.title}`
    : seoData.title;
  document.title = pageTitle;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', seoData.description);
  }

  // Update meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', seoData.keywords);
  }

  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', pageTitle);
  }

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', seoData.description);
  }

  // Update Twitter Cards tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', pageTitle);
  }

  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', seoData.description);
  }

  // Log SEO update for debugging
  console.log(`SEO updated for ${fileType}:`, pageTitle, seoData.description);
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getFileIcon = (type: FileType) => {
  switch (type) {
    case 'xlsx':
      return (
        <div className="w-4 h-4 text-emerald-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        </div>
      );
    case 'docx':
      return (
        <div className="w-4 h-4 text-blue-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        </div>
      );
    case 'pdf':
      return (
        <div className="w-4 h-4 text-rose-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
          </svg>
        </div>
      );
    case 'image':
      return (
        <div className="w-4 h-4 text-violet-500">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      );
    case 'rtf':
      return (
        <div className="w-4 h-4 text-amber-500">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM17 19H7v-2h10v2zm0-4H7v-2h10v2z" />
          </svg>
        </div>
      );
    case 'md':
      return (
        <div className="w-4 h-4 text-zinc-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-8l-4 4-4-4 1.4-1.4 2.6 2.6 2.6-2.6L16 12z" />
          </svg>
        </div>
      );
    case 'mdb':
      return (
        <div className="w-4 h-4 text-teal-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 5c0 2.2-4.1 4-9 4S3 7.2 3 5s4.1-4 9-4 9 1.8 9 4zm0 6c0 2.2-4.1 4-9 4S3 13.2 3 11V7c0 2.2 4.1 4 9 4s9-1.8 9-4v4zm0 6c0 2.2-4.1 4-9 4S3 19.2 3 17v-4c0 2.2 4.1 4 9 4s9-1.8 9-4v4z" />
          </svg>
        </div>
      );
    case 'dbf':
      return (
        <div className="w-4 h-4 text-orange-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 5c0 2.2-4.1 4-9 4S3 7.2 3 5s4.1-4 9-4 9 1.8 9 4zm0 6c0 2.2-4.1 4-9 4S3 13.2 3 11V7c0 2.2 4.1 4 9 4s9-1.8 9-4v4zm0 6c0 2.2-4.1 4-9 4S3 19.2 3 17v-4c0 2.2 4.1 4 9 4s9-1.8 9-4v4z" />
          </svg>
        </div>
      );
    case 'pptx':
      return (
        <div className="w-4 h-4 text-orange-500">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM17 19H7v-2h10v2zm0-4H7v-2h10v2z" />
          </svg>
        </div>
      );
    case 'sqlite':
      return (
        <div className="w-4 h-4 text-sky-600">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 5c0 2.2-4.1 4-9 4S3 7.2 3 5s4.1-4 9-4 9 1.8 9 4zm0 6c0 2.2-4.1 4-9 4S3 13.2 3 11V7c0 2.2 4.1 4 9 4s9-1.8 9-4v4zm0 6c0 2.2-4.1 4-9 4S3 19.2 3 17v-4c0 2.2 4.1 4 9 4s9-1.8 9-4v4z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-4 h-4 text-zinc-400">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
          </svg>
        </div>
      );
  }
};

export const getColorClass = (color: string | undefined) => {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'blue':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'rose':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    case 'amber':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'violet':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
    case 'orange':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'sky':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    case 'teal':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
};

export const getMetaIcon = (icon: string) => {
  switch (icon) {
    case 'filter':
      return (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      );
    case 'sort':
      return (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    case 'search':
      return (
        <svg
          className="w-3 h-3"
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
      );
    case 'table':
      return (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      );
    case 'columns':
      return (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      );
    default:
      return null;
  }
};
