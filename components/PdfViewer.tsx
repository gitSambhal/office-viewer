import React, { useEffect, useState, useCallback } from 'react';

interface Props {
  data: ArrayBuffer;
}

export const PdfViewer: React.FC<Props> = ({ data }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createBlobUrl = useCallback(() => {
    try {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setError(null);
    } catch (err) {
      setError('Failed to create PDF blob URL');
    }
  }, [data]);

  useEffect(() => {
    createBlobUrl();
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [createBlobUrl]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Error Loading PDF
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {blobUrl ? (
        <iframe
          src={blobUrl}
          className="w-full h-full border-0"
          title="PDF Document"
          style={{ minHeight: '100vh' }}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
