// Formula Parser for Excel-like expressions
// Supports operators, functions, cell references, and ranges

export interface ParsedFormula {
  type: 'formula'
  expression: Expression
}

export type Expression = 
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | CellReference
  | RangeReference
  | FunctionCall
  | BinaryOperation
  | UnaryOperation
  | ArrayExpression

export interface NumberLiteral {
  type: 'number'
  value: number
}

export interface StringLiteral {
  type: 'string'
  value: string
}

export interface BooleanLiteral {
  type: 'boolean'
  value: boolean
}

export interface CellReference {
  type: 'cell'
  column: string
  row: number
  sheet?: string
  absolute?: {
    column?: boolean
    row?: boolean
  }
}

export interface RangeReference {
  type: 'range'
  start: CellReference
  end: CellReference
}

export interface FunctionCall {
  type: 'function'
  name: string
  arguments: Expression[]
}

export interface BinaryOperation {
  type: 'binary'
  operator: '+' | '-' | '*' | '/' | '^' | '=' | '<>' | '<' | '>' | '<=' | '>=' | '&'
  left: Expression
  right: Expression
}

export interface UnaryOperation {
  type: 'unary'
  operator: '-' | '+'
  operand: Expression
}

export interface ArrayExpression {
  type: 'array'
  elements: Expression[][]
}

export class FormulaParser {
  private pos: number = 0
  private input: string = ''

  parse(formula: string): ParsedFormula | null {
    if (!formula.startsWith('=')) {
      return null
    }
    
    this.input = formula.substring(1).trim()
    this.pos = 0
    
    try {
      const expression = this.parseExpression()
      return { type: 'formula', expression }
    } catch (error) {
      console.error('Parse error:', error)
      return null
    }
  }

  private parseExpression(): Expression {
    return this.parseComparison()
  }

  private parseComparison(): Expression {
    let left = this.parseConcatenation()
    
    while (this.pos < this.input.length) {
      const op = this.peekComparisonOperator()
      if (!op) break
      
      this.pos += op.length
      this.skipWhitespace()
      const right = this.parseConcatenation()
      left = { type: 'binary', operator: op as any, left, right }
    }
    
    return left
  }

  private parseConcatenation(): Expression {
    let left = this.parseAddition()
    
    while (this.pos < this.input.length) {
      this.skipWhitespace()
      if (this.input[this.pos] === '&') {
        this.pos++
        this.skipWhitespace()
        const right = this.parseAddition()
        left = { type: 'binary', operator: '&', left, right }
      } else {
        break
      }
    }
    
    return left
  }

  private parseAddition(): Expression {
    let left = this.parseMultiplication()
    
    while (this.pos < this.input.length) {
      this.skipWhitespace()
      const op = this.input[this.pos]
      if (op === '+' || op === '-') {
        this.pos++
        this.skipWhitespace()
        const right = this.parseMultiplication()
        left = { type: 'binary', operator: op as any, left, right }
      } else {
        break
      }
    }
    
    return left
  }

  private parseMultiplication(): Expression {
    let left = this.parsePower()
    
    while (this.pos < this.input.length) {
      this.skipWhitespace()
      const op = this.input[this.pos]
      if (op === '*' || op === '/') {
        this.pos++
        this.skipWhitespace()
        const right = this.parsePower()
        left = { type: 'binary', operator: op as any, left, right }
      } else {
        break
      }
    }
    
    return left
  }

  private parsePower(): Expression {
    let left = this.parseUnary()
    
    while (this.pos < this.input.length) {
      this.skipWhitespace()
      if (this.input[this.pos] === '^') {
        this.pos++
        this.skipWhitespace()
        const right = this.parseUnary()
        left = { type: 'binary', operator: '^', left, right }
      } else {
        break
      }
    }
    
    return left
  }

  private parseUnary(): Expression {
    this.skipWhitespace()
    
    if (this.input[this.pos] === '-' || this.input[this.pos] === '+') {
      const op = this.input[this.pos] as '-' | '+'
      this.pos++
      this.skipWhitespace()
      return { type: 'unary', operator: op, operand: this.parseUnary() }
    }
    
    return this.parsePrimary()
  }

  private parsePrimary(): Expression {
    this.skipWhitespace()
    
    // Parentheses
    if (this.input[this.pos] === '(') {
      this.pos++
      const expr = this.parseExpression()
      this.skipWhitespace()
      if (this.input[this.pos] !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      this.pos++
      return expr
    }
    
    // String literal
    if (this.input[this.pos] === '"') {
      return this.parseString()
    }
    
    // Boolean
    if (this.input.substr(this.pos, 4).toUpperCase() === 'TRUE') {
      this.pos += 4
      return { type: 'boolean', value: true }
    }
    if (this.input.substr(this.pos, 5).toUpperCase() === 'FALSE') {
      this.pos += 5
      return { type: 'boolean', value: false }
    }
    
    // Function call or cell reference
    if (/[A-Z]/i.test(this.input[this.pos])) {
      const name = this.parseIdentifier()
      this.skipWhitespace()
      
      if (this.input[this.pos] === '(') {
        // Function call
        this.pos++
        const args = this.parseFunctionArguments()
        return { type: 'function', name: name.toUpperCase(), arguments: args }
      } else {
        // Check if it's a cell reference
        const cellMatch = name.match(/^([A-Z]+)(\d+)$/i)
        if (cellMatch) {
          const cell: CellReference = {
            type: 'cell',
            column: cellMatch[1].toUpperCase(),
            row: parseInt(cellMatch[2])
          }
          
          // Check for range
          this.skipWhitespace()
          if (this.input[this.pos] === ':') {
            this.pos++
            this.skipWhitespace()
            const endName = this.parseIdentifier()
            const endMatch = endName.match(/^([A-Z]+)(\d+)$/i)
            if (endMatch) {
              const end: CellReference = {
                type: 'cell',
                column: endMatch[1].toUpperCase(),
                row: parseInt(endMatch[2])
              }
              return { type: 'range', start: cell, end }
            }
          }
          
          return cell
        }
        
        throw new Error(`Unknown identifier: ${name}`)
      }
    }
    
    // Number
    if (/[0-9.]/.test(this.input[this.pos])) {
      return this.parseNumber()
    }
    
    throw new Error(`Unexpected character: ${this.input[this.pos]}`)
  }

  private parseFunctionArguments(): Expression[] {
    const args: Expression[] = []
    this.skipWhitespace()
    
    if (this.input[this.pos] === ')') {
      this.pos++
      return args
    }
    
    while (true) {
      args.push(this.parseExpression())
      this.skipWhitespace()
      
      if (this.input[this.pos] === ')') {
        this.pos++
        break
      }
      
      if (this.input[this.pos] === ',') {
        this.pos++
        this.skipWhitespace()
      } else {
        throw new Error('Expected comma or closing parenthesis')
      }
    }
    
    return args
  }

  private parseIdentifier(): string {
    let name = ''
    while (this.pos < this.input.length && /[A-Z0-9_]/i.test(this.input[this.pos])) {
      name += this.input[this.pos]
      this.pos++
    }
    return name
  }

  private parseNumber(): NumberLiteral {
    let num = ''
    let hasDecimal = false
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos]
      if (char === '.') {
        if (hasDecimal) break
        hasDecimal = true
        num += char
        this.pos++
      } else if (/[0-9]/.test(char)) {
        num += char
        this.pos++
      } else {
        break
      }
    }
    
    return { type: 'number', value: parseFloat(num) }
  }

  private parseString(): StringLiteral {
    this.pos++ // Skip opening quote
    let str = ''
    
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === '"') {
        if (this.pos + 1 < this.input.length && this.input[this.pos + 1] === '"') {
          // Escaped quote
          str += '"'
          this.pos += 2
        } else {
          // Closing quote
          this.pos++
          break
        }
      } else {
        str += this.input[this.pos]
        this.pos++
      }
    }
    
    return { type: 'string', value: str }
  }

  private peekComparisonOperator(): string | null {
    this.skipWhitespace()
    const twoChar = this.input.substr(this.pos, 2)
    if (twoChar === '<=' || twoChar === '>=' || twoChar === '<>') {
      return twoChar
    }
    
    const oneChar = this.input[this.pos]
    if (oneChar === '=' || oneChar === '<' || oneChar === '>') {
      return oneChar
    }
    
    return null
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++
    }
  }
}