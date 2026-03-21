import {test as vitestTest, expect} from 'vitest';

function isArrayBufferView(value) {
  return ArrayBuffer.isView(value);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value, seenValues = new WeakSet()) {
  if (isArrayBufferView(value)) {
    return Array.from(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, seenValues));
  }

  if (isPlainObject(value)) {
    if (seenValues.has(value)) {
      return '[Circular]';
    }

    seenValues.add(value);
    const normalizedObject = {};
    for (const [key, entryValue] of Object.entries(value)) {
      normalizedObject[key] = normalizeValue(entryValue, seenValues);
    }
    seenValues.delete(value);
    return normalizedObject;
  }

  return value;
}

function formatMessage(messages) {
  return messages
    .map(message => {
      if (typeof message === 'string') {
        return message;
      }
      try {
        return JSON.stringify(message);
      } catch {
        return String(message);
      }
    })
    .join(' ');
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function normalizeThrowsArgs(expectedOrMessage, message) {
  if (typeof expectedOrMessage === 'string' && message === undefined) {
    return {message: expectedOrMessage};
  }

  return {
    expected: expectedOrMessage,
    message
  };
}

function usesExplicitEndSignal(callback) {
  return /\.end\s*\(/.test(callback.toString());
}

class VitestTape {
  actualAssertionCount = 0;

  endPromise;

  endResolver = null;

  hasEnded = false;

  plannedAssertionCount;

  teardownCallbacks = [];

  timeoutMilliseconds;

  constructor() {
    this.endPromise = new Promise(resolve => {
      this.endResolver = resolve;
    });
  }

  comment(...messages) {
    const message = formatMessage(messages);
    if (message) {
      console.log(message);
    }
  }

  deepEqual(actual, expected, message) {
    this.countAssertion();
    expect(normalizeValue(actual), message).toEqual(normalizeValue(expected));
  }

  deepEquals(actual, expected, message) {
    this.deepEqual(actual, expected, message);
  }

  doesNotThrow(callback, message) {
    this.countAssertion();
    expect(callback, message).not.toThrow();
  }

  end() {
    if (this.hasEnded) {
      return;
    }

    this.hasEnded = true;
    this.endResolver?.();
  }

  equal(actual, expected, message) {
    this.countAssertion();
    expect(actual, message).toBe(expected);
  }

  equals(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  error(error, message) {
    this.countAssertion();
    expect(error, message).toBeFalsy();
  }

  fail(message) {
    this.countAssertion();
    throw new Error(message || 'Forced failure');
  }

  false(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  is(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  isEqual(actual, expected, message) {
    this.equal(actual, expected, message);
  }

  match(actual, expected, message) {
    this.countAssertion();
    if (typeof expected === 'string') {
      expect(actual, message).toContain(expected);
      return;
    }
    expect(actual, message).toMatch(expected);
  }

  notDeepEqual(actual, expected, message) {
    this.countAssertion();
    expect(normalizeValue(actual), message).not.toEqual(normalizeValue(expected));
  }

  notEqual(actual, expected, message) {
    this.countAssertion();
    expect(actual, message).not.toBe(expected);
  }

  notOk(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  ok(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  pass(message) {
    this.countAssertion();
    expect(true, message).toBe(true);
  }

  plan(assertionCount) {
    this.plannedAssertionCount = assertionCount;
  }

  teardown(callback) {
    this.teardownCallbacks.push(callback);
  }

  throws(callback, expectedOrMessage, message) {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    if (expected === undefined) {
      expect(callback, normalizedMessage).toThrow();
      return;
    }
    expect(callback, normalizedMessage).toThrow(expected);
  }

  timeoutAfter(timeoutMilliseconds) {
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  true(value, message) {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  async run(callback) {
    try {
      const waitsForEnd = usesExplicitEndSignal(callback);

      if (this.timeoutMilliseconds === undefined) {
        await callback(this);
      } else {
        await Promise.race([
          callback(this),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
              this.timeoutMilliseconds
            )
          )
        ]);
      }

      if (waitsForEnd) {
        if (this.timeoutMilliseconds === undefined) {
          await this.endPromise;
        } else {
          await Promise.race([
            this.endPromise,
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
                this.timeoutMilliseconds
              )
            )
          ]);
        }
      }

      if (this.plannedAssertionCount !== undefined) {
        expect(this.actualAssertionCount).toBe(this.plannedAssertionCount);
      }
    } finally {
      for (const teardownCallback of this.teardownCallbacks.reverse()) {
        await teardownCallback();
      }
    }
  }

  countAssertion() {
    this.actualAssertionCount++;
  }
}

function wrapTest(vitestImplementation) {
  return (name, callback) =>
    vitestImplementation(name, async () => {
      if (!callback) {
        return;
      }

      const tapeTest = new VitestTape();
      const result = tapeTest.run(callback);

      if (isPromiseLike(result)) {
        await result;
      }
    });
}

const test = wrapTest(vitestTest);

test.only = wrapTest(vitestTest.only);
test.skip = wrapTest(vitestTest.skip);

export default test;

