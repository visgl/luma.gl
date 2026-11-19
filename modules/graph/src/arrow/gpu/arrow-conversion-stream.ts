// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Pull-based source accepted by Arrow streaming converters. */
export type ArrowConversionSource<Source> =
  | Iterable<Source>
  | AsyncIterable<Source>
  | AsyncIterator<Source>;

/** Cancellation shared by Arrow streaming converters. */
export type ArrowConversionStreamOptions = {
  /** Abort pending reads; already yielded GPU results remain caller-owned. */
  signal?: AbortSignal;
};

/** Converts one item per pull and releases results rejected before ownership transfers. */
export async function* convertArrowStream<Source, Result extends {destroy(): void}>(
  source: ArrowConversionSource<Source>,
  convert: (value: Source) => Result | Promise<Result>,
  validate: (result: Result, value: Source) => void,
  {signal}: ArrowConversionStreamOptions
): AsyncGenerator<Result> {
  for await (const value of iterateSource(source, signal)) {
    signal?.throwIfAborted();
    const result = await convert(value);
    try {
      signal?.throwIfAborted();
      validate(result, value);
    } catch (error) {
      result.destroy();
      throw error;
    }
    yield result;
  }
}

/** Checks a stable output shape, including optional companion vectors. */
export function validateArrowStreamFormats(
  expected: Map<string, string | undefined>,
  formats: Record<string, string | undefined>
): void {
  for (const [name, format] of Object.entries(formats)) {
    if (expected.has(name) && expected.get(name) !== format) {
      throw new Error(
        `Arrow stream column "${name}" format changed: ${expected.get(name) ?? 'missing'} -> ${format ?? 'missing'}`
      );
    }
    expected.set(name, format);
  }
}

/** Pulls one batch at a time, allowing abort to interrupt a stalled next(). */
async function* iterateSource<Source>(
  source: ArrowConversionSource<Source>,
  signal?: AbortSignal
): AsyncGenerator<Source> {
  signal?.throwIfAborted();
  const iterator =
    Symbol.asyncIterator in source
      ? source[Symbol.asyncIterator]()
      : Symbol.iterator in source
        ? source[Symbol.iterator]()
        : source;
  let completed = false;
  try {
    for (;;) {
      const result = await readSource(iterator, signal);
      signal?.throwIfAborted();
      if (result.done) {
        completed = true;
        return;
      }
      yield result.value;
    }
  } finally {
    if (!completed) {
      // Async generators may queue return() behind a stalled next(); do not delay abort.
      const cleanup = Promise.resolve().then(() => iterator.return?.());
      if (signal?.aborted) void cleanup.catch(() => {});
      else await cleanup;
    }
  }
}

function readSource<Source>(
  iterator: Iterator<Source> | AsyncIterator<Source>,
  signal?: AbortSignal
): Promise<IteratorResult<Source>> {
  signal?.throwIfAborted();
  if (!signal) return Promise.resolve(iterator.next());
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, {once: true});
    Promise.resolve()
      .then(() => {
        signal.throwIfAborted();
        return iterator.next();
      })
      .then(
        result => {
          signal.removeEventListener('abort', abort);
          resolve(result);
        },
        error => {
          signal.removeEventListener('abort', abort);
          reject(error);
        }
      );
  });
}
