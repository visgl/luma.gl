// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO - replace with Promise.withResolvers once we upgrade TS baseline
export function withResolvers<T>(): {
  promise: Promise<T>;
  resolve: (t: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (t: T) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  // @ts-expect-error - in fact these are no used before initialized
  return {promise, resolve, reject};
}
