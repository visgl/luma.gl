// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// Rounded execution times plus three seconds for isolated page/import overhead.
// Measured on SwiftShader master run 40502376058 (2026-10-27). Refresh as suites grow.
export const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/anari/test/anari-diffuse.spec.ts': 17,
  'modules/anari/test/anari-emitter-sampling.spec.ts': 22,
  'modules/anari/test/anari-picking.spec.ts': 40,
  'modules/anari/test/anari-reflection-bounces.spec.ts': 16,
  'modules/anari/test/anari-reflection.spec.ts': 22,
  'modules/anari/test/anari-ring.spec.ts': 17,
  'modules/anari/test/anari-sampling.spec.ts': 22,
  'modules/anari/test/anari-shapes.spec.ts': 15,
  'modules/anari/test/chart-labels.spec.ts': 21,
  'modules/anari/test/engine/ray-tracing-image-export.spec.ts': 19,
  'modules/anari/test/engine/scene-renderer-lighting-parity.spec.ts': 17,
  'modules/gltf/test/gltf/gltf-area-lights-render.spec.ts': 32,
  'modules/gltf/test/physics/gltf-physics.spec.ts': 13,
  'modules/graph/test/gpu-core/gpu-batch-conformance.spec.ts': 15,
  'modules/graph/test/gpu-core/gpu-completion-batching.spec.ts': 11,
  'modules/graph/test/gpu-core/gpu-dense-batching.spec.ts': 29,
  'modules/graph/test/gpu-core/gpu-spatial-batching.spec.ts': 20,
  'modules/graph/test/gpu-core/gpu-transform-batching.spec.ts': 11,
  'modules/graph/test/gpu-graph/gpu-graph-modularity-optimization.spec.ts': 11,
  'modules/graph/test/gpu-physics/authored-trigger-qualification.spec.ts': 27,
  'modules/graph/test/gpu-physics/gpu-physics-batch.spec.ts': 23,
  'modules/graph/test/gpu-physics/gpu-physics-ensemble.spec.ts': 142,
  'modules/graph/test/gpu-physics/gpu-rigid-body-world.spec.ts': 105,
  'modules/graph/test/gpu-physics/gpu-sphere-world.spec.ts': 25,
  'modules/graph/test/gpu-physics/rigid-body-compaction.spec.ts': 20,
  'modules/graph/test/gpu-physics/rigid-body-contact-geometry.spec.ts': 29,
  'modules/graph/test/gpu-physics/rigid-body-convex-continuous.spec.ts': 52,
  'modules/graph/test/gpu-physics/rigid-body-convex.spec.ts': 131,
  'modules/graph/test/gpu-physics/rigid-body-coverage.spec.ts': 20,
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts': 135,
  'modules/graph/test/gpu-physics/rigid-body-fast-motion.spec.ts': 40,
  'modules/graph/test/gpu-physics/rigid-body-gameplay.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-general-joints.spec.ts': 57,
  'modules/graph/test/gpu-physics/rigid-body-geometry-robustness.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-impact-continuity.spec.ts': 38,
  'modules/graph/test/gpu-physics/rigid-body-joints.spec.ts': 147,
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts': 123,
  'modules/graph/test/gpu-physics/rigid-body-mesh-pairs.spec.ts': 116,
  'modules/graph/test/gpu-physics/rigid-body-mutations.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts': 87,
  'modules/graph/test/gpu-physics/rigid-body-parallel.spec.ts': 16,
  'modules/graph/test/gpu-physics/rigid-body-persistent-anchors.spec.ts': 14,
  'modules/graph/test/gpu-physics/rigid-body-plane.spec.ts': 16,
  'modules/graph/test/gpu-physics/rigid-body-qualification.spec.ts': 21,
  'modules/graph/test/gpu-physics/rigid-body-recovery.spec.ts': 29,
  'modules/graph/test/gpu-physics/rigid-body-reliability.spec.ts': 35,
  'modules/graph/test/gpu-physics/rigid-body-seam-continuity.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-sparse.spec.ts': 29,
  'modules/graph/test/gpu-physics/rigid-body-stability.spec.ts': 71,
  'modules/graph/test/gpu-physics/scenegraph-behaviors.spec.ts': 32,
  'modules/graph/test/gpu-physics/scenegraph-session.spec.ts': 14,
  'modules/graph/test/gpu-raster/gpu-raster-tile-halo-parity.spec.ts': 14,
  'modules/three/test/animated-renderer.spec.ts': 25,
  'modules/three/test/geographic-renderer.spec.ts': 13,
  'modules/three/test/gltf-renderer.spec.ts': 14,
  'modules/three/test/physical-renderer.spec.ts': 12
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
