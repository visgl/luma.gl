// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as luGraphModule from '@luma.gl/experimental/lugraph';
import * as benchmarkModule from '@luma.gl/experimental/lugraph/benchmarks';
import {
  makeLuGraphBenchmarkDataset,
  type LuGraphBenchmarkDatasetKind,
  type LuGraphBenchmarkOptions,
  type LuGraphBenchmarkPathReport
} from '@luma.gl/experimental/lugraph/benchmarks';
import {describe, expect, expectTypeOf, test} from 'vitest';

import {
  evaluateLuGraphBenchmarkShortestPath,
  prepareLuGraphBenchmark,
  summarizeLuGraphBenchmarkSamples
} from '../../src/lugraph/lu-graph-benchmark-data';

const DATASET_KINDS: LuGraphBenchmarkDatasetKind[] = [
  'sparse',
  'dense',
  'scale-free',
  'disconnected',
  'high-degree'
];

describe('luGraph benchmark optional package boundary', () => {
  test('isolates deterministic datasets and GPU benchmark runners from production entry points', () => {
    expect(Object.keys(benchmarkModule).sort()).toEqual([
      'makeLuGraphBenchmarkDataset',
      'runLuGraphBenchmark'
    ]);
    expect(typeof benchmarkModule.makeLuGraphBenchmarkDataset).toBe('function');
    expect(typeof benchmarkModule.runLuGraphBenchmark).toBe('function');
    expect('runLuGraphBenchmark' in experimentalModule).toBe(false);
    expect('makeLuGraphBenchmarkDataset' in experimentalModule).toBe(false);
    expect('runLuGraphBenchmark' in luGraphModule).toBe(false);
    expect('makeLuGraphBenchmarkDataset' in luGraphModule).toBe(false);
  });

  test('declares a conditional benchmark subpath without adding Apache Arrow dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      exports: Record<string, Record<string, string>>;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    expect(packageJson.exports['./lugraph/benchmarks']).toEqual({
      import: './dist/lugraph/benchmarks.js',
      require: './dist/lugraph/benchmarks.cjs',
      types: './dist/lugraph/benchmarks.d.ts'
    });
    for (const dependencies of [
      packageJson.dependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies
    ]) {
      expect(dependencies?.['apache-arrow']).toBeUndefined();
    }
  });

  test('keeps bounded convergence and final residual metadata optional and backward compatible', () => {
    expectTypeOf<LuGraphBenchmarkPathReport>()
      .toHaveProperty('iterations')
      .toEqualTypeOf<number | undefined>();
    expectTypeOf<LuGraphBenchmarkPathReport>()
      .toHaveProperty('converged')
      .toEqualTypeOf<boolean | undefined>();
    expectTypeOf<LuGraphBenchmarkPathReport>()
      .toHaveProperty('residual')
      .toEqualTypeOf<number | undefined>();

    const distribution = {minimum: 1, median: 1, percentile95: 1, maximum: 1};
    const legacyPath: LuGraphBenchmarkPathReport = {
      algorithm: 'topology',
      cpuTimeMilliseconds: distribution,
      cpuEncodeTimeMilliseconds: distribution,
      synchronizedTimeMilliseconds: distribution,
      maxAbsoluteError: 0,
      importedBufferBytes: 4,
      transientBufferBytes: 0
    };

    expect('iterations' in legacyPath).toBe(false);
    expect('converged' in legacyPath).toBe(false);
    expect('residual' in legacyPath).toBe(false);
  });
});

describe('luGraph benchmark deterministic source datasets', () => {
  test.each(
    DATASET_KINDS
  )('creates repeatable, valid, independently owned %s graph batches and coordinates', kind => {
    const first = makeLuGraphBenchmarkDataset({kind, vertexCount: 32, seed: 123});
    const repeated = makeLuGraphBenchmarkDataset({kind, vertexCount: 32, seed: 123});

    expect(first.kind).toBe(kind);
    expect(first.vertexCount).toBe(32);
    expect(first.sourceChunks).toHaveLength(3);
    expect(first.targetChunks).toHaveLength(3);
    expect(first.weightChunks).toHaveLength(3);
    expect(first.sourceChunks[1]).toHaveLength(0);
    expect(first.targetChunks[1]).toHaveLength(0);
    expect(first.weightChunks[1]).toHaveLength(0);
    expect(first.positions).toBeInstanceOf(Float32Array);
    expect(first.positions).toHaveLength(64);
    expect(first.positions).not.toBe(repeated.positions);
    expect(Array.from(first.positions)).toEqual(Array.from(repeated.positions));
    expect(Array.from(first.positions).every(position => Number.isFinite(position))).toBe(true);
    expect(Array.from(first.positions).every(position => position > -2 && position < 2)).toBe(true);

    let edgeCount = 0;
    for (const [chunkIndex, sources] of first.sourceChunks.entries()) {
      const targets = first.targetChunks[chunkIndex];
      const weights = first.weightChunks[chunkIndex];
      expect(sources).toBeInstanceOf(Uint32Array);
      expect(targets).toBeInstanceOf(Uint32Array);
      expect(weights).toBeInstanceOf(Float32Array);
      expect(targets.length).toBe(sources.length);
      expect(weights.length).toBe(sources.length);
      expect(Array.from(sources)).toEqual(Array.from(repeated.sourceChunks[chunkIndex]));
      expect(Array.from(targets)).toEqual(Array.from(repeated.targetChunks[chunkIndex]));
      expect(Array.from(weights)).toEqual(Array.from(repeated.weightChunks[chunkIndex]));
      expect(weights).not.toBe(repeated.weightChunks[chunkIndex]);
      expect(Array.from(sources).every(vertex => vertex < first.vertexCount)).toBe(true);
      expect(Array.from(targets).every(vertex => vertex < first.vertexCount)).toBe(true);
      expect(Array.from(weights).every(weight => Number.isFinite(weight) && weight > 0)).toBe(true);
      edgeCount += sources.length;
    }
    expect(first.edgeCount).toBe(edgeCount);
    expect(first.edgeCount).toBeGreaterThan(0);
    expect(new Set(first.weightChunks.flatMap(chunk => Array.from(chunk))).size).toBeGreaterThan(1);
  });

  test('dense inputs contain every distinct ordered pair rather than synthetic edge counts', () => {
    const dataset = makeLuGraphBenchmarkDataset({kind: 'dense', vertexCount: 12, seed: 7});
    const uniqueEdges = new Set<string>();

    for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
      for (const [rowIndex, source] of sources.entries()) {
        const target = dataset.targetChunks[chunkIndex][rowIndex];
        expect(source).not.toBe(target);
        uniqueEdges.add(`${source}-${target}`);
      }
    }

    expect(dataset.edgeCount).toBe(12 * 11);
    expect(uniqueEdges.size).toBe(dataset.edgeCount);
  });

  test('sparse and dense datasets have materially different actual edge workloads', () => {
    const sparse = makeLuGraphBenchmarkDataset({kind: 'sparse', vertexCount: 32, seed: 9});
    const dense = makeLuGraphBenchmarkDataset({kind: 'dense', vertexCount: 32, seed: 9});

    expect(sparse.edgeCount).toBeLessThan(32 * 5);
    expect(dense.edgeCount).toBe(32 * 31);
    expect(dense.edgeCount).toBeGreaterThan(sparse.edgeCount * 3);
  });

  test('high-degree and scale-free generators contain genuine hub vertices', () => {
    for (const kind of ['high-degree', 'scale-free'] as const) {
      const dataset = makeLuGraphBenchmarkDataset({kind, vertexCount: 32, seed: 5});
      const degrees = new Uint32Array(dataset.vertexCount);
      for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
        for (const [rowIndex, source] of sources.entries()) {
          degrees[source]++;
          degrees[dataset.targetChunks[chunkIndex][rowIndex]]++;
        }
      }
      expect(Math.max(...degrees)).toBeGreaterThanOrEqual(8);
    }
  });

  test('disconnected workloads contain multiple independently discoverable weak components', () => {
    const dataset = makeLuGraphBenchmarkDataset({kind: 'disconnected', vertexCount: 24, seed: 9});
    const neighbors = Array.from({length: dataset.vertexCount}, () => [] as number[]);
    for (const [chunkIndex, sources] of dataset.sourceChunks.entries()) {
      for (const [rowIndex, source] of sources.entries()) {
        const target = dataset.targetChunks[chunkIndex][rowIndex];
        neighbors[source].push(target);
        neighbors[target].push(source);
      }
    }

    const reached = new Set<number>();
    let componentCount = 0;
    for (let vertex = 0; vertex < dataset.vertexCount; vertex++) {
      if (reached.has(vertex)) continue;
      componentCount++;
      const frontier = [vertex];
      while (frontier.length > 0) {
        const current = frontier.pop()!;
        if (reached.has(current)) continue;
        reached.add(current);
        frontier.push(...neighbors[current]);
      }
    }
    expect(componentCount).toBeGreaterThan(1);
  });

  test('different deterministic seeds actually change graph coordinates', () => {
    const first = makeLuGraphBenchmarkDataset({kind: 'scale-free', vertexCount: 24, seed: 1});
    const second = makeLuGraphBenchmarkDataset({kind: 'scale-free', vertexCount: 24, seed: 2});
    expect(Array.from(first.positions)).not.toEqual(Array.from(second.positions));
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects invalid deterministic dataset vertex counts: %s', vertexCount => {
    expect(() => makeLuGraphBenchmarkDataset({kind: 'sparse', vertexCount})).toThrow(
      /vertexCount|vertex|uint32|positive/
    );
  });

  test.each([
    -1,
    1.5,
    0x100000000,
    Number.NaN
  ])('rejects invalid uint32 dataset seeds: %s', seed => {
    expect(() => makeLuGraphBenchmarkDataset({kind: 'sparse', vertexCount: 8, seed})).toThrow(
      /seed|uint32|unsigned/
    );
  });

  test('rejects unsupported graph families instead of reporting fabricated workload data', () => {
    expect(() =>
      makeLuGraphBenchmarkDataset({
        kind: 'fabricated' as LuGraphBenchmarkDatasetKind,
        vertexCount: 8
      })
    ).toThrow(/kind|dataset|graph/);
  });

  test('supports a one-vertex graph while preserving all three explicit source batches', () => {
    const dataset = makeLuGraphBenchmarkDataset({kind: 'sparse', vertexCount: 1, seed: 0});
    expect(dataset.positions).toHaveLength(2);
    expect(dataset.sourceChunks).toHaveLength(3);
    expect(dataset.targetChunks).toHaveLength(3);
    expect(dataset.weightChunks).toHaveLength(3);
    expect(dataset.edgeCount).toBe(0);
  });
});

describe('luGraph benchmark independent CPU oracles', () => {
  test.each(DATASET_KINDS)('evaluates all nine real CPU references for %s workloads', kind => {
    const context = prepareLuGraphBenchmark({
      kind,
      vertexCount: 12,
      seed: 42,
      warmupIterations: 0,
      measuredIterations: 1,
      pageRankIterations: 4,
      forceIterations: 1,
      maxDepth: 4,
      theta: 0,
      gridSize: [4, 4]
    });
    const {reference} = context;

    expect(reference.forwardOffsets).toHaveLength(13);
    expect(reference.reverseOffsets).toHaveLength(13);
    expect(reference.forwardOffsets[12]).toBe(context.dataset.edgeCount);
    expect(reference.reverseOffsets[12]).toBe(context.dataset.edgeCount);
    expect(reference.forwardNeighbors).toHaveLength(context.dataset.edgeCount);
    expect(reference.forwardWeights).toHaveLength(context.dataset.edgeCount);
    expect(reference.reverseNeighbors).toHaveLength(context.dataset.edgeCount);
    expect(reference.reverseWeights).toHaveLength(context.dataset.edgeCount);
    expect(reference.distances).toHaveLength(12);
    expect(reference.predecessors).toHaveLength(12);
    expect(reference.distances[0]).toBe(0);
    expect(reference.predecessors[0]).toBe(0xffffffff);
    expect(reference.weightedDistances).toHaveLength(12);
    expect(reference.weightedPredecessors).toHaveLength(12);
    expect(reference.weightedDistances[0]).toBe(0);
    expect(reference.weightedPredecessors[0]).toBe(0xffffffff);
    expect(reference.components).toHaveLength(12);
    expect(reference.communities).toHaveLength(12);
    expect(typeof reference.communityConverged).toBe('boolean');
    expect(reference.clusteringCoefficients).toHaveLength(12);
    expect(reference.triangleCounts).toHaveLength(12);
    expect(
      Array.from(reference.clusteringCoefficients).every(
        coefficient => coefficient >= 0 && coefficient <= 1
      )
    ).toBe(true);
    expect(reference.pageRank).toHaveLength(12);
    expect(Array.from(reference.pageRank).reduce((sum, score) => sum + score, 0)).toBeCloseTo(1, 5);
    expect(reference.exactPositions).toHaveLength(24);
    expect(reference.exactVelocities).toHaveLength(24);
    expect(reference.spatialPositions).toHaveLength(24);
    expect(reference.spatialVelocities).toHaveLength(24);

    for (let index = 0; index < reference.exactPositions.length; index++) {
      expect(reference.spatialPositions[index]).toBeCloseTo(reference.exactPositions[index], 5);
      expect(reference.spatialVelocities[index]).toBeCloseTo(reference.exactVelocities[index], 5);
    }

    expect(Object.keys(context.cpuTimeMilliseconds)).toEqual([
      'topology',
      'breadth-first-search',
      'single-source-shortest-path',
      'connected-components',
      'label-propagation',
      'local-clustering-coefficient',
      'page-rank',
      'exact-layout',
      'spatial-layout'
    ]);
    for (const distribution of Object.values(context.cpuTimeMilliseconds)) {
      expect(distribution.minimum).toBeGreaterThanOrEqual(0);
      expect(distribution.minimum).toBeLessThanOrEqual(distribution.median);
      expect(distribution.median).toBeLessThanOrEqual(distribution.percentile95);
      expect(distribution.percentile95).toBeLessThanOrEqual(distribution.maximum);
    }
  });

  test('preserves default controls and isolated unreachable-component semantics', () => {
    const context = prepareLuGraphBenchmark({kind: 'disconnected', vertexCount: 8});

    expect(context.options).toMatchObject({
      seed: 0,
      warmupIterations: 1,
      measuredIterations: 3,
      pageRankIterations: 20,
      forceIterations: 1,
      maxDepth: 8,
      theta: 0.6,
      gridSize: [8, 8]
    });
    expect(context.reference.components[7]).toBe(7);
    expect(context.reference.distances[7]).toBe(0xffffffff);
    expect(context.reference.predecessors[7]).toBe(0xffffffff);
    expect(context.reference.weightedDistances[7]).toBe(Number.POSITIVE_INFINITY);
    expect(context.reference.weightedPredecessors[7]).toBe(0xffffffff);
    expect(context.reference.clusteringCoefficients[7]).toBe(0);
    expect(context.reference.triangleCounts[7]).toBe(0);
  });

  test('uses weighted routes rather than relabeling unweighted hop counts', () => {
    const context = prepareLuGraphBenchmark({
      kind: 'sparse',
      vertexCount: 16,
      seed: 42,
      warmupIterations: 0,
      measuredIterations: 1
    });

    expect(
      Array.from(context.reference.weightedDistances).some(
        (distance, vertex) =>
          Number.isFinite(distance) && distance !== context.reference.distances[vertex]
      )
    ).toBe(true);
  });

  test('bounds the shortest-path oracle to the same 1,024 GPU relaxation rounds', () => {
    const vertexCount = 1030;
    const edgeCount = vertexCount - 1;
    const forwardOffsets = Uint32Array.from({length: vertexCount + 1}, (_, vertex) =>
      Math.min(vertex, edgeCount)
    );
    const forwardNeighbors = Uint32Array.from({length: edgeCount}, (_, vertex) => vertex + 1);
    const forwardWeights = new Float32Array(edgeCount).fill(1);

    const reference = evaluateLuGraphBenchmarkShortestPath({
      forwardOffsets,
      forwardNeighbors,
      forwardWeights,
      reverseOffsets: new Uint32Array(vertexCount + 1),
      reverseNeighbors: new Uint32Array(0),
      reverseWeights: new Float32Array(0)
    });

    expect(reference.weightedDistances[1024]).toBe(1024);
    expect(reference.weightedPredecessors[1024]).toBe(1023);
    expect(reference.weightedDistances[1025]).toBe(Number.POSITIVE_INFINITY);
    expect(reference.weightedPredecessors[1025]).toBe(0xffffffff);
    expect(reference.weightedDistances[vertexCount - 1]).toBe(Number.POSITIVE_INFINITY);
  });

  test('counts distinct directed closures and normalizes complete graph neighborhoods', () => {
    const context = prepareLuGraphBenchmark({
      kind: 'dense',
      vertexCount: 8,
      warmupIterations: 0,
      measuredIterations: 1
    });

    expect(Array.from(context.reference.clusteringCoefficients)).toEqual(Array(8).fill(1));
    expect(Array.from(context.reference.triangleCounts)).toEqual(Array(8).fill(42));
  });

  test.each([
    [{warmupIterations: -1}, /warmupIterations/],
    [{measuredIterations: 0}, /measuredIterations/],
    [{pageRankIterations: 0}, /pageRankIterations/],
    [{pageRankIterations: 1025}, /pageRankIterations/],
    [{forceIterations: 0}, /forceIterations/],
    [{forceIterations: 1025}, /forceIterations/],
    [{maxDepth: -1}, /maxDepth/],
    [{maxDepth: 1025}, /maxDepth/],
    [{theta: -1}, /theta/],
    [{theta: Number.NaN}, /theta/],
    [{gridSize: [0, 4]}, /gridSize/],
    [{gridSize: [4, 1.5]}, /gridSize/]
  ] as [
    Partial<LuGraphBenchmarkOptions>,
    RegExp
  ][])('rejects unsupported benchmark controls %j before producing measurements', (invalidOptions, error) => {
    expect(() =>
      prepareLuGraphBenchmark({kind: 'sparse', vertexCount: 8, ...invalidOptions})
    ).toThrow(error);
  });

  test('reports observed nearest-rank timings without fabricating or interpolating values', () => {
    expect(summarizeLuGraphBenchmarkSamples([8, 1, 5, 3])).toEqual({
      minimum: 1,
      median: 3,
      percentile95: 8,
      maximum: 8
    });
    for (const invalidSamples of [[], [-1], [Number.NaN], [Number.POSITIVE_INFINITY]]) {
      expect(() => summarizeLuGraphBenchmarkSamples(invalidSamples)).toThrow(/sample|duration/);
    }
  });
});

describe('luGraph live documentation benchmark isolation', () => {
  test('uses explicit-start SSR-safe UI and independently reports index and approximation costs', () => {
    const component = readFileSync(
      new URL('../../../../website/src/components/docs/lugraph-benchmark.tsx', import.meta.url),
      'utf8'
    );
    const documentation = readFileSync(
      new URL('../../../../docs/api-reference/experimental/lugraph.md', import.meta.url),
      'utf8'
    );

    expect(component).toContain("from '@luma.gl/experimental/lugraph/benchmarks'");
    expect(component).toContain('<LiveBenchmarkPanel');
    expect(component).toContain('onRun={async () =>');
    expect(component).toContain("typeof navigator === 'undefined'");
    expect(component).toContain('spatialIndexBuildTimeMilliseconds');
    expect(component).toContain('approximationMaxAbsoluteError');
    expect(component).toContain('Weighted shortest paths');
    expect(component).toContain('Label-propagation communities');
    expect(component).toContain('Local clustering coefficient');
    expect(component.match(/await runLuGraphBenchmark\(/g)).toHaveLength(1);
    expect(documentation).toContain('<LuGraphBenchmark />');
    expect(documentation).toContain('explicit completion fence');
  });
});
