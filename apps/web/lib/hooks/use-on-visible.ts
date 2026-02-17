"use client";

import * as React from "react";

type UseOnVisibleOptions = {
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
};

export function useOnVisible<TElement extends Element>(
  onVisible: () => void,
  {
    enabled = true,
    root = null,
    rootMargin = "120px",
    threshold = 0,
  }: UseOnVisibleOptions = {},
) {
  const callbackRef = React.useRef(onVisible);

  React.useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  return React.useCallback(
    (node: TElement | null) => {
      if (!node || !enabled) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) {
            return;
          }

          callbackRef.current();
        },
        {
          root,
          rootMargin,
          threshold,
        },
      );

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    },
    [enabled, root, rootMargin, threshold],
  );
}
