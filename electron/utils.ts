import { URL } from "url";

interface ValidURLCheckResult {
  isValid: boolean;
  finalURL: string;
}

export function isValidURL(str: string): ValidURLCheckResult {
  try {
    if (!str.startsWith('https://') && !str.startsWith('http://')) {
      str = 'https://' + str

    }
    const parsedUrl = new URL(str)
    const regex = /^([a-zA-Z0-9-_.:]+)+$/
    return {
      isValid: regex.test(parsedUrl.host),
      finalURL: str
    }
  } catch (e) {
    return { isValid: false, finalURL: str }
  }
}