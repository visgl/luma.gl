type TestCallback = (test: Test) => void | Promise<void>;

type MatchPattern = RegExp | string;

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

export type TapeTestFunction = {
  (name: string, callback: TestCallback): unknown;
  only: (name: string, callback: TestCallback) => unknown;
  skip: (name: string, callback?: TestCallback) => unknown;
};

declare const test: TapeTestFunction;

export default test;

