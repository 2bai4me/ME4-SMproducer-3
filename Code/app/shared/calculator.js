/**
 * Calculator – Simple arithmetic calculator with add/subtract operations.
 * Includes memory, history, and chaining support.
 */

/**
 * Validates that a value is a proper number (not NaN, not non-number).
 * @param {*} v - value to check
 * @param {string} label - context label for error messages
 * @throws {TypeError} if v is not a valid number
 */
function guardNumber(v, label) {
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new TypeError(label + ' requires a valid number, got ' + (v === null ? 'null' : typeof v));
  }
}

/**
 * Core arithmetic operations.
 */
export function add(a, b) {
  guardNumber(a, 'add()');
  guardNumber(b, 'add()');
  return a + b;
}

export function subtract(a, b) {
  guardNumber(a, 'subtract()');
  guardNumber(b, 'subtract()');
  return a - b;
}

export function multiply(a, b) {
  guardNumber(a, 'multiply()');
  guardNumber(b, 'multiply()');
  return a * b;
}

export function divide(a, b) {
  guardNumber(a, 'divide()');
  guardNumber(b, 'divide()');
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

/**
 * Calculator class with memory, history, and chaining.
 *
 * Usage:
 *   const calc = new Calculator();
 *   calc.add(5).subtract(2).value();        // 3
 *   calc.add(10).multiply(3).value();       // 30
 *   calc.reset().add(100).subtract(40).value(); // 60
 */
export class Calculator {
  constructor(initialValue = 0) {
    guardNumber(initialValue, 'Calculator()');
    this._value = initialValue;
    this._history = [];
    this._memory = 0;
    this._pushHistory('init', null, initialValue);
  }

  /** Current computed value. */
  value() {
    return this._value;
  }

  /** Add n to the current value. Chainable. */
  add(n) {
    guardNumber(n, 'Calculator.add()');
    const old = this._value;
    this._value = add(this._value, n);
    this._pushHistory('add', n, this._value, old);
    return this;
  }

  /** Subtract n from the current value. Chainable. */
  subtract(n) {
    guardNumber(n, 'Calculator.subtract()');
    const old = this._value;
    this._value = subtract(this._value, n);
    this._pushHistory('subtract', n, this._value, old);
    return this;
  }

  /** Multiply current value by n. Chainable. */
  multiply(n) {
    guardNumber(n, 'Calculator.multiply()');
    const old = this._value;
    this._value = multiply(this._value, n);
    this._pushHistory('multiply', n, this._value, old);
    return this;
  }

  /** Divide current value by n. Chainable. */
  divide(n) {
    guardNumber(n, 'Calculator.divide()');
    const old = this._value;
    this._value = divide(this._value, n);
    this._pushHistory('divide', n, this._value, old);
    return this;
  }

  /** Reset the calculator to 0. Chainable. */
  reset() {
    const old = this._value;
    this._value = 0;
    this._pushHistory('reset', null, 0, old);
    return this;
  }

  /** Store current value in memory. Chainable. */
  memoryStore() {
    this._memory = this._value;
    return this;
  }

  /** Recall memory value (does NOT change current value, just returns it). */
  memoryRecall() {
    return this._memory;
  }

  /** Add current value to memory. Chainable. */
  memoryAdd() {
    this._memory += this._value;
    return this;
  }

  /** Subtract current value from memory. Chainable. */
  memorySubtract() {
    this._memory -= this._value;
    return this;
  }

  /** Clear memory to 0. Chainable. */
  memoryClear() {
    this._memory = 0;
    return this;
  }

  /** Return a copy of the operation history. */
  history() {
    return [...this._history];
  }

  /** Clear history. Chainable. */
  clearHistory() {
    this._history = [];
    return this;
  }

  /** Undo the last operation. Returns true if undone, false if nothing to undo. */
  undo() {
    this._history.pop();
    if (this._history.length === 0) {
      this._value = 0;
      return false;
    }
    const prev = this._history[this._history.length - 1];
    this._value = prev.newValue;
    return true;
  }

  // ─── Internal ────────────────────────────────────────────────
  _pushHistory(op, operand, newValue, oldValue) {
    this._history.push({
      op,
      operand,
      oldValue: oldValue !== undefined ? oldValue : null,
      newValue,
      timestamp: new Date().toISOString()
    });
  }
}
