import { useCallback, useEffect, useState } from 'react';
import { WebView } from './types';

export interface IWebInfoProviderProps {
  webview: WebView | null;
}

export const useWebInfoProvider = (props: IWebInfoProviderProps) => {
  const { webview } = props;

  const [title, setTitle] = useState('');
  const [faviconURL, setFaviconURL] = useState('');

  const setupEvents = useCallback(() => {
    if (!webview) {
      return;
    }

    webview.addEventListener('page-title-updated', () => {
      setTitle(webview.getTitle());
    });

    webview.addEventListener('page-favicon-updated', e => {
      if (e.favicons.length > 0) {
        setFaviconURL(e.favicons[0]);
      }
    });
  }, [webview]);

  useEffect(() => {
    setupEvents();
  }, [setupEvents]);

  return { title, faviconURL };
};
