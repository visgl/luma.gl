// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {makeGraphExplorerDataset} from '../../../../examples/experimental/lugraph-explorer/graph-data';
import {
  GRAPH_EXPLORER_EDGE_SHADER,
  GRAPH_EXPLORER_NODE_SHADER,
  GRAPH_EXPLORER_PICKING_SHADER,
  GRAPH_EXPLORER_VIEW_BYTE_LENGTH
} from '../../../../examples/experimental/lugraph-explorer/graph-shaders';

describe('interactive luGraph explorer deterministic source graph', () => {
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
    64, 128, 256
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
      expect(Array.from(sources).every(source => source < vertexCount)).toBe(true);
      expect(Array.from(targets).every(target => target < vertexCount)).toBe(true);
    }
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

describe('interactive luGraph explorer dependency-free rendering integration', () => {
  test('keeps its website-only example outside Yarn workspace manifests', () => {
    const packagePath = new URL(
      '../../../../examples/experimental/lugraph-explorer/package.json',
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
  });

  test('exposes genuine existing GPU analytics without inventing community or spatial contributors', () => {
    const explorerSource = readFileSync(
      new URL('../../../../examples/experimental/lugraph-explorer/app.ts', import.meta.url),
      'utf8'
    );

    expect(GRAPH_EXPLORER_NODE_SHADER).toMatch(/@binding\(4\).*degrees/u);
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
    expect(explorerSource).not.toContain('LuGraphLabelPropagation');
    expect(explorerSource).not.toContain('LuGraphSpatialForceLayout');
  });

  test('registers the API guide in both documentation navigation trees', () => {
    const documentationContents = readFileSync(
      new URL('../../../../docs/table-of-contents.json', import.meta.url),
      'utf8'
    );
    expect(documentationContents.match(/api-reference\/experimental\/lugraph/g)).toHaveLength(2);
    const experimentalTabs = readFileSync(
      new URL(
        '../../../../website/src/components/docs/experimental-docs-tabs.tsx',
        import.meta.url
      ),
      'utf8'
    );
    expect(experimentalTabs).toContain("id: 'lugraph'");
  });

  test('registers the WebGPU explorer route, component, and discoverable sidebar entry', () => {
    const exampleContents = readFileSync(
      new URL('../../../../website/content/examples/table-of-contents.json', import.meta.url),
      'utf8'
    );
    const examplePage = readFileSync(
      new URL(
        '../../../../website/content/examples/experimental/lugraph-explorer.mdx',
        import.meta.url
      ),
      'utf8'
    );
    const examplesRegistry = readFileSync(
      new URL('../../../../website/src/examples.tsx', import.meta.url),
      'utf8'
    );
    const exampleThumbnails = readFileSync(
      new URL('../../../../website/src/example-thumbnails.ts', import.meta.url),
      'utf8'
    );

    expect(exampleContents).toContain('experimental/lugraph-explorer');
    expect(examplePage).toContain('<LuGraphExplorerExample />');
    expect(examplesRegistry).toContain('template={LuGraphExplorerApp}');
    expect(examplesRegistry).toContain("devices={['webgpu']}");
    expect(exampleThumbnails).toContain(
      "'experimental/lugraph-explorer': 'showcase/packet-spraying'"
    );
  });
});
