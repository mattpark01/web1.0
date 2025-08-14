import { clsx, type ClassValue } from "clsx"

export interface GridBorderOptions {
  row: number
  col: number
  totalRows: number
  totalCols: number
  borderStyle?: 'all' | 'inner' | 'outer' | 'none'
  responsive?: {
    sm?: { cols: number }
    md?: { cols: number }
    lg?: { cols: number }
    xl?: { cols: number }
  }
  customRules?: {
    skipBorder?: (row: number, col: number) => boolean
    extraClasses?: (row: number, col: number) => string
  }
  borderWidth?: 'thin' | 'normal' | 'thick'
  borderColor?: string
}

/**
 * Generates border classes for grid cells to prevent overlapping borders
 * 
 * Rules:
 * - Top border: Only on first row
 * - Left border: Only on first column  
 * - Right border: Always (except last column in 'inner' style)
 * - Bottom border: Always (except last row in 'inner' style)
 * 
 * This ensures single-width borders throughout the grid
 */
export function getGridBorderClasses(options: GridBorderOptions): string {
  const {
    row,
    col,
    totalRows,
    totalCols,
    borderStyle = 'all',
    responsive,
    customRules,
    borderWidth = 'normal',
    borderColor = 'border'
  } = options

  // Check if border should be skipped
  if (customRules?.skipBorder?.(row, col)) {
    return customRules?.extraClasses?.(row, col) || ''
  }

  const classes: string[] = []
  
  // Determine border width class
  const widthClass = borderWidth === 'thin' ? '' : borderWidth === 'thick' ? '2' : ''
  const borderBase = borderColor === 'border' ? 'border' : `border-${borderColor}`
  
  // Helper to create border class
  const border = (side: string) => {
    if (side === '') return borderBase + (widthClass ? `-${widthClass}` : '')
    return `${borderBase}-${side}` + (widthClass ? `-${widthClass}` : '')
  }

  const isFirstRow = row === 0
  const isLastRow = row === totalRows - 1
  const isFirstCol = col === 0
  const isLastCol = col === totalCols - 1

  switch (borderStyle) {
    case 'all':
      // Top border only on first row
      if (isFirstRow) {
        classes.push(border('t'))
      }
      
      // Left border only on first column
      if (isFirstCol) {
        classes.push(border('l'))
      }
      
      // Right border always
      classes.push(border('r'))
      
      // Bottom border always
      classes.push(border('b'))
      break

    case 'inner':
      // No outer borders, only inner dividers
      // Right border except on last column
      if (!isLastCol) {
        classes.push(border('r'))
      }
      
      // Bottom border except on last row
      if (!isLastRow) {
        classes.push(border('b'))
      }
      break

    case 'outer':
      // Only outer borders
      if (isFirstRow) classes.push(border('t'))
      if (isLastRow) classes.push(border('b'))
      if (isFirstCol) classes.push(border('l'))
      if (isLastCol) classes.push(border('r'))
      break

    case 'none':
      // No borders
      break
  }

  // Handle responsive layouts
  if (responsive) {
    // For responsive grids, we need to adjust borders based on different column counts
    Object.entries(responsive).forEach(([breakpoint, config]) => {
      if (!config) return
      
      const responsiveCols = config.cols
      const isResponsiveLastCol = (col + 1) % responsiveCols === 0
      const isResponsiveFirstCol = col % responsiveCols === 0
      
      // Adjust right border for responsive layout
      if (borderStyle === 'all') {
        if (isResponsiveLastCol && col !== totalCols - 1) {
          // Remove right border on responsive last column (except actual last column)
          classes.push(`${breakpoint}:border-r-0`)
        } else if (!isResponsiveLastCol && col === totalCols - 1) {
          // Add right border back on actual last column if not responsive last
          classes.push(`${breakpoint}:${border('r')}`)
        }
      }
      
      // Add left border for responsive first columns (except actual first)
      if (borderStyle === 'all' && isResponsiveFirstCol && col !== 0) {
        classes.push(`${breakpoint}:${border('l')}`)
      }
    })
  }

  // Add custom classes if provided
  if (customRules?.extraClasses) {
    classes.push(customRules.extraClasses(row, col))
  }

  return clsx(...classes)
}

/**
 * Helper function to get border classes for a simple horizontal/vertical divider
 */
export function getDividerClasses(
  orientation: 'horizontal' | 'vertical',
  borderWidth?: 'thin' | 'normal' | 'thick',
  borderColor?: string
): string {
  const widthClass = borderWidth === 'thin' ? '' : borderWidth === 'thick' ? '2' : ''
  const colorClass = borderColor || 'border'
  
  if (orientation === 'horizontal') {
    return clsx(
      'border-b',
      widthClass && `border-b-${widthClass}`,
      colorClass !== 'border' && `border-${colorClass}`
    )
  } else {
    return clsx(
      'border-r',
      widthClass && `border-r-${widthClass}`,
      colorClass !== 'border' && `border-${colorClass}`
    )
  }
}

/**
 * Helper to generate classes for an entire grid at once
 */
export function generateGridBorderMap(
  totalRows: number,
  totalCols: number,
  options?: Omit<GridBorderOptions, 'row' | 'col' | 'totalRows' | 'totalCols'>
): string[][] {
  const borderMap: string[][] = []
  
  for (let row = 0; row < totalRows; row++) {
    borderMap[row] = []
    for (let col = 0; col < totalCols; col++) {
      borderMap[row][col] = getGridBorderClasses({
        row,
        col,
        totalRows,
        totalCols,
        ...options
      })
    }
  }
  
  return borderMap
}

/**
 * Utility to handle grid gaps without overlapping borders
 * Uses negative margins to create visual gaps
 */
export function getGridGapClasses(gap: number, unit: 'px' | 'rem' = 'px'): {
  container: string
  cell: string
} {
  const gapValue = `${gap}${unit}`
  
  return {
    container: clsx(
      'border-collapse',
      `gap-0` // Ensure no CSS gap
    ),
    cell: clsx(
      // Use padding for internal spacing instead of margins
      `p-${gap}` // This would need to be adjusted based on your spacing scale
    )
  }
}