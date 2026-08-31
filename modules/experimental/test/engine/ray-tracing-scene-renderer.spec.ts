// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {
  RayTracingSceneRenderer,
  type RayTracingSceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {updateRayTracingAdaptiveBudget} from '../../src/engine/ray-tracing-scene-renderer';

type AdaptiveBudgetState = Parameters<typeof updateRayTracingAdaptiveBudget>[0];

function makeAdaptiveBudgetState(
  overrides: Partial<AdaptiveBudgetState> = {}
): AdaptiveBudgetState {
  return {
    resolutionScale: 0.5,
    requestedResolutionScale: 0.5,
    minimumResolutionScale: 0.25,
    adaptiveResolution: true,
    targetFrameTimeMilliseconds: 33.3,
    phaseCount: 1,
    phaseIndex: 0,
    averageFrameTimeMilliseconds: 10,
    overBudgetFrameCount: 0,
    underBudgetFrameCount: 0,
    lastBudgetAdjustmentTimeMilliseconds: 0,
    historyNeedsReset: false,
    accumulatedFrameCount: 32,
    ...overrides
  };
}

it('RayTracingSceneRenderer adaptive budget stays at or below requested resolution', () => {
  const budget = makeAdaptiveBudgetState();
  for (let frameIndex = 1; frameIndex <= 100; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  expect(
    budget.resolutionScale,
    'sustained spare time never promotes the default half-resolution request to 75% or 100%'
  ).toBe(0.5);

  budget.resolutionScale = 0.25;
  budget.historyNeedsReset = false;
  for (let frameIndex = 101; frameIndex <= 300; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
    budget.historyNeedsReset = false;
  }
  expect(
    budget.resolutionScale,
    'recovery can return to the requested scale but cannot overshoot it'
  ).toBe(0.5);
  void 0;
});

it('RayTracingSceneRenderer adaptive budget uses stable history before sparse phases', () => {
  const budget = makeAdaptiveBudgetState({
    resolutionScale: 0.25,
    averageFrameTimeMilliseconds: 50,
    accumulatedFrameCount: 7
  });
  for (let frameIndex = 1; frameIndex <= 20; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  expect(
    budget.phaseCount,
    'minimum-resolution frames remain fully covered until progressive history is stable'
  ).toBe(1);

  budget.accumulatedFrameCount = 8;
  updateRayTracingAdaptiveBudget(budget, 21_000);
  expect(budget.phaseCount, 'stable history permits sparse scheduling under pressure').toBe(2);

  budget.phaseIndex = 1;
  budget.historyNeedsReset = true;
  updateRayTracingAdaptiveBudget(budget, 22_000);
  expect(budget.phaseCount, 'history invalidation returns to full pixel coverage').toBe(1);
  expect(budget.phaseIndex, 'history invalidation restarts sparse phase rotation').toBe(0);
  void 0;
});

it('RayTracingSceneRenderer adaptive budget requires sustained pressure', () => {
  const budget = makeAdaptiveBudgetState({averageFrameTimeMilliseconds: 50});
  for (let frameIndex = 1; frameIndex <= 5; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  expect(
    budget.resolutionScale,
    'short frame-time spikes do not immediately rebuild lower-resolution history'
  ).toBe(0.5);

  updateRayTracingAdaptiveBudget(budget, 6000);
  expect(budget.resolutionScale, 'sustained pressure steps down one scale').toBe(0.375);
  expect(budget.historyNeedsReset, 'resolution changes explicitly invalidate history').toBe(true);
  void 0;
});

it('RayTracingSceneRenderer builds and traverses Morton TLAS and mesh BLAS within WebGPU core limits', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const supportsRawValidationErrorScopes =
    device.info.gpu !== 'software' && device.info.gpuType !== 'cpu' && !device.info.fallback;
  if (!supportsRawValidationErrorScopes) {
    void 0;
  }

  expect(
    device.limits.maxStorageBuffersPerShaderStage,
    'GPU TLAS and BLAS construction use only the default WebGPU core storage-buffer allowance'
  ).toBe(8);

  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array([-1, -0.75, 0, 1, -0.75, 0, 1, 0.75, 0, -1, 0.75, 0, 0, 0, 0.35])
      },
      NORMAL: {
        size: 3,
        value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
      }
    },
    indices: new Uint16Array([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4])
  });
  const sphereSurface: SceneSurface = {
    id: 'ray-tracing-analytic-sphere',
    geometry,
    material: {
      id: 'ray-tracing-sphere-material',
      uniforms: {
        baseColorFactor: [0.9, 0.45, 0.2, 1],
        metallicRoughnessValues: [0.65, 0.3]
      }
    },
    transforms: [
      new Matrix4()
        .translate([0.65, 0, 0])
        .rotateY(Math.PI / 4)
        .scale([1.2, 0.7, 0.55]),
      new Matrix4().translate([-0.65, 0, 0]).scale([0.65, 1.15, 0.85])
    ]
  };
  const meshSurface: SceneSurface = {
    id: 'ray-tracing-indexed-mesh',
    geometry,
    material: {
      id: 'ray-tracing-mesh-material',
      uniforms: {baseColorFactor: [0.2, 0.55, 0.9, 1]}
    },
    transforms: [new Matrix4().translate([0, -0.15, -0.8])]
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'ray-tracing-bvh-frame',
    surfaces: [sphereSurface, meshSurface],
    primitives: {[sphereSurface.id]: {type: 'sphere', radius: 0.55}},
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 4]
    },
    lights: [
      {type: 'ambient', color: [1, 1, 1], intensity: 0.15},
      {type: 'directional', direction: [-0.4, -0.8, -1], intensity: 1.6},
      {type: 'point', position: [0, 1, 2], intensity: 6}
    ],
    samplesPerPixel: 2,
    progressive: true,
    shadows: true,
    adaptiveResolution: false,
    width: 32,
    height: 32
  };
  const renderer = new RayTracingSceneRenderer(device);

  try {
    if (supportsRawValidationErrorScopes) {
      device.handle.pushErrorScope('validation');
    }
    const initialStatistics = renderer.render(options);
    device.submit();
    if (supportsRawValidationErrorScopes) {
      const initialValidationError = await device.handle.popErrorScope();
      expect(
        initialValidationError,
        'GPU Morton TLAS and BLAS construction, nearest-hit traversal, and any-hit shadows validate'
      ).toBe(null);
    }
    const frameResources = getRayTracingFrameResources(renderer, options.id);
    const accelerationNodeOrder = frameResources.accelerationGraph.stats.nodeOrder;
    const buildBoundsIndex = findNodeIndex(accelerationNodeOrder, 'build-primitive-bounds');
    const initializeBoundsIndex = findNodeIndex(accelerationNodeOrder, 'initialize-scene-bounds');
    const reduceBoundsIndex = findNodeIndex(accelerationNodeOrder, 'reduce-scene-bounds');
    const encodeMortonIndex = findNodeIndex(accelerationNodeOrder, 'build-morton-keys');
    // Sort scratch initialization is dependency-free and may be hoisted before key generation;
    // only the output-producing final sort stage must precede the sorted-bounds gather.
    const sortMortonCompletionIndex = findLastNodeIndex(
      accelerationNodeOrder,
      'sort-primitive-morton-keys'
    );
    const gatherBoundsIndex = findNodeIndex(accelerationNodeOrder, 'gather-sorted-bounds');
    const fusedAccelerationIndex = findNodeIndex(
      accelerationNodeOrder,
      'ray-tracing-bvh-fused-refit'
    );
    expect(
      Boolean(
        [
          buildBoundsIndex,
          initializeBoundsIndex,
          reduceBoundsIndex,
          encodeMortonIndex,
          sortMortonCompletionIndex,
          gatherBoundsIndex,
          fusedAccelerationIndex
        ].every(index => index >= 0) &&
          buildBoundsIndex < reduceBoundsIndex &&
          initializeBoundsIndex < reduceBoundsIndex &&
          reduceBoundsIndex < encodeMortonIndex &&
          encodeMortonIndex < sortMortonCompletionIndex &&
          sortMortonCompletionIndex < gatherBoundsIndex &&
          gatherBoundsIndex < fusedAccelerationIndex
      ),
      'the acceleration graph tightly bounds meshes, sorts leaves, and builds the TLAS in one fused workgroup'
    ).toBe(true);
    expect(
      Boolean(
        accelerationNodeOrder.some(identifier =>
          identifier.includes('sort-primitive-morton-keys-bitonic-local')
        )
      ),
      'small instance permutations reuse the general single-dispatch GPU sort primitive'
    ).toBe(true);
    expect(
      Boolean(
        accelerationNodeOrder.some(identifier =>
          identifier.includes('sort-primitive-morton-keys-bitonic-initialize')
        )
      ),
      'small instance permutations avoid the legacy per-stage bitonic sorting network'
    ).toBe(false);
    expect(
      Boolean(
        getGraphBufferIdentifiers(frameResources.accelerationGraph).includes('sorted-primitive-ids')
      ),
      'the acceleration graph publishes an explicit sorted primitive permutation'
    ).toBe(true);
    expect(
      Boolean(getGraphBufferIdentifiers(frameResources.accelerationGraph).includes('blas-nodes')),
      'the acceleration graph reads exact local mesh bounds from retained BLAS roots'
    ).toBe(true);
    expect(
      Boolean(getGraphBufferIdentifiers(frameResources.traceGraph).includes('leaf-primitive-ids')),
      'the trace graph consumes the explicit sorted primitive permutation'
    ).toBe(true);
    const topologyNodeOrder = frameResources.topologyGraph.stats.nodeOrder;
    const triangleBoundsIndex = findNodeIndex(topologyNodeOrder, 'build-triangle-bounds');
    const initializeBlasBoundsIndex = findNodeIndex(
      topologyNodeOrder,
      'blas-0-initialize-scene-bounds'
    );
    const reduceBlasBoundsIndex = findNodeIndex(topologyNodeOrder, 'blas-0-reduce-scene-bounds');
    const encodeBlasMortonIndex = findNodeIndex(topologyNodeOrder, 'blas-0-build-morton-keys');
    const sortBlasMortonCompletionIndex = findLastNodeIndex(
      topologyNodeOrder,
      'blas-sort-triangle-morton-keys'
    );
    const gatherBlasBoundsIndex = findNodeIndex(topologyNodeOrder, 'blas-0-gather-sorted-bounds');
    const fusedBlasIndex = findNodeIndex(topologyNodeOrder, 'blas-bvh-fused-refit-4');
    const packBlasIndex = findNodeIndex(topologyNodeOrder, 'blas-0-pack-nodes');
    expect(
      Boolean(
        [
          triangleBoundsIndex,
          initializeBlasBoundsIndex,
          reduceBlasBoundsIndex,
          encodeBlasMortonIndex,
          sortBlasMortonCompletionIndex,
          gatherBlasBoundsIndex,
          fusedBlasIndex,
          packBlasIndex
        ].every(index => index >= 0) &&
          triangleBoundsIndex < reduceBlasBoundsIndex &&
          initializeBlasBoundsIndex < reduceBlasBoundsIndex &&
          reduceBlasBoundsIndex < encodeBlasMortonIndex &&
          encodeBlasMortonIndex < sortBlasMortonCompletionIndex &&
          sortBlasMortonCompletionIndex < gatherBlasBoundsIndex &&
          gatherBlasBoundsIndex < fusedBlasIndex &&
          fusedBlasIndex < packBlasIndex
      ),
      'the topology graph Morton-sorts mesh triangles, batches the BLAS hierarchy, and packs trace nodes'
    ).toBe(true);
    expect(
      Boolean(
        topologyNodeOrder.some(identifier =>
          identifier.includes('blas-sort-triangle-morton-keys-bitonic-local-4')
        )
      ),
      'small mesh triangle permutations reuse the general segmented single-dispatch GPU sort primitive'
    ).toBe(true);
    expect(
      Boolean(
        getGraphBufferIdentifiers(frameResources.topologyGraph).includes('blas-nodes') &&
          getGraphBufferIdentifiers(frameResources.topologyGraph).includes('blas-triangle-ids')
      ),
      'the topology graph publishes packed BLAS nodes and triangle permutations'
    ).toBe(true);
    expect(
      Boolean(
        getGraphBufferIdentifiers(frameResources.traceGraph).includes('blas-nodes') &&
          getGraphBufferIdentifiers(frameResources.traceGraph).includes('blas-triangle-ids')
      ),
      'the trace graph consumes packed BLAS nodes and triangle permutations'
    ).toBe(true);
    const refitNodeOrder = frameResources.refitGraph.stats.nodeOrder;
    const refitBoundsIndex = findNodeIndex(refitNodeOrder, 'refit-primitive-bounds');
    const refitGatherIndex = findNodeIndex(refitNodeOrder, 'refit-gather-sorted-bounds');
    const fusedRefitIndex = findNodeIndex(refitNodeOrder, 'ray-tracing-refit-bvh-fused-refit');
    expect(
      Boolean(
        [refitBoundsIndex, refitGatherIndex, fusedRefitIndex].every(index => index >= 0) &&
          refitBoundsIndex < refitGatherIndex &&
          refitGatherIndex < fusedRefitIndex
      ),
      'the transform-only graph tightly bounds meshes and refits the retained TLAS in one fused workgroup'
    ).toBe(true);
    expect(
      Boolean(
        refitNodeOrder.some(
          identifier =>
            identifier.includes('scene-bounds') ||
            identifier.includes('build-morton-keys') ||
            identifier.includes('sort-primitive-morton-keys')
        )
      ),
      'the transform-only graph omits scene reduction, Morton encoding, and sorting'
    ).toBe(false);
    expect(
      Boolean(refitNodeOrder.some(identifier => identifier.includes('-blas-'))),
      'the transform-only graph reuses topology-owned BLAS data'
    ).toBe(false);
    expect(
      Boolean(
        getGraphBufferIdentifiers(frameResources.refitGraph).includes('sorted-primitive-ids')
      ),
      'the refit graph reuses the retained sorted primitive permutation'
    ).toBe(true);
    expect(
      Boolean(getGraphBufferIdentifiers(frameResources.refitGraph).includes('blas-nodes')),
      'the refit graph reuses exact retained BLAS root bounds during instance animation'
    ).toBe(true);
    expect(
      frameResources.traceGraph.stats.importedBufferCount,
      'the trace graph imports one uniform plus exactly eight storage buffers within CORE limits'
    ).toBe(9);
    expect(
      frameResources.traceGraph.stats.importedTextureCount,
      'the trace graph borrows two rotating color textures and two rotating metadata textures'
    ).toBe(4);
    expect(
      frameResources.traceGraph.stats.logicalTransientTextureCount,
      'retained ping-pong history avoids hidden transient presentation or metadata textures'
    ).toBe(0);
    const historyCarryIndex = findNodeIndex(
      frameResources.traceGraph.stats.nodeOrder,
      'carry-ray-tracing-history'
    );
    const traceRaysIndex = findNodeIndex(frameResources.traceGraph.stats.nodeOrder, 'trace-rays');
    const presentationIndex = findNodeIndex(
      frameResources.traceGraph.stats.nodeOrder,
      'present-ray-tracing'
    );
    expect(
      Boolean(
        historyCarryIndex >= 0 &&
          historyCarryIndex < traceRaysIndex &&
          traceRaysIndex < presentationIndex
      ),
      'sparse history carry and packed ray dispatch run before fullscreen presentation'
    ).toBe(true);
    expect(
      Boolean(
        frameResources.traceGraph.stats.nodeOrder.some(
          identifier =>
            identifier.includes('prefill-ray-tracing') ||
            identifier.includes('remember-ray-tracing')
        )
      ),
      'rotating graph texture roles eliminate all four full-frame history copies'
    ).toBe(false);
    expect(
      Boolean(
        frameResources.traceGraph.stats.nodeOrder.some(identifier =>
          identifier.includes('trace-rays')
        )
      ),
      'the Morton TLAS and packed BLASes feed the ray-tracing compute node'
    ).toBe(true);
    expect(initialStatistics.surfaceCount, 'the shared renderer preserves both surfaces').toBe(2);
    expect(
      initialStatistics.instanceCount,
      'the Morton TLAS preserves translated, rotated, and nonuniformly scaled placements'
    ).toBe(3);
    expect(
      initialStatistics.triangleCount,
      'analytic spheres avoid expansion while the indexed mesh retains four BLAS leaves'
    ).toBe(4);
    expect(initialStatistics.drawCount, 'the graph uses one fullscreen presentation').toBe(1);
    expect(
      initialStatistics.rayTracing?.internalWidth,
      'the default ray workload traces half the display width'
    ).toBe(16);
    expect(
      initialStatistics.rayTracing?.internalHeight,
      'the default ray workload traces half the display height'
    ).toBe(16);
    expect(
      initialStatistics.rayTracing?.sampledPixelCoverage,
      'new history is fully initialized before sparse scheduling can begin'
    ).toBe(1);
    expect(
      initialStatistics.rayTracing?.accumulatedSamples,
      'ray-tracing telemetry reports samples per pixel rather than encoded frames'
    ).toBe(2);
    const initialGraphStatistics = initialStatistics.rayTracing?.graph;
    expect(
      Boolean(initialGraphStatistics?.topology && initialGraphStatistics.acceleration),
      'the initial frame reports its independently encoded topology and Morton acceleration stages'
    ).toBe(true);
    expect(
      Boolean(initialGraphStatistics?.refit),
      'a full Morton acceleration build does not also report an unused refit stage'
    ).toBe(false);
    expect(
      initialGraphStatistics?.nodeCount,
      'aggregate graph telemetry counts only stages encoded during the current frame'
    ).toBe(
      (initialGraphStatistics?.topology?.nodeCount ?? 0) +
        (initialGraphStatistics?.acceleration?.nodeCount ?? 0) +
        (initialGraphStatistics?.trace.nodeCount ?? 0)
    );
    expect(
      Boolean((initialGraphStatistics?.coalescedComputeNodeCount ?? 0) > 0),
      'graph telemetry exposes logical compute nodes coalesced into physical passes'
    ).toBe(true);
    expect(
      Boolean((initialGraphStatistics?.cpuEncodeTimeMilliseconds ?? -1) >= 0),
      'graph telemetry reports synchronous CPU encoding cost without GPU readback'
    ).toBe(true);
    const initialColorHistory = frameResources.colorHistory.previousTexture;
    const initialColorOutput = frameResources.colorHistory.currentTexture;
    const initialMetadataHistory = frameResources.metadataHistory.previousTexture;
    const initialMetadataOutput = frameResources.metadataHistory.currentTexture;

    if (supportsRawValidationErrorScopes) {
      device.handle.pushErrorScope('validation');
    }
    const accumulatedStatistics = renderer.render(options);
    device.submit();
    expect(
      accumulatedStatistics.instanceCount,
      'unchanged instances reuse the compiled graph and progressive history'
    ).toBe(3);
    expect(
      accumulatedStatistics.rayTracing?.accumulatedSamples,
      'progressive telemetry accumulates the requested samples per pixel'
    ).toBe(4);
    expect(
      Boolean(
        accumulatedStatistics.rayTracing?.graph?.topology ||
          accumulatedStatistics.rayTracing?.graph?.acceleration ||
          accumulatedStatistics.rayTracing?.graph?.refit
      ),
      'an unchanged frame reports only its trace/presentation graph stage'
    ).toBe(false);
    expect(
      accumulatedStatistics.rayTracing?.graph?.nodeCount,
      'unchanged-frame aggregate counts exactly match the trace graph'
    ).toBe(accumulatedStatistics.rayTracing?.graph?.trace.nodeCount);
    expect(
      frameResources.colorHistory.previousTexture,
      'successful encoding rotates the current color into the next history role'
    ).toBe(initialColorOutput);
    expect(
      frameResources.colorHistory.currentTexture,
      'successful encoding reuses the previous color as the next output without copying'
    ).toBe(initialColorHistory);
    expect(
      frameResources.metadataHistory.previousTexture,
      'surface metadata rotates in lockstep with color history'
    ).toBe(initialMetadataOutput);
    expect(
      frameResources.metadataHistory.currentTexture,
      'surface metadata reuses its previous allocation without copying'
    ).toBe(initialMetadataHistory);

    frameResources.phaseCount = 2;
    frameResources.phaseIndex = 0;
    const halfCoverageStatistics = renderer.render(options);
    device.submit();
    expect(
      halfCoverageStatistics.rayTracing?.sampledPixelCoverage,
      'half-frame ray sampling preserves untouched pixels through compact history carry'
    ).toBe(0.5);
    frameResources.phaseCount = 4;
    frameResources.phaseIndex = 0;
    const quarterCoverageStatistics = renderer.render(options);
    device.submit();
    expect(
      quarterCoverageStatistics.rayTracing?.sampledPixelCoverage,
      'quarter-frame sampling carries every untouched pixel without full-frame copies'
    ).toBe(0.25);
    frameResources.phaseCount = 1;
    frameResources.phaseIndex = 0;

    const nonReprojectedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    expect(
      nonReprojectedStatistics.rayTracing?.accumulatedSamples,
      'disabling temporal reprojection starts a fresh progressive history'
    ).toBe(2);
    const accumulatedNonReprojectedStatistics = renderer.render({
      ...options,
      temporalReprojection: false
    });
    device.submit();
    expect(
      accumulatedNonReprojectedStatistics.rayTracing?.accumulatedSamples,
      'unchanged transforms can still accumulate without temporal reprojection'
    ).toBe(4);

    sphereSurface.transforms = [
      new Matrix4()
        .translate([0.45, 0.1, 0])
        .rotateY(Math.PI / 5)
        .scale([1.15, 0.75, 0.6]),
      new Matrix4().translate([-0.45, -0.1, 0]).scale([0.7, 1.1, 0.8])
    ];
    const refittedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    expect(
      refittedStatistics.instanceCount,
      'same-count transform animation preserves every Morton TLAS leaf'
    ).toBe(3);
    expect(
      Boolean(getRayTracingFrameResources(renderer, options.id).refitsSinceMortonRebuild > 0),
      'same-count transform animation uses the retained-permutation refit path'
    ).toBe(true);
    expect(
      Boolean(
        refittedStatistics.rayTracing?.graph?.refit &&
          !refittedStatistics.rayTracing.graph.acceleration
      ),
      'transform-only telemetry reports the retained TLAS refit without a full rebuild'
    ).toBe(true);
    expect(
      Boolean(getRayTracingFrameResources(renderer, options.id).topologyNeedsUpdate),
      'same-count transform animation reuses the topology-only BLAS graph'
    ).toBe(false);

    sphereSurface.transforms = [
      new Matrix4()
        .translate([-0.35, 0.2, 0])
        .rotateY(Math.PI / 3)
        .scale([0.75, 1.3, 0.5])
    ];
    const reducedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    expect(
      reducedStatistics.instanceCount,
      'refit invalidates inactive leaves when the instance count shrinks'
    ).toBe(2);
    expect(
      reducedStatistics.rayTracing?.accumulatedSamples,
      'moving transforms reset history when reprojection is disabled'
    ).toBe(2);
    expect(
      getRayTracingFrameResources(renderer, options.id).refitsSinceMortonRebuild,
      'topology-changing shrink rebuilds the Morton order before removing inactive leaves'
    ).toBe(0);
    expect(
      Boolean(
        reducedStatistics.rayTracing?.graph?.acceleration &&
          !reducedStatistics.rayTracing.graph.refit
      ),
      'topology-changing telemetry reports the rebuilt Morton acceleration stage'
    ).toBe(true);
    expect(
      Boolean(getRayTracingFrameResources(renderer, options.id).previousTransformsNeedCommit),
      'topology rebuilds preserve the pending transform-history commit for retained instances'
    ).toBe(true);
    renderer.render({...options, temporalReprojection: false});
    device.submit();
    expect(
      Boolean(getRayTracingFrameResources(renderer, options.id).previousTransformsNeedCommit),
      'the unchanged frame after a topology rebuild commits current instance transforms'
    ).toBe(false);

    sphereSurface.transforms = [
      ...sphereSurface.transforms,
      new Matrix4()
        .translate([0.75, -0.1, 0.1])
        .rotateY(-Math.PI / 6)
        .scale([0.5, 1.2, 0.9])
    ];
    const restoredStatistics = renderer.render({...options, shadows: false});
    device.submit();
    expect(
      restoredStatistics.instanceCount,
      'repopulated leaves reuse their stable object identities when shadows are disabled'
    ).toBe(3);

    const emptyStatistics = renderer.render({...options, surfaces: []});
    device.submit();
    expect(emptyStatistics.instanceCount, 'empty scenes retain a valid padded TLAS').toBe(0);
    expect(emptyStatistics.drawCount, 'empty scenes still present their background').toBe(1);

    const repopulatedStatistics = renderer.render(options);
    device.submit();
    expect(
      repopulatedStatistics.instanceCount,
      'nearest-hit and shadow traversal recover when a previously empty scene is repopulated'
    ).toBe(3);

    const resizedStatistics = renderer.render({...options, width: 16, height: 16});
    device.submit();
    expect(
      resizedStatistics.instanceCount,
      'resizing recreates the trace graph without dropping scene instances'
    ).toBe(3);
    expect(
      resizedStatistics.rayTracing?.internalWidth,
      'resizing preserves the default half-resolution ray workload'
    ).toBe(8);

    const fullResolutionStatistics = renderer.render({
      ...options,
      width: 16,
      height: 16,
      resolutionScale: 1,
      adaptiveResolution: false
    });
    device.submit();
    expect(
      fullResolutionStatistics.rayTracing?.internalWidth,
      'callers can opt back into full-resolution ray dispatch'
    ).toBe(16);

    if (supportsRawValidationErrorScopes) {
      const updatedValidationError = await device.handle.popErrorScope();
      expect(
        updatedValidationError,
        'Morton TLAS and BLAS sorting, inactive leaves, regrowth, progressive tracing, and resizing remain core-valid'
      ).toBe(null);
    }

    renderer.destroyFrame(options.id);
    renderer.destroyFrame(options.id);
  } finally {
    renderer.destroy();
  }

  void 0;
});

it('RayTracingSceneRenderer batches small mesh sorting while retaining large-mesh radix and sparse history', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const surfaces = [1, 3, 4, 5, 257].map((triangleCount, surfaceIndex): SceneSurface => {
    const positions = new Float32Array(triangleCount * 9);
    const normals = new Float32Array(triangleCount * 9);
    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
      const triangleOffset = triangleIndex * 9;
      const horizontalOffset = (triangleIndex % 16) * 0.01;
      positions.set(
        [
          -0.2 + horizontalOffset,
          -0.2,
          0,
          0.2 + horizontalOffset,
          -0.2,
          0,
          horizontalOffset,
          0.2,
          0
        ],
        triangleOffset
      );
      normals.set([0, 0, 1, 0, 0, 1, 0, 0, 1], triangleOffset);
    }

    return {
      id: `segmented-mesh-surface-${surfaceIndex}`,
      geometry: new Geometry({
        id: `segmented-mesh-geometry-${surfaceIndex}`,
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: positions},
          NORMAL: {size: 3, value: normals}
        }
      }),
      material: {
        id: `segmented-mesh-material-${surfaceIndex}`,
        uniforms: {baseColorFactor: [0.2 + surfaceIndex * 0.15, 0.55, 0.9, 1]}
      },
      transforms: [new Matrix4().translate([(surfaceIndex - 2) * 0.35, 0, 0])]
    };
  });
  const options: RayTracingSceneRenderOptions = {
    id: 'ray-tracing-segmented-mesh-history',
    surfaces,
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 3], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 33 / 27,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 3]
    },
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 0.5}],
    samplesPerPixel: 1,
    progressive: true,
    adaptiveResolution: false,
    width: 33,
    height: 27
  };
  const renderer = new RayTracingSceneRenderer(device);

  try {
    const initialStatistics = renderer.render(options);
    device.submit();
    const resources = getRayTracingFrameResources(renderer, options.id);
    const segmentedSortNodes = resources.topologyGraph.stats.nodeOrder.filter(identifier =>
      identifier.includes('blas-sort-triangle-morton-keys-bitonic-local-')
    );
    expect(
      segmentedSortNodes.map(identifier => Number(identifier.split('-').at(-1))),
      'four independent mesh permutations share three width-bucketed segmented sort dispatches'
    ).toEqual([2, 4, 8]);
    const segmentedHierarchyNodes = resources.topologyGraph.stats.nodeOrder.filter(identifier =>
      identifier.includes('blas-bvh-fused-refit-')
    );
    expect(
      segmentedHierarchyNodes.map(identifier => Number(identifier.split('-').at(-1))),
      'four independent small mesh hierarchies share three leaf-capacity-bucketed BVH dispatches'
    ).toEqual([1, 4, 8]);
    expect(
      Boolean(
        resources.topologyGraph.stats.nodeOrder.some(identifier =>
          identifier.includes('blas-4-sort-triangle-morton-keys-radix-digit-0-histogram')
        )
      ),
      'meshes exceeding one workgroup retain the independent four-bit radix fallback'
    ).toBe(true);
    expect(initialStatistics.instanceCount, 'all independently sorted meshes render').toBe(5);
    expect(initialStatistics.triangleCount, 'segmented and radix sorting preserve every mesh').toBe(
      270
    );

    const firstColorHistory = resources.colorHistory.previousTexture;
    resources.phaseCount = 2;
    resources.phaseIndex = 1;
    const halfCoverage = renderer.render(options);
    device.submit();
    expect(
      halfCoverage.rayTracing?.sampledPixelCoverage,
      'odd-sized half-phase rendering carries the complementary retained pixels'
    ).toBe(0.5);
    expect(
      resources.colorHistory.previousTexture,
      'half-phase output rotates into retained history without a texture copy'
    ).not.toBe(firstColorHistory);

    resources.phaseCount = 4;
    resources.phaseIndex = 3;
    const quarterCoverage = renderer.render(options);
    device.submit();
    expect(
      quarterCoverage.rayTracing?.sampledPixelCoverage,
      'odd-sized quarter-phase rendering carries every non-selected pixel'
    ).toBe(0.25);
    expect(
      resources.colorHistory.previousTexture,
      'two successful sparse encodings return to the original retained history allocation'
    ).toBe(firstColorHistory);
  } finally {
    renderer.destroy();
  }

  void 0;
});

it('RayTracingSceneRenderer uploads only committed dirty placement transforms', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const transforms = Array.from({length: 8}, (_, index) =>
    new Matrix4().translate([(index - 4) * 0.25, 0, 0])
  );
  const instanceIds = transforms.map((_, index) => `dirty-placement-${index}`);
  const surface: SceneSurface = {
    id: 'dirty-placement-surface',
    geometry: new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
      }
    }),
    material: {
      id: 'dirty-placement-material',
      uniforms: {baseColorFactor: [0.8, 0.45, 0.2, 1]}
    },
    transforms,
    instanceIds
  };
  const revisions: NonNullable<RayTracingSceneRenderOptions['sceneRevisions']> = {
    identity: 'dirty-placement-world',
    topology: 0,
    transforms: 0,
    materials: 0,
    lights: 0
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'ray-tracing-dirty-placement-transforms',
    surfaces: [surface],
    sceneRevisions: revisions,
    primitives: {[surface.id]: {type: 'sphere', radius: 0.08}},
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 3], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 3]
    },
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 0.5}],
    samplesPerPixel: 1,
    progressive: true,
    adaptiveResolution: false,
    width: 16,
    height: 16
  };
  const renderer = new RayTracingSceneRenderer(device);

  try {
    renderer.render(options);
    device.submit();
    const resources = getRayTracingFrameResources(renderer, options.id);
    const primitiveBuffer: {
      write(data: ArrayBufferView, byteOffset?: number): void;
    } = Reflect.get(resources, 'primitiveBuffer');
    const originalWrite = primitiveBuffer.write.bind(primitiveBuffer);
    const writes: {byteOffset: number; values: Float32Array}[] = [];
    primitiveBuffer.write = (data, byteOffset = 0) => {
      writes.push({
        byteOffset,
        values: new Float32Array(
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        )
      });
      originalWrite(data, byteOffset);
    };

    const previousThirdTranslation = transforms[3][12];
    transforms[3] = new Matrix4().translate([0.9, 0.25, 0]);
    revisions.transforms++;
    revisions.dirtyInstanceIds = [instanceIds[3]];
    renderer.render(options);
    device.submit();
    expect(
      writes.map(write => [write.byteOffset, write.values.byteLength]),
      'one committed placement writes only its current/inverse matrices and previous motion matrix'
    ).toEqual([
      [3 * 68 * Float32Array.BYTES_PER_ELEMENT, 32 * Float32Array.BYTES_PER_ELEMENT],
      [(3 * 68 + 52) * Float32Array.BYTES_PER_ELEMENT, 16 * Float32Array.BYTES_PER_ELEMENT]
    ]);
    expect(writes[0].values[12], 'the current sparse transform is packed').toBe(Math.fround(0.9));
    expect(
      writes[1].values[12],
      'the previous sparse transform preserves the exact prior placement'
    ).toBe(Math.fround(previousThirdTranslation));

    writes.length = 0;
    transforms[5] = new Matrix4().translate([1.25, 0, 0]);
    revisions.transforms++;
    revisions.dirtyInstanceIds = [instanceIds[5]];
    renderer.render(options);
    device.submit();
    expect(
      writes.map(write => write.values.byteLength),
      'the next sparse placement commits the prior row without repacking unchanged instances'
    ).toEqual([16, 32, 16].map(floatCount => floatCount * Float32Array.BYTES_PER_ELEMENT));

    writes.length = 0;
    renderer.render(options);
    device.submit();
    expect(
      writes.map(write => [write.byteOffset, write.values.byteLength]),
      'the following unchanged frame commits only the pending previous-motion matrix'
    ).toEqual([
      [(5 * 68 + 52) * Float32Array.BYTES_PER_ELEMENT, 16 * Float32Array.BYTES_PER_ELEMENT]
    ]);
    expect(
      Boolean(resources.previousTransformsNeedCommit),
      'no previous transforms remain pending'
    ).toBe(false);

    writes.length = 0;
    const freshSurface = {...surface, transforms: [...transforms], instanceIds: [...instanceIds]};
    freshSurface.transforms[1] = new Matrix4().translate([-0.3, 0.2, 0]);
    revisions.transforms++;
    revisions.dirtyInstanceIds = [instanceIds[1]];
    const freshOptions = {...options, surfaces: [freshSurface]};
    renderer.render(freshOptions);
    device.submit();
    expect(
      writes.map(write => write.values.byteLength),
      'fresh scene descriptor arrays conservatively fall back to a complete primitive upload'
    ).toEqual([8 * 68 * Float32Array.BYTES_PER_ELEMENT]);

    writes.length = 0;
    const replacementSurface = {
      ...freshSurface,
      transforms: [...freshSurface.transforms],
      instanceIds: [...instanceIds]
    };
    replacementSurface.transforms[2] = new Matrix4().translate([0.6, -0.1, 0]);
    freshOptions.surfaces[0] = replacementSurface;
    revisions.transforms++;
    revisions.dirtyInstanceIds = [instanceIds[2]];
    renderer.render(freshOptions);
    device.submit();
    expect(
      writes.map(write => write.values.byteLength),
      'in-place descriptor replacement never reuses a stale retained placement reference'
    ).toEqual([8 * 68 * Float32Array.BYTES_PER_ELEMENT]);
  } finally {
    renderer.destroy();
  }

  void 0;
});

type InspectableCompiledGraph = {
  stats: {
    nodeOrder: string[];
    importedBufferCount: number;
    importedTextureCount: number;
    logicalTransientTextureCount: number;
  };
};

type InspectableRayTracingFrameResources = {
  topologyGraph: InspectableCompiledGraph;
  accelerationGraph: InspectableCompiledGraph;
  refitGraph: InspectableCompiledGraph;
  traceGraph: InspectableCompiledGraph;
  topologyNeedsUpdate: boolean;
  previousTransformsNeedCommit: boolean;
  refitsSinceMortonRebuild: number;
  phaseCount: number;
  phaseIndex: number;
  colorHistory: {previousTexture: object; currentTexture: object};
  metadataHistory: {previousTexture: object; currentTexture: object};
};

function getRayTracingFrameResources(
  renderer: RayTracingSceneRenderer,
  frameIdentifier: string
): InspectableRayTracingFrameResources {
  const frames: Map<string, InspectableRayTracingFrameResources> = Reflect.get(renderer, 'frames');
  const resources = frames.get(frameIdentifier);
  if (!resources) {
    throw new Error('Expected ray-tracing frame resources to be retained after rendering.');
  }
  return resources;
}

function findNodeIndex(nodeOrder: readonly string[], identifierSubstring: string): number {
  return nodeOrder.findIndex(identifier => identifier.includes(identifierSubstring));
}

function findLastNodeIndex(nodeOrder: readonly string[], identifierSubstring: string): number {
  for (let index = nodeOrder.length - 1; index >= 0; index--) {
    if (nodeOrder[index].includes(identifierSubstring)) {
      return index;
    }
  }
  return -1;
}

function getGraphBufferIdentifiers(graph: InspectableCompiledGraph): string[] {
  const buffers: Map<string, unknown> = Reflect.get(graph, 'buffers');
  return Array.from(buffers.keys());
}
