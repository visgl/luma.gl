import {test as vitestTest, expect} from 'vitest';

type TestCallback = (test: Test) => void | Promise<void>;

type MatchPattern = RegExp | string;

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value: unknown, seenValues: WeakSet<object> = new WeakSet()): unknown {
  if (isArrayBufferView(value)) {
    return Array.from(value as ArrayLike<number>);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, seenValues));
  }

  if (isPlainObject(value)) {
    if (seenValues.has(value)) {
      return '[Circular]';
    }

    seenValues.add(value);
    const normalizedObject: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      normalizedObject[key] = normalizeValue(entryValue, seenValues);
    }
    seenValues.delete(value);
    return normalizedObject;
  }

  return value;
}

function formatMessage(messages: unknown[]): string {
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

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return Boolean(value) && typeof (value as Promise<unknown>).then === 'function';
}

function normalizeThrowsArgs(
  expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
  message?: string
): {
  expected?: MatchPattern | (new (...args: never[]) => Error);
  message?: string;
} {
  if (typeof expectedOrMessage === 'string' && message === undefined) {
    return {message: expectedOrMessage};
  }

  return {
    expected: expectedOrMessage as MatchPattern | (new (...args: never[]) => Error) | undefined,
    message
  };
}

function usesExplicitEndSignal(callback: TestCallback): boolean {
  return /\.end\s*\(/.test(callback.toString());
}

export interface Test {
  comment(...messages: unknown[]): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  deepEquals(actual: unknown, expected: unknown, message?: string): void;
  doesNotThrow(callback: () => unknown, message?: string): void;
  end(): void;
  equal(actual: unknown, expected: unknown, message?: string): void;
  equals(actual: unknown, expected: unknown, message?: string): void;
  error(error: unknown, message?: string): void;
  fail(message?: string): never;
  false(value: unknown, message?: string): void;
  is(actual: unknown, expected: unknown, message?: string): void;
  isEqual(actual: unknown, expected: unknown, message?: string): void;
  match(actual: string, expected: MatchPattern, message?: string): void;
  notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
  notEqual(actual: unknown, expected: unknown, message?: string): void;
  notOk(value: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
  pass(message?: string): void;
  plan(assertionCount: number): void;
  teardown(callback: () => void | Promise<void>): void;
  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void;
  timeoutAfter(timeoutMilliseconds: number): void;
  true(value: unknown, message?: string): void;
}

class VitestTape implements Test {
  private actualAssertionCount: number = 0;
  private endPromise: Promise<void>;
  private endResolver: (() => void) | null = null;
  private hasEnded: boolean = false;
  private plannedAssertionCount?: number;
  private teardownCallbacks: Array<() => void | Promise<void>> = [];
  private timeoutMilliseconds?: number;

  constructor() {
    this.endPromise = new Promise(resolve => {
      this.endResolver = resolve;
    });
  }

  comment(...messages: unknown[]): void {
    const message = formatMessage(messages);
    if (message) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(normalizeValue(actual), message).toEqual(normalizeValue(expected));
  }

  deepEquals(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  doesNotThrow(callback: () => unknown, message?: string): void {
    this.countAssertion();
    expect(callback, message).not.toThrow();
  }

  end(): void {
    if (this.hasEnded) {
      return;
    }

    this.hasEnded = true;
    this.endResolver?.();
  }

  equal(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(actual, message).toBe(expected);
  }

  equals(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  error(error: unknown, message?: string): void {
    this.countAssertion();
    expect(error, message).toBeFalsy();
  }

  fail(message?: string): never {
    this.countAssertion();
    throw new Error(message || 'Forced failure');
  }

  false(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  is(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  isEqual(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  match(actual: string, expected: MatchPattern, message?: string): void {
    this.countAssertion();
    if (typeof expected === 'string') {
      expect(actual, message).toContain(expected);
      return;
    }
    expect(actual, message).toMatch(expected);
  }

  notDeepEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(normalizeValue(actual), message).not.toEqual(normalizeValue(expected));
  }

  notEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(actual, message).not.toBe(expected);
  }

  notOk(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  ok(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  pass(message?: string): void {
    this.countAssertion();
    expect(true, message).toBe(true);
  }

  plan(assertionCount: number): void {
    this.plannedAssertionCount = assertionCount;
  }

  teardown(callback: () => void | Promise<void>): void {
    this.teardownCallbacks.push(callback);
  }

  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    if (expected === undefined) {
      expect(callback, normalizedMessage).toThrow();
      return;
    }
    expect(callback, normalizedMessage).toThrow(expected as MatchPattern);
  }

  timeoutAfter(timeoutMilliseconds: number): void {
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  true(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  async run(callback: TestCallback): Promise<void> {
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

  private countAssertion(): void {
    this.actualAssertionCount++;
  }
}

export type TapeTestFunction = {
  (name: string, callback: TestCallback): ReturnType<typeof vitestTest>;
  only: (name: string, callback: TestCallback) => ReturnType<typeof vitestTest.only>;
  skip: (name: string, callback?: TestCallback) => ReturnType<typeof vitestTest.skip>;
};

function wrapTest(
  vitestImplementation: typeof vitestTest | typeof vitestTest.only
): (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation> {
  return ((name: string, callback?: TestCallback) =>
    vitestImplementation(name, async () => {
      if (!callback) {
        return;
      }

      const tapeTest = new VitestTape();
      const result = tapeTest.run(callback);

      if (isPromiseLike(result)) {
        await result;
      }
    })) as (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation>;
}

const test = wrapTest(vitestTest) as TapeTestFunction;

test.only = wrapTest(vitestTest.only);
test.skip = wrapTest(vitestTest.skip);

export default test;
