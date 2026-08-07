// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSplatData} from './splat-data';
import {projectWorldPositionToScreen} from './splat-covariance';
import {
  SplatResidencyManager,
  type SplatResidencyBounds,
  type SplatResidencyBudget,
  type SplatResidencyChunk
} from './splat-residency';

/** Whether refined source pages replace their parent or add detail to it. */
export type SplatHierarchyRefinement = 'replace' | 'add';

/** One format-independent, independently loadable Gaussian splat hierarchy page. */
export type SplatHierarchyNode = {
  /** Stable source tile identity retained across traversal, loading, and rendering. */
  id: string;
  /** Optional source parent identity, useful for externally supplied tile metadata. */
  parentId?: string;
  /** World-space bounding sphere used for visibility, camera distance, and foveation. */
  bounds: SplatResidencyBounds;
  /** World-space geometric approximation error represented by this source page. */
  geometricError: number;
  /** Independently loadable child pages, without assumptions about branching shape. */
  children?: readonly SplatHierarchyNode[];
  /** Optional already-prepared source batch; its existing buffers remain untouched. */
  data?: GPUSplatData;
  /** Optional page-specific decoder, worker bridge, or asynchronous source loader. */
  load?: SplatHierarchyPageLoader;
  /** Opaque source content location passed unchanged to a caller-provided page loader. */
  contentUri?: string;
  /** Upper-bound GPU allocation reserved before asynchronous preparation starts. */
  estimatedGpuBytes?: number;
  /** Upper-bound logical source rows reserved before asynchronous preparation starts. */
  estimatedSplatCount?: number;
  /** Whether finer child content replaces this page or contributes additional detail. */
  refinement?: SplatHierarchyRefinement;
  /** Whether the residency manager owns and destroys this particular source page. */
  ownsData?: boolean;
  /** Opaque source metadata, such as compression, feature identifiers, or tile transforms. */
  metadata?: Readonly<Record<string, unknown>>;
};

/** Cancellation, hierarchy depth, and view-dependent priority supplied to page loaders. */
export type SplatHierarchyLoadContext = {
  /** Aborted when this page leaves the requested view or its hierarchy is destroyed. */
  signal: AbortSignal;
  /** Zero-based hierarchy depth of this independently loaded source page. */
  levelOfDetail: number;
  /** Camera- and foveation-dependent importance used for scheduling and eviction. */
  priority: number;
};

/** Caller-owned decoder or worker bridge that prepares exactly one intact source batch. */
export type SplatHierarchyPageLoader = (
  node: SplatHierarchyNode,
  context: SplatHierarchyLoadContext
) => GPUSplatData | Promise<GPUSplatData>;

/** Viewport-normalized focus controls for concentrating detail near a gaze position. */
export type SplatHierarchyFoveation = {
  /** Normalized screen-space gaze position; the default is the viewport center. */
  center?: readonly [number, number];
  /** Normalized distance around the gaze position that receives full detail. */
  radius?: number;
  /** Error relaxation outside the focus radius; zero disables foveation. */
  strength?: number;
};

/** Camera state used to cull source pages and choose an active level-of-detail frontier. */
export type SplatHierarchyView = {
  /** World-space camera position used for conservative page distance calculations. */
  cameraPosition: readonly [number, number, number];
  /** Current physical viewport dimensions in pixels. */
  viewportSize: readonly [number, number];
  /** Optional column-major clip transform used for conservative sphere culling. */
  modelViewProjectionMatrix?: readonly number[];
  /** Vertical camera field of view in radians; defaults to sixty degrees. */
  verticalFieldOfView?: number;
  /** Optional per-view override for gaze-aware page selection and load ordering. */
  foveation?: SplatHierarchyFoveation;
};

/** One intact, currently rendered source batch and its view-dependent hierarchy metadata. */
export type SplatHierarchyFrontierEntry = {
  /** Original caller-supplied source metadata, including content location and children. */
  node: SplatHierarchyNode;
  /** Original independently retained GPU source batch and its residency metadata. */
  chunk: SplatResidencyChunk;
  /** Zero-based depth of this page in the caller-supplied hierarchy. */
  levelOfDetail: number;
  /** Conservative unfoveated geometric approximation error in physical pixels. */
  screenSpaceError: number;
  /** Foveation-adjusted importance used to prioritize source-page requests. */
  priority: number;
  /** Whether this page is temporarily covering finer pages that are not resident yet. */
  isFallback: boolean;
};

/** Current traversal, bounded scheduling, source visibility, and page-load diagnostics. */
export type SplatHierarchyStats = {
  /** Total number of source nodes in the indexed caller-owned hierarchy. */
  nodeCount: number;
  /** Source nodes intersecting the current conservative camera frustum. */
  visibleNodeCount: number;
  /** Whole source branches excluded by conservative bounding-sphere culling. */
  culledNodeCount: number;
  /** Independently rendered source batches in the current active frontier. */
  frontierNodeCount: number;
  /** Running page loads, bounded by the configured maximum concurrency. */
  pendingLoadCount: number;
  /** Visible source pages waiting for a loading or decoding worker slot. */
  queuedLoadCount: number;
  /** Source pages successfully admitted without combining or repacking their buffers. */
  completedLoadCount: number;
  /** Requested source pages rejected by bounded residency admission. */
  rejectedLoadCount: number;
  /** In-flight source pages cancelled after becoming irrelevant to the active view. */
  abortedLoadCount: number;
};

/** Hierarchy, bounded residency, decoding, scheduling, and renderer integration controls. */
export type SplatHierarchyManagerProps = {
  /** Root source pages, preserving the caller's original child and batch boundaries. */
  roots: readonly SplatHierarchyNode[];
  /** Optional shared residency window, borrowed and never destroyed by this hierarchy. */
  residencyManager?: SplatResidencyManager;
  /** Limits applied when this hierarchy creates its own borrowing residency window. */
  residencyBudget?: SplatResidencyBudget;
  /** Optional source-format-specific decoder or asynchronous worker page loader. */
  loadPage?: SplatHierarchyPageLoader;
  /** Maximum acceptable projected geometric error, measured in physical pixels. */
  maximumScreenSpaceError?: number;
  /** Maximum simultaneously running source page fetches or decoder worker requests. */
  maxConcurrentLoads?: number;
  /** Default gaze-aware refinement and loading controls for views without an override. */
  foveation?: SplatHierarchyFoveation;
  /** Called with intact source batches whenever the renderer-visible frontier changes. */
  onFrontierChange?: (
    batches: readonly GPUSplatData[],
    frontier: readonly SplatHierarchyFrontierEntry[],
    stats: SplatHierarchyStats
  ) => void;
  /** Called when an active source loader rejects for a reason other than cancellation. */
  onLoadError?: (error: unknown, node: SplatHierarchyNode) => void;
};

type SplatHierarchyTraversalResult = {
  entries: SplatHierarchyFrontierEntry[];
  visible: boolean;
  complete: boolean;
};

type SplatHierarchyLoadRequest = {
  node: SplatHierarchyNode;
  levelOfDetail: number;
  priority: number;
};

type PendingSplatHierarchyLoad = {
  controller: AbortController;
  promise: Promise<void>;
};

const DEFAULT_VERTICAL_FIELD_OF_VIEW = Math.PI / 3;
const MINIMUM_CAMERA_DISTANCE = 1e-6;

/**
 * Traverses a source-owned Gaussian hierarchy and maintains a bounded active frontier.
 *
 * Coarse resident parents remain visible while independently decoded child pages load.
 * Requests use conservative screen-space error, optional gaze-aware refinement, bounded
 * worker concurrency, cancellation, and exact residency estimates. Source batches are
 * passed directly to renderers without combining rows or allocating replacement buffers.
 */
export class SplatHierarchyManager {
  /** Bounded source-batch residency shared with callers or owned by this hierarchy. */
  readonly residencyManager: SplatResidencyManager;

  private readonly nodesById = new Map<string, SplatHierarchyNode>();
  private readonly ownedPinnedIds = new Set<string>();
  private readonly queuedLoads = new Map<string, SplatHierarchyLoadRequest>();
  private readonly pendingLoads = new Map<string, PendingSplatHierarchyLoad>();
  private readonly rejectedLoadIds = new Set<string>();
  private readonly loadPage?: SplatHierarchyPageLoader;
  private readonly onFrontierChange?: SplatHierarchyManagerProps['onFrontierChange'];
  private readonly onLoadError?: SplatHierarchyManagerProps['onLoadError'];
  private readonly ownsResidencyManager: boolean;
  private readonly maximumScreenSpaceError: number;
  private readonly maxConcurrentLoads: number;
  private readonly foveation?: SplatHierarchyFoveation;

  private roots: readonly SplatHierarchyNode[];
  private currentView?: SplatHierarchyView;
  private currentFrontier: SplatHierarchyFrontierEntry[] = [];
  private visibleNodeCount = 0;
  private culledNodeCount = 0;
  private completedLoadCount = 0;
  private rejectedLoadCount = 0;
  private abortedLoadCount = 0;
  private isDestroyed = false;

  /** Creates a source-preserving hierarchy backed by a shared or independently bounded window. */
  constructor(props: SplatHierarchyManagerProps) {
    this.roots = props.roots;
    this.residencyManager =
      props.residencyManager ?? new SplatResidencyManager(props.residencyBudget);
    this.ownsResidencyManager = !props.residencyManager;
    this.loadPage = props.loadPage;
    this.onFrontierChange = props.onFrontierChange;
    this.onLoadError = props.onLoadError;
    this.maximumScreenSpaceError = Math.max(props.maximumScreenSpaceError ?? 8, 0);
    this.maxConcurrentLoads = Math.max(1, Math.floor(props.maxConcurrentLoads ?? 4));
    this.foveation = props.foveation;
    this.indexNodes();
  }

  /** Whether traversal has been stopped and owned source-residency metadata released. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Currently rendered intact source batches and their view-dependent page metadata. */
  get frontier(): readonly SplatHierarchyFrontierEntry[] {
    return this.currentFrontier;
  }

  /** Current renderer-ready source batches, retaining their original row and batch identities. */
  get frontierBatches(): GPUSplatData[] {
    return this.currentFrontier.map(entry => entry.chunk.data);
  }

  /** Source visibility, bounded worker scheduling, and independent loading diagnostics. */
  get stats(): SplatHierarchyStats {
    return {
      nodeCount: this.nodesById.size,
      visibleNodeCount: this.visibleNodeCount,
      culledNodeCount: this.culledNodeCount,
      frontierNodeCount: this.currentFrontier.length,
      pendingLoadCount: this.pendingLoads.size,
      queuedLoadCount: this.queuedLoads.size,
      completedLoadCount: this.completedLoadCount,
      rejectedLoadCount: this.rejectedLoadCount,
      abortedLoadCount: this.abortedLoadCount
    };
  }

  /** Resolves an original source page by its stable externally supplied hierarchy identity. */
  getNode(id: string): SplatHierarchyNode | undefined {
    return this.nodesById.get(id);
  }

  /** Replaces caller-owned source metadata and immediately updates any active camera view. */
  setRoots(roots: readonly SplatHierarchyNode[]): void {
    this.roots = roots;
    this.indexNodes();
    if (this.currentView) {
      this.update(this.currentView);
    }
  }

  /** Selects visible source pages, queues bounded requests, and returns the active frontier. */
  update(view: SplatHierarchyView): readonly SplatHierarchyFrontierEntry[] {
    if (this.isDestroyed) {
      throw new Error('Splat hierarchy has been destroyed');
    }
    this.currentView = view;
    this.rejectedLoadIds.clear();
    this.refresh();
    return this.currentFrontier;
  }

  /** Waits until every currently requested source fetch and decoder-worker operation settles. */
  async waitForIdle(): Promise<void> {
    while (this.pendingLoads.size > 0 || this.queuedLoads.size > 0) {
      this.startQueuedLoads();
      const runningLoads = Array.from(this.pendingLoads.values(), load => load.promise);
      if (runningLoads.length === 0) {
        return;
      }
      await Promise.allSettled(runningLoads);
    }
  }

  /** Cancels worker requests, releases only hierarchy-owned pins, and preserves shared windows. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.queuedLoads.clear();
    for (const pendingLoad of this.pendingLoads.values()) {
      if (!pendingLoad.controller.signal.aborted) {
        pendingLoad.controller.abort();
        this.abortedLoadCount++;
      }
    }
    this.releaseInactivePins(new Set());
    this.currentFrontier = [];
    if (this.ownsResidencyManager) {
      this.residencyManager.destroy();
    }
  }

  private indexNodes(): void {
    this.nodesById.clear();
    const pendingNodes = [...this.roots];
    while (pendingNodes.length > 0) {
      const node = pendingNodes.pop();
      if (!node) {
        continue;
      }
      if (this.nodesById.has(node.id)) {
        throw new Error('Splat hierarchy node identities must be unique');
      }
      this.nodesById.set(node.id, node);
      if (node.children) {
        pendingNodes.push(...node.children);
      }
    }
  }

  private refresh(): void {
    const view = this.currentView;
    if (this.isDestroyed || !view) {
      return;
    }

    this.visibleNodeCount = 0;
    this.culledNodeCount = 0;
    const requestedLoads = new Map<string, SplatHierarchyLoadRequest>();
    const protectedChunkIds = new Set<string>();
    const selectedFrontier: SplatHierarchyFrontierEntry[] = [];
    for (const root of this.roots) {
      selectedFrontier.push(
        ...this.traverseNode(root, 0, view, requestedLoads, protectedChunkIds).entries
      );
    }

    const activeChunkIds = new Set([
      ...protectedChunkIds,
      ...selectedFrontier.map(entry => entry.chunk.id)
    ]);
    for (const entry of selectedFrontier) {
      this.protectChunk(entry.chunk);
      this.residencyManager.setPriority(entry.chunk, entry.priority);
    }
    this.releaseInactivePins(activeChunkIds);
    this.updateFrontier(selectedFrontier);
    this.synchronizeLoadRequests(requestedLoads);
    this.startQueuedLoads();
  }

  private traverseNode(
    node: SplatHierarchyNode,
    levelOfDetail: number,
    view: SplatHierarchyView,
    requestedLoads: Map<string, SplatHierarchyLoadRequest>,
    protectedChunkIds: Set<string>
  ): SplatHierarchyTraversalResult {
    if (!isSplatHierarchyNodeVisible(node, view.modelViewProjectionMatrix)) {
      this.culledNodeCount++;
      return {entries: [], visible: false, complete: true};
    }
    this.visibleNodeCount++;

    const screenSpaceError = getSplatHierarchyScreenSpaceError(node, view);
    const priority = getSplatHierarchyFoveatedPriority(
      node,
      view,
      view.foveation ?? this.foveation,
      screenSpaceError
    );
    let residentChunk = this.residencyManager.getChunk(node.id);
    if (!residentChunk && node.data && !node.data.destroyed) {
      residentChunk = this.residencyManager.add(node.data, {
        id: node.id,
        priority,
        levelOfDetail,
        bounds: node.bounds,
        ...(node.ownsData !== undefined ? {ownsData: node.ownsData} : {})
      });
    }

    if (!residentChunk && (!node.data || node.data.destroyed) && (node.load || this.loadPage)) {
      requestedLoads.set(node.id, {node, levelOfDetail, priority});
    }

    const children = node.children ?? [];
    const shouldRefine = children.length > 0 && priority > this.maximumScreenSpaceError;
    if (!shouldRefine) {
      if (!residentChunk) {
        return {entries: [], visible: true, complete: false};
      }
      return {
        entries: [
          {node, chunk: residentChunk, levelOfDetail, screenSpaceError, priority, isFallback: false}
        ],
        visible: true,
        complete: true
      };
    }

    if (residentChunk) {
      this.protectChunk(residentChunk);
    }

    const childResults = children.map(child =>
      this.traverseNode(child, levelOfDetail + 1, view, requestedLoads, protectedChunkIds)
    );
    const visibleChildResults = childResults.filter(result => result.visible);
    const childEntries = visibleChildResults.flatMap(result => result.entries);
    const childrenComplete =
      visibleChildResults.length > 0 && visibleChildResults.every(result => result.complete);

    if (node.refinement === 'add') {
      const parentEntries = residentChunk
        ? [
            {
              node,
              chunk: residentChunk,
              levelOfDetail,
              screenSpaceError,
              priority,
              isFallback: !childrenComplete
            }
          ]
        : [];
      return {
        entries: [...parentEntries, ...childEntries],
        visible: true,
        complete: Boolean(residentChunk) && childrenComplete
      };
    }

    if (childrenComplete) {
      return {entries: childEntries, visible: true, complete: true};
    }
    if (residentChunk) {
      for (const childEntry of childEntries) {
        this.protectChunk(childEntry.chunk);
        protectedChunkIds.add(childEntry.chunk.id);
        this.residencyManager.setPriority(childEntry.chunk, childEntry.priority);
      }
      return {
        entries: [
          {node, chunk: residentChunk, levelOfDetail, screenSpaceError, priority, isFallback: true}
        ],
        visible: true,
        complete: true
      };
    }
    return {entries: childEntries, visible: true, complete: false};
  }

  private protectChunk(chunk: SplatResidencyChunk): void {
    if (!chunk.pinned && this.residencyManager.pin(chunk)) {
      this.ownedPinnedIds.add(chunk.id);
    }
  }

  private releaseInactivePins(activeChunkIds: ReadonlySet<string>): void {
    for (const chunkId of this.ownedPinnedIds) {
      if (activeChunkIds.has(chunkId)) {
        continue;
      }
      this.ownedPinnedIds.delete(chunkId);
      this.residencyManager.unpin(chunkId);
    }
  }

  private updateFrontier(selectedFrontier: SplatHierarchyFrontierEntry[]): void {
    const hasChanged =
      selectedFrontier.length !== this.currentFrontier.length ||
      selectedFrontier.some((entry, index) => {
        const previousEntry = this.currentFrontier[index];
        return (
          entry.node.id !== previousEntry.node.id ||
          entry.chunk.data !== previousEntry.chunk.data ||
          entry.isFallback !== previousEntry.isFallback
        );
      });
    this.currentFrontier = selectedFrontier;
    if (hasChanged) {
      this.onFrontierChange?.(this.frontierBatches, selectedFrontier, this.stats);
    }
  }

  private synchronizeLoadRequests(requestedLoads: Map<string, SplatHierarchyLoadRequest>): void {
    for (const [nodeId] of this.queuedLoads) {
      if (!requestedLoads.has(nodeId)) {
        this.queuedLoads.delete(nodeId);
      }
    }
    for (const [nodeId, pendingLoad] of this.pendingLoads) {
      if (!requestedLoads.has(nodeId) && !pendingLoad.controller.signal.aborted) {
        pendingLoad.controller.abort();
        this.abortedLoadCount++;
      }
    }
    for (const [nodeId, request] of requestedLoads) {
      if (
        !this.pendingLoads.has(nodeId) &&
        !this.rejectedLoadIds.has(nodeId) &&
        !this.residencyManager.has(nodeId)
      ) {
        this.queuedLoads.set(nodeId, request);
      }
    }
  }

  private startQueuedLoads(): void {
    while (
      !this.isDestroyed &&
      this.pendingLoads.size < this.maxConcurrentLoads &&
      this.queuedLoads.size > 0
    ) {
      const request = Array.from(this.queuedLoads.values()).sort(
        (firstRequest, secondRequest) =>
          secondRequest.priority - firstRequest.priority ||
          firstRequest.levelOfDetail - secondRequest.levelOfDetail ||
          firstRequest.node.id.localeCompare(secondRequest.node.id)
      )[0];
      this.queuedLoads.delete(request.node.id);
      this.startLoad(request);
    }
  }

  private startLoad(request: SplatHierarchyLoadRequest): void {
    const loadPage = request.node.load ?? this.loadPage;
    if (!loadPage) {
      return;
    }

    const controller = new AbortController();
    const loadContext: SplatHierarchyLoadContext = {
      signal: controller.signal,
      levelOfDetail: request.levelOfDetail,
      priority: request.priority
    };
    const loadPromise = this.residencyManager
      .load(
        request.node.id,
        () => {
          controller.signal.throwIfAborted();
          return loadPage(request.node, loadContext);
        },
        {
          priority: request.priority,
          levelOfDetail: request.levelOfDetail,
          bounds: request.node.bounds,
          ...(request.node.estimatedGpuBytes !== undefined
            ? {estimatedGpuBytes: request.node.estimatedGpuBytes}
            : {}),
          estimatedSplatCount: request.node.estimatedSplatCount ?? 0,
          ...(request.node.ownsData !== undefined ? {ownsData: request.node.ownsData} : {})
        }
      )
      .then(chunk => {
        if (controller.signal.aborted || this.isDestroyed) {
          if (chunk && !this.residencyManager.destroyed) {
            this.residencyManager.remove(chunk);
          }
          return;
        }
        if (!chunk) {
          this.rejectedLoadIds.add(request.node.id);
          this.rejectedLoadCount++;
          return;
        }
        this.completedLoadCount++;
      })
      .catch(error => {
        if (!controller.signal.aborted && !this.isDestroyed) {
          this.rejectedLoadIds.add(request.node.id);
          this.onLoadError?.(error, request.node);
        }
      })
      .finally(() => {
        this.pendingLoads.delete(request.node.id);
        if (!this.isDestroyed) {
          this.refresh();
        }
      });
    this.pendingLoads.set(request.node.id, {controller, promise: loadPromise});
  }
}

/** Returns conservative camera-distance-adjusted geometric approximation error in pixels. */
export function getSplatHierarchyScreenSpaceError(
  node: SplatHierarchyNode,
  view: SplatHierarchyView
): number {
  const distance = Math.max(
    Math.hypot(
      node.bounds.center[0] - view.cameraPosition[0],
      node.bounds.center[1] - view.cameraPosition[1],
      node.bounds.center[2] - view.cameraPosition[2]
    ) - Math.max(node.bounds.radius ?? 0, 0),
    MINIMUM_CAMERA_DISTANCE
  );
  const verticalFieldOfView = Math.min(
    Math.max(view.verticalFieldOfView ?? DEFAULT_VERTICAL_FIELD_OF_VIEW, MINIMUM_CAMERA_DISTANCE),
    Math.PI - MINIMUM_CAMERA_DISTANCE
  );
  const focalLengthPixels =
    Math.max(view.viewportSize[1], 0) / (2 * Math.tan(verticalFieldOfView / 2));
  return (Math.max(node.geometricError, 0) * focalLengthPixels) / distance;
}

/** Applies optional viewport-normalized gaze falloff to geometric page-loading importance. */
export function getSplatHierarchyFoveatedPriority(
  node: SplatHierarchyNode,
  view: SplatHierarchyView,
  foveation: SplatHierarchyFoveation | undefined = view.foveation,
  screenSpaceError = getSplatHierarchyScreenSpaceError(node, view)
): number {
  const strength = Math.max(foveation?.strength ?? 0, 0);
  if (strength === 0) {
    return screenSpaceError;
  }
  const [screenPositionX, screenPositionY] = projectWorldPositionToScreen(
    view.modelViewProjectionMatrix,
    view.viewportSize,
    node.bounds.center
  );
  const normalizedPositionX = screenPositionX / Math.max(view.viewportSize[0], 1);
  const normalizedPositionY = screenPositionY / Math.max(view.viewportSize[1], 1);
  const center = foveation?.center ?? [0.5, 0.5];
  const gazeDistance = Math.hypot(normalizedPositionX - center[0], normalizedPositionY - center[1]);
  const peripheralDistance = Math.max(gazeDistance - Math.max(foveation?.radius ?? 0.15, 0), 0);
  return screenSpaceError / (1 + peripheralDistance * strength);
}

/** Conservatively excludes a source page only when its sphere lies outside one clip plane. */
export function isSplatHierarchyNodeVisible(
  node: SplatHierarchyNode,
  modelViewProjectionMatrix?: readonly number[]
): boolean {
  if (!modelViewProjectionMatrix) {
    return true;
  }

  const radius = Math.max(node.bounds.radius ?? 0, 0);
  for (let coordinateIndex = 0; coordinateIndex < 3; coordinateIndex++) {
    for (const direction of [-1, 1]) {
      const planeX =
        modelViewProjectionMatrix[3] + direction * modelViewProjectionMatrix[coordinateIndex];
      const planeY =
        modelViewProjectionMatrix[7] + direction * modelViewProjectionMatrix[4 + coordinateIndex];
      const planeZ =
        modelViewProjectionMatrix[11] + direction * modelViewProjectionMatrix[8 + coordinateIndex];
      const planeOffset =
        modelViewProjectionMatrix[15] + direction * modelViewProjectionMatrix[12 + coordinateIndex];
      const signedDistance =
        planeX * node.bounds.center[0] +
        planeY * node.bounds.center[1] +
        planeZ * node.bounds.center[2] +
        planeOffset;
      if (signedDistance < -radius * Math.hypot(planeX, planeY, planeZ)) {
        return false;
      }
    }
  }
  return true;
}
