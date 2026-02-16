// Supported file types and extensions
export const FILE_EXTENSIONS = {
  XLSX: '.xlsx',
  XLS: '.xls',
  CSV: '.csv',
  DOCX: '.docx',
  DOC: '.doc',
  PDF: '.pdf',
  TXT: '.txt',
  MD: '.md',
  PNG: '.png',
  JPG: '.jpg',
  JPEG: '.jpeg',
  GIF: '.gif',
  WEBP: '.webp',
  RTF: '.rtf',
  MDB: '.mdb',
  ACCDB: '.accdb',
  SQLITE: '.sqlite',
  DB: '.db',
  DB3: '.db3',
  DBF: '.dbf',
  PPTX: '.pptx',
} as const;

// Supported file types array for quick access
export const SUPPORTED_EXTENSIONS = Object.values(FILE_EXTENSIONS);

// Accept string for file inputs
export const FILE_ACCEPT = SUPPORTED_EXTENSIONS.join(',');

// File type to extension map
export const FILE_TYPE_EXTENSIONS = {
  xlsx: FILE_EXTENSIONS.XLSX,
  csv: FILE_EXTENSIONS.CSV,
  docx: FILE_EXTENSIONS.DOCX,
  pdf: FILE_EXTENSIONS.PDF,
  txt: FILE_EXTENSIONS.TXT,
  md: FILE_EXTENSIONS.MD,
  image: [
    FILE_EXTENSIONS.PNG,
    FILE_EXTENSIONS.JPG,
    FILE_EXTENSIONS.JPEG,
    FILE_EXTENSIONS.GIF,
    FILE_EXTENSIONS.WEBP,
  ],
  rtf: FILE_EXTENSIONS.RTF,
  mdb: [FILE_EXTENSIONS.MDB, FILE_EXTENSIONS.ACCDB],
  sqlite: [FILE_EXTENSIONS.SQLITE, FILE_EXTENSIONS.DB, FILE_EXTENSIONS.DB3],
  dbf: FILE_EXTENSIONS.DBF,
  pptx: FILE_EXTENSIONS.PPTX,
} as const;

// Export formats
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
  JSON: 'json',
} as const;

// Key bindings
export const KEY_BINDINGS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  CTRL_F: 'f',
} as const;

// Database constants
export const INDEXED_DB = {
  NAME: 'suhail-viewer-shared-files',
  VERSION: 1,
  STORE: 'files',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  RECENT_FILES: 'suhail_recent_files',
  THEME: 'suhail_theme',
  TYPE_AWARE: 'suhail_type_aware',
} as const;

// Preview data
export const PREVIEW_DATA = {
  SAMPLE_PDF_URL: 'https://pdfobject.com/pdf/sample.pdf',
  SAMPLE_PDF_NAME: 'sample-document.pdf',
} as const;

// Default slicer settings
export const DEFAULT_SLICER_SETTINGS = {
  mode: 'all' as const,
  value: 100,
  endValue: 200,
};

// Constants for UI
export const UI_CONSTANTS = {
  MAX_RECENT_FILES: 5,
  ROW_HEIGHT: 44,
  OVER_SCAN: 10,
} as const;

// Supported features for dashboard
export const FEATURES = [
  {
    title: 'AI Local Analysis & Insights',
    desc: 'Get instant summaries and ask factual questions about your documents using private, local AI that never leaves your device.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Offline-First & Local Processing',
    desc: 'Your files are processed entirely on your device, ensuring privacy and security with absolutely no server uploads.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'Ad-Free Experience',
    desc: 'Enjoy a clean, uninterrupted viewing experience without any advertisements.',
    icon: 'M6 18L18 6M6 6l12 12',
  },
  {
    title: 'Multi-Format Viewing',
    desc: 'Seamlessly open and view a wide range of documents including PDFs, Spreadsheets, Word files, various Databases (MDB, SQLite, DBF), Images, and more.',
    icon: 'M4 6h16M4 12h16m-7 6h7',
  },
  {
    title: 'Tab Management',
    desc: 'Efficiently manage multiple open documents in a tabbed interface for easy comparison and multitasking.',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    title: 'Zen Focus Mode',
    desc: 'Eliminate distractions with a dedicated focus mode, including fullscreen viewing and quick toggles.',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Intuitive File Handling',
    desc: 'Easily load files via drag & drop (even entire folders), a traditional file picker, or by providing a URL.',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  },
  {
    title: 'PWA File Sharing',
    desc: 'Directly receive and open files shared from other applications on your device when installed as a Progressive Web App.',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Type-Aware Visualization',
    desc: 'Automatic data type detection with color-coded visual highlighting for better data comprehension.',
    icon: 'M7 7h10M10 7v10m4-10v10M7 17h10',
  },
  {
    title: 'Advanced Search & Filter',
    desc: 'Powerful search capabilities across all open tabs and databases with real-time filtering.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  {
    title: 'Sorting & Organization',
    desc: 'Multi-column sorting and data organization for tables and spreadsheets.',
    icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
  },
  {
    title: 'Real-time Metadata',
    desc: 'Detailed file information and metadata displayed in a customizable sidebar.',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
  {
    title: 'Responsive Design',
    desc: 'Optimized viewing experience across all device sizes from mobile to desktop.',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    title: 'Dark & Light Themes',
    desc: 'Toggle between dark and light themes for comfortable viewing in any environment.',
    icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  },
  {
    title: 'Cross-Browser Support',
    desc: 'Works seamlessly on all modern browsers including Chrome, Firefox, Safari, and Edge.',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
] as const;

// Preview data
export const PREVIEW_TABS = [
  { name: 'report.pdf', type: 'pdf' as const, index: 0 },
  { name: 'budget.xlsx', type: 'xlsx' as const, index: 1 },
  { name: 'notes.md', type: 'md' as const, index: 2 },
  { name: 'database.sqlite', type: 'sqlite' as const, index: 3 },
] as const;

// SEO metadata for each file type
export const FILE_TYPE_SEO = {
  xlsx: {
    title: 'Excel & AI Spreadsheet Analysis - XLSX/XLS Viewer',
    description:
      'Free online Excel viewer with built-in AI analysis. Chat with your spreadsheets, get summaries, and find insights instantly. 100% private local processing.',
    type: 'ai spreadsheet viewer',
    keywords:
      'excel ai, talk to excel, xlsx viewer, spreadsheet analysis, local ai',
  },
  csv: {
    title: 'CSV Viewer & AI Data Analysis',
    description:
      'View and analyze CSV files with AI. Ask questions about your data and get instant answers without uploading files to a server.',
    type: 'ai csv viewer',
    keywords: 'csv ai, chat with csv, csv viewer, data analysis, local llm',
  },
  docx: {
    title: 'Word Reader & AI Summarizer - DOCX Viewer',
    description:
      'Read Word documents with instant AI summaries. Chat with your DOCX files to extract key information privately in your browser.',
    type: 'ai document reader',
    keywords: 'word ai, docx summary, chat with document, private ai reader',
  },
  pdf: {
    title: 'PDF Viewer with AI Chat - Private Local Analysis',
    description:
      'Chat with PDF documents using local AI. Summarize reports, ask questions, and extract data from PDFs without server uploads.',
    type: 'ai pdf viewer',
    keywords: 'chat with pdf, pdf ai, pdf summary, local pdf analysis',
  },
  txt: {
    title: 'Text File Viewer & AI Analysis',
    description:
      'View and analyze text files with local AI. Summarize notes, logs, and code snippets instantly.',
    type: 'ai text viewer',
    keywords: 'text ai, txt analysis, log viewer ai, local llm',
  },
  md: {
    title: 'Markdown Viewer & AI Helper',
    description:
      'Render Markdown files and use AI to summarize content or format structure. Perfect for documentation and notes.',
    type: 'ai markdown viewer',
    keywords: 'markdown ai, md viewer, documentation helper, local ai',
  },
  image: {
    title: 'Image Viewer - Photo and Image File Viewer',
    description:
      'Free online image viewer. View JPG, PNG, GIF, and WEBP images with our fast and secure image viewer. Supports zoom and rotation.',
    type: 'image viewer',
    keywords: 'image viewer, photo viewer, jpg viewer, png viewer',
  },
  rtf: {
    title: 'RTF File Viewer - Rich Text Format Reader',
    description:
      'Free online RTF file viewer. View Rich Text Format documents with formatting. Supports text styles, images, and tables.',
    type: 'rtf viewer',
    keywords: 'rtf viewer, rich text format, rtf reader, document viewer',
  },
  mdb: {
    title: 'Access Database Viewer - MDB/ACCDB File Reader',
    description:
      'Free online Access database viewer. View MDB and ACCDB files without Microsoft Access. Supports tables, queries, and data export.',
    type: 'database viewer',
    keywords: 'access viewer, mdb viewer, accdb viewer, database viewer',
  },
  sqlite: {
    title: 'SQLite Database Viewer - DB/SQLite3 File Reader',
    description:
      'Free online SQLite database viewer. View DB, SQLite3, and SQLITE files. Supports tables, queries, and data export.',
    type: 'database viewer',
    keywords: 'sqlite viewer, db viewer, sqlite3 viewer, database viewer',
  },
  dbf: {
    title: 'DBF File Viewer - dBase Database Viewer',
    description:
      'Free online DBF file viewer. View dBase database files with our fast and secure DBF viewer. Supports tables, fields, and data export.',
    type: 'dbf viewer',
    keywords: 'dbf viewer, dbase viewer, database viewer, table viewer',
  },
  pptx: {
    title: 'PowerPoint AI Viewer - Presentation Summaries',
    description:
      'View PowerPoint slides with instant AI summaries. Extract key points from presentations privately without Microsoft Office.',
    type: 'ai presentation viewer',
    keywords:
      'pptx ai, powerpoint summary, chat with slides, presentation analysis',
  },
} as const;
