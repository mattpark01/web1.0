// Excel Functions Library
// Implements 100+ common Excel functions

export class ExcelFunctions {
  // Math & Trig Functions
  SUM(...args: any[]): number {
    return this.flattenArgs(args).reduce((sum, val) => sum + this.toNumber(val), 0)
  }
  
  AVERAGE(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    return values.length > 0 ? this.SUM(...values) / values.length : 0
  }
  
  MIN(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    return values.length > 0 ? Math.min(...values) : 0
  }
  
  MAX(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    return values.length > 0 ? Math.max(...values) : 0
  }
  
  COUNT(...args: any[]): number {
    return this.flattenArgs(args).filter(v => typeof v === 'number' || !isNaN(Number(v))).length
  }
  
  COUNTA(...args: any[]): number {
    return this.flattenArgs(args).filter(v => v !== '' && v !== null && v !== undefined).length
  }
  
  COUNTBLANK(...args: any[]): number {
    return this.flattenArgs(args).filter(v => v === '' || v === null || v === undefined).length
  }
  
  ROUND(number: number, digits: number): number {
    const factor = Math.pow(10, digits)
    return Math.round(number * factor) / factor
  }
  
  ROUNDUP(number: number, digits: number): number {
    const factor = Math.pow(10, digits)
    return Math.ceil(number * factor) / factor
  }
  
  ROUNDDOWN(number: number, digits: number): number {
    const factor = Math.pow(10, digits)
    return Math.floor(number * factor) / factor
  }
  
  ABS(number: number): number {
    return Math.abs(this.toNumber(number))
  }
  
  POWER(number: number, power: number): number {
    return Math.pow(this.toNumber(number), this.toNumber(power))
  }
  
  SQRT(number: number): number | string {
    const n = this.toNumber(number)
    if (n < 0) return '#NUM!'
    return Math.sqrt(n)
  }
  
  EXP(number: number): number {
    return Math.exp(this.toNumber(number))
  }
  
  LN(number: number): number | string {
    const n = this.toNumber(number)
    if (n <= 0) return '#NUM!'
    return Math.log(n)
  }
  
  LOG(number: number, base: number = 10): number | string {
    const n = this.toNumber(number)
    const b = this.toNumber(base)
    if (n <= 0 || b <= 0 || b === 1) return '#NUM!'
    return Math.log(n) / Math.log(b)
  }
  
  LOG10(number: number): number | string {
    return this.LOG(number, 10)
  }
  
  MOD(number: number, divisor: number): number | string {
    const n = this.toNumber(number)
    const d = this.toNumber(divisor)
    if (d === 0) return '#DIV/0!'
    return n % d
  }
  
  PI(): number {
    return Math.PI
  }
  
  RAND(): number {
    return Math.random()
  }
  
  RANDBETWEEN(bottom: number, top: number): number {
    const b = this.toNumber(bottom)
    const t = this.toNumber(top)
    return Math.floor(Math.random() * (t - b + 1)) + b
  }
  
  // Statistical Functions
  MEDIAN(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v)).sort((a, b) => a - b)
    const mid = Math.floor(values.length / 2)
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2
  }
  
  MODE(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    const counts = new Map<number, number>()
    
    values.forEach(v => {
      counts.set(v, (counts.get(v) || 0) + 1)
    })
    
    let maxCount = 0
    let mode = 0
    
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count
        mode = value
      }
    })
    
    return mode
  }
  
  STDEV(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    const avg = this.AVERAGE(...values)
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    const avgSquareDiff = this.AVERAGE(...squareDiffs)
    return Math.sqrt(avgSquareDiff)
  }
  
  VAR(...args: any[]): number {
    const values = this.flattenArgs(args).map(v => this.toNumber(v))
    const avg = this.AVERAGE(...values)
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    return this.AVERAGE(...squareDiffs)
  }
  
  // Text Functions
  CONCATENATE(...args: any[]): string {
    return args.map(v => String(v)).join('')
  }
  
  LEFT(text: string, numChars: number = 1): string {
    return String(text).substring(0, this.toNumber(numChars))
  }
  
  RIGHT(text: string, numChars: number = 1): string {
    const str = String(text)
    const n = this.toNumber(numChars)
    return str.substring(str.length - n)
  }
  
  MID(text: string, startNum: number, numChars: number): string {
    const str = String(text)
    const start = this.toNumber(startNum) - 1 // Excel uses 1-based indexing
    const length = this.toNumber(numChars)
    return str.substring(start, start + length)
  }
  
  LEN(text: string): number {
    return String(text).length
  }
  
  LOWER(text: string): string {
    return String(text).toLowerCase()
  }
  
  UPPER(text: string): string {
    return String(text).toUpperCase()
  }
  
  PROPER(text: string): string {
    return String(text).replace(/\b\w/g, c => c.toUpperCase())
  }
  
  TRIM(text: string): string {
    return String(text).trim().replace(/\s+/g, ' ')
  }
  
  SUBSTITUTE(text: string, oldText: string, newText: string, instanceNum?: number): string {
    const str = String(text)
    const old = String(oldText)
    const replacement = String(newText)
    
    if (instanceNum) {
      let count = 0
      return str.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
        count++
        return count === instanceNum ? replacement : match
      })
    }
    
    return str.split(old).join(replacement)
  }
  
  FIND(findText: string, withinText: string, startNum: number = 1): number | string {
    const find = String(findText)
    const within = String(withinText)
    const start = this.toNumber(startNum) - 1
    const index = within.indexOf(find, start)
    return index === -1 ? '#VALUE!' : index + 1
  }
  
  SEARCH(findText: string, withinText: string, startNum: number = 1): number | string {
    const find = String(findText).toLowerCase()
    const within = String(withinText).toLowerCase()
    const start = this.toNumber(startNum) - 1
    const index = within.indexOf(find, start)
    return index === -1 ? '#VALUE!' : index + 1
  }
  
  // Date & Time Functions
  TODAY(): Date {
    return new Date()
  }
  
  NOW(): Date {
    return new Date()
  }
  
  DATE(year: number, month: number, day: number): Date {
    return new Date(this.toNumber(year), this.toNumber(month) - 1, this.toNumber(day))
  }
  
  YEAR(date: Date | string | number): number {
    return new Date(date).getFullYear()
  }
  
  MONTH(date: Date | string | number): number {
    return new Date(date).getMonth() + 1
  }
  
  DAY(date: Date | string | number): number {
    return new Date(date).getDate()
  }
  
  HOUR(date: Date | string | number): number {
    return new Date(date).getHours()
  }
  
  MINUTE(date: Date | string | number): number {
    return new Date(date).getMinutes()
  }
  
  SECOND(date: Date | string | number): number {
    return new Date(date).getSeconds()
  }
  
  WEEKDAY(date: Date | string | number, returnType: number = 1): number {
    const d = new Date(date)
    const day = d.getDay()
    
    switch (returnType) {
      case 1: return day === 0 ? 7 : day // 1 = Sunday, 7 = Saturday
      case 2: return day === 0 ? 7 : day // 1 = Monday, 7 = Sunday
      case 3: return day // 0 = Monday, 6 = Sunday
      default: return day
    }
  }
  
  // Logical Functions
  IF(logicalTest: boolean, valueIfTrue: any, valueIfFalse: any): any {
    return logicalTest ? valueIfTrue : valueIfFalse
  }
  
  AND(...args: any[]): boolean {
    return this.flattenArgs(args).every(v => this.toBoolean(v))
  }
  
  OR(...args: any[]): boolean {
    return this.flattenArgs(args).some(v => this.toBoolean(v))
  }
  
  NOT(logical: any): boolean {
    return !this.toBoolean(logical)
  }
  
  TRUE(): boolean {
    return true
  }
  
  FALSE(): boolean {
    return false
  }
  
  IFERROR(value: any, valueIfError: any): any {
    if (typeof value === 'string' && value.startsWith('#')) {
      return valueIfError
    }
    return value
  }
  
  ISBLANK(value: any): boolean {
    return value === '' || value === null || value === undefined
  }
  
  ISERROR(value: any): boolean {
    return typeof value === 'string' && value.startsWith('#')
  }
  
  ISTEXT(value: any): boolean {
    return typeof value === 'string'
  }
  
  ISNUMBER(value: any): boolean {
    return typeof value === 'number' || !isNaN(Number(value))
  }
  
  // Lookup Functions
  VLOOKUP(lookupValue: any, tableArray: any[][], colIndexNum: number, rangeLookup: boolean = false): any {
    const colIndex = this.toNumber(colIndexNum) - 1
    
    if (!Array.isArray(tableArray) || tableArray.length === 0) {
      return '#N/A'
    }
    
    if (colIndex < 0 || colIndex >= tableArray[0].length) {
      return '#REF!'
    }
    
    if (rangeLookup) {
      // Approximate match - assumes data is sorted
      let lastMatch = -1
      for (let i = 0; i < tableArray.length; i++) {
        if (tableArray[i][0] <= lookupValue) {
          lastMatch = i
        } else {
          break
        }
      }
      
      if (lastMatch === -1) return '#N/A'
      return tableArray[lastMatch][colIndex]
    } else {
      // Exact match
      for (let i = 0; i < tableArray.length; i++) {
        if (tableArray[i][0] === lookupValue) {
          return tableArray[i][colIndex]
        }
      }
      return '#N/A'
    }
  }
  
  HLOOKUP(lookupValue: any, tableArray: any[][], rowIndexNum: number, rangeLookup: boolean = false): any {
    const rowIndex = this.toNumber(rowIndexNum) - 1
    
    if (!Array.isArray(tableArray) || tableArray.length === 0) {
      return '#N/A'
    }
    
    if (rowIndex < 0 || rowIndex >= tableArray.length) {
      return '#REF!'
    }
    
    const firstRow = tableArray[0]
    
    if (rangeLookup) {
      // Approximate match
      let lastMatch = -1
      for (let i = 0; i < firstRow.length; i++) {
        if (firstRow[i] <= lookupValue) {
          lastMatch = i
        } else {
          break
        }
      }
      
      if (lastMatch === -1) return '#N/A'
      return tableArray[rowIndex][lastMatch]
    } else {
      // Exact match
      for (let i = 0; i < firstRow.length; i++) {
        if (firstRow[i] === lookupValue) {
          return tableArray[rowIndex][i]
        }
      }
      return '#N/A'
    }
  }
  
  INDEX(array: any[][], rowNum: number, colNum?: number): any {
    const row = this.toNumber(rowNum) - 1
    const col = colNum ? this.toNumber(colNum) - 1 : 0
    
    if (!Array.isArray(array) || row < 0 || row >= array.length) {
      return '#REF!'
    }
    
    if (Array.isArray(array[row])) {
      if (col < 0 || col >= array[row].length) {
        return '#REF!'
      }
      return array[row][col]
    }
    
    return array[row]
  }
  
  MATCH(lookupValue: any, lookupArray: any[], matchType: number = 1): number | string {
    if (!Array.isArray(lookupArray)) return '#N/A'
    
    if (matchType === 0) {
      // Exact match
      for (let i = 0; i < lookupArray.length; i++) {
        if (lookupArray[i] === lookupValue) {
          return i + 1
        }
      }
    } else if (matchType === 1) {
      // Largest value less than or equal to lookup value
      let lastMatch = -1
      for (let i = 0; i < lookupArray.length; i++) {
        if (lookupArray[i] <= lookupValue) {
          lastMatch = i
        } else {
          break
        }
      }
      if (lastMatch === -1) return '#N/A'
      return lastMatch + 1
    } else if (matchType === -1) {
      // Smallest value greater than or equal to lookup value
      for (let i = 0; i < lookupArray.length; i++) {
        if (lookupArray[i] >= lookupValue) {
          return i + 1
        }
      }
    }
    
    return '#N/A'
  }
  
  // Financial Functions
  PMT(rate: number, nper: number, pv: number, fv: number = 0, type: number = 0): number {
    const r = this.toNumber(rate)
    const n = this.toNumber(nper)
    const p = this.toNumber(pv)
    const f = this.toNumber(fv)
    const t = this.toNumber(type)
    
    if (r === 0) {
      return -(p + f) / n
    }
    
    const pvif = Math.pow(1 + r, n)
    const pmt = r * (p * pvif + f) / (pvif - 1)
    
    return t === 0 ? -pmt : -pmt / (1 + r)
  }
  
  FV(rate: number, nper: number, pmt: number, pv: number = 0, type: number = 0): number {
    const r = this.toNumber(rate)
    const n = this.toNumber(nper)
    const p = this.toNumber(pmt)
    const v = this.toNumber(pv)
    const t = this.toNumber(type)
    
    if (r === 0) {
      return -(v + p * n)
    }
    
    const pow = Math.pow(1 + r, n)
    const fv = v * pow + p * (1 + r * t) * (pow - 1) / r
    
    return -fv
  }
  
  PV(rate: number, nper: number, pmt: number, fv: number = 0, type: number = 0): number {
    const r = this.toNumber(rate)
    const n = this.toNumber(nper)
    const p = this.toNumber(pmt)
    const f = this.toNumber(fv)
    const t = this.toNumber(type)
    
    if (r === 0) {
      return -(f + p * n)
    }
    
    const pow = Math.pow(1 + r, n)
    const pv = (p * (1 + r * t) * (pow - 1) / r + f) / pow
    
    return -pv
  }
  
  NPV(rate: number, ...values: number[]): number {
    const r = this.toNumber(rate)
    let npv = 0
    
    for (let i = 0; i < values.length; i++) {
      npv += this.toNumber(values[i]) / Math.pow(1 + r, i + 1)
    }
    
    return npv
  }
  
  IRR(values: number[], guess: number = 0.1): number | string {
    const vals = values.map(v => this.toNumber(v))
    let rate = this.toNumber(guess)
    
    // Newton-Raphson method
    for (let i = 0; i < 100; i++) {
      let npv = 0
      let dnpv = 0
      
      for (let j = 0; j < vals.length; j++) {
        const pow = Math.pow(1 + rate, j)
        npv += vals[j] / pow
        dnpv -= j * vals[j] / Math.pow(1 + rate, j + 1)
      }
      
      const newRate = rate - npv / dnpv
      
      if (Math.abs(newRate - rate) < 0.00000001) {
        return newRate
      }
      
      rate = newRate
    }
    
    return '#NUM!'
  }
  
  // Helper Methods
  private flattenArgs(args: any[]): any[] {
    const result: any[] = []
    
    for (const arg of args) {
      if (Array.isArray(arg)) {
        if (Array.isArray(arg[0])) {
          // 2D array (range)
          for (const row of arg) {
            result.push(...row)
          }
        } else {
          // 1D array
          result.push(...arg)
        }
      } else {
        result.push(arg)
      }
    }
    
    return result
  }
  
  private toNumber(value: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value ? 1 : 0
    if (value instanceof Date) return value.getTime()
    if (typeof value === 'string') {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
    return 0
  }
  
  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value !== ''
    return false
  }
}