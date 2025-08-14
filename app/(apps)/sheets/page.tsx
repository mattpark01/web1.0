"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { 
  Table, 
  Download, 
  Upload, 
  Copy, 
  Scissors, 
  ClipboardPaste,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  ChevronDown,
  Palette,
  Type,
  Calculator,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3x3,
  Save,
  FileSpreadsheet,
  Printer,
  Share2,
  FolderOpen,
  FileText,
  X
} from "lucide-react"
import { CalculationEngine } from "@/lib/spreadsheet/calc-engine"
import { ExcelFunctions } from "@/lib/spreadsheet/excel-functions"

interface Cell {
  value: string
  formula?: string
  calculatedValue?: any
  style?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    align?: 'left' | 'center' | 'right'
    backgroundColor?: string
    color?: string
    numberFormat?: string
  }
}

interface SpreadsheetData {
  [key: string]: Cell
}

interface SavedSheet {
  id: string
  name: string
  updatedAt: string
}

export default function SheetsPage() {
  const [data, setData] = useState<SpreadsheetData>({})
  const [selectedCell, setSelectedCell] = useState<string | null>("A1")
  const [selectedRange, setSelectedRange] = useState<Set<string>>(new Set(["A1"]))
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [formulaBarValue, setFormulaBarValue] = useState("")
  const [editingFormulaBar, setEditingFormulaBar] = useState(false)
  const [formulaRefCell, setFormulaRefCell] = useState<string | null>(null)
  const [copiedCells, setCopiedCells] = useState<{ cells: Set<string>, data: SpreadsheetData } | null>(null)
  const [history, setHistory] = useState<SpreadsheetData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  
  // Sheet management
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null)
  const [sheetName, setSheetName] = useState("Untitled Spreadsheet")
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  
  // Function autocomplete
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([])
  const [selectedAutocomplete, setSelectedAutocomplete] = useState(0)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  
  const gridRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({})
  const formulaInputRef = useRef<HTMLInputElement>(null)
  const cellEditValueRef = useRef<string>("")
  const formulaRefCellRef = useRef<string | null>(null)
  const lastFormulaPositionRef = useRef<number>(0)

  const rows = 100
  const cols = 26 // A-Z columns

  // Initialize calculation engine
  const calcEngine = useMemo(() => new CalculationEngine(), [])
  
  // Available Excel functions for autocomplete
  const excelFunctions = useMemo(() => {
    const funcs = new ExcelFunctions()
    return Object.getOwnPropertyNames(Object.getPrototypeOf(funcs))
      .filter(name => name !== 'constructor' && !name.startsWith('_'))
      .sort()
  }, [])

  const getColumnLabel = (index: number) => {
    return String.fromCharCode(65 + index)
  }

  const getCellKey = (row: number, col: number) => {
    return `${getColumnLabel(col)}${row + 1}`
  }

  const getCellCoordinates = (cellKey: string) => {
    const match = cellKey.match(/^([A-Z]+)(\d+)$/)
    if (!match) return null
    const col = match[1].charCodeAt(0) - 65
    const row = parseInt(match[2]) - 1
    return { row, col }
  }

  // Reactive cell value calculation
  const recalculateAllCells = useCallback(() => {
    const newData = { ...data }
    let hasChanges = false
    
    Object.entries(newData).forEach(([key, cell]) => {
      if (cell.formula) {
        const calculatedValue = calcEngine.getCellValue(key)
        if (cell.calculatedValue !== calculatedValue) {
          cell.calculatedValue = calculatedValue
          hasChanges = true
        }
      }
    })
    
    if (hasChanges) {
      setData(newData)
    }
  }, [data, calcEngine])

  const getCellValue = (cellKey: string) => {
    const cell = data[cellKey]
    if (!cell) return ""
    
    // Return calculated value for formulas
    if (cell.formula) {
      return cell.calculatedValue !== undefined ? cell.calculatedValue : calcEngine.getCellValue(cellKey)
    }
    
    return cell.value || ""
  }

  const getCellDisplayValue = (cellKey: string) => {
    const value = getCellValue(cellKey)
    const cell = data[cellKey]
    
    // Apply number formatting if specified
    if (cell?.style?.numberFormat && typeof value === 'number') {
      return formatNumber(value, cell.style.numberFormat)
    }
    
    return value
  }

  const formatNumber = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
      case 'percent':
        return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0 }).format(value)
      case 'number':
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
      default:
        return String(value)
    }
  }

  const handleCellClick = (cellKey: string, event: React.MouseEvent) => {
    // If we're editing, confirm the edit first
    if (editingCell && editingCell !== cellKey) {
      confirmCellEdit(editingCell)
    }
    
    if (event.shiftKey && selectedCell) {
      // Range selection
      const start = getCellCoordinates(selectedCell)
      const end = getCellCoordinates(cellKey)
      if (start && end) {
        const newRange = new Set<string>()
        for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
          for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
            newRange.add(getCellKey(r, c))
          }
        }
        setSelectedRange(newRange)
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Multiple selection
      const newRange = new Set(selectedRange)
      if (newRange.has(cellKey)) {
        newRange.delete(cellKey)
      } else {
        newRange.add(cellKey)
      }
      setSelectedRange(newRange)
    } else {
      setSelectedCell(cellKey)
      setSelectedRange(new Set([cellKey]))
      const cell = data[cellKey]
      setFormulaBarValue(cell?.formula || cell?.value || "")
      setEditingFormulaBar(false)
    }
  }

  const startEditingCell = (cellKey: string, initialValue?: string) => {
    setEditingCell(cellKey)
    const cell = data[cellKey]
    const value = initialValue !== undefined ? initialValue : (cell?.formula || cell?.value || "")
    cellEditValueRef.current = value
    
    // Update formula bar
    setFormulaBarValue(value)
    
    // Focus input after render
    setTimeout(() => {
      const input = inputRefs.current[cellKey]
      if (input) {
        input.value = value
        input.focus()
        if (initialValue === undefined) {
          input.select()
        } else {
          input.setSelectionRange(value.length, value.length)
        }
      }
    }, 0)
  }

  const handleCellDoubleClick = (cellKey: string) => {
    startEditingCell(cellKey)
  }

  const confirmCellEdit = (cellKey: string) => {
    const value = cellEditValueRef.current
    
    // Update calculation engine
    calcEngine.setCellValue(cellKey, value)
    
    // Update local state
    const newData = { ...data }
    newData[cellKey] = {
      ...newData[cellKey],
      value: value,
      formula: value.startsWith("=") ? value : undefined,
      calculatedValue: value.startsWith("=") ? calcEngine.getCellValue(cellKey) : undefined
    }
    
    // Recalculate dependent cells
    Object.entries(newData).forEach(([key, cell]) => {
      if (cell.formula && key !== cellKey) {
        cell.calculatedValue = calcEngine.getCellValue(key)
      }
    })
    
    setData(newData)
    setEditingCell(null)
    setFormulaRefCell(null)
    formulaRefCellRef.current = null
    setIsDirty(true)
    addToHistory()
  }

  const cancelCellEdit = () => {
    setEditingCell(null)
    setFormulaRefCell(null)
    formulaRefCellRef.current = null
    // Restore formula bar value
    if (selectedCell) {
      const cell = data[selectedCell]
      setFormulaBarValue(cell?.formula || cell?.value || "")
    }
  }

  const handleCellInputChange = (cellKey: string, value: string) => {
    cellEditValueRef.current = value
    setFormulaBarValue(value)
    
    // Reset formula reference tracking when user types
    formulaRefCellRef.current = null
    setFormulaRefCell(null)
    
    // Show autocomplete for formulas
    if (value.startsWith('=')) {
      updateAutocomplete(value, cellKey)
    } else {
      setShowAutocomplete(false)
    }
  }

  const updateAutocomplete = (value: string, cellKey?: string) => {
    const lastMatch = value.match(/([A-Z_]+)$/i)
    if (lastMatch) {
      const partial = lastMatch[1].toUpperCase()
      const matches = excelFunctions.filter(f => f.startsWith(partial))
      
      if (matches.length > 0) {
        setAutocompleteOptions(matches)
        setSelectedAutocomplete(0)
        
        // Position autocomplete near the cell or formula bar
        if (cellKey && editingCell) {
          const cellElement = document.querySelector(`[data-cell="${cellKey}"]`)
          if (cellElement) {
            const rect = cellElement.getBoundingClientRect()
            setAutocompletePosition({
              top: rect.bottom,
              left: rect.left
            })
          }
        } else {
          // Position near formula bar
          setAutocompletePosition({
            top: 100,
            left: 200
          })
        }
        
        setShowAutocomplete(true)
      } else {
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value)
    setEditingFormulaBar(true)
    
    // Update autocomplete
    updateAutocomplete(value)
    
    // If editing a cell, update its value too
    if (editingCell) {
      cellEditValueRef.current = value
      const input = inputRefs.current[editingCell]
      if (input) {
        input.value = value
      }
    }
  }

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (showAutocomplete) {
        handleAutocompleteSelect(autocompleteOptions[selectedAutocomplete])
      } else if (selectedCell) {
        // Apply formula bar value to selected cell
        calcEngine.setCellValue(selectedCell, formulaBarValue)
        
        const newData = { ...data }
        newData[selectedCell] = {
          ...newData[selectedCell],
          value: formulaBarValue,
          formula: formulaBarValue.startsWith("=") ? formulaBarValue : undefined,
          calculatedValue: formulaBarValue.startsWith("=") ? calcEngine.getCellValue(selectedCell) : undefined
        }
        
        // Recalculate dependent cells
        Object.entries(newData).forEach(([key, cell]) => {
          if (cell.formula && key !== selectedCell) {
            cell.calculatedValue = calcEngine.getCellValue(key)
          }
        })
        
        setData(newData)
        setIsDirty(true)
        setEditingFormulaBar(false)
        
        // Move to next cell
        const coords = getCellCoordinates(selectedCell)
        if (coords && coords.row < rows - 1) {
          const nextCell = getCellKey(coords.row + 1, coords.col)
          setSelectedCell(nextCell)
          setSelectedRange(new Set([nextCell]))
          const cell = data[nextCell]
          setFormulaBarValue(cell?.formula || cell?.value || "")
        }
      }
    } else if (e.key === 'Escape') {
      setEditingFormulaBar(false)
      if (selectedCell) {
        const cell = data[selectedCell]
        setFormulaBarValue(cell?.formula || cell?.value || "")
      }
      setShowAutocomplete(false)
    }
  }

  const handleAutocompleteSelect = (func: string) => {
    const currentValue = editingCell ? cellEditValueRef.current : formulaBarValue
    const lastMatch = currentValue.match(/(.*)([A-Z_]+)$/i)
    
    if (lastMatch) {
      const newValue = lastMatch[1] + func + '('
      
      if (editingCell) {
        cellEditValueRef.current = newValue
        const input = inputRefs.current[editingCell]
        if (input) {
          input.value = newValue
          input.focus()
          input.setSelectionRange(newValue.length, newValue.length)
        }
      }
      
      setFormulaBarValue(newValue)
      setShowAutocomplete(false)
    }
  }

  const handleCopy = () => {
    setCopiedCells({ cells: new Set(selectedRange), data: { ...data } })
  }

  const handlePaste = () => {
    if (!copiedCells || selectedRange.size === 0) return
    
    const targetCells = Array.from(selectedRange)
    const sourceCells = Array.from(copiedCells.cells)
    
    if (sourceCells.length === 1) {
      // Paste single cell to multiple cells
      const sourceData = copiedCells.data[sourceCells[0]]
      if (sourceData) {
        const newData = { ...data }
        targetCells.forEach(cell => {
          newData[cell] = { ...sourceData }
          calcEngine.setCellValue(cell, sourceData.formula || sourceData.value)
          if (sourceData.formula) {
            newData[cell].calculatedValue = calcEngine.getCellValue(cell)
          }
        })
        setData(newData)
        setIsDirty(true)
        addToHistory()
      }
    }
  }

  const handleCut = () => {
    handleCopy()
    const newData = { ...data }
    selectedRange.forEach(cell => {
      delete newData[cell]
      calcEngine.setCellValue(cell, '')
    })
    setData(newData)
    setIsDirty(true)
    addToHistory()
  }

  const handleDelete = () => {
    const newData = { ...data }
    selectedRange.forEach(cell => {
      delete newData[cell]
      calcEngine.setCellValue(cell, '')
    })
    
    // Recalculate dependent cells
    Object.entries(newData).forEach(([key, cell]) => {
      if (cell.formula) {
        cell.calculatedValue = calcEngine.getCellValue(key)
      }
    })
    
    setData(newData)
    setIsDirty(true)
    addToHistory()
  }

  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...data })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      const historicalData = history[historyIndex - 1]
      setData(historicalData)
      
      // Update calculation engine
      Object.entries(historicalData).forEach(([key, cell]) => {
        calcEngine.setCellValue(key, cell.formula || cell.value)
      })
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      const historicalData = history[historyIndex + 1]
      setData(historicalData)
      
      // Update calculation engine
      Object.entries(historicalData).forEach(([key, cell]) => {
        calcEngine.setCellValue(key, cell.formula || cell.value)
      })
    }
  }

  const applyStyle = (styleKey: string, value: any) => {
    const newData = { ...data }
    selectedRange.forEach(cellKey => {
      if (!newData[cellKey]) {
        newData[cellKey] = { value: '' }
      }
      if (!newData[cellKey].style) {
        newData[cellKey].style = {}
      }
      ;(newData[cellKey].style as any)[styleKey] = value
    })
    setData(newData)
    setIsDirty(true)
    addToHistory()
  }

  // Save and load functionality
  const saveSheet = async () => {
    setIsSaving(true)
    try {
      const sheetData = {
        name: sheetName,
        data: {
          cells: data,
          metadata: {
            rows,
            cols
          }
        }
      }

      if (currentSheetId) {
        // Update existing sheet
        const response = await fetch(`/api/sheets/${currentSheetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData)
        })
        
        if (response.ok) {
          setLastSaved(new Date())
          setIsDirty(false)
        }
      } else {
        // Create new sheet
        const response = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData)
        })
        
        if (response.ok) {
          const saved = await response.json()
          setCurrentSheetId(saved.id)
          setLastSaved(new Date())
          setIsDirty(false)
        }
      }
    } catch (error) {
      console.error('Failed to save sheet:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadSheetsList = async () => {
    try {
      const response = await fetch('/api/sheets')
      if (response.ok) {
        const sheets = await response.json()
        setSavedSheets(sheets)
      }
    } catch (error) {
      console.error('Failed to load sheets:', error)
    }
  }

  const loadSheet = async (sheetId: string) => {
    try {
      const response = await fetch(`/api/sheets/${sheetId}`)
      if (response.ok) {
        const sheet = await response.json()
        setCurrentSheetId(sheet.id)
        setSheetName(sheet.name)
        
        // Load cells into state and calculation engine
        const cells = sheet.data?.cells || {}
        
        // First pass: load all values
        Object.entries(cells).forEach(([key, cell]: [string, any]) => {
          calcEngine.setCellValue(key, cell.formula || cell.value)
        })
        
        // Second pass: calculate all formulas
        Object.entries(cells).forEach(([key, cell]: [string, any]) => {
          if (cell.formula) {
            cells[key].calculatedValue = calcEngine.getCellValue(key)
          }
        })
        
        setData(cells)
        setLastSaved(new Date(sheet.updatedAt))
        setIsDirty(false)
        setShowOpenDialog(false)
      }
    } catch (error) {
      console.error('Failed to load sheet:', error)
    }
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle autocomplete navigation
    if (showAutocomplete) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedAutocomplete(prev => 
          prev < autocompleteOptions.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedAutocomplete(prev => 
          prev > 0 ? prev - 1 : autocompleteOptions.length - 1
        )
        return
      }
      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault()
        handleAutocompleteSelect(autocompleteOptions[selectedAutocomplete])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowAutocomplete(false)
        return
      }
    }
    
    // Don't handle navigation if editing formula bar
    if (editingFormulaBar) {
      return
    }
    
    if (!selectedCell) return

    const coords = getCellCoordinates(selectedCell)
    if (!coords) return

    // Handle escape to cancel edit immediately
    if (event.key === 'Escape' && editingCell) {
      event.preventDefault()
      event.stopPropagation()
      cancelCellEdit()
      return
    }

    // Handle enter to confirm edit
    if (event.key === 'Enter' && editingCell) {
      event.preventDefault()
      confirmCellEdit(editingCell)
      
      // Move to next row
      if (coords.row < rows - 1) {
        const nextCell = getCellKey(coords.row + 1, coords.col)
        setSelectedCell(nextCell)
        setSelectedRange(new Set([nextCell]))
        const cell = data[nextCell]
        setFormulaBarValue(cell?.formula || cell?.value || "")
      }
      return
    }

    // Handle tab to confirm edit and move
    if (event.key === 'Tab' && editingCell) {
      event.preventDefault()
      confirmCellEdit(editingCell)
      
      // Move to next column
      if (event.shiftKey) {
        if (coords.col > 0) {
          const nextCell = getCellKey(coords.row, coords.col - 1)
          setSelectedCell(nextCell)
          setSelectedRange(new Set([nextCell]))
          const cell = data[nextCell]
          setFormulaBarValue(cell?.formula || cell?.value || "")
        }
      } else {
        if (coords.col < cols - 1) {
          const nextCell = getCellKey(coords.row, coords.col + 1)
          setSelectedCell(nextCell)
          setSelectedRange(new Set([nextCell]))
          const cell = data[nextCell]
          setFormulaBarValue(cell?.formula || cell?.value || "")
        }
      }
      return
    }

    // Don't handle other keys if editing
    if (editingCell) {
      return
    }

    let newRow = coords.row
    let newCol = coords.col

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (event.metaKey || event.ctrlKey) {
          newRow = 0
        } else {
          newRow = Math.max(0, coords.row - 1)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (event.metaKey || event.ctrlKey) {
          newRow = rows - 1
        } else {
          newRow = Math.min(rows - 1, coords.row + 1)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (event.metaKey || event.ctrlKey) {
          newCol = 0
        } else {
          newCol = Math.max(0, coords.col - 1)
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (event.metaKey || event.ctrlKey) {
          newCol = cols - 1
        } else {
          newCol = Math.min(cols - 1, coords.col + 1)
        }
        break
      case 'Enter':
        event.preventDefault()
        startEditingCell(selectedCell)
        return
      case 'Tab':
        event.preventDefault()
        if (event.shiftKey) {
          newCol = Math.max(0, coords.col - 1)
        } else {
          newCol = Math.min(cols - 1, coords.col + 1)
        }
        break
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        handleDelete()
        return
      case 'F2':
        event.preventDefault()
        startEditingCell(selectedCell)
        return
      default:
        // Start editing on any character key
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault()
          startEditingCell(selectedCell, event.key)
        }
        return
    }

    if (newRow !== coords.row || newCol !== coords.col) {
      const newCellKey = getCellKey(newRow, newCol)
      
      if (event.shiftKey) {
        // Multi-cell selection with Shift+Arrow
        // Keep the original selected cell as anchor
        const anchorCell = selectedCell
        const anchorCoords = getCellCoordinates(anchorCell)
        
        if (anchorCoords) {
          // Create a range from anchor to new position
          const newRange = new Set<string>()
          const minRow = Math.min(anchorCoords.row, newRow)
          const maxRow = Math.max(anchorCoords.row, newRow)
          const minCol = Math.min(anchorCoords.col, newCol)
          const maxCol = Math.max(anchorCoords.col, newCol)
          
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              newRange.add(getCellKey(r, c))
            }
          }
          
          setSelectedRange(newRange)
          // Don't change selectedCell to maintain anchor
          const cell = data[newCellKey]
          setFormulaBarValue(cell?.formula || cell?.value || "")
        }
      } else {
        // Single cell selection
        setSelectedCell(newCellKey)
        setSelectedRange(new Set([newCellKey]))
        const cell = data[newCellKey]
        setFormulaBarValue(cell?.formula || cell?.value || "")
      }
      
      // Auto-scroll to the new cell
      setTimeout(() => {
        const cellElement = document.querySelector(`[data-cell="${newCellKey}"]`)
        if (cellElement) {
          cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        }
      }, 0)
    }
  }, [selectedCell, editingCell, data, rows, cols, showAutocomplete, autocompleteOptions, selectedAutocomplete, editingFormulaBar])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (work even when editing)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault()
            handleCopy()
            break
          case 'v':
            e.preventDefault()
            handlePaste()
            break
          case 'x':
            e.preventDefault()
            handleCut()
            break
          case 'z':
            e.preventDefault()
            handleUndo()
            break
          case 'y':
            e.preventDefault()
            handleRedo()
            break
          case 's':
            e.preventDefault()
            saveSheet()
            break
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [selectedRange, copiedCells, data, historyIndex, history])

  // Cell navigation keyboard handler
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Load sheets list on mount
  useEffect(() => {
    loadSheetsList()
  }, [])

  // Mouse up handler for selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
    }
    
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center gap-4 bg-background">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowOpenDialog(true)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Open"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
          <button 
            onClick={saveSheet}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Save (Ctrl+S)"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={handleUndo}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Undo (Ctrl+Z)"
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </button>
          <button 
            onClick={handleRedo}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Redo (Ctrl+Y)"
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCut}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Cut (Ctrl+X)"
          >
            <Scissors className="h-4 w-4" />
          </button>
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Copy (Ctrl+C)"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button 
            onClick={handlePaste}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Paste (Ctrl+V)"
            disabled={!copiedCells}
          >
            <ClipboardPaste className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => applyStyle('bold', true)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button 
            onClick={() => applyStyle('italic', true)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button 
            onClick={() => applyStyle('underline', true)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => applyStyle('align', 'left')}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={() => applyStyle('align', 'center')}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button 
            onClick={() => applyStyle('align', 'right')}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => applyStyle('numberFormat', 'currency')}
            className="p-2 hover:bg-muted rounded transition-colors text-xs font-mono"
            title="Currency"
          >
            $
          </button>
          <button 
            onClick={() => applyStyle('numberFormat', 'percent')}
            className="p-2 hover:bg-muted rounded transition-colors text-xs font-mono"
            title="Percent"
          >
            %
          </button>
          <button 
            onClick={() => applyStyle('numberFormat', 'number')}
            className="p-2 hover:bg-muted rounded transition-colors text-xs font-mono"
            title="Number"
          >
            #
          </button>
        </div>
        
        <div className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="text"
            value={sheetName}
            onChange={(e) => {
              setSheetName(e.target.value)
              setIsDirty(true)
            }}
            className="px-2 py-1 border rounded bg-background"
            placeholder="Sheet name"
          />
          {isDirty && <span className="text-yellow-600">●</span>}
          {lastSaved && (
            <span className="text-muted-foreground text-xs">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Formula Bar */}
      <div className="border-b flex items-center bg-background relative">
        <div className="px-4 py-2 border-r min-w-[100px] font-mono text-sm bg-muted">
          {selectedCell || ""}
        </div>
        <div className="px-2 text-muted-foreground">
          fx
        </div>
        <input
          ref={formulaInputRef}
          type="text"
          className="flex-1 px-2 py-2 outline-none bg-transparent font-mono text-sm"
          value={formulaBarValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          onKeyDown={handleFormulaBarKeyDown}
          onFocus={() => setEditingFormulaBar(true)}
          onBlur={() => {
            if (!showAutocomplete) {
              setEditingFormulaBar(false)
            }
          }}
          placeholder="Enter formula or value"
        />
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto relative focus:outline-none" ref={gridRef} tabIndex={0}>
        <div className="inline-block min-w-full">
          <table className="table-fixed border-collapse" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-muted w-12 h-8 text-xs font-normal text-muted-foreground border border-neutral-200 dark:border-neutral-800">
                </th>
                {Array.from({ length: cols }, (_, i) => (
                  <th 
                    key={i} 
                    className="sticky top-0 z-10 bg-muted w-24 h-8 text-xs font-normal text-muted-foreground hover:bg-muted/80 cursor-pointer border border-neutral-200 dark:border-neutral-800"
                  >
                    {getColumnLabel(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="sticky left-0 z-10 bg-muted w-12 h-8 text-xs text-center text-muted-foreground hover:bg-muted/80 cursor-pointer border border-neutral-200 dark:border-neutral-800">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const cellKey = getCellKey(rowIndex, colIndex)
                    const cell = data[cellKey]
                    const isSelected = selectedCell === cellKey
                    const isInRange = selectedRange.has(cellKey)
                    const isEditing = editingCell === cellKey
                    const displayValue = getCellDisplayValue(cellKey)
                    const isError = typeof displayValue === 'string' && displayValue.startsWith('#')
                    
                    return (
                      <td
                        key={cellKey}
                        data-cell={cellKey}
                        className={`
                          relative h-8 p-0 cursor-cell bg-background border border-neutral-200 dark:border-neutral-800
                          ${isSelected ? 'ring-1 ring-neutral-400 dark:ring-neutral-600 ring-inset z-[5]' : ''}
                          ${isInRange && !isSelected ? 'bg-neutral-50 dark:bg-neutral-900' : ''}
                          ${!isEditing ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''}
                          focus:outline-none
                        `}
                        onClick={(e) => handleCellClick(cellKey, e)}
                        onDoubleClick={() => handleCellDoubleClick(cellKey)}
                        onMouseDown={(e) => {
                          if (e.button === 0) { // Left click only
                            setIsSelecting(true)
                            setSelectionStart(cellKey)
                          }
                        }}
                        onMouseEnter={() => {
                          if (isSelecting && selectionStart) {
                            const start = getCellCoordinates(selectionStart)
                            const end = getCellCoordinates(cellKey)
                            if (start && end) {
                              const newRange = new Set<string>()
                              for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
                                for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
                                  newRange.add(getCellKey(r, c))
                                }
                              }
                              setSelectedRange(newRange)
                            }
                          }
                        }}
                        title={cell?.formula || ''}
                      >
                        {isEditing ? (
                          <input
                            ref={(el) => {
                              if (el) inputRefs.current[cellKey] = el
                            }}
                            type="text"
                            className="w-full h-full px-1 outline-none border-0 text-sm bg-transparent font-mono focus:outline-none focus:ring-0"
                            style={{
                              fontFamily: 'inherit',
                              textAlign: cell?.style?.align || 'left'
                            }}
                            onChange={(e) => handleCellInputChange(cellKey, e.target.value)}
                            onKeyDown={(e) => {
                              const currentValue = cellEditValueRef.current
                              const isTypingFormula = currentValue.startsWith('=')
                              const hasPartialFunction = isTypingFormula && currentValue.match(/([A-Z_]+)$/i)
                              const shouldHandleAutocomplete = showAutocomplete && autocompleteOptions.length > 0 && hasPartialFunction
                              
                              // Handle arrow keys
                              if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                if (shouldHandleAutocomplete) {
                                  // Navigate autocomplete dropdown
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault()
                                    setSelectedAutocomplete(prev => 
                                      prev < autocompleteOptions.length - 1 ? prev + 1 : 0
                                    )
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault()
                                    setSelectedAutocomplete(prev => 
                                      prev > 0 ? prev - 1 : autocompleteOptions.length - 1
                                    )
                                  }
                                  return
                                } else if (isTypingFormula) {
                                  // Excel-like behavior: arrow keys in formula mode select cells
                                  e.preventDefault()
                                  
                                  // Check if we should be inserting/updating a reference
                                  const lastChar = currentValue[currentValue.length - 1]
                                  const shouldStartNewRef = currentValue === '=' || 
                                    ['+', '-', '*', '/', '(', ',', ':', '=', ' '].includes(lastChar)
                                  
                                  // Get current position for navigation
                                  const navFromCell = formulaRefCellRef.current || selectedCell || cellKey
                                  const coords = getCellCoordinates(navFromCell)
                                  if (!coords) return
                                  
                                  let targetRow = coords.row
                                  let targetCol = coords.col
                                  
                                  switch (e.key) {
                                    case 'ArrowUp':
                                      targetRow = Math.max(0, coords.row - 1)
                                      break
                                    case 'ArrowDown':
                                      targetRow = Math.min(rows - 1, coords.row + 1)
                                      break
                                    case 'ArrowLeft':
                                      targetCol = Math.max(0, coords.col - 1)
                                      break
                                    case 'ArrowRight':
                                      targetCol = Math.min(cols - 1, coords.col + 1)
                                      break
                                  }
                                  
                                  const targetCellKey = getCellKey(targetRow, targetCol)
                                  
                                  let newValue = currentValue
                                  
                                  if (shouldStartNewRef && !formulaRefCellRef.current) {
                                    // Start a new reference
                                    newValue = currentValue + targetCellKey
                                    lastFormulaPositionRef.current = currentValue.length
                                    formulaRefCellRef.current = targetCellKey
                                  } else if (formulaRefCellRef.current) {
                                    // Update existing reference
                                    const beforeRef = currentValue.substring(0, lastFormulaPositionRef.current)
                                    const afterRef = currentValue.substring(lastFormulaPositionRef.current + formulaRefCellRef.current.length)
                                    newValue = beforeRef + targetCellKey + afterRef
                                    formulaRefCellRef.current = targetCellKey
                                  } else {
                                    // No reference context, just move selection
                                    setSelectedCell(targetCellKey)
                                    setSelectedRange(new Set([targetCellKey]))
                                    return
                                  }
                                  
                                  cellEditValueRef.current = newValue
                                  const input = inputRefs.current[cellKey]
                                  if (input) {
                                    input.value = newValue
                                    input.setSelectionRange(newValue.length, newValue.length)
                                  }
                                  setFormulaBarValue(newValue)
                                  
                                  // Visually select the referenced cell
                                  setSelectedCell(targetCellKey)
                                  setSelectedRange(new Set([targetCellKey]))
                                  setFormulaRefCell(targetCellKey)
                                  return
                                } else {
                                  // Normal navigation - confirm edit and move
                                  e.preventDefault()
                                  confirmCellEdit(cellKey)
                                  const coords = getCellCoordinates(cellKey)
                                  if (!coords) return
                                  
                                  let newRow = coords.row
                                  let newCol = coords.col
                                  
                                  switch (e.key) {
                                    case 'ArrowUp':
                                      newRow = Math.max(0, coords.row - 1)
                                      break
                                    case 'ArrowDown':
                                      newRow = Math.min(rows - 1, coords.row + 1)
                                      break
                                    case 'ArrowLeft':
                                      newCol = Math.max(0, coords.col - 1)
                                      break
                                    case 'ArrowRight':
                                      newCol = Math.min(cols - 1, coords.col + 1)
                                      break
                                  }
                                  
                                  const nextCell = getCellKey(newRow, newCol)
                                  setSelectedCell(nextCell)
                                  setSelectedRange(new Set([nextCell]))
                                  const cell = data[nextCell]
                                  setFormulaBarValue(cell?.formula || cell?.value || "")
                                  return
                                }
                              }
                              
                              // Handle Enter/Tab for autocomplete
                              if ((e.key === 'Enter' || e.key === 'Tab') && shouldHandleAutocomplete) {
                                e.preventDefault()
                                handleAutocompleteSelect(autocompleteOptions[selectedAutocomplete])
                                return
                              }
                              
                              // Regular Enter key - confirm and move down
                              if (e.key === 'Enter' && !shouldHandleAutocomplete) {
                                e.preventDefault()
                                confirmCellEdit(cellKey)
                                const coords = getCellCoordinates(cellKey)
                                if (coords && coords.row < rows - 1) {
                                  const nextCell = getCellKey(coords.row + 1, coords.col)
                                  setSelectedCell(nextCell)
                                  setSelectedRange(new Set([nextCell]))
                                  const cell = data[nextCell]
                                  setFormulaBarValue(cell?.formula || cell?.value || "")
                                }
                                return
                              }
                              
                              // Tab key - confirm and move right/left
                              if (e.key === 'Tab' && !shouldHandleAutocomplete) {
                                e.preventDefault()
                                confirmCellEdit(cellKey)
                                const coords = getCellCoordinates(cellKey)
                                if (coords) {
                                  if (e.shiftKey && coords.col > 0) {
                                    const nextCell = getCellKey(coords.row, coords.col - 1)
                                    setSelectedCell(nextCell)
                                    setSelectedRange(new Set([nextCell]))
                                    const cell = data[nextCell]
                                    setFormulaBarValue(cell?.formula || cell?.value || "")
                                  } else if (!e.shiftKey && coords.col < cols - 1) {
                                    const nextCell = getCellKey(coords.row, coords.col + 1)
                                    setSelectedCell(nextCell)
                                    setSelectedRange(new Set([nextCell]))
                                    const cell = data[nextCell]
                                    setFormulaBarValue(cell?.formula || cell?.value || "")
                                  }
                                }
                                return
                              }
                              
                              // Escape key - cancel edit or close autocomplete
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                e.stopPropagation()
                                if (showAutocomplete) {
                                  setShowAutocomplete(false)
                                } else {
                                  cancelCellEdit()
                                }
                                return
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className={`
                              w-full h-8 px-1 flex items-center text-sm overflow-hidden whitespace-nowrap
                              ${cell?.style?.bold ? 'font-bold' : ''}
                              ${cell?.style?.italic ? 'italic' : ''}
                              ${cell?.style?.underline ? 'underline' : ''}
                              ${cell?.style?.align === 'center' ? 'justify-center' : ''}
                              ${cell?.style?.align === 'right' ? 'justify-end' : ''}
                              ${isError ? 'text-red-500' : ''}
                            `}
                            style={{
                              backgroundColor: cell?.style?.backgroundColor,
                              color: isError ? undefined : cell?.style?.color
                            }}
                          >
                            {displayValue}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 flex items-center justify-between text-xs text-muted-foreground bg-background">
        <div className="flex items-center gap-4">
          <span>{editingCell ? 'Editing' : 'Ready'}</span>
          {selectedRange.size > 1 && (
            <>
              <span>{selectedRange.size} cells</span>
              <span>
                SUM: {Array.from(selectedRange).reduce((sum, cell) => {
                  const val = getCellValue(cell)
                  return sum + (typeof val === 'number' ? val : 0)
                }, 0).toFixed(2)}
              </span>
              <span>
                AVG: {(Array.from(selectedRange).reduce((sum, cell) => {
                  const val = getCellValue(cell)
                  return sum + (typeof val === 'number' ? val : 0)
                }, 0) / selectedRange.size).toFixed(2)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Press F2 or double-click to edit</span>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && autocompleteOptions.length > 0 && (
        <div 
          className="fixed bg-popover border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{
            top: `${autocompletePosition.top}px`,
            left: `${autocompletePosition.left}px`
          }}
        >
          {autocompleteOptions.map((option, index) => (
            <div
              key={option}
              className={`px-3 py-1 cursor-pointer hover:bg-muted text-sm ${
                index === selectedAutocomplete ? 'bg-muted' : ''
              }`}
              onClick={() => handleAutocompleteSelect(option)}
              onMouseEnter={() => setSelectedAutocomplete(index)}
            >
              <span className="font-mono">{option}</span>
            </div>
          ))}
        </div>
      )}

      {/* Open Sheet Dialog */}
      {showOpenDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Open Spreadsheet</h2>
              <button
                onClick={() => setShowOpenDialog(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {savedSheets.length === 0 ? (
                <p className="text-muted-foreground text-sm">No saved spreadsheets</p>
              ) : (
                savedSheets.map(sheet => (
                  <button
                    key={sheet.id}
                    onClick={() => loadSheet(sheet.id)}
                    className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors border"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{sheet.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Modified {new Date(sheet.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}