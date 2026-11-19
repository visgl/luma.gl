// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Resource} from './resource';
import type {Device} from '../device';
import type {Stat, Stats} from 'probe.gl/stats';
import {uid} from '../../utils/uid';

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

export type DeviceResourceProps = {
  /** Name of resource, mainly for debugging purposes. A unique name will be assigned if not provided */
  id?: string;
  /** Handle for the underlying resources (WebGL object or WebGPU handle) */
  handle?: unknown;
  /**
   * @internal Opaque externally owned handle. luma.gl may reference this handle but must not
   * initialize, mutate, or destroy it.
   */
  _isHandleBorrowed?: boolean;
  /** User provided data stored on this resource  */
  userData?: {[key: string]: unknown};
};

/**
 * Base class for GPU (WebGPU/WebGL) Resources
 */
export abstract class DeviceResource<
  Props extends DeviceResourceProps = DeviceResourceProps
> extends Resource {
  /** Default properties for resource */
  static defaultProps: Required<DeviceResourceProps> = {
    id: 'undefined',
    handle: undefined,
    _isHandleBorrowed: false,
    userData: undefined!
  };

  abstract get [Symbol.toStringTag](): string;

  override toString(): string {
    return `${this[Symbol.toStringTag] || this.constructor.name}:"${this.id}"`;
  }

  /** Compact serialization for assertion diffs and structured debug logs. */
  toJSON(): string {
    return this.toString();
  }

  /** props.id, for debugging. */
  id: string;
  /** The props that this resource was created with */
  readonly props: Required<Props>;
  /** User data object, reserved for the application */
  readonly userData: Record<string, unknown> = {};
  /** The device that this resource is associated with */
  abstract readonly device: Device;
  /** The handle for the underlying resource, e.g. WebGL object or WebGPU handle */
  abstract readonly handle: unknown;
  /** The device that this resource is associated with - TODO can we remove this dup? */
  private _device: Device;

  /** For resources that allocate GPU memory */
  private allocatedBytes: number = 0;
  /** Stats bucket currently holding the tracked allocation */
  private allocatedBytesName: string | null = null;

  /** Whether luma.gl created and owns the underlying resource handle. */
  get ownsHandle(): boolean {
    return (
      (this.props.handle === undefined || this.props.handle === null) && !this.isHandleBorrowed
    );
  }

  /** Whether luma.gl may only reference the opaque externally owned resource handle. */
  get isHandleBorrowed(): boolean {
    return Boolean(this.props._isHandleBorrowed);
  }

  /**
   * Create a new DeviceResource. Called from Subclass
   */
  constructor(device: Device, props: Props, defaultProps: Required<Props>) {
    super();
    if (!device) {
      throw new Error('no device');
    }
    this._device = device;
    this.props = selectivelyMerge<Props>(props, defaultProps);

    const id =
      this.props.id !== 'undefined' ? (this.props.id as string) : uid(this[Symbol.toStringTag]);
    this.props.id = id;
    this.id = id;
    this.userData = this.props.userData || {};

    this.addStats();
  }

  /**
   * Combines a map of user props and default props, only including props from defaultProps
   * @returns returns a map of overridden default props
   */
  getProps(): object {
    return this.props;
  }

  /** Backend cleanup. Override this instead of destroy(); children are already destroyed. */
  protected destroyHandle(): void {}

  /** Complete device bookkeeping even when backend cleanup fails. */
  protected override onDestroy(): void {
    try {
      this.destroyHandle();
    } finally {
      this.trackDeallocatedMemory();
      this.removeStats();
    }
  }

  /** Track object destruction after backend cleanup. */
  protected removeStats(): void {
    const profiler = getCpuHotspotProfiler(this._device);
    const startTime = profiler ? getTimestamp() : 0;
    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_COUNTS_STATS),
      this._device.statsManager.getStats(LEGACY_RESOURCE_COUNTS_STATS)
    ];
    const orderedStatNames = getResourceCountStatOrder(this._device);
    for (const stats of statsObjects) {
      initializeStats(stats, orderedStatNames);
    }
    const name = this.getStatsName();
    for (const stats of statsObjects) {
      stats.get('Resources Active').decrementCount();
      stats.get(`${name}s Active`).decrementCount();
    }
    if (profiler) {
      profiler.statsBookkeepingCalls = (profiler.statsBookkeepingCalls || 0) + 1;
      profiler.statsBookkeepingTimeMs =
        (profiler.statsBookkeepingTimeMs || 0) + (getTimestamp() - startTime);
    }
  }

  /** Called by subclass to track memory allocations */
  protected trackAllocatedMemory(bytes: number, name = this.getStatsName()): void {
    const profiler = getCpuHotspotProfiler(this._device);
    const startTime = profiler ? getTimestamp() : 0;
    const stats = this._device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS);

    if (this.allocatedBytes > 0 && this.allocatedBytesName) {
      stats.get('GPU Memory').subtractCount(this.allocatedBytes);
      stats.get(`${this.allocatedBytesName} Memory`).subtractCount(this.allocatedBytes);
    }

    stats.get('GPU Memory').addCount(bytes);
    stats.get(`${name} Memory`).addCount(bytes);
    if (profiler) {
      profiler.statsBookkeepingCalls = (profiler.statsBookkeepingCalls || 0) + 1;
      profiler.statsBookkeepingTimeMs =
        (profiler.statsBookkeepingTimeMs || 0) + (getTimestamp() - startTime);
    }
    this.allocatedBytes = bytes;
    this.allocatedBytesName = name;
  }

  /** Called by subclass to track handle-backed memory allocations separately from owned allocations */
  protected trackReferencedMemory(bytes: number, name = this.getStatsName()): void {
    this.trackAllocatedMemory(bytes, `External ${name}`);
  }

  /** Called by subclass to track memory deallocations */
  protected trackDeallocatedMemory(name = this.getStatsName()): void {
    if (this.allocatedBytes === 0) {
      this.allocatedBytesName = null;
      return;
    }

    const profiler = getCpuHotspotProfiler(this._device);
    const startTime = profiler ? getTimestamp() : 0;
    const stats = this._device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS);
    stats.get('GPU Memory').subtractCount(this.allocatedBytes);
    stats.get(`${this.allocatedBytesName || name} Memory`).subtractCount(this.allocatedBytes);
    if (profiler) {
      profiler.statsBookkeepingCalls = (profiler.statsBookkeepingCalls || 0) + 1;
      profiler.statsBookkeepingTimeMs =
        (profiler.statsBookkeepingTimeMs || 0) + (getTimestamp() - startTime);
    }
    this.allocatedBytes = 0;
    this.allocatedBytesName = null;
  }

  /** Called by subclass to deallocate handle-backed memory tracked via trackReferencedMemory() */
  protected trackDeallocatedReferencedMemory(name = this.getStatsName()): void {
    this.trackDeallocatedMemory(`Referenced ${name}`);
  }

  /** Called by resource constructor to track object creation */
  private addStats(): void {
    const name = this.getStatsName();
    const profiler = getCpuHotspotProfiler(this._device);
    const startTime = profiler ? getTimestamp() : 0;
    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_COUNTS_STATS),
      this._device.statsManager.getStats(LEGACY_RESOURCE_COUNTS_STATS)
    ];
    const orderedStatNames = getResourceCountStatOrder(this._device);
    for (const stats of statsObjects) {
      initializeStats(stats, orderedStatNames);
    }
    for (const stats of statsObjects) {
      stats.get('Resources Created').incrementCount();
      stats.get('Resources Active').incrementCount();
      stats.get(`${name}s Created`).incrementCount();
      stats.get(`${name}s Active`).incrementCount();
    }
    if (profiler) {
      profiler.statsBookkeepingCalls = (profiler.statsBookkeepingCalls || 0) + 1;
      profiler.statsBookkeepingTimeMs =
        (profiler.statsBookkeepingTimeMs || 0) + (getTimestamp() - startTime);
    }
    recordTransientCanvasResourceCreate(this._device, name);
  }

  /** Canonical resource name used for stats buckets. */
  protected getStatsName(): string {
    return getCanonicalResourceName(this);
  }
}

/**
 * Combines a map of user props and default props, only including props from defaultProps
 * @param props
 * @param defaultProps
 * @returns returns a map of overridden default props
 */
function selectivelyMerge<Props>(props: Props, defaultProps: Required<Props>): Required<Props> {
  const mergedProps = {...defaultProps};
  for (const key in props) {
    if (props[key] !== undefined) {
      mergedProps[key] = props[key];
    }
  }
  return mergedProps;
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

function getResourceCountStatOrder(device: Device): readonly string[] {
  return device.type === 'webgl' ? WEBGL_RESOURCE_COUNT_STAT_ORDER : BASE_RESOURCE_COUNT_STAT_ORDER;
}

function getCpuHotspotProfiler(device: Device): CpuHotspotProfiler | null {
  const profiler = device.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler | undefined;
  return profiler?.enabled ? profiler : null;
}

function getTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

function recordTransientCanvasResourceCreate(device: Device, name: string): void {
  const profiler = getCpuHotspotProfiler(device);
  if (!profiler || !profiler.activeDefaultFramebufferAcquireDepth) {
    return;
  }

  profiler.transientCanvasResourceCreates = (profiler.transientCanvasResourceCreates || 0) + 1;

  switch (name) {
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

function getCanonicalResourceName(resource: DeviceResource<any>): string {
  let prototype = Object.getPrototypeOf(resource);

  while (prototype) {
    const parentPrototype = Object.getPrototypeOf(prototype);
    if (!parentPrototype || parentPrototype === DeviceResource.prototype) {
      return (
        getPrototypeToStringTag(prototype) ||
        resource[Symbol.toStringTag] ||
        resource.constructor.name
      );
    }
    prototype = parentPrototype;
  }

  return resource[Symbol.toStringTag] || resource.constructor.name;
}

function getPrototypeToStringTag(prototype: object): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, Symbol.toStringTag);
  if (typeof descriptor?.get === 'function') {
    return descriptor.get.call(prototype);
  }
  if (typeof descriptor?.value === 'string') {
    return descriptor.value;
  }
  return null;
}
