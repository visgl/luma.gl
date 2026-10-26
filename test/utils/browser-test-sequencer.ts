// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// Rounded execution times plus three seconds for isolated page/import overhead.
// Measured on SwiftShader CI run 40005777681 (2026-10-23). Refresh as suites grow.
export const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/anari/test/anari-diffuse.spec.ts': 15,
  'modules/anari/test/anari-emitter-sampling.spec.ts': 24,
  'modules/anari/test/anari-picking.spec.ts': 38,
  'modules/anari/test/anari-reflection-bounces.spec.ts': 15,
  'modules/anari/test/anari-reflection.spec.ts': 23,
  'modules/anari/test/anari-ring.spec.ts': 18,
  'modules/anari/test/anari-sampling.spec.ts': 17,
  'modules/anari/test/anari-shapes.spec.ts': 18,
  'modules/anari/test/chart-labels.spec.ts': 19,
  'modules/anari/test/engine/ray-tracing-image-export.spec.ts': 17,
  'modules/anari/test/engine/scene-renderer-lighting-parity.spec.ts': 19,
  'modules/gltf/test/gltf/gltf-area-lights-render.spec.ts': 32,
  'modules/gltf/test/physics/gltf-physics.spec.ts': 12,
  'modules/graph/test/gpu-core/gpu-batch-conformance.spec.ts': 14,
  'modules/graph/test/gpu-core/gpu-dense-batching.spec.ts': 32,
  'modules/graph/test/gpu-core/gpu-sort.spec.ts': 12,
  'modules/graph/test/gpu-core/gpu-spatial-batching.spec.ts': 19,
  'modules/graph/test/gpu-core/gpu-transform-batching.spec.ts': 11,
  'modules/graph/test/gpu-graph/gpu-graph-modularity-optimization.spec.ts': 12,
  'modules/graph/test/gpu-physics/gpu-rigid-body-world.spec.ts': 104,
  'modules/graph/test/gpu-physics/gpu-sphere-world.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-compaction.spec.ts': 22,
  'modules/graph/test/gpu-physics/rigid-body-contact-geometry.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-convex-continuous.spec.ts': 71,
  'modules/graph/test/gpu-physics/rigid-body-convex.spec.ts': 138,
  'modules/graph/test/gpu-physics/rigid-body-coverage.spec.ts': 22,
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts': 119,
  'modules/graph/test/gpu-physics/rigid-body-fast-motion.spec.ts': 56,
  'modules/graph/test/gpu-physics/rigid-body-gameplay.spec.ts': 20,
  'modules/graph/test/gpu-physics/rigid-body-geometry-robustness.spec.ts': 24,
  'modules/graph/test/gpu-physics/rigid-body-impact-continuity.spec.ts': 42,
  'modules/graph/test/gpu-physics/rigid-body-joints.spec.ts': 102,
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts': 76,
  'modules/graph/test/gpu-physics/rigid-body-mesh-pairs.spec.ts': 86,
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts': 105,
  'modules/graph/test/gpu-physics/rigid-body-parallel.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-persistent-anchors.spec.ts': 16,
  'modules/graph/test/gpu-physics/rigid-body-plane.spec.ts': 20,
  'modules/graph/test/gpu-physics/rigid-body-qualification.spec.ts': 19,
  'modules/graph/test/gpu-physics/rigid-body-recovery.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-reliability.spec.ts': 36,
  'modules/graph/test/gpu-physics/rigid-body-rotation-qualification.spec.ts': 11,
  'modules/graph/test/gpu-physics/rigid-body-seam-continuity.spec.ts': 36,
  'modules/graph/test/gpu-physics/rigid-body-sparse.spec.ts': 22,
  'modules/graph/test/gpu-physics/rigid-body-stability.spec.ts': 105,
  'modules/graph/test/gpu-raster/gpu-raster-tile-halo-parity.spec.ts': 15,
  'modules/three/test/animated-renderer.spec.ts': 18,
  'modules/three/test/deck-lantern-renderer.spec.ts': 11,
  'modules/three/test/geographic-renderer.spec.ts': 12,
  'modules/three/test/gltf-renderer.spec.ts': 12,
  'modules/three/test/physical-renderer.spec.ts': 14
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
