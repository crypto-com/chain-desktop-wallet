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

export function trimString(name: String, maxLength = 18) {
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
}

export function middleEllipsis(str: string, len: number) {
  return `${str.substr(0, len)}...${str.substr(str.length - len, str.length)}`;
}

export function ellipsis(str: string, len: number) {
  return str.length <= len ? `${str}` : `${str.substr(0, len)}...`;
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
