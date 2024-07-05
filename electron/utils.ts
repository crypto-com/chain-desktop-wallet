import { URL } from 'url';

interface ValidURLCheckResult {
  isValid: boolean;
  finalURL: string;
}

export function isValidURL(str: string): ValidURLCheckResult {
  try {
    const parsedUrl = new URL(str);
    const regex = /^([a-zA-Z0-9-_.:]+)+$/;

    if(parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:' 
    && parsedUrl.protocol !== 'ws:' && parsedUrl.protocol !== 'wss:') {
      return { 
        isValid: false, 
        finalURL: str 
      };
    }

    return {
      isValid: regex.test(parsedUrl.host),
      finalURL: str
    };
  } catch (e) {
    return { isValid: false, finalURL: str };
  }
}