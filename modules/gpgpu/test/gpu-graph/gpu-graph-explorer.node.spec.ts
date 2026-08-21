// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {
  getGraphExplorerGridSize,
  GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT,
  GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT,
  GRAPH_EXPLORER_MAXIMUM_HUB_SPOKES,
  GRAPH_EXPLORER_MAX_VISIBLE_EDGES,
  GRAPH_EXPLORER_POINT_VERTEX_COUNT,
  GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT,
  GRAPH_EXPLORER_SPATIAL_BOUNDS,
  GRAPH_EXPLORER_VERTEX_COUNTS,
  makeGraphExplorerDataset
} from '../../../../examples/experimental/gpu-graph-explorer/graph-data';
import {
  GRAPH_EXPLORER_EDGE_SHADER,
  GRAPH_EXPLORER_NODE_SHADER,
  GRAPH_EXPLORER_PICKING_SHADER,
  GRAPH_EXPLORER_VIEW_BYTE_LENGTH
} from '../../../../examples/experimental/gpu-graph-explorer/graph-shaders';

describe('interactive GPU Graph explorer deterministic source graph', () => {
  test('offers fourteen honest graph populations while retaining the small fixture default', () => {
    expect(GRAPH_EXPLORER_VERTEX_COUNTS).toEqual([
      128, 256, 512, 1024, 2048, 4096, 8192, 16_384, 32_768, 65_536, 131_072, 262_144, 524_288,
      1_048_576
    ]);
    expect(GRAPH_EXPLORER_SHOWCASE_DEFAULT_VERTEX_COUNT).toBe(1024);
    expect(GRAPH_EXPLORER_MAXIMUM_EXACT_VERTEX_COUNT).toBe(512);
    expect(GRAPH_EXPLORER_LINEAR_LAYOUT_VERTEX_COUNT).toBe(16_384);
    expect(GRAPH_EXPLORER_POINT_VERTEX_COUNT).toBe(65_536);
    expect(GRAPH_EXPLORER_MAX_VISIBLE_EDGES).toBe(65_536);
    expect(makeGraphExplorerDataset().vertexCount).toBe(128);
  });

  test('publishes deterministic typed graph data without allocating browser or GPU resources', () => {
    const first = makeGraphExplorerDataset();
    const second = makeGraphExplorerDataset();

    expect(first.vertexCount).toBe(128);
    expect(first.positions).toBeInstanceOf(Float32Array);
    expect(first.velocities).toBeInstanceOf(Float32Array);
    expect(first.positions.length).toBe(first.vertexCount * 2);
    expect(first.velocities.length).toBe(first.vertexCount * 2);
    expect(Array.from(first.positions)).toEqual(Array.from(second.positions));
    expect(Array.from(first.velocities)).toEqual(Array.from(second.velocities));
    expect(first.sourceChunks.map(chunk => Array.from(chunk))).toEqual(
      second.sourceChunks.map(chunk => Array.from(chunk))
    );
    expect(first.targetChunks.map(chunk => Array.from(chunk))).toEqual(
      second.targetChunks.map(chunk => Array.from(chunk))
    );
    expect(Array.from(first.positions).every(Number.isFinite)).toBe(true);
    expect(Array.from(first.velocities).every(velocity => velocity === 0)).toBe(true);
  });

  test.each([
    64,
    ...GRAPH_EXPLORER_VERTEX_COUNTS.slice(0, -1)
  ])('preserves aligned original uint32 edge batches: %i vertices', vertexCount => {
    const dataset = makeGraphExplorerDataset(vertexCount);

    expect(dataset.vertexCount).toBe(vertexCount);
    expect(dataset.sourceChunks).toHaveLength(3);
    expect(dataset.targetChunks).toHaveLength(3);
    expect(dataset.sourceChunks[1]).toBeInstanceOf(Uint32Array);
    expect(dataset.targetChunks[1]).toBeInstanceOf(Uint32Array);
    expect(dataset.sourceChunks[1]).toHaveLength(0);
    expect(dataset.targetChunks[1]).toHaveLength(0);

    for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
      const targets = dataset.targetChunks[chunkIndex];
      expect(sources).toBeInstanceOf(Uint32Array);
      expect(targets).toBeInstanceOf(Uint32Array);
      expect(targets.length).toBe(sources.length);
      expect(sources.every(source => source < vertexCount)).toBe(true);
      expect(targets.every(target => target < vertexCount)).toBe(true);
    }
  });

  test.each([
    {vertices: 8, dimension: 4},
    {vertices: 32, dimension: 5},
    {vertices: 128, dimension: 6},
    {vertices: 512, dimension: 9},
    {vertices: 1024, dimension: 10},
    {vertices: 8192, dimension: 17},
    {vertices: 1_048_576, dimension: 32},
    {vertices: 100_000_000, dimension: 32}
  ])('bounds the caller-owned spatial grid at $vertices vertices', ({vertices, dimension}) => {
    expect(getGraphExplorerGridSize(vertices)).toEqual([dimension, dimension]);
  });

  test.each([
    0,
    7,
    -1,
    2.5,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects unusable spatial graph populations: %s', vertexCount => {
    expect(() => getGraphExplorerGridSize(vertexCount)).toThrow(/eight|vertices/i);
  });

  test('keeps 8,192-node community hubs and spatial coordinates explicitly bounded', () => {
    const dataset = makeGraphExplorerDataset(8192);
    const incoming = new Uint32Array(dataset.vertexCount);
    for (const targets of dataset.targetChunks) {
      for (const target of targets) incoming[target]++;
    }

    expect(Math.max(...incoming)).toBeLessThanOrEqual(GRAPH_EXPLORER_MAXIMUM_HUB_SPOKES + 3);
    expect(
      dataset.positions.every((position, index) => {
        const minimum = GRAPH_EXPLORER_SPATIAL_BOUNDS[index % 2];
        const maximum = GRAPH_EXPLORER_SPATIAL_BOUNDS[(index % 2) + 2];
        return position > minimum && position < maximum;
      })
    ).toBe(true);
    expect(dataset.sourceChunks[1]).toHaveLength(0);
  });

  test('creates all 1,048,576 source vertices and 2,097,343 original directed edge rows', () => {
    const vertexCount = 1_048_576;
    const edgeCount = 2_097_343;
    const dataset = makeGraphExplorerDataset(vertexCount);

    expect(dataset.vertexCount).toBe(vertexCount);
    expect(dataset.positions).toBeInstanceOf(Float32Array);
    expect(dataset.velocities).toBeInstanceOf(Float32Array);
    expect(dataset.positions.length).toBe(vertexCount * 2);
    expect(dataset.velocities.length).toBe(vertexCount * 2);
    expect(dataset.positions.byteLength).toBe(vertexCount * 8);
    expect(dataset.velocities.byteLength).toBe(vertexCount * 8);
    expect(dataset.sourceChunks.map(chunk => chunk.length)).toEqual([1_048_672, 0, 1_048_671]);
    expect(dataset.targetChunks.map(chunk => chunk.length)).toEqual([1_048_672, 0, 1_048_671]);
    expect(dataset.sourceChunks.reduce((total, chunk) => total + chunk.length, 0)).toBe(edgeCount);
    expect(dataset.targetChunks.reduce((total, chunk) => total + chunk.length, 0)).toBe(edgeCount);
    expect(edgeCount).toBe(vertexCount * 2 + 191);

    const sourceAllocation = dataset.sourceChunks[0].buffer;
    const targetAllocation = dataset.targetChunks[0].buffer;
    for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
      const targets = dataset.targetChunks[chunkIndex];
      expect(sources.buffer).toBe(sourceAllocation);
      expect(targets.buffer).toBe(targetAllocation);
      expect(sources.every(source => source < vertexCount)).toBe(true);
      expect(targets.every(target => target < vertexCount)).toBe(true);
    }
    expect(dataset.sourceChunks[2].byteOffset).toBe(dataset.sourceChunks[0].byteLength);
    expect(dataset.targetChunks[2].byteOffset).toBe(dataset.targetChunks[0].byteLength);
    expect(dataset.sourceChunks[2].at(-1)).toBe(0);
    expect(dataset.targetChunks[2].at(-1)).toBe(vertexCount / 4);
  });

  test('contains multiple weak components and high-degree vertices for visible graph analytics', () => {
    const dataset = makeGraphExplorerDataset();
    const neighbors = Array.from({length: dataset.vertexCount}, () => new Set<number>());

    for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
      for (const [rowIndex, source] of sources.entries()) {
        const target = dataset.targetChunks[chunkIndex][rowIndex];
        neighbors[source].add(target);
        neighbors[target].add(source);
      }
    }

    const visited = new Set<number>();
    let componentCount = 0;
    for (let vertexIndex = 0; vertexIndex < dataset.vertexCount; vertexIndex++) {
      if (visited.has(vertexIndex)) continue;
      componentCount++;
      const frontier = [vertexIndex];
      while (frontier.length > 0) {
        const current = frontier.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const neighbor of neighbors[current]) frontier.push(neighbor);
      }
    }

    expect(componentCount).toBeGreaterThan(1);
    expect(Math.max(...neighbors.map(vertices => vertices.size))).toBeGreaterThanOrEqual(4);
  });
});

describe('interactive GPU Graph explorer dependency-free rendering integration', () => {
  test('keeps its website-only example outside Yarn workspace manifests', () => {
    const packagePath = new URL(
      '../../../../examples/experimental/gpu-graph-explorer/package.json',
      import.meta.url
    );
    expect(existsSync(packagePath)).toBe(false);
  });

  test('declares compatible GPU node, original-batch edge, and signed-integer picking shaders', () => {
    expect(GRAPH_EXPLORER_VIEW_BYTE_LENGTH).toBe(32);
    for (const shader of [
      GRAPH_EXPLORER_EDGE_SHADER,
      GRAPH_EXPLORER_NODE_SHADER,
      GRAPH_EXPLORER_PICKING_SHADER
    ]) {
      expect(shader).toMatch(/@vertex/);
      expect(shader).toMatch(/@fragment/);
      expect(shader).not.toMatch(/atomic\s*<\s*f32\s*>/);
    }
    expect(GRAPH_EXPLORER_PICKING_SHADER).toMatch(/@location\(1\)/);
    expect(GRAPH_EXPLORER_PICKING_SHADER).toMatch(/vec2<i32>/);
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('communities: array<u32>');
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('degrees: array<u32>');
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('communities[sourceIndex] / communitySpan');
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('view.interaction.z / 4u');
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('0.78');
    expect(GRAPH_EXPLORER_NODE_SHADER).toMatch(/7u|\[7\]/);
  });

  test('exposes accessible graph controls backed by actual resident analytics', () => {
    const source = readFileSync(
      new URL('../../../../examples/experimental/gpu-graph-explorer/app.ts', import.meta.url),
      'utf8'
    );

    for (const attribute of [
      'data-graph-size',
      'data-graph-size-value',
      'data-layout-mode',
      'data-color-mode',
      'data-node-size',
      'data-edge-toggle',
      'data-depth',
      'data-pause',
      'data-graph-legend',
      'data-graph-adapter',
      'data-graph-memory'
    ]) {
      expect(source).toContain(attribute);
    }
    for (const mode of ['community', 'component', 'degree', 'pagerank', 'distance']) {
      expect(source).toContain(`value="${mode}"`);
    }
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('GPUGraphLabelPropagation');
    expect(source).toContain('GPUGraphSpatialForceLayout');
    expect(source).toContain('addGraphExplorerSampledLayoutToGraph');
    expect(source).toMatch(/repulsion:\s*useSampledForce\s*\?\s*0\.0015\s*:/);
    expect(source).toMatch(/gravity:\s*useSampledForce\s*\?\s*0\.005\s*:/);
    expect(source).toContain('CPU encode');
    expect(source).toContain('physicalTransientBytes');
    expect(source).not.toMatch(/GPU\s+(?:frame|execution|duration)\s*[:=]\s*\$\{/i);
  });

  test('bounds genuine full-edge GPU layout to four vertex samples without staging or atomics', () => {
    const source = readFileSync(
      new URL(
        '../../../../examples/experimental/gpu-graph-explorer/graph-scale-layout.ts',
        import.meta.url
      ),
      'utf8'
    );

    expect(source).toContain('REPULSION_SAMPLE_COUNT = 4');
    expect(source).toContain('O(E + 4V)');
    expect(source).toContain('addGraphExplorerSampledLayoutToGraph');
    expect(source).toContain('forwardNeighbors');
    expect(source).toContain('reverseNeighbors');
    expect(source).toContain('getCommunityAnchorSource');
    expect(source).toContain('getCommunityAnchor(index)');
    expect(source).toContain('2.39996323');
    expect(source).toContain('(anchor - position) * 0.12');
    expect(source).toContain('neighborDisplacement');
    expect(source).toContain('max(f32(neighborCount), 1.0)');
    expect(source).toContain('positions[positionIndex] = anchor.x');
    expect(source).toContain('positions[positionIndex + 1u] = anchor.y');
    expect(source).not.toMatch(/atomic\s*<\s*f32\s*>/);
    expect(source).not.toMatch(/\bdevice\.submit\s*\(/);
    expect(source).not.toMatch(/\.readAsync\s*\(/);
  });

  test('exposes genuine GPU analytics, communities, and bounded spatial contributors', () => {
    const explorerSource = readFileSync(
      new URL('../../../../examples/experimental/gpu-graph-explorer/app.ts', import.meta.url),
      'utf8'
    );

    expect(GRAPH_EXPLORER_NODE_SHADER).toMatch(/@binding\(3\).*degrees/u);
    expect(GRAPH_EXPLORER_PICKING_SHADER).toMatch(/@binding\(1\).*degrees/u);
    expect(GRAPH_EXPLORER_NODE_SHADER).toContain('degrees[sourceIndex]');
    expect(GRAPH_EXPLORER_PICKING_SHADER).toContain('degrees[sourceIndex]');

    for (const selector of [
      'data-color-mode',
      'data-node-size',
      'data-pause',
      'data-edge-toggle',
      'data-depth',
      'data-reset',
      'data-unpin',
      'data-graph-legend',
      'data-graph-adapter',
      'data-graph-memory',
      'data-graph-fps'
    ]) {
      expect(explorerSource, selector).toContain(selector);
    }

    expect(explorerSource).toContain('aria-live="polite"');
    expect(explorerSource).toContain('Expand info box');
    expect(explorerSource).toContain('[data-info-box-appearance]');
    expect(explorerSource).toContain('GPUGraphLabelPropagation');
    expect(explorerSource).toContain('GPUGraphSpatialForceLayout');
  });
});
