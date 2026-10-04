// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// Rounded setup and execution times from SwiftShader CI run 37225736435 (2026-10-04).
// Include page/import overhead: GPU test-body durations alone underweight Arrow and Deck specs.
// Keep the current source paths here when suites move between packages.
export const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/arrow/test/arrow/arrow-path-model.spec.ts': 15,
  'modules/arrow/test/arrow/dggs-gpu-polygons.spec.ts': 12,
  'modules/deck-arrow-layers/test/gpu-graph-deck.spec.ts': 15,
  'modules/deck-arrow-layers/test/layers/arrow-layers.spec.ts': 10,
  'modules/deck-gpu-layers/test/scene-buffer-effect.spec.ts': 7,
  'modules/experimental/test/geospatial/geospatial-projection-distance.spec.ts': 10,
  'modules/experimental/test/gpu-dataframe/gpu-sort.spec.ts': 7,
  'modules/experimental/test/gpu-raster/gpu-raster-cross-tile-components-pipeline.spec.ts': 10,
  'modules/experimental/test/gpu-raster/gpu-raster-cross-tile-components.spec.ts': 7,
  'modules/experimental/test/gpu-raster/gpu-raster-region-measurements-pipeline.spec.ts': 7,
  'modules/experimental/test/gpu-raster/gpu-raster-tile-halo-parity.spec.ts': 9,
  'modules/gpgpu/test/gpu-core/gpu-batch-conformance.spec.ts': 14,
  'modules/gpgpu/test/gpu-core/gpu-byte-range-gather-batching.spec.ts': 8,
  'modules/gpgpu/test/gpu-core/gpu-completion-batching.spec.ts': 11,
  'modules/gpgpu/test/gpu-core/gpu-dense-batching.spec.ts': 29,
  'modules/gpgpu/test/gpu-core/gpu-finite-difference-batching.spec.ts': 9,
  'modules/gpgpu/test/gpu-core/gpu-hash-batching.spec.ts': 8,
  'modules/gpgpu/test/gpu-core/gpu-reduction-mask.spec.ts': 8,
  'modules/gpgpu/test/gpu-core/gpu-sort.spec.ts': 12,
  'modules/gpgpu/test/gpu-core/gpu-spatial-batching.spec.ts': 12,
  'modules/gpgpu/test/gpu-core/gpu-transform-batching.spec.ts': 7,
  'modules/gpgpu/test/gpu-graph/gpu-graph-explorer.spec.ts': 8,
  'modules/gpgpu/test/gpu-graph/gpu-graph-modularity-optimization.spec.ts': 7,
  'modules/gpgpu/test/gpu-graph/gpu-graph-spatial-force-layout.spec.ts': 9,
  'modules/gpgpu/test/gpu-vector-search/gpu-ivf-flat-index.spec.ts': 7,
  'modules/text/test/text-2d/convert-arrow-text-vectors.spec.ts': 11,
  'test/examples/gpu-dataframe-analysis.spec.ts': 13,
  'test/examples/gpu-dataframe-derived-columns.spec.ts': 9
};

type WeightedTestSpecification = {
  path: string;
  specification: TestSpecification;
  weight: number;
};

type ShardBucket = {
  index: number;
  specifications: TestSpecification[];
  totalWeight: number;
};

/** Distributes expensive browser specs across shards instead of hashing paths into equal counts. */
export class BrowserTestSequencer extends BaseSequencer {
  override async shard(specifications: TestSpecification[]): Promise<TestSpecification[]> {
    const shardConfiguration = this.ctx.config.shard;
    if (!shardConfiguration) {
      return specifications;
    }

    const weightedSpecifications = specifications
      .map(specification => {
        const testPath = relative(this.ctx.config.root, specification.moduleId).replaceAll(
          '\\',
          '/'
        );
        return {
          path: testPath,
          specification,
          weight: SLOW_BROWSER_TEST_WEIGHTS[testPath] ?? DEFAULT_BROWSER_TEST_WEIGHT
        } satisfies WeightedTestSpecification;
      })
      .sort((left, right) => right.weight - left.weight || left.path.localeCompare(right.path));
    const shardBuckets: ShardBucket[] = Array.from(
      {length: shardConfiguration.count},
      (_, index) => ({index, specifications: [], totalWeight: 0})
    );

    for (const weightedSpecification of weightedSpecifications) {
      const lightestBucket = shardBuckets.reduce((selectedBucket, candidateBucket) => {
        if (candidateBucket.totalWeight !== selectedBucket.totalWeight) {
          return candidateBucket.totalWeight < selectedBucket.totalWeight
            ? candidateBucket
            : selectedBucket;
        }
        if (candidateBucket.specifications.length !== selectedBucket.specifications.length) {
          return candidateBucket.specifications.length < selectedBucket.specifications.length
            ? candidateBucket
            : selectedBucket;
        }
        return candidateBucket.index < selectedBucket.index ? candidateBucket : selectedBucket;
      });
      lightestBucket.specifications.push(weightedSpecification.specification);
      lightestBucket.totalWeight += weightedSpecification.weight;
    }

    return shardBuckets[shardConfiguration.index - 1].specifications;
  }
}
