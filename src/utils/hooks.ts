import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for debouncing a callback function
 * Delays execution until after wait milliseconds have elapsed since the last call
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns Debounced version of the callback
 */
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
};

/**
 * Hook for throttling a callback function
 * Ensures the function is called at most once per wait milliseconds
 * 
 * @param callback - The function to throttle
 * @param limit - The time limit in milliseconds
 * @returns Throttled version of the callback
 */
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  limit: number
) => {
  const inThrottle = useRef(false);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;

      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        lastArgs.current = null;

        setTimeout(() => {
          inThrottle.current = false;
          // Execute with last args if there were any calls during throttle
          if (lastArgs.current) {
            callback(...lastArgs.current);
            lastArgs.current = null;
          }
        }, limit);
      }
    },
    [callback, limit]
  ) as T;
};
