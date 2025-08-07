import { useState, useEffect, useCallback } from "react";

interface Size {
  width: number;
  height: number;
}

export function useElementSize<
  T extends HTMLElement = HTMLDivElement,
>(defaultSize: {
  defaultWidth?: number;
  defaultHeight?: number;
}): [(node: T | null) => void, Size] {
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({
    width: defaultSize.defaultWidth ?? 0,
    height: defaultSize.defaultHeight ?? 0,
  });

  // Update size function - use regular state updates
  const updateSize = useCallback(() => {
    if (ref) {
      const newSize = {
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      };
      // Regular state update without flushSync to avoid render cycle conflicts
      if (size.width !== newSize.width || size.height !== newSize.height) {
        setSize(newSize);
      }
    }
  }, [ref, size.width, size.height]);

  useEffect(() => {
    if (!ref) return;

    updateSize(); // Update size initially

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(ref);

    return () => resizeObserver.disconnect();
  }, [ref, updateSize]);

  return [setRef, size];
}
