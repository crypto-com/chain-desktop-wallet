import { URL } from "url";

function isValidDomain(domain: string) {
  const parts = domain.split('.');
  if (parts.length < 2) {
    return false;
  }

  for (const part of parts) {
    if (part.length === 0) {
      return false;
    }
  }

  return true;
}

export function isValidURL(str: string) {
  const count = str.split(':').length - 1;
  if (count > 1) {
    return false;
  }

  let urlTest: URL;
  try {
    if (count == 0 && isValidDomain(str)) {
      urlTest = new URL('https://' + str);
    } else {
      urlTest = new URL(str);
    }
  } catch (_) {
    return false;
  }

  if (urlTest.protocol === 'http:' || urlTest.protocol === 'https:') {
    return true;
  } else if (urlTest.protocol === 'http' || urlTest.protocol === 'https') {
    return true;
  } else {
    return false;
  }
}