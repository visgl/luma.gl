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
import test from 'test/utils/vitest-tape';
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

test('RayTracingSceneRenderer adaptive budget stays at or below requested resolution', testCase => {
  const budget = makeAdaptiveBudgetState();
  for (let frameIndex = 1; frameIndex <= 100; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  testCase.equal(
    budget.resolutionScale,
    0.5,
    'sustained spare time never promotes the default half-resolution request to 75% or 100%'
  );

  budget.resolutionScale = 0.25;
  budget.historyNeedsReset = false;
  for (let frameIndex = 101; frameIndex <= 300; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
    budget.historyNeedsReset = false;
  }
  testCase.equal(
    budget.resolutionScale,
    0.5,
    'recovery can return to the requested scale but cannot overshoot it'
  );
  testCase.end();
});

test('RayTracingSceneRenderer adaptive budget uses stable history before sparse phases', testCase => {
  const budget = makeAdaptiveBudgetState({
    resolutionScale: 0.25,
    averageFrameTimeMilliseconds: 50,
    accumulatedFrameCount: 7
  });
  for (let frameIndex = 1; frameIndex <= 20; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  testCase.equal(
    budget.phaseCount,
    1,
    'minimum-resolution frames remain fully covered until progressive history is stable'
  );

  budget.accumulatedFrameCount = 8;
  updateRayTracingAdaptiveBudget(budget, 21_000);
  testCase.equal(budget.phaseCount, 2, 'stable history permits sparse scheduling under pressure');

  budget.phaseIndex = 1;
  budget.historyNeedsReset = true;
  updateRayTracingAdaptiveBudget(budget, 22_000);
  testCase.equal(budget.phaseCount, 1, 'history invalidation returns to full pixel coverage');
  testCase.equal(budget.phaseIndex, 0, 'history invalidation restarts sparse phase rotation');
  testCase.end();
});

test('RayTracingSceneRenderer adaptive budget requires sustained pressure', testCase => {
  const budget = makeAdaptiveBudgetState({averageFrameTimeMilliseconds: 50});
  for (let frameIndex = 1; frameIndex <= 5; frameIndex++) {
    updateRayTracingAdaptiveBudget(budget, frameIndex * 1000);
  }
  testCase.equal(
    budget.resolutionScale,
    0.5,
    'short frame-time spikes do not immediately rebuild lower-resolution history'
  );

  updateRayTracingAdaptiveBudget(budget, 6000);
  testCase.equal(budget.resolutionScale, 0.375, 'sustained pressure steps down one scale');
  testCase.equal(
    budget.historyNeedsReset,
    true,
    'resolution changes explicitly invalidate history'
  );
  testCase.end();
});

test('RayTracingSceneRenderer builds and traverses Morton TLAS and mesh BLAS within WebGPU core limits', async testCase => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const supportsRawValidationErrorScopes =
    device.info.gpu !== 'software' && device.info.gpuType !== 'cpu' && !device.info.fallback;
  if (!supportsRawValidationErrorScopes) {
    testCase.comment('software WebGPU can cancel raw validation error-scope callbacks');
  }

  testCase.equal(
    device.limits.maxStorageBuffersPerShaderStage,
    8,
    'GPU TLAS and BLAS construction use only the default WebGPU core storage-buffer allowance'
  );

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
      testCase.equal(
        initialValidationError,
        null,
        'GPU Morton TLAS and BLAS construction, nearest-hit traversal, and any-hit shadows validate'
      );
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
    const loadLeavesIndex = findNodeIndex(accelerationNodeOrder, 'ray-tracing-bvh-load-leaves');
    const refitIndex = findNodeIndex(accelerationNodeOrder, 'ray-tracing-bvh-refit-depth');
    testCase.ok(
      [
        buildBoundsIndex,
        initializeBoundsIndex,
        reduceBoundsIndex,
        encodeMortonIndex,
        sortMortonCompletionIndex,
        gatherBoundsIndex,
        loadLeavesIndex,
        refitIndex
      ].every(index => index >= 0) &&
        buildBoundsIndex < reduceBoundsIndex &&
        initializeBoundsIndex < reduceBoundsIndex &&
        reduceBoundsIndex < encodeMortonIndex &&
        encodeMortonIndex < sortMortonCompletionIndex &&
        sortMortonCompletionIndex < gatherBoundsIndex &&
        gatherBoundsIndex < loadLeavesIndex &&
        loadLeavesIndex < refitIndex,
      'the acceleration graph builds bounds, Morton-sorts leaves, gathers them, then refits the TLAS'
    );
    testCase.ok(
      getGraphBufferIdentifiers(frameResources.accelerationGraph).includes('sorted-primitive-ids'),
      'the acceleration graph publishes an explicit sorted primitive permutation'
    );
    testCase.ok(
      getGraphBufferIdentifiers(frameResources.traceGraph).includes('leaf-primitive-ids'),
      'the trace graph consumes the explicit sorted primitive permutation'
    );
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
      'blas-0-sort-triangle-morton-keys'
    );
    const gatherBlasBoundsIndex = findNodeIndex(topologyNodeOrder, 'blas-0-gather-sorted-bounds');
    const loadBlasLeavesIndex = findNodeIndex(topologyNodeOrder, 'blas-0-bvh-load-leaves');
    const refitBlasIndex = findNodeIndex(topologyNodeOrder, 'blas-0-bvh-refit-depth');
    const packBlasIndex = findNodeIndex(topologyNodeOrder, 'blas-0-pack-nodes');
    testCase.ok(
      [
        triangleBoundsIndex,
        initializeBlasBoundsIndex,
        reduceBlasBoundsIndex,
        encodeBlasMortonIndex,
        sortBlasMortonCompletionIndex,
        gatherBlasBoundsIndex,
        loadBlasLeavesIndex,
        refitBlasIndex,
        packBlasIndex
      ].every(index => index >= 0) &&
        triangleBoundsIndex < reduceBlasBoundsIndex &&
        initializeBlasBoundsIndex < reduceBlasBoundsIndex &&
        reduceBlasBoundsIndex < encodeBlasMortonIndex &&
        encodeBlasMortonIndex < sortBlasMortonCompletionIndex &&
        sortBlasMortonCompletionIndex < gatherBlasBoundsIndex &&
        gatherBlasBoundsIndex < loadBlasLeavesIndex &&
        loadBlasLeavesIndex < refitBlasIndex &&
        refitBlasIndex < packBlasIndex,
      'the topology graph Morton-sorts mesh triangles, builds the BLAS, and packs trace nodes'
    );
    testCase.ok(
      getGraphBufferIdentifiers(frameResources.topologyGraph).includes('blas-nodes') &&
        getGraphBufferIdentifiers(frameResources.topologyGraph).includes('blas-triangle-ids'),
      'the topology graph publishes packed BLAS nodes and triangle permutations'
    );
    testCase.ok(
      getGraphBufferIdentifiers(frameResources.traceGraph).includes('blas-nodes') &&
        getGraphBufferIdentifiers(frameResources.traceGraph).includes('blas-triangle-ids'),
      'the trace graph consumes packed BLAS nodes and triangle permutations'
    );
    const refitNodeOrder = frameResources.refitGraph.stats.nodeOrder;
    const refitBoundsIndex = findNodeIndex(refitNodeOrder, 'refit-primitive-bounds');
    const refitGatherIndex = findNodeIndex(refitNodeOrder, 'refit-gather-sorted-bounds');
    const refitLoadLeavesIndex = findNodeIndex(refitNodeOrder, 'ray-tracing-refit-bvh-load-leaves');
    const refitDepthIndex = findNodeIndex(refitNodeOrder, 'ray-tracing-refit-bvh-refit-depth');
    testCase.ok(
      [refitBoundsIndex, refitGatherIndex, refitLoadLeavesIndex, refitDepthIndex].every(
        index => index >= 0
      ) &&
        refitBoundsIndex < refitGatherIndex &&
        refitGatherIndex < refitLoadLeavesIndex &&
        refitLoadLeavesIndex < refitDepthIndex,
      'the transform-only graph gathers the retained permutation and refits without rebuilding Morton keys'
    );
    testCase.notOk(
      refitNodeOrder.some(
        identifier =>
          identifier.includes('scene-bounds') ||
          identifier.includes('build-morton-keys') ||
          identifier.includes('sort-primitive-morton-keys')
      ),
      'the transform-only graph omits scene reduction, Morton encoding, and sorting'
    );
    testCase.notOk(
      refitNodeOrder.some(identifier => identifier.includes('-blas-')),
      'the transform-only graph reuses topology-owned BLAS data'
    );
    testCase.ok(
      getGraphBufferIdentifiers(frameResources.refitGraph).includes('sorted-primitive-ids'),
      'the refit graph reuses the retained sorted primitive permutation'
    );
    testCase.equal(
      frameResources.traceGraph.stats.importedBufferCount,
      9,
      'the trace graph imports one uniform plus exactly eight storage buffers within CORE limits'
    );
    testCase.ok(
      frameResources.traceGraph.stats.nodeOrder.some(identifier =>
        identifier.includes('trace-rays')
      ),
      'the Morton TLAS and packed BLASes feed the ray-tracing compute node'
    );
    testCase.equal(
      initialStatistics.surfaceCount,
      2,
      'the shared renderer preserves both surfaces'
    );
    testCase.equal(
      initialStatistics.instanceCount,
      3,
      'the Morton TLAS preserves translated, rotated, and nonuniformly scaled placements'
    );
    testCase.equal(
      initialStatistics.triangleCount,
      4,
      'analytic spheres avoid expansion while the indexed mesh retains four BLAS leaves'
    );
    testCase.equal(initialStatistics.drawCount, 1, 'the graph uses one fullscreen presentation');
    testCase.equal(
      initialStatistics.rayTracing?.internalWidth,
      16,
      'the default ray workload traces half the display width'
    );
    testCase.equal(
      initialStatistics.rayTracing?.internalHeight,
      16,
      'the default ray workload traces half the display height'
    );
    testCase.equal(
      initialStatistics.rayTracing?.sampledPixelCoverage,
      1,
      'new history is fully initialized before sparse scheduling can begin'
    );
    testCase.equal(
      initialStatistics.rayTracing?.accumulatedSamples,
      2,
      'ray-tracing telemetry reports samples per pixel rather than encoded frames'
    );

    if (supportsRawValidationErrorScopes) {
      device.handle.pushErrorScope('validation');
    }
    const accumulatedStatistics = renderer.render(options);
    device.submit();
    testCase.equal(
      accumulatedStatistics.instanceCount,
      3,
      'unchanged instances reuse the compiled graph and progressive history'
    );
    testCase.equal(
      accumulatedStatistics.rayTracing?.accumulatedSamples,
      4,
      'progressive telemetry accumulates the requested samples per pixel'
    );

    const nonReprojectedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    testCase.equal(
      nonReprojectedStatistics.rayTracing?.accumulatedSamples,
      2,
      'disabling temporal reprojection starts a fresh progressive history'
    );
    const accumulatedNonReprojectedStatistics = renderer.render({
      ...options,
      temporalReprojection: false
    });
    device.submit();
    testCase.equal(
      accumulatedNonReprojectedStatistics.rayTracing?.accumulatedSamples,
      4,
      'unchanged transforms can still accumulate without temporal reprojection'
    );

    sphereSurface.transforms = [
      new Matrix4()
        .translate([0.45, 0.1, 0])
        .rotateY(Math.PI / 5)
        .scale([1.15, 0.75, 0.6]),
      new Matrix4().translate([-0.45, -0.1, 0]).scale([0.7, 1.1, 0.8])
    ];
    const refittedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    testCase.equal(
      refittedStatistics.instanceCount,
      3,
      'same-count transform animation preserves every Morton TLAS leaf'
    );
    testCase.ok(
      getRayTracingFrameResources(renderer, options.id).refitsSinceMortonRebuild > 0,
      'same-count transform animation uses the retained-permutation refit path'
    );
    testCase.notOk(
      getRayTracingFrameResources(renderer, options.id).topologyNeedsUpdate,
      'same-count transform animation reuses the topology-only BLAS graph'
    );

    sphereSurface.transforms = [
      new Matrix4()
        .translate([-0.35, 0.2, 0])
        .rotateY(Math.PI / 3)
        .scale([0.75, 1.3, 0.5])
    ];
    const reducedStatistics = renderer.render({...options, temporalReprojection: false});
    device.submit();
    testCase.equal(
      reducedStatistics.instanceCount,
      2,
      'refit invalidates inactive leaves when the instance count shrinks'
    );
    testCase.equal(
      reducedStatistics.rayTracing?.accumulatedSamples,
      2,
      'moving transforms reset history when reprojection is disabled'
    );
    testCase.equal(
      getRayTracingFrameResources(renderer, options.id).refitsSinceMortonRebuild,
      0,
      'topology-changing shrink rebuilds the Morton order before removing inactive leaves'
    );

    sphereSurface.transforms = [
      ...sphereSurface.transforms,
      new Matrix4()
        .translate([0.75, -0.1, 0.1])
        .rotateY(-Math.PI / 6)
        .scale([0.5, 1.2, 0.9])
    ];
    const restoredStatistics = renderer.render({...options, shadows: false});
    device.submit();
    testCase.equal(
      restoredStatistics.instanceCount,
      3,
      'repopulated leaves reuse their stable object identities when shadows are disabled'
    );

    const emptyStatistics = renderer.render({...options, surfaces: []});
    device.submit();
    testCase.equal(emptyStatistics.instanceCount, 0, 'empty scenes retain a valid padded TLAS');
    testCase.equal(emptyStatistics.drawCount, 1, 'empty scenes still present their background');

    const repopulatedStatistics = renderer.render(options);
    device.submit();
    testCase.equal(
      repopulatedStatistics.instanceCount,
      3,
      'nearest-hit and shadow traversal recover when a previously empty scene is repopulated'
    );

    const resizedStatistics = renderer.render({...options, width: 16, height: 16});
    device.submit();
    testCase.equal(
      resizedStatistics.instanceCount,
      3,
      'resizing recreates the trace graph without dropping scene instances'
    );
    testCase.equal(
      resizedStatistics.rayTracing?.internalWidth,
      8,
      'resizing preserves the default half-resolution ray workload'
    );

    const fullResolutionStatistics = renderer.render({
      ...options,
      width: 16,
      height: 16,
      resolutionScale: 1,
      adaptiveResolution: false
    });
    device.submit();
    testCase.equal(
      fullResolutionStatistics.rayTracing?.internalWidth,
      16,
      'callers can opt back into full-resolution ray dispatch'
    );

    if (supportsRawValidationErrorScopes) {
      const updatedValidationError = await device.handle.popErrorScope();
      testCase.equal(
        updatedValidationError,
        null,
        'Morton TLAS and BLAS sorting, inactive leaves, regrowth, progressive tracing, and resizing remain core-valid'
      );
    }

    renderer.destroyFrame(options.id);
    renderer.destroyFrame(options.id);
  } finally {
    renderer.destroy();
  }

  testCase.end();
});

type InspectableCompiledGraph = {
  stats: {
    nodeOrder: string[];
    importedBufferCount: number;
  };
};

type InspectableRayTracingFrameResources = {
  topologyGraph: InspectableCompiledGraph;
  accelerationGraph: InspectableCompiledGraph;
  refitGraph: InspectableCompiledGraph;
  traceGraph: InspectableCompiledGraph;
  topologyNeedsUpdate: boolean;
  refitsSinceMortonRebuild: number;
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
