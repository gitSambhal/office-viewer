import { useCallback, useState } from 'react';
import { FileType } from '../types';
import { useFileHandler } from './useFileHandler';
import { useAppContext } from '../context/AppContext';

export const useUrlHandler = () => {
  const { state, dispatch } = useAppContext();
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const { handleFiles, setErrorMessage } = useFileHandler();

  const showUrlModal = state.showUrlModal;
  const setShowUrlModal = (value: boolean) =>
    dispatch({ type: 'SET_SHOW_URL_MODAL', payload: value });

  const handleUrlOpen = useCallback(async () => {
    if (!urlInput.trim()) return;

    setIsLoadingUrl(true);
    try {
      const response = await fetch(urlInput.trim());
      if (!response.ok) throw new Error('Failed to fetch file');

      const contentType =
        response.headers.get('content-type') || 'application/octet-stream';
      const blob = await response.blob();

      // Determine file extension and name from URL or content-type
      const urlPath = urlInput.split('/').pop() || 'downloaded-file';
      const extension = urlPath.split('.').pop()?.toLowerCase() || '';

      // Map extension to file type
      let fileType: FileType = 'unknown';
      let extensionForName = '';

      if (contentType.includes('pdf') || extension === 'pdf') {
        fileType = 'pdf';
        extensionForName = '.pdf';
      } else if (
        contentType.includes('spreadsheet') ||
        contentType.includes('excel') ||
        ['xlsx', 'xls'].includes(extension)
      ) {
        fileType = 'xlsx';
        extensionForName = '.xlsx';
      } else if (
        contentType.includes('word') ||
        contentType.includes('document') ||
        ['docx', 'doc'].includes(extension)
      ) {
        fileType = 'docx';
        extensionForName = '.docx';
      } else if (contentType.includes('rtf') || extension === 'rtf') {
        fileType = 'rtf';
        extensionForName = '.rtf';
      } else if (
        contentType.includes('text') ||
        ['txt', 'md', 'markdown'].includes(extension)
      ) {
        fileType =
          extension === 'md' || extension === 'markdown' ? 'md' : 'txt';
        extensionForName =
          extension === 'md'
            ? '.md'
            : extension === 'markdown'
              ? '.md'
              : '.txt';
      } else if (
        contentType.includes('image') ||
        ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)
      ) {
        fileType = 'image';
        const extMatch = extension.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        extensionForName = extMatch ? extMatch[0] : '.png';
      } else if (['sqlite', 'db'].includes(extension)) {
        fileType = 'sqlite';
        extensionForName = '.sqlite';
      } else if (['mdb', 'accdb'].includes(extension)) {
        fileType = 'mdb';
        extensionForName = '.' + extension;
      } else if (extension === 'dbf') {
        fileType = 'dbf';
        extensionForName = '.dbf';
      } else {
        extensionForName = '.' + (extension || 'bin');
      }

      const fileName = urlPath.includes('.')
        ? urlPath
        : `file${extensionForName}`;
      const file = new File([blob], fileName, {
        type: blob.type || contentType,
      });

      await handleFiles([file]);
      setShowUrlModal(false);
      setUrlInput('');
    } catch (error) {
      console.error('Error opening URL:', error);
      setErrorMessage(
        'Failed to open file from URL. Please check the URL and try again.'
      );
    } finally {
      setIsLoadingUrl(false);
    }
  }, [urlInput, handleFiles, setErrorMessage]);

  return {
    showUrlModal,
    setShowUrlModal,
    urlInput,
    setUrlInput,
    isLoadingUrl,
    handleUrlOpen,
  };
};
