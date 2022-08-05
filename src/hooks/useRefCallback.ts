import { useRef } from 'react';

export function useRefCallback<T>(fn: T) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
}
