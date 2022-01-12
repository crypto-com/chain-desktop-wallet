import { useCallback, useEffect, useState } from 'react';
import { WebView } from './types';

export interface IWebInfoProviderProps {
  webview: WebView | null;
}

export const useWebInfoProvider = (props: IWebInfoProviderProps) => {
  const { webview } = props;

  const [title, setTitle] = useState('');
  const [faviconURL, setFaviconURL] = useState('');
  const [url, setURL] = useState('');
  const [isDOMReady, setIsDOMReady] = useState(false);

  const setupEvents = useCallback(() => {
    if (!webview) {
      return;
    }

    webview.addEventListener('page-title-updated', () => {
      setTitle(webview.getTitle());
    });

    webview.addEventListener('dom-ready', () => {
      setIsDOMReady(true);
    });

    webview.addEventListener('page-favicon-updated', e => {
      if (e.favicons.length > 0) {
        setFaviconURL(e.favicons[0]);
      }
    });

    webview.addEventListener('load-commit', e => {
      if (!e.url) {
        setURL(e.url);
      } else {
        setURL(webview.getURL());
      }
    });
  }, [webview]);

  useEffect(() => {
    setupEvents();
  }, [setupEvents]);

  return { title, faviconURL, url, isDOMReady };
};
