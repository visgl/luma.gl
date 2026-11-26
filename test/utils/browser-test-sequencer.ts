// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// Linux seconds refreshed from PR run 44000588776 (2026-11-17),
// plus one second per file for page/import overhead. Material cases retain their
// individual timings after splitting the former 20-minute monolithic suite.
// General shard weights use median file durations from runs 44927673461, 44933490379 and 44934810103.
export const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/anari/test/anari-diffuse.spec.ts': 13,
  'modules/anari/test/anari-emitter-sampling.spec.ts': 10,
  'modules/anari/test/anari-emitter-sampling-conformance.spec.ts': 41,
  'modules/anari/test/anari-picking.spec.ts': 20,
  'modules/anari/test/anari-reflection-bounces.spec.ts': 15,
  'modules/anari/test/anari-reflection.spec.ts': 24,
  'modules/anari/test/anari-ring.spec.ts': 7,
  'modules/anari/test/anari-sampling.spec.ts': 6,
  'modules/anari/test/anari-shapes.spec.ts': 7,
  'modules/anari/test/chart-labels.spec.ts': 9,
  'modules/anari/test/engine/ray-alpha-pixels.spec.ts': 125,
  'modules/anari/test/engine/ray-environment-lighting.spec.ts': 57,
  'modules/anari/test/engine/ray-irradiance.spec.ts': 22,
  'modules/anari/test/engine/ray-material-anisotropy-bounce.spec.ts': 9,
  'modules/anari/test/engine/ray-material-anisotropy.spec.ts': 96,
  'modules/anari/test/engine/ray-material-dielectrics.spec.ts': 100,
  'modules/anari/test/engine/ray-material-diffuse-transmission.spec.ts': 106,
  'modules/anari/test/engine/ray-material-iridescence.spec.ts': 88,
  'modules/anari/test/engine/ray-material-maps.spec.ts': 218,
  'modules/anari/test/engine/ray-material-normals.spec.ts': 234,
  'modules/anari/test/engine/ray-material-occlusion.spec.ts': 63,
  'modules/anari/test/engine/ray-material-sheen-bounce.spec.ts': 9,
  'modules/anari/test/engine/ray-material-smoke.spec.ts': 14,
  'modules/anari/test/engine/ray-material-sheen.spec.ts': 56,
  'modules/anari/test/engine/ray-secondary-emitter-mis.spec.ts': 46,
  'modules/anari/test/engine/ray-secondary-texture-filtering.spec.ts': 38,
  'modules/anari/test/engine/ray-tracing-image-export.spec.ts': 26,
  'modules/anari/test/engine/scene-renderer-lighting-parity.spec.ts': 7,
  'modules/anari/test/engine/scenegraph-transforms.spec.ts': 11,
  'modules/deck-arrow-layers/test/gpu-graph-deck.spec.ts': 8,
  'modules/deck-arrow-layers/test/layers/arrow-layers.spec.ts': 16,
  'modules/deck-gpu-layers/test/gpu-spatial-geographic-point-query-effect.spec.ts': 5,
  'modules/deck-gpu-layers/test/gpu-spatial-point-layer.spec.ts': 4,
  'modules/engine/test/gltf/gltf/gltf-area-lights-render.spec.ts': 18,
  'modules/engine/test/gltf/gltf/gltf-materials-scatter-render.spec.ts': 4,
  'modules/engine/test/gltf/physics/gltf-physics-properties.spec.ts': 7,
  'modules/engine/test/gltf/physics/gltf-physics-qualification.spec.ts': 6,
  'modules/engine/test/gltf/physics/gltf-physics-session.spec.ts': 4,
  'modules/engine/test/gltf/physics/gltf-physics.spec.ts': 11,
  'modules/engine/test/lighting/ambient-occlusion.spec.ts': 4,
  'modules/engine/test/lighting/contact-shadow.spec.ts': 4,
  'modules/engine/test/lighting/lighting-workflow.spec.ts': 5,
  'modules/engine/test/lighting/lightmap-baker.spec.ts': 9,
  'modules/engine/test/lighting/pbr-shadow.spec.ts': 5,
  'modules/graph/test/arrow/arrow-gpu-analytics-adapters.spec.ts': 2,
  'modules/graph/test/arrow/dggs-gpu-polygons.spec.ts': 7,
  'modules/graph/test/geospatial/geospatial-projection-distance.spec.ts': 7,
  'modules/graph/test/gpu-core/gpu-batch-conformance.spec.ts': 9,
  'modules/graph/test/gpu-core/gpu-byte-range-gather-batching.spec.ts': 6,
  'modules/graph/test/gpu-core/gpu-command-graph.spec.ts': 5,
  'modules/graph/test/gpu-core/gpu-completion-batching.spec.ts': 9,
  'modules/graph/test/gpu-core/gpu-data-analysis.spec.ts': 7,
  'modules/graph/test/gpu-core/gpu-dense-batching.spec.ts': 25,
  'modules/graph/test/gpu-core/gpu-elementwise-batching.spec.ts': 4,
  'modules/graph/test/gpu-core/gpu-finite-difference-batching.spec.ts': 8,
  'modules/graph/test/gpu-core/gpu-fragmentation.spec.ts': 6,
  'modules/graph/test/gpu-core/gpu-hash-batching.spec.ts': 5,
  'modules/graph/test/gpu-core/gpu-reduction-mask.spec.ts': 5,
  'modules/graph/test/gpu-core/gpu-segmented-bvh.spec.ts': 4,
  'modules/graph/test/gpu-core/gpu-segmented-layout-batching.spec.ts': 4,
  'modules/graph/test/gpu-core/gpu-segmented-scan.spec.ts': 42,
  'modules/graph/test/gpu-core/gpu-sort.spec.ts': 9,
  'modules/graph/test/gpu-core/gpu-spatial-batching.spec.ts': 19,
  'modules/graph/test/gpu-core/gpu-transform-batching.spec.ts': 9,
  'modules/graph/test/gpu-core/gpu-transpose-batching.spec.ts': 4,
  'modules/graph/test/gpu-dataframe/gpu-global-aggregation.spec.ts': 3,
  'modules/graph/test/gpu-dataframe/gpu-sort.spec.ts': 3,
  'modules/graph/test/gpu-graph/gpu-graph-core-number.spec.ts': 4,
  'modules/graph/test/gpu-graph/gpu-graph-explorer.spec.ts': 3,
  'modules/graph/test/gpu-graph/gpu-graph-force-layout.spec.ts': 4,
  'modules/graph/test/gpu-graph/gpu-graph-label-propagation.spec.ts': 3,
  'modules/graph/test/gpu-graph/gpu-graph-local-clustering-coefficient.spec.ts': 3,
  'modules/graph/test/gpu-graph/gpu-graph-modularity-optimization.spec.ts': 8,
  'modules/graph/test/gpu-graph/gpu-graph-page-rank.spec.ts': 3,
  'modules/graph/test/gpu-graph/gpu-graph-spatial-force-layout.spec.ts': 5,
  'modules/graph/test/gpu-physics/authored-trigger-qualification.spec.ts': 27,
  'modules/graph/test/gpu-physics/gpu-physics-batch.spec.ts': 22,
  'modules/graph/test/gpu-physics/gpu-physics-ensemble.spec.ts': 154,
  'modules/graph/test/gpu-physics/gpu-rigid-body-world.spec.ts': 76,
  'modules/graph/test/gpu-physics/gpu-sphere-world.spec.ts': 18,
  'modules/graph/test/gpu-physics/physics-controller.spec.ts': 27,
  'modules/graph/test/gpu-physics/rigid-body-block-contacts.spec.ts': 34,
  'modules/graph/test/gpu-physics/rigid-body-compaction.spec.ts': 17,
  'modules/graph/test/gpu-physics/rigid-body-contact-geometry.spec.ts': 24,
  'modules/graph/test/gpu-physics/rigid-body-convex-continuous.spec.ts': 50,
  'modules/graph/test/gpu-physics/rigid-body-convex.spec.ts': 117,
  'modules/graph/test/gpu-physics/rigid-body-coverage.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts': 135,
  'modules/graph/test/gpu-physics/rigid-body-fast-motion.spec.ts': 44,
  'modules/graph/test/gpu-physics/rigid-body-gameplay.spec.ts': 15,
  'modules/graph/test/gpu-physics/rigid-body-general-joints.spec.ts': 57,
  'modules/graph/test/gpu-physics/rigid-body-geometry-robustness.spec.ts': 18,
  'modules/graph/test/gpu-physics/rigid-body-impact-continuity.spec.ts': 26,
  'modules/graph/test/gpu-physics/rigid-body-joints.spec.ts': 134,
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts': 123,
  'modules/graph/test/gpu-physics/rigid-body-mesh-pairs.spec.ts': 116,
  'modules/graph/test/gpu-physics/rigid-body-mutations.spec.ts': 19,
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts': 87,
  'modules/graph/test/gpu-physics/rigid-body-parallel-joints.spec.ts': 16,
  'modules/graph/test/gpu-physics/rigid-body-parallel.spec.ts': 16,
  'modules/graph/test/gpu-physics/rigid-body-persistent-anchors.spec.ts': 14,
  'modules/graph/test/gpu-physics/rigid-body-plane.spec.ts': 17,
  'modules/graph/test/gpu-physics/rigid-body-qualification.spec.ts': 15,
  'modules/graph/test/gpu-physics/rigid-body-recovery.spec.ts': 26,
  'modules/graph/test/gpu-physics/rigid-body-reliability.spec.ts': 34,
  'modules/graph/test/gpu-physics/rigid-body-seam-continuity.spec.ts': 31,
  'modules/graph/test/gpu-physics/rigid-body-sparse.spec.ts': 22,
  'modules/graph/test/gpu-physics/rigid-body-stability.spec.ts': 51,
  'modules/graph/test/gpu-physics/rigid-body-stack-regression.spec.ts': 72,
  'modules/graph/test/gpu-physics/scenegraph-behaviors.spec.ts': 33,
  'modules/graph/test/gpu-physics/scenegraph-instance.spec.ts': 5,
  'modules/graph/test/gpu-physics/scenegraph-session.spec.ts': 12,
  'modules/graph/test/gpu-physics/wrecking-ball.spec.ts': 70,
  'modules/graph/test/gpu-raster/gpu-raster-cross-tile-components-pipeline.spec.ts': 5,
  'modules/graph/test/gpu-raster/gpu-raster-cross-tile-components.spec.ts': 4,
  'modules/graph/test/gpu-raster/gpu-raster-tile-halo-parity.spec.ts': 12,
  'modules/graph/test/gpu-timeseries/gpu-timeseries.spec.ts': 4,
  'modules/graph/test/gpu-vector-search/gpu-ivf-flat-index.spec.ts': 5,
  'modules/graph/test/gpu-vector-search/gpu-vector-search.spec.ts': 6,
  'modules/shaders/test/modules/geospatial/dggs.spec.ts': 5,
  'modules/three/test/animated-renderer.spec.ts': 21,
  'modules/three/test/deck-lantern-renderer.spec.ts': 11,
  'modules/three/test/deck-picking-renderer.spec.ts': 4,
  'modules/three/test/geographic-renderer.spec.ts': 11,
  'modules/three/test/gltf-renderer.spec.ts': 10,
  'modules/three/test/overlay-renderer.spec.ts': 5,
  'modules/three/test/physical-renderer.spec.ts': 20,
  'test/examples/algebraic-varieties.spec.ts': 1,
  'test/examples/gpu-dataframe-analysis.spec.ts': 7,
  'test/examples/gpu-dataframe-derived-columns.spec.ts': 5,
  'test/examples/luvs-live-benchmark.spec.ts': 2
};

// Native Apple Silicon coverage timings refreshed from run 44000588776 (2026-11-17).
export const NATIVE_PHYSICS_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/graph/test/gpu-physics/authored-trigger-qualification.spec.ts': 4,
  'modules/graph/test/gpu-physics/domino-spiral.spec.ts': 119,
  'modules/graph/test/gpu-physics/gpu-physics-ensemble.spec.ts': 46,
  'modules/graph/test/gpu-physics/gpu-rigid-body-world.spec.ts': 25,
  'modules/graph/test/gpu-physics/gpu-sphere-world.spec.ts': 14,
  'modules/graph/test/gpu-physics/rigid-body-block-contacts.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-compaction.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-contact-geometry.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-convex-continuous.spec.ts': 11,
  'modules/graph/test/gpu-physics/rigid-body-convex.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-fast-motion.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-gameplay.spec.ts': 4,
  'modules/graph/test/gpu-physics/rigid-body-general-joints.spec.ts': 6,
  'modules/graph/test/gpu-physics/rigid-body-impact-continuity.spec.ts': 9,
  'modules/graph/test/gpu-physics/rigid-body-joints.spec.ts': 17,
  'modules/graph/test/gpu-physics/rigid-body-mesh-pairs.spec.ts': 32,
  'modules/graph/test/gpu-physics/rigid-body-parallel-joints.spec.ts': 8,
  'modules/graph/test/gpu-physics/rigid-body-parallel.spec.ts': 10,
  'modules/graph/test/gpu-physics/rigid-body-recovery.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-reliability.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-rotation-qualification.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-seam-continuity.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-sparse.spec.ts': 6,
  'modules/graph/test/gpu-physics/rigid-body-stability.spec.ts': 21,
  'modules/graph/test/gpu-physics/rigid-body-stack-regression.spec.ts': 37,
  'modules/graph/test/gpu-physics/wrecking-ball.spec.ts': 13
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

    const weights =
      process.env.LUMA_TEST_BROWSER_GROUP === 'physics'
        ? NATIVE_PHYSICS_TEST_WEIGHTS
        : SLOW_BROWSER_TEST_WEIGHTS;
    const weightedSpecifications = specifications
      .map(specification => {
        const testPath = relative(this.ctx.config.root, specification.moduleId).replaceAll(
          '\\',
          '/'
        );
        return {
          path: testPath,
          specification,
          weight: weights[testPath] ?? DEFAULT_BROWSER_TEST_WEIGHT
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
