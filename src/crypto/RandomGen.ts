import { lib } from 'crypto-js';

export function getRandomId(): string {
  return lib.WordArray.random(8).toString();
}
