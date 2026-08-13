// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import type {
  LocalGaussianSplatLoadersConfiguration,
  LocalGaussianSplatRADMetadata
} from '../../examples/showcase/gaussian-splats/local-loaders';
import {createGaussianSplatRADWorkerDecoder} from '../../examples/showcase/gaussian-splats/rad-worker-decoder';

describe('Gaussian splat RAD browser worker', () => {
  test('decodes a real RAD chunk off-thread with Arrow metadata, source rows, SH, and LoD opacity', async () => {
    const loaderBundleUrl = new URL(
      '/website/static/standalone-examples/gaussian-splats/loaders-gl.mjs',
      window.location.href
    ).href;
    const configuration: LocalGaussianSplatLoadersConfiguration = {
      loaderMode: 'bundled',
      loadersRoot: '',
      loaderBundleUrl,
      sourceUrl: 'https://example.test/coit.rad',
      sourceUrls: ['https://example.test/coit.rad'],
      fallbackSourceUrls: [],
      sourceFormat: 'RAD',
      sceneId: 'coit',
      sourceLabel: 'Worker RAD fixture',
      upAxis: 'z',
      up: [0, 0, 1]
    };
    const decoder = createGaussianSplatRADWorkerDecoder(configuration, {maxWorkers: 1});
    expect(decoder?.mode).toBe('worker');
    expect(decoder?.workerCount).toBe(1);
    if (!decoder) {
      throw new Error('The real browser did not create its Gaussian RAD module worker.');
    }

    const chunk = makeGaussianBrowserRADChunk();
    const metadata: LocalGaussianSplatRADMetadata = {
      count: 2,
      chunks: [{chunkIndex: 7, base: 65_536, count: 2, bytes: chunk.byteLength}],
      maxSh: 1,
      lodTree: true,
      splatEncoding: {lodOpacity: true}
    };
    const signal = new AbortController().signal;
    let defaultParserCalls = 0;
    let fetchCalls = 0;
    const page = await decoder.decodePage({
      chunkIndex: 7,
      sourceUrl: configuration.sourceUrl,
      metadata,
      signal,
      fetchChunkBytes: async () => {
        fetchCalls++;
        return chunk;
      },
      decodeDefault: async () => {
        defaultParserCalls++;
        throw new Error('RAD decoding incorrectly fell back to the main thread.');
      }
    });

    expect(fetchCalls).toBe(1);
    expect(defaultParserCalls).toBe(0);
    expect(decoder.completedDecodeCount).toBe(1);
    expect(chunk.byteLength).toBe(0);
    expect(page.data.numRows).toBe(2);
    expect(page.loaderData).toMatchObject({
      base: 65_536,
      chunkIndex: 7,
      maxSh: 1,
      lodTree: true,
      splatEncoding: {lodOpacity: true}
    });
    expect(Array.from(page.loaderData.childCounts!)).toEqual([1, 0]);
    expect(Array.from(page.loaderData.childStarts!)).toEqual([131_072, 0]);
    expect(page.data.getChild('opacity')?.get(0)).toBeCloseTo((128 / 255) * 2);
    expect(page.data.getChild('opacity')?.get(1)).toBeCloseTo((64 / 255) * 2);
    expect(page.data.getChild('f_rest_8')?.get(1)).toBeCloseTo(1.7);
    expect(page.data.schema.metadata?.get('loaders_gl.gaussian_splats.source_format')).toBe('rad');
    const opacityField = page.data.schema.fields.find(field => field.name === 'opacity');
    expect(opacityField?.metadata?.get('loaders_gl.gaussian_splats.encoding')).toBe('linear');

    decoder.destroy();
    expect(decoder.workerCount).toBe(0);
    decoder.destroy();
  });

  test('retries the root page when an accepted module worker fails asynchronously', async () => {
    const loaderBundleUrl = new URL(
      '/website/static/standalone-examples/gaussian-splats/loaders-gl.mjs',
      window.location.href
    ).href;
    const loaderBundle = await import(/* @vite-ignore */ loaderBundleUrl);
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() =>
      originalCreateObjectURL(
        new Blob(['throw new Error("Module workers are blocked by the content security policy")'], {
          type: 'text/javascript'
        })
      )
    );
    const configuration: LocalGaussianSplatLoadersConfiguration = {
      loaderMode: 'bundled',
      loadersRoot: '',
      loaderBundleUrl,
      sourceUrl: 'https://example.test/coit.rad',
      sourceUrls: ['https://example.test/coit.rad'],
      fallbackSourceUrls: [],
      sourceFormat: 'RAD',
      sceneId: 'coit',
      sourceLabel: 'Worker startup fallback fixture',
      upAxis: 'z',
      up: [0, 0, 1]
    };
    const metadata: LocalGaussianSplatRADMetadata = {
      count: 2,
      chunks: [{chunkIndex: 0, base: 65_536, count: 2, bytes: 0}],
      maxSh: 1,
      lodTree: true,
      splatEncoding: {lodOpacity: true}
    };
    const decoder = createGaussianSplatRADWorkerDecoder(configuration, {maxWorkers: 1});

    try {
      expect(decoder?.mode).toBe('worker');
      expect(decoder?.workerCount).toBe(1);
      if (!decoder) {
        throw new Error('The browser did not accept the intentionally failing module worker.');
      }

      let fallbackCalls = 0;
      const page = await decoder.decodePage({
        chunkIndex: 0,
        sourceUrl: configuration.sourceUrl,
        metadata,
        signal: new AbortController().signal,
        fetchChunkBytes: async () => makeGaussianBrowserRADChunk(),
        decodeDefault: async () => {
          fallbackCalls++;
          return loaderBundle.parseRADChunk(makeGaussianBrowserRADChunk(), {
            radChunk: {
              splatEncoding: metadata.splatEncoding,
              includeLoDTree: true,
              includeSphericalHarmonics: true
            }
          });
        }
      });

      expect(decoder.mode).toBe('main-thread');
      expect(decoder.workerCount).toBe(0);
      expect(decoder.completedDecodeCount).toBe(1);
      expect(fallbackCalls).toBe(1);
      expect(page.data.numRows).toBe(2);
      expect(page.loaderData).toMatchObject({
        base: 65_536,
        maxSh: 1,
        lodTree: true,
        splatEncoding: {lodOpacity: true}
      });
      expect(Array.from(page.loaderData.childCounts!)).toEqual([1, 0]);
      expect(Array.from(page.loaderData.childStarts!)).toEqual([131_072, 0]);

      let fallbackByteFetches = 0;
      const nextPage = await decoder.decodePage({
        chunkIndex: 0,
        sourceUrl: configuration.sourceUrl,
        metadata,
        signal: new AbortController().signal,
        fetchChunkBytes: async () => {
          fallbackByteFetches++;
          return makeGaussianBrowserRADChunk();
        },
        decodeDefault: async () => {
          fallbackCalls++;
          return loaderBundle.parseRADChunk(makeGaussianBrowserRADChunk(), {
            radChunk: {splatEncoding: metadata.splatEncoding, includeLoDTree: true}
          });
        }
      });

      expect(nextPage.data.numRows).toBe(2);
      expect(fallbackByteFetches).toBe(0);
      expect(fallbackCalls).toBe(2);
      expect(decoder.completedDecodeCount).toBe(2);
      expect(decoder.workerCount).toBe(0);
    } finally {
      decoder?.destroy();
      createObjectURL.mockRestore();
    }
  });

  test('drains queued pages and preserves cancellation when the worker import fails', async () => {
    const validBundleUrl = new URL(
      '/website/static/standalone-examples/gaussian-splats/loaders-gl.mjs',
      window.location.href
    ).href;
    const loaderBundle = await import(/* @vite-ignore */ validBundleUrl);
    const failingBundleUrl = URL.createObjectURL(
      new Blob(['throw new Error("Dynamic module imports are unavailable in workers")'], {
        type: 'text/javascript'
      })
    );
    const configuration: LocalGaussianSplatLoadersConfiguration = {
      loaderMode: 'bundled',
      loadersRoot: '',
      loaderBundleUrl: failingBundleUrl,
      sourceUrl: 'https://example.test/coit.rad',
      sourceUrls: ['https://example.test/coit.rad'],
      fallbackSourceUrls: [],
      sourceFormat: 'RAD',
      sceneId: 'coit',
      sourceLabel: 'Worker import fallback fixture',
      upAxis: 'z',
      up: [0, 0, 1]
    };
    const metadata: LocalGaussianSplatRADMetadata = {
      count: 6,
      chunks: [
        {chunkIndex: 0, base: 65_536, count: 2, bytes: 0},
        {chunkIndex: 1, base: 65_538, count: 2, bytes: 0},
        {chunkIndex: 2, base: 65_540, count: 2, bytes: 0}
      ],
      maxSh: 1,
      lodTree: true,
      splatEncoding: {lodOpacity: true}
    };
    const decoder = createGaussianSplatRADWorkerDecoder(configuration, {maxWorkers: 1});

    try {
      expect(decoder?.mode).toBe('worker');
      if (!decoder) {
        throw new Error('The browser did not create its failing-import module worker.');
      }

      const canceledController = new AbortController();
      const fallbackChunkIndices: number[] = [];
      let activeFallbacks = 0;
      let maximumActiveFallbacks = 0;
      const decodePage = (chunkIndex: number, signal = new AbortController().signal) =>
        decoder.decodePage({
          chunkIndex,
          sourceUrl: configuration.sourceUrl,
          metadata,
          signal,
          fetchChunkBytes: async () => makeGaussianBrowserRADChunk(),
          decodeDefault: async () => {
            fallbackChunkIndices.push(chunkIndex);
            activeFallbacks++;
            maximumActiveFallbacks = Math.max(maximumActiveFallbacks, activeFallbacks);
            try {
              await Promise.resolve();
              signal.throwIfAborted();
              return loaderBundle.parseRADChunk(makeGaussianBrowserRADChunk(), {
                radChunk: {splatEncoding: metadata.splatEncoding, includeLoDTree: true}
              });
            } finally {
              activeFallbacks--;
            }
          }
        });
      const rootPage = decodePage(0);
      const queuedPage = decodePage(1);
      const canceledPage = decodePage(2, canceledController.signal).catch(error => error);
      await Promise.resolve();
      canceledController.abort();

      await expect(rootPage).resolves.toMatchObject({data: {numRows: 2}});
      await expect(queuedPage).resolves.toMatchObject({data: {numRows: 2}});
      await expect(canceledPage).resolves.toMatchObject({name: 'AbortError'});
      expect(fallbackChunkIndices).toEqual([0, 1]);
      expect(maximumActiveFallbacks).toBe(1);
      expect(decoder.mode).toBe('main-thread');
      expect(decoder.workerCount).toBe(0);
      expect(decoder.completedDecodeCount).toBe(2);
    } finally {
      decoder?.destroy();
      URL.revokeObjectURL(failingBundleUrl);
    }
  });

  test('cancels an actual in-flight worker and recreates it for fresh camera demand', async () => {
    const loaderBundleUrl = new URL(
      '/website/static/standalone-examples/gaussian-splats/loaders-gl.mjs',
      window.location.href
    ).href;
    const decoder = createGaussianSplatRADWorkerDecoder(
      {
        loaderMode: 'bundled',
        loadersRoot: '',
        loaderBundleUrl,
        sourceUrl: 'https://example.test/coit.rad',
        sourceUrls: ['https://example.test/coit.rad'],
        fallbackSourceUrls: [],
        sourceFormat: 'RAD',
        sceneId: 'coit',
        sourceLabel: 'Worker RAD fixture',
        upAxis: 'z',
        up: [0, 0, 1]
      },
      {maxWorkers: 1}
    );
    if (!decoder) {
      throw new Error('The real browser did not create its Gaussian RAD module worker.');
    }

    const metadata: LocalGaussianSplatRADMetadata = {
      count: 2,
      chunks: [{chunkIndex: 0, base: 65_536, count: 2, bytes: 0}],
      splatEncoding: {lodOpacity: true}
    };
    const firstController = new AbortController();
    const stalePage = decoder.decodePage({
      chunkIndex: 0,
      sourceUrl: 'https://example.test/coit.rad',
      metadata,
      signal: firstController.signal,
      fetchChunkBytes: async () => makeGaussianBrowserRADChunk(),
      decodeDefault: async () => undefined
    });
    await Promise.resolve();
    firstController.abort();
    await expect(stalePage).rejects.toMatchObject({name: 'AbortError'});

    const currentPage = await decoder.decodePage({
      chunkIndex: 0,
      sourceUrl: 'https://example.test/coit.rad',
      metadata,
      signal: new AbortController().signal,
      fetchChunkBytes: async () => makeGaussianBrowserRADChunk(),
      decodeDefault: async () => undefined
    });
    expect(currentPage.data.numRows).toBe(2);
    expect(decoder.completedDecodeCount).toBe(1);
    expect(decoder.workerCount).toBe(1);
    decoder.destroy();
  });
});

function makeGaussianBrowserRADChunk(): ArrayBuffer {
  const positions = new Float32Array([1, 2, 3, 4, 5, 6]);
  const opacities = new Uint8Array([128, 64]);
  const childCounts = new Uint16Array([1, 0]);
  const childStarts = new Uint32Array([131_072, 0]);
  const harmonics = Float32Array.from({length: 18}, (_, component) => component / 10);
  const positionOffset = 0;
  const opacityOffset = positionOffset + alignGaussianBrowserRADBytes(positions.byteLength);
  const childCountOffset = opacityOffset + alignGaussianBrowserRADBytes(opacities.byteLength);
  const childStartOffset = childCountOffset + alignGaussianBrowserRADBytes(childCounts.byteLength);
  const harmonicsOffset = childStartOffset + alignGaussianBrowserRADBytes(childStarts.byteLength);
  const payloadByteLength = harmonicsOffset + alignGaussianBrowserRADBytes(harmonics.byteLength);
  const metadataBytes = new TextEncoder().encode(
    JSON.stringify({
      version: 1,
      base: 65_536,
      count: 2,
      maxSh: 1,
      lodTree: true,
      payloadBytes: payloadByteLength,
      properties: [
        {offset: positionOffset, bytes: positions.byteLength, property: 'center', encoding: 'f32'},
        {
          offset: opacityOffset,
          bytes: opacities.byteLength,
          property: 'alpha',
          encoding: 'r8',
          min: 0,
          max: 1
        },
        {
          offset: childCountOffset,
          bytes: childCounts.byteLength,
          property: 'child_count',
          encoding: 'u16'
        },
        {
          offset: childStartOffset,
          bytes: childStarts.byteLength,
          property: 'child_start',
          encoding: 'u32'
        },
        {offset: harmonicsOffset, bytes: harmonics.byteLength, property: 'sh1', encoding: 'f32'}
      ]
    })
  );
  const payloadLengthOffset = 8 + alignGaussianBrowserRADBytes(metadataBytes.byteLength);
  const payloadOffset = payloadLengthOffset + 8;
  const chunk = new ArrayBuffer(payloadOffset + payloadByteLength);
  const view = new DataView(chunk);
  const bytes = new Uint8Array(chunk);
  view.setUint32(0, 0x43444152, true);
  view.setUint32(4, metadataBytes.byteLength, true);
  view.setBigUint64(payloadLengthOffset, BigInt(payloadByteLength), true);
  bytes.set(metadataBytes, 8);
  bytes.set(new Uint8Array(positions.buffer), payloadOffset + positionOffset);
  bytes.set(opacities, payloadOffset + opacityOffset);
  bytes.set(new Uint8Array(childCounts.buffer), payloadOffset + childCountOffset);
  bytes.set(new Uint8Array(childStarts.buffer), payloadOffset + childStartOffset);
  bytes.set(new Uint8Array(harmonics.buffer), payloadOffset + harmonicsOffset);
  return chunk;
}

function alignGaussianBrowserRADBytes(byteLength: number): number {
  return (byteLength + 7) & ~7;
}
