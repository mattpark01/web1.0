"use client";

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  ElementType,
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import { MotionProps, motion } from "framer-motion";
import { useElementSize } from "./utils/useElementSize";
import { Slot } from "@radix-ui/react-slot";
import { getSvgPath } from "./utils";
import { cn } from "@/lib/utils";

interface SuperellipseProps<E extends ElementType = "div"> {
  key?: string;
  cornerSmoothing?: number;
  cornerRadius?: number;
  topLeftCornerRadius?: number;
  topRightCornerRadius?: number;
  bottomLeftCornerRadius?: number;
  bottomRightCornerRadius?: number;
  topCornerRadius?: number;
  leftCornerRadius?: number;
  rightCornerRadius?: number;
  bottomCornerRadius?: number;
  asChild?: boolean;
  children?: ReactNode;
  width?: number;
  height?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Superellipse = forwardRef(
  <E extends ElementType = "div">(
    {
      children,
      cornerRadius = 8,
      cornerSmoothing = 1,
      topLeftCornerRadius,
      topRightCornerRadius,
      bottomLeftCornerRadius,
      bottomRightCornerRadius,
      topCornerRadius,
      leftCornerRadius,
      rightCornerRadius,
      bottomCornerRadius,
      asChild,
      style,
      width: w,
      height: h,
      defaultWidth,
      defaultHeight,
      className,
      onClick,
      onMouseEnter,
      onMouseDown,
      ...props
    }: SuperellipseProps<E>,
    ref: Ref<any>,
  ) => {
    const Comp = asChild ? Slot : motion.div;

    // Check if explicit dimensions are provided (width is sufficient for our use case)
    const hasExplicitDimensions = w !== undefined;

    const [initialized, setInitialized] = useState(hasExplicitDimensions);

    // Only use useElementSize when explicit dimensions are NOT provided
    const [elementRef, { width, height }] = useElementSize<HTMLDivElement>({
      defaultWidth,
      defaultHeight,
    });

    useEffect(() => {
      if (!hasExplicitDimensions && width && height) {
        setInitialized(true);
      }
    }, [width, height, hasExplicitDimensions]);

    // Ensure initialized stays true when explicit dimensions change
    useEffect(() => {
      if (hasExplicitDimensions) {
        setInitialized(true);
      }
    }, [hasExplicitDimensions, w, h]);

    const actualRef = hasExplicitDimensions ? ref : (ref || elementRef);

    // Extract numeric values from MotionValues if needed
    const getNumericValue = (value: any): number | undefined => {
      if (value && typeof value === 'object' && 'get' in value) {
        // It's a MotionValue, get the current numeric value
        return value.get();
      }
      return value;
    };
    
    const actualWidth = getNumericValue(w) ?? width ?? defaultWidth;
    const actualHeight = getNumericValue(h) ?? height ?? defaultHeight;
    

    // Simple path calculation - let the container handle the animation
    const path = useMemo(() => {
      // Need valid dimensions to generate path
      if (!initialized || !actualWidth || !actualHeight || actualWidth <= 0 || actualHeight <= 0) return "";
      
      const resolvedCornerRadius = cornerRadius ?? 0;
      
      return getSvgPath({
        width: actualWidth,
        height: actualHeight,
        topLeftCornerRadius:
          topLeftCornerRadius ??
          topCornerRadius ??
          leftCornerRadius ??
          resolvedCornerRadius,
        topRightCornerRadius:
          topRightCornerRadius ??
          topCornerRadius ??
          rightCornerRadius ??
          resolvedCornerRadius,
        bottomLeftCornerRadius:
          bottomLeftCornerRadius ??
          bottomCornerRadius ??
          leftCornerRadius ??
          resolvedCornerRadius,
        bottomRightCornerRadius:
          bottomRightCornerRadius ??
          bottomCornerRadius ??
          rightCornerRadius ??
          resolvedCornerRadius,
        cornerSmoothing,
      });
    }, [
      initialized,
      actualWidth,
      actualHeight,
      topLeftCornerRadius,
      topRightCornerRadius,
      bottomLeftCornerRadius,
      bottomRightCornerRadius,
      topCornerRadius,
      leftCornerRadius,
      rightCornerRadius,
      bottomCornerRadius,
      cornerRadius,
      cornerSmoothing,
    ]);

    const combinedStyle = {
      ...style,
      // Always apply borderRadius for fallback
      borderRadius: cornerRadius,
      // Apply clip path when available
      clipPath: path ? `path('${path}')` : undefined,
      WebkitClipPath: path ? `path('${path}')` : undefined,
      // No transitions - corner radius changes should be instant
      transition: 'none',
      WebkitTransition: 'none',
      // Always ensure content doesn't overflow
      overflow: 'hidden',
      // Add a tiny bit of padding to prevent edge cutoff issues
      boxSizing: 'border-box' as const,
      // Force layout context
      position: 'relative' as const,
      // Ensure the element participates in grid layout properly
      minWidth: 0,
      minHeight: 0,
    };
    

    return (
      <Comp
        {...props}
        key={props.key}
        ref={actualRef}
        style={combinedStyle}
        onMouseEnter={onMouseEnter}
        onMouseDown={onMouseDown}
        data-squircle={cornerRadius}
        className={cn(className)}
        onClick={onClick}
      >
        {children}
      </Comp>
    );
  },
);

Superellipse.displayName = "Superellipse";

export { Superellipse, type SuperellipseProps };