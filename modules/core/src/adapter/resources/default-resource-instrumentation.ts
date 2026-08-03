// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Stat, Stats} from '@probe.gl/stats';
import type {Device} from '../device';
import type {ResourceInstrumentation} from './resource-instrumentation';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';
const RESOURCE_COUNTS_STATS = 'GPU Resource Counts';
const LEGACY_RESOURCE_COUNTS_STATS = 'Resource Counts';
const GPU_TIME_AND_MEMORY_STATS = 'GPU Time and Memory';
const BASE_RESOURCE_COUNT_ORDER = [
  'Resources',
  'Buffers',
  'Textures',
  'Samplers',
  'TextureViews',
  'Framebuffers',
  'QuerySets',
  'Shaders',
  'RenderPipelines',
  'ComputePipelines',
  'PipelineLayouts',
  'VertexArrays',
  'RenderPasss',
  'RenderBundleEncoders',
  'RenderBundles',
  'ComputePasss',
  'CommandEncoders',
  'CommandBuffers'
] as const;
const WEBGL_RESOURCE_COUNT_ORDER = [
  'Resources',
  'Buffers',
  'Textures',
  'Samplers',
  'TextureViews',
  'Framebuffers',
  'QuerySets',
  'Shaders',
  'RenderPipelines',
  'SharedRenderPipelines',
  'ComputePipelines',
  'PipelineLayouts',
  'VertexArrays',
  'RenderPasss',
  'RenderBundleEncoders',
  'RenderBundles',
  'ComputePasss',
  'CommandEncoders',
  'CommandBuffers'
] as const;
const BASE_RESOURCE_COUNT_STAT_ORDER = BASE_RESOURCE_COUNT_ORDER.flatMap(resourceType => [
  `${resourceType} Created`,
  `${resourceType} Active`
]);
const WEBGL_RESOURCE_COUNT_STAT_ORDER = WEBGL_RESOURCE_COUNT_ORDER.flatMap(resourceType => [
  `${resourceType} Created`,
  `${resourceType} Active`
]);
const ORDERED_STATS_CACHE = new WeakMap<
  Stats,
  {orderedStatNames: readonly string[]; statCount: number}
>();
const ORDERED_STAT_NAME_SET_CACHE = new WeakMap<readonly string[], Set<string>>();

type CpuHotspotProfiler = {
  enabled?: boolean;
  activeDefaultFramebufferAcquireDepth?: number;
  statsBookkeepingTimeMs?: number;
  statsBookkeepingCalls?: number;
  transientCanvasResourceCreates?: number;
  transientCanvasTextureCreates?: number;
  transientCanvasTextureViewCreates?: number;
  transientCanvasSamplerCreates?: number;
  transientCanvasFramebufferCreates?: number;
};

/** Default compatibility instrumentation that mirrors resource events into luma stats. */
export const defaultResourceInstrumentation: ResourceInstrumentation = {
  recordResourceCreated(device, _resource, resourceType) {
    const profiler = getCpuHotspotProfiler(device);
    const startTime = profiler ? getTimestamp() : 0;
    const statsObjects = getResourceCountStats(device);
    initializeResourceCountStats(device, statsObjects);
    for (const stats of statsObjects) {
      stats.get('Resources Created').incrementCount();
      stats.get('Resources Active').incrementCount();
      stats.get(`${resourceType}s Created`).incrementCount();
      stats.get(`${resourceType}s Active`).incrementCount();
    }
    recordStatsBookkeeping(profiler, startTime);
    recordTransientCanvasResourceCreate(device, resourceType);
  },

  recordResourceDestroyed(device, _resource, resourceType) {
    const profiler = getCpuHotspotProfiler(device);
    const startTime = profiler ? getTimestamp() : 0;
    const statsObjects = getResourceCountStats(device);
    initializeResourceCountStats(device, statsObjects);
    for (const stats of statsObjects) {
      stats.get('Resources Active').decrementCount();
      stats.get(`${resourceType}s Active`).decrementCount();
    }
    recordStatsBookkeeping(profiler, startTime);
  },

  recordResourceAllocation(
    device,
    _resource,
    byteLength,
    resourceType,
    previousByteLength,
    previousResourceType
  ) {
    const profiler = getCpuHotspotProfiler(device);
    const startTime = profiler ? getTimestamp() : 0;
    const stats = device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS);
    if (previousByteLength > 0 && previousResourceType) {
      stats.get('GPU Memory').subtractCount(previousByteLength);
      stats.get(`${previousResourceType} Memory`).subtractCount(previousByteLength);
    }
    stats.get('GPU Memory').addCount(byteLength);
    stats.get(`${resourceType} Memory`).addCount(byteLength);
    recordStatsBookkeeping(profiler, startTime);
  },

  recordResourceDeallocation(device, _resource, byteLength, resourceType) {
    const profiler = getCpuHotspotProfiler(device);
    const startTime = profiler ? getTimestamp() : 0;
    const stats = device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS);
    stats.get('GPU Memory').subtractCount(byteLength);
    stats.get(`${resourceType} Memory`).subtractCount(byteLength);
    recordStatsBookkeeping(profiler, startTime);
  }
};

function getResourceCountStats(device: Device): Stats[] {
  return [
    device.statsManager.getStats(RESOURCE_COUNTS_STATS),
    device.statsManager.getStats(LEGACY_RESOURCE_COUNTS_STATS)
  ];
}

function initializeResourceCountStats(device: Device, statsObjects: Stats[]): void {
  const orderedStatNames =
    device.type === 'webgl' ? WEBGL_RESOURCE_COUNT_STAT_ORDER : BASE_RESOURCE_COUNT_STAT_ORDER;
  for (const stats of statsObjects) {
    initializeStats(stats, orderedStatNames);
  }
}

function initializeStats(stats: Stats, orderedStatNames: readonly string[]): void {
  const statsMap = stats.stats;
  let addedOrderedStat = false;
  for (const statName of orderedStatNames) {
    if (!statsMap[statName]) {
      stats.get(statName);
      addedOrderedStat = true;
    }
  }

  const statCount = Object.keys(statsMap).length;
  const cachedStats = ORDERED_STATS_CACHE.get(stats);
  if (
    !addedOrderedStat &&
    cachedStats?.orderedStatNames === orderedStatNames &&
    cachedStats.statCount === statCount
  ) {
    return;
  }

  const reorderedStats: Record<string, Stat> = {};
  let orderedStatNamesSet = ORDERED_STAT_NAME_SET_CACHE.get(orderedStatNames);
  if (!orderedStatNamesSet) {
    orderedStatNamesSet = new Set(orderedStatNames);
    ORDERED_STAT_NAME_SET_CACHE.set(orderedStatNames, orderedStatNamesSet);
  }

  for (const statName of orderedStatNames) {
    if (statsMap[statName]) {
      reorderedStats[statName] = statsMap[statName];
    }
  }
  for (const [statName, stat] of Object.entries(statsMap)) {
    if (!orderedStatNamesSet.has(statName)) {
      reorderedStats[statName] = stat;
    }
  }
  for (const statName of Object.keys(statsMap)) {
    delete statsMap[statName];
  }
  Object.assign(statsMap, reorderedStats);
  ORDERED_STATS_CACHE.set(stats, {orderedStatNames, statCount});
}

function getCpuHotspotProfiler(device: Device): CpuHotspotProfiler | null {
  const profiler = device.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler | undefined;
  return profiler?.enabled ? profiler : null;
}

function recordStatsBookkeeping(profiler: CpuHotspotProfiler | null, startTime: number): void {
  if (profiler) {
    profiler.statsBookkeepingCalls = (profiler.statsBookkeepingCalls || 0) + 1;
    profiler.statsBookkeepingTimeMs =
      (profiler.statsBookkeepingTimeMs || 0) + (getTimestamp() - startTime);
  }
}

function getTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

function recordTransientCanvasResourceCreate(device: Device, resourceType: string): void {
  const profiler = getCpuHotspotProfiler(device);
  if (!profiler || !profiler.activeDefaultFramebufferAcquireDepth) {
    return;
  }

  profiler.transientCanvasResourceCreates = (profiler.transientCanvasResourceCreates || 0) + 1;
  switch (resourceType) {
    case 'Texture':
      profiler.transientCanvasTextureCreates = (profiler.transientCanvasTextureCreates || 0) + 1;
      break;
    case 'TextureView':
      profiler.transientCanvasTextureViewCreates =
        (profiler.transientCanvasTextureViewCreates || 0) + 1;
      break;
    case 'Sampler':
      profiler.transientCanvasSamplerCreates = (profiler.transientCanvasSamplerCreates || 0) + 1;
      break;
    case 'Framebuffer':
      profiler.transientCanvasFramebufferCreates =
        (profiler.transientCanvasFramebufferCreates || 0) + 1;
      break;
    default:
      break;
  }
}
