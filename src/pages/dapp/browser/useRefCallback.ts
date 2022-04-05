import { useRef } from 'react';

export function useRefCallback(fn: Function) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
}
