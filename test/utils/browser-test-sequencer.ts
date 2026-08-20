// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// Coarse weights from SwiftShader CI timings. Most browser files spend about three seconds on
// page setup and execution; these known outliers need explicit weights so Vitest does not place
// several of them in the same shard. Update only when CI timings materially change.
const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/experimental/test/gpu-raster/gpu-raster-tile-halo-parity.spec.ts': 14,
  'modules/text/test/text-2d/convert-arrow-text-vectors.spec.ts': 14,
  'modules/arrow-layers/test/gpu-graph-deck.spec.ts': 10,
  'modules/experimental/test/geospatial/geospatial-projection-distance.spec.ts': 9,
  'test/examples/gpu-dataframe-analysis.spec.ts': 9,
  'modules/arrow/test/arrow/arrow-path-model.spec.ts': 9,
  'modules/experimental/test/gpu-graph/gpu-graph-core-number.spec.ts': 9,
  'modules/experimental/test/gpu-dataframe/gpu-global-aggregation.spec.ts': 9,
  'modules/arrow/test/arrow/dggs-gpu-polygons.spec.ts': 8,
  'modules/experimental/test/gpu-graph/gpu-graph-modularity-optimization.spec.ts': 8
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
