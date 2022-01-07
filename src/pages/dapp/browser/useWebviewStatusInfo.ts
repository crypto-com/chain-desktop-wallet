import { useCallback, useEffect, useState } from 'react';
import { WebView } from './types';

export interface IWebviewStatusInfoProps {
  webview: WebView | null;
}
export type WebviewState = 'idle' | 'loading' | 'loaded' | 'error';

export const useWebviewStatusInfo = (props: IWebviewStatusInfoProps) => {
  const { webview } = props;

  const [state, setState] = useState<WebviewState>('idle');

  const setupEvents = useCallback(() => {
    if (!webview) {
      return;
    }

    webview.addEventListener('did-start-loading', () => {
      setState('loading');
    });

    webview.addEventListener('did-finish-load', () => {
      setState('loaded');
    });

    webview.addEventListener('did-fail-load', () => {
      setState('error');
    });
  }, [webview]);

  useEffect(() => {
    setupEvents();
  }, [setupEvents]);

  return { state };
};
