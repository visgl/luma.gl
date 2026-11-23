// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Adapted from deck.gl-community glyph range utilities under the MIT License.

import {GLYPH_RANGE_SIZE, parseGlyphRange, type Glyph} from './glyph-pbf';

/** Network and cache options for a font-stack glyph range endpoint. */
export type GlyphRangeLoaderOptions = {
  /** URL template containing `{fontstack}` and `{range}` (inclusive 256-code-point ranges). */
  url: string;
  /** Base URL for a relative template. */
  baseUrl?: string;
  /** Caller-owned network policy; defaults to global fetch. */
  fetch?: typeof fetch;
  fetchOptions?: RequestInit;
  /** Maximum completed ranges retained across all font stacks. Defaults to 64. */
  maxRanges?: number;
};

type RangeEntry = {
  promise: Promise<ReadonlyMap<number, Glyph>>;
  completed: boolean;
};

/**
 * CPU-only glyph acquisition shared by independent text renderers and atlas builders.
 * Concurrent requests share their fetch and decode. Completed ranges use a bounded LRU cache;
 * in-flight requests are retained until they settle. Failures reject and can be retried.
 * Local-font substitution, tile readiness, placement and GPU resource ownership belong to callers.
 */
export class GlyphRangeLoader {
  readonly url: string;
  private readonly fetch: typeof fetch;
  private readonly fetchOptions?: RequestInit;
  private readonly maxRanges: number;
  private readonly ranges = new Map<string, RangeEntry>();

  constructor(options: GlyphRangeLoaderOptions) {
    // Preserve template braces when resolving a relative URL.
    this.url = options.baseUrl
      ? new URL(options.url, options.baseUrl).href.replace(/%7B/gi, '{').replace(/%7D/gi, '}')
      : options.url;
    this.fetch =
      options.fetch || ((...arguments_: Parameters<typeof fetch>) => fetch(...arguments_));
    this.fetchOptions = options.fetchOptions;
    this.maxRanges = options.maxRanges ?? 64;
    if (!Number.isInteger(this.maxRanges) || this.maxRanges < 0) {
      throw new RangeError('Invalid range cache capacity');
    }
  }

  /** Encodes font names individually so they cannot inject path, query or fragment syntax. */
  getRangeUrl(fontStack: string, range: number): string {
    const first = range * GLYPH_RANGE_SIZE;
    const encoded = fontStack
      .split(',')
      .map(name => {
        // URL parsers normalize percent-encoded dot-only path segments too: reject them.
        if (/^\.+$/.test(name)) throw new Error('Invalid font name');
        return encodeURIComponent(name);
      })
      .join(',');
    return this.url.replace(/\{(fontstack|range)\}/g, (_, name: string) =>
      name === 'fontstack' ? encoded : `${first}-${first + GLYPH_RANGE_SIZE - 1}`
    );
  }

  /**
   * Loads the ranges required by `texts` and returns a caller-owned map of available glyphs.
   * Missing glyphs are omitted. The snapshot survives cache eviction and subsequent loads.
   * Text iteration is by Unicode code point, including supplementary-plane characters.
   */
  async loadGlyphs(
    fontStack: string,
    texts: Iterable<string>
  ): Promise<ReadonlyMap<number, Glyph>> {
    const codePoints = new Set<number>();
    const rangeIds = new Set<number>();
    for (const text of texts) {
      for (const character of text) {
        const codePoint = character.codePointAt(0)!;
        codePoints.add(codePoint);
        rangeIds.add(Math.floor(codePoint / GLYPH_RANGE_SIZE));
      }
    }
    const ranges = await Promise.all([...rangeIds].map(range => this.loadRange(fontStack, range)));
    const glyphs = new Map<number, Glyph>();
    for (const range of ranges) {
      for (const [codePoint, glyph] of range) {
        if (codePoints.has(codePoint)) glyphs.set(codePoint, glyph);
      }
    }
    return glyphs;
  }

  private loadRange(fontStack: string, range: number): Promise<ReadonlyMap<number, Glyph>> {
    const url = this.getRangeUrl(fontStack, range);
    const existing = this.ranges.get(url);
    if (existing) {
      this.ranges.delete(url);
      this.ranges.set(url, existing);
      return existing.promise;
    }
    const entry: RangeEntry = {
      completed: false,
      promise: Promise.resolve()
        .then(async () => {
          const response = await this.fetch(url, this.fetchOptions);
          if (!response.ok) throw new Error(`Glyph range HTTP ${response.status}`);
          const glyphs = new Map<number, Glyph>();
          for (const glyph of parseGlyphRange(await response.arrayBuffer())) {
            if (Math.floor(glyph.id / GLYPH_RANGE_SIZE) === range) glyphs.set(glyph.id, glyph);
          }
          return glyphs;
        })
        .then(
          glyphs => {
            entry.completed = true;
            this.trimCache();
            return glyphs;
          },
          error => {
            this.ranges.delete(url);
            throw error;
          }
        )
    };
    this.ranges.set(url, entry);
    return entry.promise;
  }

  private trimCache(): void {
    let completed = [...this.ranges.values()].filter(entry => entry.completed).length;
    for (const [url, entry] of this.ranges) {
      if (completed <= this.maxRanges) break;
      if (entry.completed) {
        this.ranges.delete(url);
        completed--;
      }
    }
  }
}
