// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {relative} from 'node:path';
import {BaseSequencer, type TestSpecification} from 'vitest/node';

const DEFAULT_BROWSER_TEST_WEIGHT = 3;

// General-suite wall times include page/import overhead, measured on run 40804836290
// (2026-10-29). Compute/physics retain SwiftShader timings from run 40502376058
// for default all-suite sharding; CI runs them in reusable contexts.
export const SLOW_BROWSER_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/anari/test/anari-diffuse.spec.ts': 19,
  'modules/anari/test/anari-emitter-sampling.spec.ts': 22,
  'modules/anari/test/anari-picking.spec.ts': 44,
  'modules/anari/test/anari-reflection-bounces.spec.ts': 18,
  'modules/anari/test/anari-reflection.spec.ts': 15,
  'modules/anari/test/anari-renderer.spec.ts': 5,
  'modules/anari/test/anari-ring.spec.ts': 17,
  'modules/anari/test/anari-sampling.spec.ts': 21,
  'modules/anari/test/anari-shapes.spec.ts': 17,
  'modules/anari/test/chart-labels.spec.ts': 22,
  'modules/anari/test/engine/deferred-scene-renderer.spec.ts': 4,
  'modules/anari/test/engine/ray-tracing-image-export.spec.ts': 13,
  'modules/anari/test/engine/ray-tracing-scene-renderer.spec.ts': 4,
  'modules/anari/test/engine/scene-deformation.spec.ts': 4,
  'modules/anari/test/engine/scene-next-pbr-materials.spec.ts': 6,
  'modules/anari/test/engine/scene-renderer-lighting-parity.spec.ts': 13,
  'modules/anari/test/engine/scene-renderer.spec.ts': 4,
  'modules/anari/test/gltf-production-skin.spec.ts': 7,
  'modules/anari/test/oit/wboit-renderer.spec.ts': 5,
  'modules/anari/test/rendering/clustered-lighting.spec.ts': 5,
  'modules/anari/test/rendering/depth-texture-copy.spec.ts': 4,
  'modules/anari/test/rendering/g-buffer.spec.ts': 4,
  'modules/arrow/test/arrow/arrow-gpu-analytics-adapters.spec.ts': 5,
  'modules/arrow/test/arrow/arrow-gpu-fixed-size-list.spec.ts': 5,
  'modules/arrow/test/arrow/arrow-path-model.spec.ts': 4,
  'modules/arrow/test/arrow/arrow-temporal-gpu-vector.spec.ts': 5,
  'modules/arrow/test/arrow/arrow-text-renderer.spec.ts': 5,
  'modules/arrow/test/arrow/dggs-gpu-polygons.spec.ts': 7,
  'modules/arrow/test/geoarrow/geoarrow.spec.ts': 5,
  'modules/core/test/adapter/resources/texture.spec.ts': 4,
  'modules/deck-arrow-layers/test/gpu-graph-deck.spec.ts': 8,
  'modules/deck-arrow-layers/test/layers/arrow-layers.spec.ts': 16,
  'modules/deck-gpu-layers/test/globe-cloud-layer.spec.ts': 6,
  'modules/deck-gpu-layers/test/luspatial-geographic-point-query-effect.spec.ts': 5,
  'modules/deck-gpu-layers/test/luspatial-point-layer.spec.ts': 4,
  'modules/deck-gpu-layers/test/scene-buffer-effect.spec.ts': 7,
  'modules/deck-gpu-layers/test/shader-pass-effect.spec.ts': 6,
  'modules/deck-gpu-layers/test/sky-body-layers.spec.ts': 10,
  'modules/deck-gpu-layers/test/wind-particle-layer.spec.ts': 4,
  'modules/effects/test/passes/image-blur-filters/bloom.spec.ts': 4,
  'modules/effects/test/passes/screen-space/height-fog.spec.ts': 4,
  'modules/engine/test/graph/tables/table-transform.spec.ts': 5,
  'modules/engine/test/gltf/gltf/gltf-animated-crowd.spec.ts': 7,
  'modules/engine/test/gltf/gltf/gltf-area-lights-render.spec.ts': 19,
  'modules/engine/test/gltf/gltf/gltf-audio.spec.ts': 4,
  'modules/engine/test/gltf/gltf/gltf-lightmap-render.spec.ts': 4,
  'modules/engine/test/gltf/gltf/gltf-materials-scatter-render.spec.ts': 6,
  'modules/engine/test/gltf/gltf/gltf.spec.ts': 4,
  'modules/engine/test/gltf/parsers/parse-gltf.spec.ts': 4,
  'modules/engine/test/gltf/physics/gltf-physics-properties.spec.ts': 12,
  'modules/engine/test/gltf/physics/gltf-physics-session.spec.ts': 10,
  'modules/engine/test/gltf/physics/gltf-physics.spec.ts': 15,
  'modules/graph/test/gpu-core/gpu-batch-conformance.spec.ts': 15,
  'modules/graph/test/gpu-core/gpu-completion-batching.spec.ts': 11,
  'modules/graph/test/gpu-core/gpu-dense-batching.spec.ts': 29,
  'modules/graph/test/gpu-core/gpu-spatial-batching.spec.ts': 20,
  'modules/graph/test/gpu-core/gpu-transform-batching.spec.ts': 11,
  'modules/graph/test/gpu-graph/gpu-graph-explorer.spec.ts': 4,
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
  'modules/shadertools/test/modules/geospatial/dggs.spec.ts': 7,
  'modules/shadertools/test/modules/math/fp64-arithmetic-compute.spec.ts': 5,
  'modules/engine/test/splats/gpu-paged-splat-renderer.spec.ts': 12,
  'modules/engine/test/splats/gpu-splat-graph-interaction.spec.ts': 4,
  'modules/engine/test/splats/gpu-splat-progressive-renderer.spec.ts': 4,
  'modules/engine/test/splats/splat-renderer.spec.ts': 4,
  'modules/engine/test/text/text-2d/convert-arrow-text-vectors.spec.ts': 11,
  'modules/three/test/animated-renderer.spec.ts': 23,
  'modules/three/test/deck-lantern-renderer.spec.ts': 13,
  'modules/three/test/deck-picking-renderer.spec.ts': 6,
  'modules/three/test/deck-renderer.spec.ts': 5,
  'modules/three/test/geographic-renderer.spec.ts': 15,
  'modules/three/test/gltf-renderer.spec.ts': 7,
  'modules/three/test/interleaved-renderer.spec.ts': 6,
  'modules/three/test/overlay-renderer.spec.ts': 5,
  'modules/three/test/physical-renderer.spec.ts': 9,
  'test/examples/algebraic-varieties.spec.ts': 4,
  'test/examples/example-panels.spec.ts': 5,
  'test/examples/fluid-foundry.spec.ts': 4,
  'test/examples/gltf-animation-studio.spec.ts': 4,
  'test/examples/gltf-scatter-panel.spec.ts': 4,
  'test/examples/gpu-dataframe-analysis.spec.ts': 13,
  'test/examples/gpu-dataframe-derived-columns.spec.ts': 12,
  'test/examples/gpu-scene-graph.spec.ts': 4,
  'test/examples/gpu-streaming-analytics.spec.ts': 5,
  'test/examples/gpu-trace-scene.spec.ts': 5,
  'test/examples/gpu-trace-viewer.spec.ts': 5,
  'test/examples/lucim-volume-lab.spec.ts': 4,
  'test/examples/luvs-live-benchmark.spec.ts': 4,
  'test/examples/spectral-caustics.spec.ts': 5,
  'test/examples/tempest-ocean.spec.ts': 5,
  'test/examples/volumetric-fire-forge.spec.ts': 4
};

// Native Apple Silicon physics wall times from run 40804836290 (2026-10-29).
// Keep these separate from SwiftShader weights used by default all-suite sharding.
export const NATIVE_PHYSICS_TEST_WEIGHTS: Readonly<Record<string, number>> = {
  'modules/graph/test/gpu-physics/authored-trigger-qualification.spec.ts': 3,
  'modules/graph/test/gpu-physics/gpu-physics-batch.spec.ts': 2,
  'modules/graph/test/gpu-physics/gpu-physics-ensemble.spec.ts': 51,
  'modules/graph/test/gpu-physics/gpu-rigid-body-world.spec.ts': 26,
  'modules/graph/test/gpu-physics/gpu-sphere-world.spec.ts': 19,
  'modules/graph/test/gpu-physics/rigid-body-broad-phase.spec.ts': 2,
  'modules/graph/test/gpu-physics/rigid-body-compaction.spec.ts': 6,
  'modules/graph/test/gpu-physics/rigid-body-contact-geometry.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-convex-continuous.spec.ts': 14,
  'modules/graph/test/gpu-physics/rigid-body-convex.spec.ts': 26,
  'modules/graph/test/gpu-physics/rigid-body-coverage.spec.ts': 3,
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts': 102,
  'modules/graph/test/gpu-physics/rigid-body-fast-motion.spec.ts': 6,
  'modules/graph/test/gpu-physics/rigid-body-gameplay.spec.ts': 3,
  'modules/graph/test/gpu-physics/rigid-body-general-joints.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-geometry-robustness.spec.ts': 2,
  'modules/graph/test/gpu-physics/rigid-body-impact-continuity.spec.ts': 24,
  'modules/graph/test/gpu-physics/rigid-body-joints.spec.ts': 17,
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts': 90,
  'modules/graph/test/gpu-physics/rigid-body-mesh-pairs.spec.ts': 28,
  'modules/graph/test/gpu-physics/rigid-body-mutations.spec.ts': 2,
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts': 95,
  'modules/graph/test/gpu-physics/rigid-body-parallel.spec.ts': 8,
  'modules/graph/test/gpu-physics/rigid-body-persistent-anchors.spec.ts': 1,
  'modules/graph/test/gpu-physics/rigid-body-plane.spec.ts': 2,
  'modules/graph/test/gpu-physics/rigid-body-qualification.spec.ts': 2,
  'modules/graph/test/gpu-physics/rigid-body-recovery.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-reliability.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-rotation-qualification.spec.ts': 4,
  'modules/graph/test/gpu-physics/rigid-body-seam-continuity.spec.ts': 7,
  'modules/graph/test/gpu-physics/rigid-body-sparse.spec.ts': 5,
  'modules/graph/test/gpu-physics/rigid-body-stability.spec.ts': 39,
  'modules/graph/test/gpu-physics/scenegraph-behaviors.spec.ts': 3,
  'modules/graph/test/gpu-physics/scenegraph-instance.spec.ts': 1,
  'modules/graph/test/gpu-physics/scenegraph-session.spec.ts': 2
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
