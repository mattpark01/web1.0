import { Expression, CellReference, RangeReference, FormulaParser } from './formula-parser'
import { ExcelFunctions } from './excel-functions'

export interface CellData {
  value: any
  formula?: string
  error?: string
  dependencies?: Set<string>
  dependents?: Set<string>
}

export interface SheetData {
  cells: Map<string, CellData>
  name: string
}

export class CalculationEngine {
  private sheets: Map<string, SheetData> = new Map()
  private parser = new FormulaParser()
  private functions = new ExcelFunctions()
  private calculationOrder: string[] = []
  private activeSheet: string = 'Sheet1'
  
  constructor() {
    // Initialize with a default sheet
    this.addSheet('Sheet1')
  }
  
  addSheet(name: string) {
    this.sheets.set(name, {
      name,
      cells: new Map()
    })
  }
  
  setActiveSheet(name: string) {
    if (this.sheets.has(name)) {
      this.activeSheet = name
    }
  }
  
  setCellValue(cellKey: string, value: any, sheet?: string) {
    const sheetName = sheet || this.activeSheet
    const sheetData = this.sheets.get(sheetName)
    if (!sheetData) return
    
    const cell: CellData = { value }
    
    // Check if it's a formula
    if (typeof value === 'string' && value.startsWith('=')) {
      cell.formula = value
      cell.dependencies = new Set()
      
      // Parse formula and extract dependencies
      const parsed = this.parser.parse(value)
      if (parsed) {
        this.extractDependencies(parsed.expression, cell.dependencies, sheetName)
      }
    }
    
    // Remove old dependencies
    const oldCell = sheetData.cells.get(cellKey)
    if (oldCell?.dependencies) {
      oldCell.dependencies.forEach(dep => {
        const [depSheet, depCell] = this.parseCellAddress(dep)
        const depSheetData = this.sheets.get(depSheet)
        const dependency = depSheetData?.cells.get(depCell)
        if (dependency?.dependents) {
          dependency.dependents.delete(`${sheetName}!${cellKey}`)
        }
      })
    }
    
    // Add new dependencies
    if (cell.dependencies) {
      cell.dependencies.forEach(dep => {
        const [depSheet, depCell] = this.parseCellAddress(dep)
        const depSheetData = this.sheets.get(depSheet)
        if (depSheetData) {
          let dependency = depSheetData.cells.get(depCell)
          if (!dependency) {
            dependency = { value: '' }
            depSheetData.cells.set(depCell, dependency)
          }
          if (!dependency.dependents) {
            dependency.dependents = new Set()
          }
          dependency.dependents.add(`${sheetName}!${cellKey}`)
        }
      })
    }
    
    sheetData.cells.set(cellKey, cell)
    
    // Recalculate this cell and its dependents
    this.recalculateCell(cellKey, sheetName)
    
    // Recalculate dependents
    if (cell.dependents) {
      cell.dependents.forEach(dep => {
        const [depSheet, depCell] = this.parseCellAddress(dep)
        this.recalculateCell(depCell, depSheet)
      })
    }
  }
  
  getCellValue(cellKey: string, sheet?: string): any {
    const sheetName = sheet || this.activeSheet
    const sheetData = this.sheets.get(sheetName)
    if (!sheetData) return ''
    
    const cell = sheetData.cells.get(cellKey)
    if (!cell) return ''
    
    if (cell.error) return cell.error
    if (cell.formula) {
      return this.evaluateFormula(cell.formula, sheetName)
    }
    return cell.value
  }
  
  private recalculateCell(cellKey: string, sheet: string) {
    const sheetData = this.sheets.get(sheet)
    if (!sheetData) return
    
    const cell = sheetData.cells.get(cellKey)
    if (!cell || !cell.formula) return
    
    try {
      const result = this.evaluateFormula(cell.formula, sheet)
      cell.value = result
      cell.error = undefined
    } catch (error: any) {
      cell.error = `#ERROR: ${error.message}`
      cell.value = cell.error
    }
  }
  
  evaluateFormula(formula: string, sheet: string): any {
    const parsed = this.parser.parse(formula)
    if (!parsed) return '#PARSE!'
    
    try {
      return this.evaluateExpression(parsed.expression, sheet)
    } catch (error: any) {
      return `#ERROR: ${error.message}`
    }
  }
  
  private evaluateExpression(expr: Expression, sheet: string): any {
    switch (expr.type) {
      case 'number':
        return expr.value
      
      case 'string':
        return expr.value
      
      case 'boolean':
        return expr.value
      
      case 'cell':
        return this.evaluateCellReference(expr, sheet)
      
      case 'range':
        return this.evaluateRangeReference(expr, sheet)
      
      case 'function':
        return this.evaluateFunction(expr.name, expr.arguments, sheet)
      
      case 'binary':
        return this.evaluateBinaryOperation(expr.operator, expr.left, expr.right, sheet)
      
      case 'unary':
        return this.evaluateUnaryOperation(expr.operator, expr.operand, sheet)
      
      case 'array':
        return expr.elements.map(row => 
          row.map(cell => this.evaluateExpression(cell, sheet))
        )
      
      default:
        throw new Error('Unknown expression type')
    }
  }
  
  private evaluateCellReference(ref: CellReference, sheet: string): any {
    const cellKey = `${ref.column}${ref.row}`
    const targetSheet = ref.sheet || sheet
    const sheetData = this.sheets.get(targetSheet)
    
    if (!sheetData) return '#REF!'
    
    const cell = sheetData.cells.get(cellKey)
    if (!cell) return ''
    
    if (cell.formula) {
      // Detect circular reference
      if (this.hasCircularReference(cellKey, targetSheet, new Set())) {
        return '#CIRCULAR!'
      }
      return this.evaluateFormula(cell.formula, targetSheet)
    }
    
    return cell.value || ''
  }
  
  private evaluateRangeReference(range: RangeReference, sheet: string): any[][] {
    const result: any[][] = []
    const startCol = this.columnToNumber(range.start.column)
    const endCol = this.columnToNumber(range.end.column)
    const startRow = range.start.row
    const endRow = range.end.row
    
    for (let row = startRow; row <= endRow; row++) {
      const rowData: any[] = []
      for (let col = startCol; col <= endCol; col++) {
        const cellRef: CellReference = {
          type: 'cell',
          column: this.numberToColumn(col),
          row
        }
        rowData.push(this.evaluateCellReference(cellRef, sheet))
      }
      result.push(rowData)
    }
    
    return result
  }
  
  private evaluateFunction(name: string, args: Expression[], sheet: string): any {
    const evaluatedArgs = args.map(arg => this.evaluateExpression(arg, sheet))
    
    // Check if function exists
    const func = (this.functions as any)[name]
    if (typeof func === 'function') {
      return func.apply(this.functions, evaluatedArgs)
    }
    
    return `#NAME? (${name})`
  }
  
  private evaluateBinaryOperation(op: string, left: Expression, right: Expression, sheet: string): any {
    const leftVal = this.evaluateExpression(left, sheet)
    const rightVal = this.evaluateExpression(right, sheet)
    
    switch (op) {
      case '+':
        return this.coerceToNumber(leftVal) + this.coerceToNumber(rightVal)
      case '-':
        return this.coerceToNumber(leftVal) - this.coerceToNumber(rightVal)
      case '*':
        return this.coerceToNumber(leftVal) * this.coerceToNumber(rightVal)
      case '/':
        const divisor = this.coerceToNumber(rightVal)
        if (divisor === 0) return '#DIV/0!'
        return this.coerceToNumber(leftVal) / divisor
      case '^':
        return Math.pow(this.coerceToNumber(leftVal), this.coerceToNumber(rightVal))
      case '&':
        return String(leftVal) + String(rightVal)
      case '=':
        return leftVal === rightVal
      case '<>':
        return leftVal !== rightVal
      case '<':
        return this.coerceToNumber(leftVal) < this.coerceToNumber(rightVal)
      case '>':
        return this.coerceToNumber(leftVal) > this.coerceToNumber(rightVal)
      case '<=':
        return this.coerceToNumber(leftVal) <= this.coerceToNumber(rightVal)
      case '>=':
        return this.coerceToNumber(leftVal) >= this.coerceToNumber(rightVal)
      default:
        throw new Error(`Unknown operator: ${op}`)
    }
  }
  
  private evaluateUnaryOperation(op: string, operand: Expression, sheet: string): any {
    const val = this.evaluateExpression(operand, sheet)
    
    switch (op) {
      case '-':
        return -this.coerceToNumber(val)
      case '+':
        return this.coerceToNumber(val)
      default:
        throw new Error(`Unknown unary operator: ${op}`)
    }
  }
  
  private extractDependencies(expr: Expression, deps: Set<string>, sheet: string) {
    switch (expr.type) {
      case 'cell':
        const targetSheet = expr.sheet || sheet
        deps.add(`${targetSheet}!${expr.column}${expr.row}`)
        break
      
      case 'range':
        const startCol = this.columnToNumber(expr.start.column)
        const endCol = this.columnToNumber(expr.end.column)
        const startRow = expr.start.row
        const endRow = expr.end.row
        const rangeSheet = expr.start.sheet || sheet
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            deps.add(`${rangeSheet}!${this.numberToColumn(col)}${row}`)
          }
        }
        break
      
      case 'function':
        expr.arguments.forEach(arg => this.extractDependencies(arg, deps, sheet))
        break
      
      case 'binary':
        this.extractDependencies(expr.left, deps, sheet)
        this.extractDependencies(expr.right, deps, sheet)
        break
      
      case 'unary':
        this.extractDependencies(expr.operand, deps, sheet)
        break
      
      case 'array':
        expr.elements.forEach(row => 
          row.forEach(cell => this.extractDependencies(cell, deps, sheet))
        )
        break
    }
  }
  
  private hasCircularReference(cellKey: string, sheet: string, visited: Set<string>): boolean {
    const fullKey = `${sheet}!${cellKey}`
    if (visited.has(fullKey)) return true
    
    visited.add(fullKey)
    
    const sheetData = this.sheets.get(sheet)
    const cell = sheetData?.cells.get(cellKey)
    
    if (cell?.dependencies) {
      for (const dep of cell.dependencies) {
        const [depSheet, depCell] = this.parseCellAddress(dep)
        if (this.hasCircularReference(depCell, depSheet, new Set(visited))) {
          return true
        }
      }
    }
    
    return false
  }
  
  private parseCellAddress(address: string): [string, string] {
    const parts = address.split('!')
    if (parts.length === 2) {
      return [parts[0], parts[1]]
    }
    return [this.activeSheet, parts[0]]
  }
  
  private coerceToNumber(value: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'string') {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
    return 0
  }
  
  private columnToNumber(column: string): number {
    let result = 0
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 64)
    }
    return result
  }
  
  private numberToColumn(num: number): string {
    let result = ''
    while (num > 0) {
      const remainder = (num - 1) % 26
      result = String.fromCharCode(65 + remainder) + result
      num = Math.floor((num - 1) / 26)
    }
    return result
  }
  
  getAllCells(sheet?: string): Map<string, CellData> {
    const sheetName = sheet || this.activeSheet
    const sheetData = this.sheets.get(sheetName)
    return sheetData?.cells || new Map()
  }
}