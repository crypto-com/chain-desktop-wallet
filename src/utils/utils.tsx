import { useState, useEffect } from 'react';

export function isElectron() {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object') {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}

export function middleEllipsis(str: string, len: number) {
  return `${str.substr(0, len)}...${str.substr(str.length - len, str.length)}`;
}

export function ellipsis(str: string, len: number) {
  return str.length <= len ? `${str}` : `${str.substr(0, len)}...`;
}

export function capitalizeFirstLetter(value: string) {
  if (!value || value.length < 2) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function isJson(val: string) {
  try {
    JSON.parse(val);
  } catch (e) {
    return false;
  }
  return true;
}

export function splitToChunks(arr: any[], len: number) {
  const arrays: any[] = [];
  // const result =
  for (let i = 0, j = arr.length; i < j; i += len) {
    arrays.push(arr.slice(i, i + len));
  }
  return arrays;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function convertIpfsToHttp(ipfsUrl: string) {
  if (ipfsUrl.indexOf('ipfs://') === 0) {
    return ipfsUrl.replace(/ipfs:\/\//i, 'https://ipfs.io/ipfs/');
  }
  throw new Error('Invalid IPFS URL');
}

export const useWindowSize = () => {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  // Correct window size
  const adjusted = {
    width: 103,
    height: 64,
  };
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth - adjusted.width,
        height: window.innerHeight - adjusted.height,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
};
