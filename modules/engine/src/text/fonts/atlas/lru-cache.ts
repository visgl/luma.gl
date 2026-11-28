// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Minimal insertion-ordered LRU cache owned by font atlas generation. */
export class LRUCache<ValueT> {
  private readonly cache = new Map<string, ValueT>();
  private limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  /** Increases capacity while preserving entries and their recency. */
  grow(limit: number): void {
    this.limit = Math.max(this.limit, limit);
  }

  get(key: string): ValueT | undefined {
    const value = this.cache.get(key);
    if (value === undefined) {
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: string, value: ValueT): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    while (this.cache.size > this.limit) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.cache.delete(oldestKey);
    }
  }
}
