// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {GlyphRangeLoader, parseGlyphRange, createGlyphFontRenderer} from '../../src/fonts';
import {makeGlyphRange, makeGlyphResponse} from './glyph-range-fixture';

test('decodes metrics, negative bearings and bitmap bytes without a DOM', () => {
  const [glyph] = parseGlyphRange(makeGlyphRange([65]));
  expect(glyph).toMatchObject({id: 65, width: 1, height: 1, left: -2, top: 2, advance: 5});
  expect(glyph.bitmap).toHaveLength(49);
  const renderer = createGlyphFontRenderer(new Map([[65, glyph]]));
  expect(renderer.measure('A')).toEqual({advance: 5, width: 1, ascent: 2, descent: -1});
  expect(renderer.measure('B').advance).toBe(0);
});

test.each([
  {bitmap: []},
  {bitmap: Array(36).fill(0)}
])('preserves blank glyph advances with bitmap $bitmap', ({bitmap}) => {
  const [glyph] = parseGlyphRange(makeGlyphRange([32], {width: 0, height: 0, bitmap}));
  expect(glyph).toMatchObject({id: 32, width: 0, height: 0, advance: 5});
  expect(glyph.bitmap).toHaveLength(bitmap.length);
});

test('rejects incorrectly sized blank glyph bitmaps', () => {
  expect(parseGlyphRange(makeGlyphRange([32], {width: 0, height: 0, bitmap: [0]}))).toEqual([]);
});

test.each(
  [[10, 2, 0], [9, 1], [13, 1], [128]].map(bytes => ({bytes}))
)('rejects truncated protocol buffers $bytes', ({bytes}) => {
  expect(() => parseGlyphRange(new Uint8Array(bytes))).toThrow();
});

test('shares concurrent range fetches and decodes, including supplementary Unicode', async () => {
  const fetch = vi.fn(async () => makeGlyphResponse([65, 66, 0x1f600]));
  const loader = new GlyphRangeLoader({
    url: 'https://fonts.example/{fontstack}/{range}.pbf',
    fetch
  });
  const [first, second] = await Promise.all([
    loader.loadGlyphs('Regular', ['AB']),
    loader.loadGlyphs('Regular', ['A'])
  ]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(first.get(65)).toBe(second.get(65));
  expect(first.size).toBe(2);
  expect(second.size).toBe(1);
  const supplementary = await loader.loadGlyphs('Regular', ['😀']);
  expect(supplementary.get(0x1f600)?.id).toBe(0x1f600);
  expect(fetch.mock.calls).toHaveLength(2);
  expect((fetch.mock.calls as unknown[][])[1][0]).toContain('128512-128767');
});

test('resolves relative templates, encodes names, and forwards caller fetch options', async () => {
  const fetch = vi.fn(async () => makeGlyphResponse([65]));
  const fetchOptions = {headers: {'X-Test': 'glyphs'}};
  const loader = new GlyphRangeLoader({
    url: '../fonts/{fontstack}/{range}.pbf',
    baseUrl: 'https://example.com/styles/main.json',
    fetch,
    fetchOptions
  });
  await loader.loadGlyphs('A/B?#,Regular', ['A']);
  expect(fetch).toHaveBeenCalledWith(
    'https://example.com/fonts/A%2FB%3F%23,Regular/0-255.pbf',
    fetchOptions
  );
  expect(() => loader.getRangeUrl('..', 0)).toThrow();
});

test('failures reject every waiter and a subsequent load retries', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('', {status: 503}))
    .mockImplementation(async () => makeGlyphResponse([65]));
  const loader = new GlyphRangeLoader({url: 'https://example.com/{fontstack}/{range}', fetch});
  const results = await Promise.allSettled([
    loader.loadGlyphs('Regular', ['A']),
    loader.loadGlyphs('Regular', ['A'])
  ]);
  expect(results.map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((await loader.loadGlyphs('Regular', ['A'])).has(65)).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('evicts completed LRU ranges without invalidating returned glyph snapshots', async () => {
  const fetch = vi.fn(async () => makeGlyphResponse([65, 257]));
  const loader = new GlyphRangeLoader({
    url: 'https://example.com/{fontstack}/{range}',
    fetch,
    maxRanges: 1
  });
  const first = await loader.loadGlyphs('Regular', ['A']);
  await loader.loadGlyphs('Regular', ['ā']);
  await loader.loadGlyphs('Regular', ['ā']);
  expect(fetch).toHaveBeenCalledTimes(2);
  await loader.loadGlyphs('Regular', ['A']);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(first.get(65)?.advance).toBe(5);
});

test('capacity zero still deduplicates pending loads and empty text performs no fetch', async () => {
  const fetch = vi.fn(async () => makeGlyphResponse([65]));
  const loader = new GlyphRangeLoader({
    url: 'https://example.com/{fontstack}/{range}',
    fetch,
    maxRanges: 0
  });
  await loader.loadGlyphs('Regular', []);
  expect(fetch).not.toHaveBeenCalled();
  await Promise.all([loader.loadGlyphs('Regular', ['A']), loader.loadGlyphs('Regular', ['A'])]);
  expect(fetch).toHaveBeenCalledTimes(1);
  await loader.loadGlyphs('Regular', ['A']);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(() => new GlyphRangeLoader({url: 'x', maxRanges: -1})).toThrow();
});

test('evicting completed ranges does not duplicate a still-pending request', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const fetch = vi.fn(async (url: string | URL | Request) => {
    if (String(url).includes('0-255')) await pending;
    return makeGlyphResponse([65, 257]);
  });
  const loader = new GlyphRangeLoader({
    url: 'https://example.com/{fontstack}/{range}',
    fetch,
    maxRanges: 0
  });
  const first = loader.loadGlyphs('Regular', ['A']);
  await loader.loadGlyphs('Regular', ['ā']);
  const second = loader.loadGlyphs('Regular', ['A']);
  release();
  const snapshots = await Promise.all([first, second]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(snapshots[0].get(65)).toBe(snapshots[1].get(65));
});

test('font stacks are isolated and absent glyphs are omitted without refetching', async () => {
  const fetch = vi.fn(async () => makeGlyphResponse([65]));
  const loader = new GlyphRangeLoader({url: 'https://example.com/{fontstack}/{range}', fetch});
  expect((await loader.loadGlyphs('Regular', ['AB'])).has(66)).toBe(false);
  await loader.loadGlyphs('Regular', ['B']);
  await loader.loadGlyphs('Bold', ['A']);
  expect(fetch).toHaveBeenCalledTimes(2);
});
