import { useCallback, useEffect, useState } from 'react';
import { WebView } from './types';

export interface IWebviewStatusInfoProps {
  webview: WebView | null;
}
export type WebviewState = 'idle' | 'loading' | 'loaded' | 'error';

export interface IWebviewNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  canRefresh: boolean;
}

export const useWebviewStatusInfo = (props: IWebviewStatusInfoProps) => {
  const { webview } = props;

  const [state, setState] = useState<WebviewState>('idle');
  const [navigationState, setNavigationState] = useState<IWebviewNavigationState>({
    canGoBack: false,
    canGoForward: false,
    canRefresh: true,
  });

  const setupEvents = useCallback(() => {
    if (!webview) {
      return;
    }

    webview.addEventListener('did-start-loading', () => {
      setState('loading');
      setNavigationState({
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        canRefresh: true,
      });
    });

    webview.addEventListener('did-stop-loading', () => {
      setState('loaded');
      setNavigationState({
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        canRefresh: true,
      });
    });

    webview.addEventListener('did-fail-load', () => {
      setState('error');
      setNavigationState({
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        canRefresh: true,
      });
    });
  }, [webview]);

  useEffect(() => {
    setupEvents();
  }, [setupEvents]);

  return { state, navigationState };
};
