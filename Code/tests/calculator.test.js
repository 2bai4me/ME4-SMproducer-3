import { add, subtract, multiply, divide, Calculator } from '../app/shared/calculator.js';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \x1b[32m✓\x1b[0m ' + name);
  } catch (err) {
    failed++;
    console.log('  \x1b[31m✗\x1b[0m ' + name + '\n    ' + err.message);
    failures.push({ name, error: err.message });
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function assertClose(actual, expected, epsilon) {
  epsilon = epsilon || 0.0001;
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error('expected ~' + expected + ', got ' + actual);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertThrows(fn, expectedMsg, msg) {
  try {
    fn();
    throw new Error(msg || 'Expected function to throw');
  } catch (err) {
    if (expectedMsg && !err.message.includes(expectedMsg)) {
      throw new Error(msg || 'Expected error containing "' + expectedMsg + '", got "' + err.message + '"');
    }
  }
}

// ─── add() ─────────────────────────────────────────────────
console.log('\n📐 add()');
test('adds two positive integers', () => { assertEqual(add(2, 3), 5); });
test('adds two negative integers', () => { assertEqual(add(-2, -3), -5); });
test('adds positive and negative', () => { assertEqual(add(5, -3), 2); });
test('adds with zero', () => {
  assertEqual(add(5, 0), 5);
  assertEqual(add(0, 5), 5);
  assertEqual(add(0, 0), 0);
});
test('adds floating point', () => { assertClose(add(0.1, 0.2), 0.3); });
test('adds large numbers', () => { assertEqual(add(1e10, 1e10), 2e10); });
test('add with Infinity', () => {
  assertEqual(add(Infinity, 1), Infinity);
  assertEqual(add(-Infinity, -1), -Infinity);
});
test('throws TypeError for string first arg', () => { assertThrows(() => add('2', 3), 'valid number'); });
test('throws TypeError for string second arg', () => { assertThrows(() => add(2, '3'), 'valid number'); });
test('throws TypeError for null', () => { assertThrows(() => add(null, 3), 'valid number'); });
test('throws TypeError for undefined', () => { assertThrows(() => add(undefined, 3), 'valid number'); });
test('throws TypeError for NaN', () => { assertThrows(() => add(NaN, 3), 'valid number'); });
test('throws TypeError for NaN second arg', () => { assertThrows(() => add(3, NaN), 'valid number'); });

// ─── subtract() ────────────────────────────────────────────
console.log('\n📐 subtract()');
test('subtracts two positive integers', () => { assertEqual(subtract(5, 3), 2); });
test('subtracts resulting in negative', () => { assertEqual(subtract(3, 5), -2); });
test('subtracts negative numbers', () => { assertEqual(subtract(5, -3), 8); });
test('subtracts from zero', () => { assertEqual(subtract(0, 5), -5); });
test('subtracts zero', () => { assertEqual(subtract(5, 0), 5); });
test('subtracts floating point', () => { assertClose(subtract(0.3, 0.1), 0.2); });
test('throws TypeError for non-numbers', () => { assertThrows(() => subtract('5', 2), 'valid number'); });
test('throws TypeError for NaN', () => { assertThrows(() => subtract(NaN, 2), 'valid number'); });

// ─── multiply() ────────────────────────────────────────────
console.log('\n📐 multiply()');
test('multiplies two positives', () => { assertEqual(multiply(4, 5), 20); });
test('multiplies with negative', () => { assertEqual(multiply(4, -5), -20); });
test('multiplies two negatives', () => { assertEqual(multiply(-4, -5), 20); });
test('multiplies by zero', () => { assertEqual(multiply(5, 0), 0); });
test('multiplies by one', () => { assertEqual(multiply(5, 1), 5); });
test('throws TypeError for non-numbers', () => { assertThrows(() => multiply('4', 5), 'valid number'); });
test('throws TypeError for NaN', () => { assertThrows(() => multiply(NaN, 5), 'valid number'); });

// ─── divide() ──────────────────────────────────────────────
console.log('\n📐 divide()');
test('divides two positives', () => { assertEqual(divide(10, 2), 5); });
test('divides with negative', () => { assertEqual(divide(10, -2), -5); });
test('divides floating point', () => { assertClose(divide(1, 3), 0.333333); });
test('divides zero', () => { assertEqual(divide(0, 5), 0); });
test('throws on division by zero', () => { assertThrows(() => divide(5, 0), 'Division by zero'); });
test('throws TypeError for non-numbers', () => { assertThrows(() => divide('10', 2), 'valid number'); });
test('throws TypeError for NaN', () => { assertThrows(() => divide(NaN, 2), 'valid number'); });

// ─── Calculator – constructor ──────────────────────────────
console.log('\n🧮 Calculator – constructor');
test('default value is 0', () => { assertEqual(new Calculator().value(), 0); });
test('constructor with initial value', () => { assertEqual(new Calculator(10).value(), 10); });
test('constructor with 0', () => { assertEqual(new Calculator(0).value(), 0); });
test('constructor with negative', () => { assertEqual(new Calculator(-5).value(), -5); });
test('constructor throws for string', () => { assertThrows(() => new Calculator('hello'), 'valid number'); });
test('constructor throws for NaN', () => { assertThrows(() => new Calculator(NaN), 'valid number'); });
test('constructor throws for null', () => { assertThrows(() => new Calculator(null), 'valid number'); });

// ─── Calculator – chaining ─────────────────────────────────
console.log('\n🧮 Calculator – chaining');
test('add is chainable', () => {
  const c = new Calculator();
  assert(c.add(5) instanceof Calculator);
  assertEqual(c.value(), 5);
});
test('subtract is chainable', () => {
  const c = new Calculator(10);
  assert(c.subtract(3) instanceof Calculator);
  assertEqual(c.value(), 7);
});
test('full chain: add->subtract->multiply->divide', () => {
  const c = new Calculator(0);
  c.add(10).subtract(3).multiply(2).divide(2);
  assertEqual(c.value(), 7);
});
test('long chain of adds and subtracts', () => {
  const c = new Calculator(0);
  c.add(1).add(2).add(3).subtract(4).subtract(5).add(6);
  assertEqual(c.value(), 3);
});
test('chain with negatives', () => {
  const c = new Calculator(0);
  c.add(-5).subtract(-3).add(10);
  assertEqual(c.value(), 8);
});
test('reset returns Calculator and sets value to 0', () => {
  const c = new Calculator(100);
  assert(c.reset() instanceof Calculator);
  assertEqual(c.value(), 0);
});
test('reset then chain', () => {
  const c = new Calculator(50);
  c.reset().add(25).subtract(5);
  assertEqual(c.value(), 20);
});

// ─── Calculator – type checking ────────────────────────────
console.log('\n🧮 Calculator – type checking');
test('add throws for string', () => { assertThrows(() => new Calculator().add('5'), 'valid number'); });
test('add throws for NaN', () => { assertThrows(() => new Calculator().add(NaN), 'valid number'); });
test('subtract throws for string', () => { assertThrows(() => new Calculator().subtract('5'), 'valid number'); });
test('subtract throws for NaN', () => { assertThrows(() => new Calculator().subtract(NaN), 'valid number'); });
test('multiply throws for string', () => { assertThrows(() => new Calculator().multiply('x'), 'valid number'); });
test('multiply throws for NaN', () => { assertThrows(() => new Calculator().multiply(NaN), 'valid number'); });
test('divide throws for string', () => { assertThrows(() => new Calculator().divide('x'), 'valid number'); });
test('divide throws for NaN', () => { assertThrows(() => new Calculator().divide(NaN), 'valid number'); });
test('divide throws on zero', () => { assertThrows(() => new Calculator(10).divide(0), 'Division by zero'); });

// ─── Calculator – history ──────────────────────────────────
console.log('\n🧮 Calculator – history');
test('history records operations', () => {
  const c = new Calculator(0);
  c.add(5).subtract(2);
  const h = c.history();
  assertEqual(h.length, 3);
  assertEqual(h[0].op, 'init');
  assertEqual(h[1].op, 'add');
  assertEqual(h[1].operand,
 5);
  assertEqual(h[2].op, 'subtract');
  assertEqual(h[2].operand, 2);
});
test('history returns a copy', () => {
  const c = new Calculator(0);
  c.add(5);
  const h1 = c.history();
  h1.pop();
  assert(c.history().length === 2);
});
test('history records old/new values', () => {
  const c = new Calculator(0);
  c.add(10);
  const entry = c.history()[1];
  assertEqual(entry.oldValue, 0);
  assertEqual(entry.newValue, 10);
});
test('clearHistory empties history', () => {
  const c = new Calculator(0);
  c.add(5).subtract(1);
  c.clearHistory();
  assertEqual(c.history().length, 0);
});
test('history includes ISO timestamp', () => {
  const c = new Calculator(0);
  c.add(5);
  const t = c.history()[1].timestamp;
  assert(typeof t === 'string' && t.includes('T'));
});
test('history after undo shrinks', () => {
  const c = new Calculator(0);
  c.add(10).add(20).add(30);
  assertEqual(c.history().length, 4);
  c.undo();
  assertEqual(c.history().length, 3);
  assertEqual(c.history()[2].op, 'add');
  assertEqual(c.history()[2].operand, 20);
});
test('history records reset', () => {
  const c = new Calculator(50);
  c.add(10).reset();
  const h = c.history();
  assertEqual(h.length, 3);
  assertEqual(h[2].op, 'reset');
  assertEqual(h[2].newValue, 0);
  assertEqual(h[2].oldValue, 60);
});

// Calculator - undo
console.log('\n🧮 Calculator – undo');
test('undo reverts last operation', () => {
  const c = new Calculator(0);
  c.add(10).add(5);
  assertEqual(c.value(), 15);
  c.undo();
  assertEqual(c.value(), 10);
});
test('undo works for subtract', () => {
  const c = new Calculator(10);
  c.subtract(3);
  assertEqual(c.value(), 7);
  c.undo();
  assertEqual(c.value(), 10);
});
test('undo multiple times', () => {
  const c = new Calculator(0);
  c.add(10).subtract(3).add(7);
  assertEqual(c.value(), 14);
  c.undo(); assertEqual(c.value(), 7);
  c.undo(); assertEqual(c.value(), 10);
});
test('undo past init returns false', () => {
  const c = new Calculator(5);
  c.undo();
  assertEqual(c.value(), 0);
  assertEqual(c.undo(), false);
});
test('undo after reset restores pre-reset value', () => {
  const c = new Calculator(100);
  c.reset();
  assertEqual(c.value(), 0);
  c.undo();
  assertEqual(c.value(), 100);
});
test('undo then new operation replaces undone state', () => {
  const c = new Calculator(0);
  c.add(10).add(5);
  assertEqual(c.value(), 15);
  c.undo();
  assertEqual(c.value(), 10);
  c.add(20);
  assertEqual(c.value(), 30);
  assertEqual(c.history().length, 3);
});

// Calculator - memory
console.log('\n🧮 Calculator – memory');
test('memory starts at 0', () => { assertEqual(new Calculator().memoryRecall(), 0); });
test('memoryStore saves current value', () => {
  const c = new Calculator(42);
  c.memoryStore();
  assertEqual(c.memoryRecall(), 42);
});
test('memoryAdd', () => {
  const c = new Calculator(10);
  c.memoryStore();
  c.add(5);
  c.memoryAdd();
  assertEqual(c.memoryRecall(), 25);
});
test('memorySubtract', () => {
  const c = new Calculator(100);
  c.memoryStore();
  c.reset().add(30);
  c.memorySubtract();
  assertEqual(c.memoryRecall(), 70);
});
test('memoryClear', () => {
  const c = new Calculator(50);
  c.memoryStore();
  c.memoryClear();
  assertEqual(c.memoryRecall(), 0);
});
test('memory ops are chainable', () => {
  const c = new Calculator(10);
  assert(c.memoryStore().memoryClear() instanceof Calculator);
});
test('memory unaffected by undo', () => {
  const c = new Calculator(20);
  c.memoryStore();
  c.add(10);
  c.undo();
  assertEqual(c.memoryRecall(), 20);
});

// Calculator - edge cases
console.log('\n🧮 Calculator – edge cases');
test('large numbers', () => {
  const c = new Calculator(Number.MAX_SAFE_INTEGER);
  c.subtract(1);
  assertEqual(c.value(), Number.MAX_SAFE_INTEGER - 1);
});
test('small numbers', () => {
  const c = new Calculator(Number.MIN_SAFE_INTEGER);
  c.add(1);
  assertEqual(c.value(), Number.MIN_SAFE_INTEGER + 1);
});
test('multiple resets', () => {
  const c = new Calculator(100);
  c.reset().reset().reset();
  assertEqual(c.value(), 0);
});
test('add/subtract cancel out', () => {
  const c = new Calculator(5);
  c.add(10).subtract(10);
  assertEqual(c.value(), 5);
});
test('floating point chain', () => {
  const c = new Calculator(0);
  c.add(0.1).add(0.2).subtract(0.15);
  assertClose(c.value(), 0.15);
});
test('independent instances', () => {
  const c1 = new Calculator(10);
  const c2 = new Calculator(20);
  c1.add(5);
  c2.subtract(5);
  assertEqual(c1.value(), 15);
  assertEqual(c2.value(), 15);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' total');
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f, i) { console.log('  ' + (i + 1) + '. ' + f.name + ': ' + f.error); });
}
console.log('');

process.exit(failed > 0 ? 1 : 0);
