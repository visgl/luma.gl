// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  type EPTMetadata,
  type EPTSourceAdapter,
  NYCEPTTileSource
} from '../../examples/showcase/billion-point-spatial-atlas/ept-source';

const METADATA_URL = 'https://tiles.example.test/new-york/ept.json';

const METADATA: EPTMetadata = {
  bounds: [0, 0, 0, 1000, 1000, 1000],
  boundsConforming: [10, 20, 30, 110, 70, 130],
  dataType: 'laszip',
  hierarchyType: 'json',
  points: 1_000,
  span: 128,
  version: '1.1.0'
};

function getHierarchyKey(url: string | URL): string | undefined {
  return /\/ept-hierarchy\/(.+)\.json$/.exec(String(url))?.[1];
}

function makeHierarchyAdapter(
  hierarchyPages: Record<string, Record<string, number>>,
  requestedUrls: string[] = []
): EPTSourceAdapter {
  return {
    async fetchJSON(url) {
      requestedUrls.push(String(url));
      if (String(url) === METADATA_URL) return METADATA;
      const hierarchyKey = getHierarchyKey(url);
      if (hierarchyKey && hierarchyPages[hierarchyKey]) return hierarchyPages[hierarchyKey];
      throw new Error(`Unexpected EPT fixture URL: ${String(url)}`);
    },
    async loadLASMesh(url) {
      throw new Error(`Unexpected LAZ fixture URL: ${String(url)}`);
    }
  };
}

describe('NYCEPTTileSource hierarchy selection', () => {
  test('expands the nearest hierarchy pages once and retains the cache', async () => {
    const requestedUrls: string[] = [];
    const pendingKeys = ['2-0-0-0', '2-1-0-0', '2-2-2-0', '2-3-3-0', '2-0-3-0'];
    const hierarchyPages: Record<string, Record<string, number>> = {
      '0-0-0-0': Object.fromEntries(pendingKeys.map(key => [key, -1]))
    };
    for (const key of pendingKeys) hierarchyPages[key] = {[key]: 10};

    const source = await NYCEPTTileSource.create(undefined, {
      metadataUrl: METADATA_URL,
      adapter: makeHierarchyAdapter(hierarchyPages, requestedUrls)
    });

    const firstSelection = await source.selectTiles(1, [0.9, 0.9]);
    expect(firstSelection).toEqual([{key: '2-0-0-0', pointCount: 10, pointLimit: 1}]);
    expect(requestedUrls.slice(2)).toEqual([
      'https://tiles.example.test/new-york/ept-hierarchy/2-0-0-0.json',
      'https://tiles.example.test/new-york/ept-hierarchy/2-1-0-0.json',
      'https://tiles.example.test/new-york/ept-hierarchy/2-2-2-0.json',
      'https://tiles.example.test/new-york/ept-hierarchy/2-0-3-0.json'
    ]);

    await source.selectTiles(1, [0.9, 0.9]);
    const requestCountAfterCompleteExpansion = requestedUrls.length;
    await source.selectTiles(1, [-0.9, -0.9]);

    expect(requestedUrls.at(-1)).toBe(
      'https://tiles.example.test/new-york/ept-hierarchy/2-3-3-0.json'
    );
    expect(requestedUrls).toHaveLength(requestCountAfterCompleteExpansion);
    expect(new Set(requestedUrls).size).toBe(requestedUrls.length);
  });

  test('never selects more rows than the requested resident capacity', async () => {
    const source = await NYCEPTTileSource.create(undefined, {
      metadataUrl: METADATA_URL,
      adapter: makeHierarchyAdapter({
        '0-0-0-0': {'1-0-0-0': 5, '1-1-1-0': 8, '2-1-0-0': 20}
      })
    });

    const selection = await source.selectTiles(7, [0.9, 0.9]);
    expect(selection).toEqual([
      {key: '1-0-0-0', pointCount: 5, pointLimit: 5},
      {key: '2-1-0-0', pointCount: 20, pointLimit: 2}
    ]);
    expect(selection.reduce((sum, tile) => sum + tile.pointLimit, 0)).toBe(7);
    await expect(source.selectTiles(0, [0, 0])).rejects.toThrow(
      'EPT targetPointCount must be a positive integer'
    );
  });
});

describe('NYCEPTTileSource tile decoding', () => {
  test('retains decode provenance while normalizing and packing bounded rows', async () => {
    const requestedLASUrls: string[] = [];
    const adapter = makeHierarchyAdapter({
      '0-0-0-0': {'1-1-1-0': 3}
    });
    adapter.loadLASMesh = async url => {
      requestedLASUrls.push(String(url));
      return {
        attributes: {
          POSITION: {
            value: new Float64Array([10, 20, 30, 110, 70, 130, 60, 45, 80])
          },
          intensity: {value: new Uint16Array([1, 65_535, 40])},
          classification: new Uint8Array([2, 255, 7])
        }
      };
    };
    const source = await NYCEPTTileSource.create(undefined, {
      metadataUrl: METADATA_URL,
      adapter
    });

    const tile = await source.loadTile({key: '1-1-1-0', pointCount: 3, pointLimit: 2});

    expect(requestedLASUrls).toEqual(['https://tiles.example.test/new-york/ept-data/1-1-1-0.laz']);
    expect(tile.key).toBe('1-1-1-0');
    expect(tile.decodedPointCount).toBe(3);
    expect(tile.pointCount).toBe(2);
    expect(Array.from(tile.positions)).toEqual([-1, -0.5, 0, 1, 0.5, 1.7000000476837158]);
    expect(Array.from(tile.attributes)).toEqual([258, 16_777_215]);
  });

  test('honors cancellation before and after injected asynchronous work', async () => {
    const alreadyAbortedController = new AbortController();
    alreadyAbortedController.abort();
    let requestCount = 0;
    const adapter = makeHierarchyAdapter({'0-0-0-0': {}});
    const originalFetchJSON = adapter.fetchJSON;
    adapter.fetchJSON = async (url, signal) => {
      requestCount++;
      return originalFetchJSON(url, signal);
    };

    await expect(
      NYCEPTTileSource.create(alreadyAbortedController.signal, {
        metadataUrl: METADATA_URL,
        adapter
      })
    ).rejects.toMatchObject({name: 'AbortError'});
    expect(requestCount).toBe(0);

    const source = await NYCEPTTileSource.create(undefined, {
      metadataUrl: METADATA_URL,
      adapter
    });
    const decodeController = new AbortController();
    let decodeCount = 0;
    adapter.loadLASMesh = async (_url, signal) => {
      expect(signal).toBe(decodeController.signal);
      decodeCount++;
      decodeController.abort();
      return {attributes: {POSITION: new Float32Array([10, 20, 30])}};
    };

    await expect(
      source.loadTile({key: '0-0-0-0', pointCount: 1, pointLimit: 1}, decodeController.signal)
    ).rejects.toMatchObject({name: 'AbortError'});
    expect(decodeCount).toBe(1);
  });
});
