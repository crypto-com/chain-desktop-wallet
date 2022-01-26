import { WebviewTag } from 'electron';

export type WebView = WebviewTag & HTMLWebViewElement;

export type ErrorHandler = (reason: string) => void;
