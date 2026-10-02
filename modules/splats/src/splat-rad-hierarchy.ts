// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Spark-compatible RAD opacity and support behavior is adapted from Spark's MIT-licensed shaders:
// https://github.com/sparkjsdev/spark/blob/main/src/shaders/splatVertex.glsl
// Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.

import type {GPUSplatData} from './splat-data';
import {
  getSplatHierarchyFoveatedPriority,
  isSplatHierarchyNodeVisible,
  type SplatHierarchyFoveation,
  type SplatHierarchyNode,
  type SplatHierarchyView
} from './splat-hierarchy';
import {
  SplatResidencyManager,
  type SplatResidencyBounds,
  type SplatResidencyBudget,
  type SplatResidencyChunk
} from './splat-residency';

const DEFAULT_RAD_PAGE_SIZE = 65_536;
const GAUSSIAN_SUPPORT_RADIUS = 3;
const DEFAULT_RAD_CONE_FOV0_DEGREES = 90;
const DEFAULT_RAD_CONE_FOV_DEGREES = 120;
const DEFAULT_RAD_CONE_FOVEATION = 0.4;
const DEFAULT_RAD_BEHIND_FOVEATION = 0.2;
const DEFAULT_RAD_REFINEMENT_HYSTERESIS = 0.15;

/** One independently prepared source page and its untouched per-row hierarchy metadata. */
export type SplatRADHierarchyPage = {
  /** Stable source-page identity used for residency and renderer page slots. */
  id: string;
  /** Original independently prepared batch; source buffers are never copied or repacked. */
  data: GPUSplatData;
  /** Number of child source rows represented by each original batch-local parent row. */
  childCounts?: Uint16Array;
  /** Global source-row index of the first child of each original batch-local parent row. */
  childStarts?: Uint32Array;
  /** Optional source-provided page bounds; otherwise conservative decoded bounds are derived. */
  bounds?: SplatResidencyBounds;
  /** Optional world-space error overriding the individual Gaussian source scales. */
  geometricError?: number;
  /** Whether the residency manager owns and destroys this independently decoded source batch. */
  ownsData?: boolean;
};

/** One source page with only its currently selected, original batch-local hierarchy rows. */
export type SplatRADHierarchyFrontierEntry = {
  /** Stable original source-page identity. */
  id: string;
  /** Original independently prepared source batch and all of its intact GPU buffers. */
  data: GPUSplatData;
  /** Original batch-local source-row offsets selected for the current camera view. */
  activeRows: Uint32Array;
  /** One byte per original batch-local row; selected rows contain one. */
  activeMask: Uint8Array;
  /** Conservative authored or decoded source-page bounds. */
  bounds: SplatResidencyBounds;
  /** Largest selected source-row geometric approximation error. */
  geometricError: number;
  /** Highest selected foveation-adjusted source-row priority. */
  priority: number;
  /** Whether at least one selected parent is covering missing or incomplete child pages. */
  isFallback: boolean;
};

/** Camera-prioritized request for the original source page containing a missing global row. */
export type SplatRADHierarchyRequest = {
  /** Stable original global source row required by the active hierarchy traversal. */
  rowIndex: number;
  /** Nominal original source-page index, derived from the configured source page size. */
  pageIndex: number;
  /** Global source parent retained while this missing child page is requested. */
  parentRowIndex?: number;
  /** Foveation- and screen-space-error-adjusted source-page request priority. */
  priority: number;
};

/** Camera-selected source rows, fallback coverage, demand requests, and residency diagnostics. */
export type SplatRADHierarchyStats = {
  /** Number of independently registered original source pages. */
  pageCount: number;
  /** Source pages intersecting at least one selected camera-visible hierarchy row. */
  activePageCount: number;
  /** Original source rows selected without repacking their owning source pages. */
  activeRowCount: number;
  /** Source rows traversed inside the conservative camera frustum. */
  visibleRowCount: number;
  /** Source rows omitted because their complete conservative sphere is outside the camera. */
  culledRowCount: number;
  /** Coarse parent source rows retained until every required child page becomes available. */
  fallbackRowCount: number;
  /** Independently requested, not-yet-resident original source pages. */
  requestedPageCount: number;
  /** Configured maximum number of simultaneously selected source rows. */
  maximumActiveRows: number;
};

/** Loader-neutral row-hierarchy traversal, source-page residency, and integration callbacks. */
export type SplatRADHierarchyManagerProps = {
  /** Optional initially resident source pages, preserving their original row boundaries. */
  pages?: readonly SplatRADHierarchyPage[];
  /** Global source hierarchy roots; Spark RAD sources default to the root at row zero. */
  rootRows?: readonly number[];
  /** Nominal source rows per independently fetchable page; Spark defaults to 65,536. */
  pageSize?: number;
  /** Optional borrowed source residency window, never destroyed by this hierarchy. */
  residencyManager?: SplatResidencyManager;
  /** Limits used when this hierarchy creates its own source residency window. */
  residencyBudget?: SplatResidencyBudget;
  /** Maximum accepted projected source-row geometric error in physical pixels. */
  maximumScreenSpaceError?: number;
  /** Maximum simultaneously selected original source rows across every active page. */
  maximumActiveRows?: number;
  /** Whether source opacity uses Spark's already-decoded zero-through-two LoD domain. */
  lodOpacity?: boolean;
  /** Spark-compatible multiplier applied to authored source-row refinement importance. */
  lodSplatScale?: number;
  /** Minimum projected source-row size in pixels; explicit legacy error limits take precedence. */
  lodRenderScale?: number;
  /** Full-width view cone, in degrees, retaining complete source-row detail. */
  coneFov0?: number;
  /** Full-width outer view cone, in degrees, retaining `coneFoveate` detail. */
  coneFov?: number;
  /** Relative source-row refinement retained at the outer view cone. */
  coneFoveate?: number;
  /** Relative source-row refinement retained behind the camera. */
  behindFoveate?: number;
  /** Relative deadband keeping an existing row frontier stable near its refinement threshold. */
  refinementHysteresis?: number;
  /** Optional hard bound on source rows evaluated during one synchronous camera update. */
  maxTraversalRows?: number;
  /** Default gaze-aware priority controls for views without an explicit override. */
  foveation?: SplatHierarchyFoveation;
  /** Receives intact source pages plus original batch-local active-row indirection. */
  onFrontierChange?: (
    frontier: readonly SplatRADHierarchyFrontierEntry[],
    stats: SplatRADHierarchyStats
  ) => void;
  /** Requests a missing source page; transport, decoding, workers, and upload remain external. */
  onPageRequest?: (request: SplatRADHierarchyRequest) => void;
  /** Cancels a requested page once traversal proves it cannot contribute to the camera frontier. */
  onPageCancel?: (request: SplatRADHierarchyRequest) => void;
};

type RegisteredSplatRADPage = {
  page: SplatRADHierarchyPage;
  bounds: SplatResidencyBounds;
  endRowIndex: number;
  lastDataRevision: number;
};

type SelectedSplatRADPage = {
  registeredPage: RegisteredSplatRADPage;
  activeRows: number[];
  activeMask: Uint8Array;
  geometricError: number;
  priority: number;
  isFallback: boolean;
};

type SplatRADTraversalState = {
  selectedPages: Map<string, SelectedSplatRADPage>;
  protectedPageIds: Set<string>;
  requestedPages: Map<number, SplatRADHierarchyRequest>;
  allocatedRowCount: number;
  refinedRows: Set<number>;
  retainedCapacityRows: Set<number>;
};

type SplatRADFrontierCandidate = {
  registeredPage: RegisteredSplatRADPage;
  globalRowIndex: number;
  localRowIndex: number;
  node: SplatHierarchyNode;
  priority: number;
  isFallback: boolean;
  isCapacityLimited: boolean;
  isVisible: boolean;
  children?: SplatRADFrontierCandidate[];
  parent?: SplatRADFrontierCandidate;
};

type SplatRADRefinementProgress = {
  nextChildOffset: number;
  residentChildCount: number;
  childCandidates: SplatRADFrontierCandidate[];
};

type SplatRADRetargetProgress = {
  nextChildOffset: number;
};

/** One resumable best-first traversal whose retained tree can be retargeted to a changed camera. */
type SplatRADIncrementalTraversal = {
  state: SplatRADTraversalState;
  rootCandidates: SplatRADFrontierCandidate[];
  selectedRows: Map<number, SplatRADFrontierCandidate>;
  refinementQueue: SplatRADPriorityQueue;
  refinementProgress: Map<number, SplatRADRefinementProgress>;
  retargetQueue: SplatRADPriorityQueue;
  retargetProgress: Map<number, SplatRADRetargetProgress>;
  preferRefinementNext: boolean;
};

type SplatRADFrontierSelection = Pick<
  SplatRADIncrementalTraversal,
  'state' | 'selectedRows' | 'refinementQueue'
>;

/**
 * Selects a coherent row-level frontier from independently resident Gaussian source pages.
 *
 * Each decoded row can own global child rows in any page. Parent rows stay visible until every
 * required child exists, while unrelated leaf rows in the same source page remain selected.
 * Original source pages and their GPU allocations stay intact; only batch-local visibility masks
 * and active-row indirection change as the camera or residency window changes.
 */
export class SplatRADHierarchyManager {
  /** Borrowed or independently owned residency window for untouched decoded source pages. */
  readonly residencyManager: SplatResidencyManager;

  private readonly pagesById = new Map<string, RegisteredSplatRADPage>();
  private readonly ownedPinnedIds = new Set<string>();
  private readonly pendingRequests = new Map<number, SplatRADHierarchyRequest>();
  private readonly onFrontierChange?: SplatRADHierarchyManagerProps['onFrontierChange'];
  private readonly onPageRequest?: SplatRADHierarchyManagerProps['onPageRequest'];
  private readonly onPageCancel?: SplatRADHierarchyManagerProps['onPageCancel'];
  private readonly ownsResidencyManager: boolean;
  private readonly maximumScreenSpaceError: number;
  private readonly maximumActiveRows: number;
  private maxTraversalRows: number;
  private readonly pageSize: number;
  private readonly foveation?: SplatHierarchyFoveation;
  private readonly lodOpacity: boolean;
  private readonly lodSplatScale: number;
  private readonly fullDetailHalfAngleRadians: number;
  private readonly peripheralHalfAngleRadians: number;
  private readonly coneFoveate: number;
  private readonly behindFoveate: number;
  private readonly refinementHysteresis: number;

  private sortedPages: RegisteredSplatRADPage[] = [];
  private rootRows: readonly number[];
  private currentView?: SplatHierarchyView;
  private currentFrontier: SplatRADHierarchyFrontierEntry[] = [];
  private previouslyRefinedRows = new Set<number>();
  private visibleRowCount = 0;
  private culledRowCount = 0;
  private fallbackRowCount = 0;
  private requiresRefresh = true;
  private requiresRetarget = false;
  private incrementalTraversal?: SplatRADIncrementalTraversal;
  private isDestroyed = false;

  /** Creates a loader-neutral global-row hierarchy without fetching or decoding source pages. */
  constructor(props: SplatRADHierarchyManagerProps = {}) {
    this.residencyManager =
      props.residencyManager ?? new SplatResidencyManager(props.residencyBudget);
    this.ownsResidencyManager = !props.residencyManager;
    this.rootRows = [...(props.rootRows ?? [0])];
    this.pageSize = props.pageSize ?? DEFAULT_RAD_PAGE_SIZE;
    this.maximumScreenSpaceError = Math.max(
      props.maximumScreenSpaceError ?? props.lodRenderScale ?? 8,
      0
    );
    this.maximumActiveRows = props.maximumActiveRows ?? Number.POSITIVE_INFINITY;
    this.maxTraversalRows = props.maxTraversalRows ?? Number.POSITIVE_INFINITY;
    this.foveation = props.foveation;
    this.lodOpacity = props.lodOpacity ?? false;
    this.lodSplatScale = Math.max(props.lodSplatScale ?? 1, 0);
    const innerConeDegrees = Math.min(
      Math.max(props.coneFov0 ?? DEFAULT_RAD_CONE_FOV0_DEGREES, 0),
      180
    );
    const outerConeDegrees = Math.min(
      Math.max(props.coneFov ?? DEFAULT_RAD_CONE_FOV_DEGREES, innerConeDegrees),
      180
    );
    this.fullDetailHalfAngleRadians = (innerConeDegrees * Math.PI) / 360;
    this.peripheralHalfAngleRadians = (outerConeDegrees * Math.PI) / 360;
    this.coneFoveate = Math.min(Math.max(props.coneFoveate ?? DEFAULT_RAD_CONE_FOVEATION, 0), 1);
    this.behindFoveate = Math.min(
      Math.max(props.behindFoveate ?? DEFAULT_RAD_BEHIND_FOVEATION, 0),
      1
    );
    this.refinementHysteresis = Math.min(
      Math.max(props.refinementHysteresis ?? DEFAULT_RAD_REFINEMENT_HYSTERESIS, 0),
      0.99
    );
    this.onFrontierChange = props.onFrontierChange;
    this.onPageRequest = props.onPageRequest;
    this.onPageCancel = props.onPageCancel;

    if (!Number.isSafeInteger(this.pageSize) || this.pageSize <= 0) {
      throw new RangeError('Gaussian source page size must be a positive safe integer');
    }
    if (
      this.maximumActiveRows !== Number.POSITIVE_INFINITY &&
      (!Number.isSafeInteger(this.maximumActiveRows) || this.maximumActiveRows <= 0)
    ) {
      throw new RangeError('Gaussian active-row capacity must be a positive safe integer');
    }
    if (
      this.maxTraversalRows !== Number.POSITIVE_INFINITY &&
      (!Number.isSafeInteger(this.maxTraversalRows) || this.maxTraversalRows <= 0)
    ) {
      throw new RangeError('Gaussian traversal capacity must be a positive safe integer');
    }
    this.validateRootRows(this.rootRows);
    for (const page of props.pages ?? []) {
      this.registerPage(page);
    }
  }

  /** Whether this hierarchy has released its own pins, requests, and optional residency window. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Current intact source pages and original batch-local active-row visibility masks. */
  get frontier(): readonly SplatRADHierarchyFrontierEntry[] {
    return this.currentFrontier;
  }

  /** Original independently prepared batches participating in the current row frontier. */
  get frontierBatches(): GPUSplatData[] {
    return this.currentFrontier.map(entry => entry.data);
  }

  /** Whether the current camera can advance another bounded best-first traversal slice. */
  get hasPendingTraversal(): boolean {
    return Boolean(
      this.currentView &&
        (this.requiresRefresh ||
          this.requiresRetarget ||
          (this.incrementalTraversal?.retargetQueue.length ?? 0) > 0 ||
          (this.incrementalTraversal?.refinementQueue.length ?? 0) > 0)
    );
  }

  /** Global source rows belonging to the missing pages currently requested by this view. */
  get requestedRows(): number[] {
    return Array.from(this.pendingRequests.values(), request => request.rowIndex);
  }

  /** Original global-row requests and their current camera-dependent source priorities. */
  get requests(): SplatRADHierarchyRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  /** Selected source-row, fallback, request, visibility, and independent-page diagnostics. */
  get stats(): SplatRADHierarchyStats {
    return {
      pageCount: this.pagesById.size,
      activePageCount: this.currentFrontier.length,
      activeRowCount: this.currentFrontier.reduce(
        (totalRowCount, entry) => totalRowCount + entry.activeRows.length,
        0
      ),
      visibleRowCount: this.visibleRowCount,
      culledRowCount: this.culledRowCount,
      fallbackRowCount: this.fallbackRowCount,
      requestedPageCount: this.pendingRequests.size,
      maximumActiveRows: this.maximumActiveRows
    };
  }

  /** Returns the original metadata and intact GPU allocation for one registered source page. */
  getPage(id: string): SplatRADHierarchyPage | undefined {
    return this.pagesById.get(id)?.page;
  }

  /** Resolves the independently resident source page containing one original global source row. */
  getPageForRow(rowIndex: number): SplatRADHierarchyPage | undefined {
    return this.getRegisteredPageForRow(rowIndex)?.page;
  }

  /** Replaces the original hierarchy roots and immediately refreshes any active camera view. */
  setRootRows(rootRows: readonly number[]): void {
    this.assertLive();
    this.validateRootRows(rootRows);
    this.rootRows = [...rootRows];
    this.invalidateIncrementalTraversal();
    this.requiresRefresh = true;
    this.refresh();
  }

  /** Changes synchronous camera work without replacing any original source page or GPU buffer. */
  setTraversalBudget(maxTraversalRows?: number): void {
    this.assertLive();
    const nextBudget = maxTraversalRows ?? Number.POSITIVE_INFINITY;
    if (
      nextBudget !== Number.POSITIVE_INFINITY &&
      (!Number.isSafeInteger(nextBudget) || nextBudget <= 0)
    ) {
      throw new RangeError('Gaussian traversal capacity must be a positive safe integer');
    }
    if (this.maxTraversalRows === nextBudget) {
      return;
    }
    this.maxTraversalRows = nextBudget;
    this.invalidateIncrementalTraversal();
    this.requiresRefresh = true;
    this.refresh();
  }

  /**
   * Admits one original prepared page and preserves its complete source-row child metadata.
   *
   * Returns false when bounded residency cannot accept the page while protecting existing
   * fallback coverage. Ownership remains with the caller when an incoming page is rejected.
   */
  registerPage(page: SplatRADHierarchyPage): boolean {
    this.assertLive();
    this.validatePage(page);
    const existingPage = this.pagesById.get(page.id);
    if (existingPage && existingPage.page.data !== page.data) {
      throw new Error('Gaussian source page identity already belongs to another batch');
    }
    if (existingPage) {
      return true;
    }

    const bounds = getSplatRADPageBounds(page);
    const priority = this.getPagePriority(page, bounds);
    const chunk = this.residencyManager.add(page.data, {
      id: page.id,
      priority,
      bounds,
      ...(page.ownsData !== undefined ? {ownsData: page.ownsData} : {})
    });
    if (!chunk) {
      return false;
    }

    const registeredPage: RegisteredSplatRADPage = {
      page,
      bounds,
      endRowIndex: page.data.rowIndexBase + page.data.length,
      lastDataRevision: page.data.revision
    };
    this.pagesById.set(page.id, registeredPage);
    this.sortedPages.push(registeredPage);
    this.sortedPages.sort(
      (firstPage, secondPage) =>
        firstPage.page.data.rowIndexBase - secondPage.page.data.rowIndexBase
    );
    const removedResidentPage = this.pruneEvictedPages();
    this.pendingRequests.delete(Math.floor(page.data.rowIndexBase / this.pageSize));
    const registersMissingRoot = this.rootRows.some(
      rootRow =>
        rootRow >= page.data.rowIndexBase &&
        rootRow < page.data.rowIndexBase + page.data.length &&
        !this.incrementalTraversal?.rootCandidates.some(
          candidate => candidate.globalRowIndex === rootRow
        )
    );
    if (removedResidentPage || !this.incrementalTraversal || registersMissingRoot) {
      this.invalidateIncrementalTraversal();
      this.requiresRefresh = true;
    } else {
      this.requiresRetarget = true;
    }
    return true;
  }

  /** Removes one registered source page and immediately restores any available parent coverage. */
  removePage(id: string): boolean {
    this.assertLive();
    const page = this.pagesById.get(id);
    if (!page) {
      return false;
    }
    if (this.ownedPinnedIds.delete(id)) {
      this.residencyManager.unpin(id);
    }
    this.pagesById.delete(id);
    this.sortedPages = this.sortedPages.filter(candidate => candidate !== page);
    this.residencyManager.remove(id);
    this.invalidateIncrementalTraversal();
    this.requiresRefresh = true;
    this.refresh();
    return true;
  }

  /** Allows an externally cancelled or failed source-page request to be retried by the view. */
  clearRequestedPage(pageIndex: number): void {
    const clearedRequest = this.pendingRequests.get(pageIndex);
    this.pendingRequests.delete(pageIndex);
    if (this.incrementalTraversal && clearedRequest?.parentRowIndex !== undefined) {
      this.requiresRetarget = true;
    } else {
      this.invalidateIncrementalTraversal();
      this.requiresRefresh = true;
    }
  }

  /**
   * Computes coherent camera-selected original source rows without copying source page buffers.
   * Camera changes retarget the retained hierarchy tree instead of restarting from its roots.
   * Resolved visible detail remains selected until visibility or active capacity requires a change.
   */
  update(view: SplatHierarchyView): readonly SplatRADHierarchyFrontierEntry[] {
    this.assertLive();
    const removedResidentPage = this.pruneEvictedPages();
    const sourceRowsChanged = this.haveSourceRowsChanged();
    const viewChanged = !this.currentView || !areSplatRADViewsEqual(this.currentView, view);
    if (
      this.currentView &&
      !this.requiresRefresh &&
      !this.requiresRetarget &&
      !removedResidentPage &&
      areSplatRADViewsEqual(this.currentView, view) &&
      !sourceRowsChanged
    ) {
      return this.currentFrontier;
    }
    if (removedResidentPage || sourceRowsChanged) {
      this.invalidateIncrementalTraversal();
      this.requiresRefresh = true;
    }
    this.currentView = view;
    if (this.requiresRefresh || !this.incrementalTraversal) {
      this.refresh();
    } else if (viewChanged || this.requiresRetarget) {
      this.retarget(this.maxTraversalRows);
    }
    return this.currentFrontier;
  }

  /**
   * Advances one bounded best-first slice for an unchanged camera without rebuilding prior work.
   *
   * The optional argument bounds this call only; it does not replace the configured camera-update
   * budget. Callers can schedule one small slice per frame until {@link hasPendingTraversal} is
   * false, then stop without paying another synchronous traversal cost.
   */
  continueTraversal(
    maxTraversalRows: number = this.maxTraversalRows
  ): readonly SplatRADHierarchyFrontierEntry[] {
    this.assertLive();
    validateSplatRADTraversalBudget(maxTraversalRows);
    if (!this.currentView) {
      return this.currentFrontier;
    }
    if (this.haveSourceRowsChanged()) {
      this.invalidateIncrementalTraversal();
      this.requiresRefresh = true;
    }
    if (this.requiresRefresh) {
      this.refresh(maxTraversalRows);
      return this.currentFrontier;
    }
    if (this.requiresRetarget) {
      this.retarget(maxTraversalRows);
      return this.currentFrontier;
    }
    const traversal = this.incrementalTraversal;
    if (!traversal) {
      return this.currentFrontier;
    }
    this.advanceTraversal(traversal, maxTraversalRows, false);
    this.publishTraversal(traversal);
    return this.currentFrontier;
  }

  /** Cancels irrelevant demand, releases hierarchy-owned pins, and preserves borrowed windows. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    for (const request of this.pendingRequests.values()) {
      this.onPageCancel?.(request);
    }
    this.pendingRequests.clear();
    this.releaseInactivePins(new Set());
    this.pagesById.clear();
    this.sortedPages = [];
    this.currentFrontier = [];
    this.incrementalTraversal = undefined;
    if (this.ownsResidencyManager) {
      this.residencyManager.destroy();
    }
  }

  private refresh(maxTraversalRows = this.maxTraversalRows): void {
    if (this.isDestroyed || !this.currentView) {
      return;
    }

    this.pruneEvictedPages();
    this.invalidateIncrementalTraversal();
    this.visibleRowCount = 0;
    this.culledRowCount = 0;
    this.fallbackRowCount = 0;
    const traversal = this.makeIncrementalTraversal();
    this.incrementalTraversal = traversal;
    this.advanceTraversal(traversal, maxTraversalRows, true);
    this.publishTraversal(traversal);
  }

  /** Retargets the retained coherent tree before refining it for a changed camera. */
  private retarget(maxTraversalRows: number): void {
    const traversal = this.incrementalTraversal;
    if (!traversal || !this.currentView) {
      this.refresh(maxTraversalRows);
      return;
    }

    this.visibleRowCount = 0;
    this.culledRowCount = 0;
    this.fallbackRowCount = 0;
    if (traversal.retargetQueue.length > 0 || traversal.refinementQueue.length > 0) {
      this.requiresRetarget = true;
      this.advanceTraversal(traversal, maxTraversalRows, false);
      this.publishTraversal(traversal);
      return;
    }
    traversal.state.protectedPageIds.clear();
    traversal.state.requestedPages.clear();
    traversal.refinementQueue = new SplatRADPriorityQueue();
    traversal.refinementProgress.clear();
    traversal.retargetQueue = this.makeRetargetQueue(traversal.selectedRows);
    traversal.retargetProgress.clear();
    for (const rootCandidate of traversal.rootCandidates) {
      this.updateFrontierCandidate(rootCandidate, traversal, false);
      traversal.retargetQueue.push(rootCandidate);
    }
    this.requiresRetarget = false;
    this.advanceTraversal(traversal, maxTraversalRows, false);
    this.publishTraversal(traversal);
  }

  /** Starts one deterministic best-first queue from the current roots and resident pages. */
  private makeIncrementalTraversal(): SplatRADIncrementalTraversal {
    const rootRows = this.rootRows.slice(0, this.maximumActiveRows);
    const state: SplatRADTraversalState = {
      selectedPages: new Map(),
      protectedPageIds: new Set(),
      requestedPages: new Map(),
      allocatedRowCount: 0,
      refinedRows: new Set(),
      retainedCapacityRows: new Set()
    };
    const selectedRows = new Map<number, SplatRADFrontierCandidate>();
    const rootCandidates: SplatRADFrontierCandidate[] = [];
    const refinementQueue = new SplatRADPriorityQueue();
    const refinementProgress = new Map<number, SplatRADRefinementProgress>();
    const retargetQueue = this.makeRetargetQueue(selectedRows);
    const retargetProgress = new Map<number, SplatRADRetargetProgress>();

    for (const rootRow of rootRows) {
      const rootPage = this.getRegisteredPageForRow(rootRow);
      if (!rootPage) {
        this.requestRow(state, rootRow, Number.MAX_SAFE_INTEGER);
        continue;
      }
      const candidate = this.makeFrontierCandidate(rootPage, rootRow);
      if (candidate) {
        rootCandidates.push(candidate);
        state.allocatedRowCount += candidate.isVisible ? 1 : 0;
        this.addFrontierCandidate(candidate, selectedRows, refinementQueue);
      }
    }

    return {
      state,
      rootCandidates,
      selectedRows,
      refinementQueue,
      refinementProgress,
      retargetQueue,
      retargetProgress,
      preferRefinementNext: false
    };
  }

  /** Spends one row-evaluation slice while retaining the queue for the next settled frame. */
  private advanceTraversal(
    traversal: SplatRADIncrementalTraversal,
    maxTraversalRows: number,
    countExistingRows: boolean
  ): void {
    const rowCountAtSliceStart = countExistingRows ? 0 : this.visibleRowCount + this.culledRowCount;
    const {refinementQueue, retargetQueue} = traversal;
    if (maxTraversalRows === 1) {
      if (refinementQueue.length > 0 && retargetQueue.length > 0) {
        if (traversal.preferRefinementNext) {
          this.advanceRefinementTraversal(traversal, 1, rowCountAtSliceStart);
        } else {
          this.advanceRetargetTraversal(traversal, 1, rowCountAtSliceStart);
        }
        traversal.preferRefinementNext = !traversal.preferRefinementNext;
        return;
      }
      if (retargetQueue.length > 0) {
        this.advanceRetargetTraversal(traversal, 1, rowCountAtSliceStart);
        traversal.preferRefinementNext = refinementQueue.length > 0 && retargetQueue.length > 0;
        return;
      }
      this.advanceRefinementTraversal(traversal, 1, rowCountAtSliceStart);
      return;
    }
    const refinementReservation =
      maxTraversalRows === Number.POSITIVE_INFINITY || retargetQueue.length === 0
        ? 0
        : Math.max(1, Math.floor(maxTraversalRows / 2));

    if (refinementQueue.length > 0 && refinementReservation > 0) {
      this.advanceRefinementTraversal(traversal, refinementReservation, rowCountAtSliceStart);
      this.advanceRetargetTraversal(traversal, maxTraversalRows, rowCountAtSliceStart);
      return;
    }

    if (refinementReservation > 0) {
      const initialRetargetLimit = maxTraversalRows - refinementReservation;
      this.advanceRetargetTraversal(traversal, initialRetargetLimit, rowCountAtSliceStart);
      if (
        refinementQueue.length === 0 &&
        retargetQueue.length > 0 &&
        initialRetargetLimit < maxTraversalRows - 1
      ) {
        this.advanceRetargetTraversal(traversal, maxTraversalRows - 1, rowCountAtSliceStart);
      }
      this.advanceRefinementTraversal(traversal, maxTraversalRows, rowCountAtSliceStart);
      if (refinementQueue.length === 0) {
        this.advanceRetargetTraversal(traversal, maxTraversalRows, rowCountAtSliceStart);
      }
      return;
    }

    this.advanceRetargetTraversal(traversal, maxTraversalRows, rowCountAtSliceStart);
    this.advanceRefinementTraversal(traversal, maxTraversalRows, rowCountAtSliceStart);
  }

  /** Reserves bounded work for current-view refinement while retained-tree retargeting continues. */
  private advanceRefinementTraversal(
    traversal: SplatRADIncrementalTraversal,
    maxTraversalRows: number,
    rowCountAtSliceStart: number
  ): void {
    const {selectedRows, refinementQueue, refinementProgress, state} = traversal;
    while (refinementQueue.length > 0) {
      const evaluatedRowCount = this.visibleRowCount + this.culledRowCount - rowCountAtSliceStart;
      if (evaluatedRowCount >= maxTraversalRows) {
        break;
      }
      const candidate = refinementQueue.pop()!;
      const remainingTraversalRows = maxTraversalRows - evaluatedRowCount;
      if (
        this.refineFrontierCandidate(
          candidate,
          selectedRows,
          refinementQueue,
          refinementProgress,
          state,
          remainingTraversalRows
        )
      ) {
        refinementQueue.push(candidate);
        break;
      }
    }
  }

  /** Reprioritizes the retained tree from its roots without replacing its selected leaves. */
  private advanceRetargetTraversal(
    traversal: SplatRADIncrementalTraversal,
    maxTraversalRows: number,
    rowCountAtSliceStart: number
  ): void {
    const {retargetProgress, retargetQueue, refinementQueue, selectedRows} = traversal;
    while (retargetQueue.length > 0) {
      const evaluatedRowCount = this.visibleRowCount + this.culledRowCount - rowCountAtSliceStart;
      if (evaluatedRowCount >= maxTraversalRows) {
        break;
      }
      const candidate = retargetQueue.pop()!;
      if (this.hasSelectedFrontierAncestor(candidate, selectedRows)) {
        retargetProgress.delete(candidate.globalRowIndex);
        continue;
      }
      let progress = retargetProgress.get(candidate.globalRowIndex);
      if (!progress) {
        this.updateFrontierCandidate(candidate, traversal, true);
        if (traversal.state.allocatedRowCount > this.maximumActiveRows) {
          this.collapseFrontierForCapacity(candidate, traversal);
          continue;
        }
        if (!candidate.children) {
          const childCount =
            candidate.registeredPage.page.childCounts?.[candidate.localRowIndex] ?? 0;
          if (
            selectedRows.get(candidate.globalRowIndex) === candidate &&
            childCount > 0 &&
            (!candidate.isVisible || candidate.priority > this.getRefinementThreshold(candidate))
          ) {
            refinementQueue.push(candidate);
          }
          continue;
        }
        progress = {nextChildOffset: 0};
      }

      const children = candidate.children;
      if (!children) {
        retargetProgress.delete(candidate.globalRowIndex);
        continue;
      }
      const remainingTraversalRows =
        maxTraversalRows - (this.visibleRowCount + this.culledRowCount - rowCountAtSliceStart);
      const childOffsetLimit = Math.min(
        children.length,
        progress.nextChildOffset + remainingTraversalRows
      );
      for (; progress.nextChildOffset < childOffsetLimit; progress.nextChildOffset++) {
        const child = children[progress.nextChildOffset];
        this.updateFrontierCandidate(child, traversal, true);
        if (traversal.state.allocatedRowCount > this.maximumActiveRows) {
          this.collapseFrontierForCapacity(child, traversal);
        }
        const childCount = child.registeredPage.page.childCounts?.[child.localRowIndex] ?? 0;
        if (child.isVisible || child.children || childCount > 0) {
          retargetQueue.push(child);
        }
      }
      if (progress.nextChildOffset < children.length) {
        retargetProgress.set(candidate.globalRowIndex, progress);
        retargetQueue.push(candidate);
        break;
      }
      retargetProgress.delete(candidate.globalRowIndex);
      if (selectedRows.get(candidate.globalRowIndex) === candidate) {
        this.activateFrontierCandidateChildren(candidate, traversal);
      } else if (candidate.isCapacityLimited) {
        this.selectCapacityLimitedChildren(candidate, traversal);
      }
    }
  }

  /** Recomputes one retained source row for the current camera without changing tree topology. */
  private updateFrontierCandidate(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADIncrementalTraversal,
    countDiagnosticRow: boolean
  ): void {
    const view = this.currentView;
    if (!view) {
      return;
    }
    const wasVisible = candidate.isVisible;
    const node = this.makeRowNode(candidate.registeredPage, candidate.localRowIndex);
    const isVisible = isSplatHierarchyNodeVisible(node, view.modelViewProjectionMatrix);
    if (countDiagnosticRow) {
      if (isVisible) {
        this.visibleRowCount++;
      } else {
        this.culledRowCount++;
      }
    }
    const screenSpaceError = getSplatRADScreenSpaceError(node, view);
    candidate.node = node;
    candidate.isVisible = isVisible;
    candidate.priority = isVisible
      ? getSplatHierarchyFoveatedPriority(
          node,
          view,
          view.foveation ?? this.foveation,
          screenSpaceError
        ) *
        this.getAngularFoveation(node, view) *
        this.lodSplatScale
      : 0;
    this.clearResolvedFallback(candidate);
    if (
      wasVisible !== isVisible &&
      traversal.selectedRows.get(candidate.globalRowIndex) === candidate
    ) {
      traversal.state.allocatedRowCount += isVisible ? 1 : -1;
    }
    if (wasVisible !== isVisible) {
      const capacityLimitedAncestor = this.getCapacityLimitedAncestor(candidate);
      if (capacityLimitedAncestor) {
        this.selectCapacityLimitedChildren(capacityLimitedAncestor, traversal);
      }
    }
  }

  /** Clears missing-page diagnostics once every authored direct child is resident. */
  private clearResolvedFallback(candidate: SplatRADFrontierCandidate): void {
    if (!candidate.isFallback) {
      return;
    }
    const page = candidate.registeredPage.page;
    const childCount = page.childCounts?.[candidate.localRowIndex] ?? 0;
    const childStart = page.childStarts?.[candidate.localRowIndex] ?? 0;
    if (
      childCount === 0 ||
      !Number.isSafeInteger(childStart + childCount) ||
      childStart + childCount > 0x8000_0000
    ) {
      candidate.isFallback = false;
      return;
    }
    for (let childOffset = 0; childOffset < childCount; childOffset++) {
      if (!this.getRegisteredPageForRow(childStart + childOffset)) {
        return;
      }
    }
    candidate.isFallback = false;
  }

  /** Coarsens one retained branch only when active-row capacity requires fewer visible leaves. */
  private collapseFrontierCandidate(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADIncrementalTraversal
  ): void {
    const wasSelected = traversal.selectedRows.get(candidate.globalRowIndex) === candidate;
    for (const child of candidate.children ?? []) {
      this.removeSelectedCandidateBranch(child, traversal.selectedRows, traversal.state);
    }
    candidate.isFallback = false;
    candidate.isCapacityLimited = false;
    traversal.state.refinedRows.delete(candidate.globalRowIndex);
    traversal.selectedRows.set(candidate.globalRowIndex, candidate);
    if (!wasSelected) {
      traversal.state.allocatedRowCount += candidate.isVisible ? 1 : 0;
    }
  }

  /** Reactivates retained direct children as one coherent parent replacement. */
  private activateFrontierCandidateChildren(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADIncrementalTraversal
  ): boolean {
    const children = candidate.children;
    if (!children) {
      return false;
    }
    const visibleChildCount = children.reduce(
      (visibleRowCount, child) => visibleRowCount + (child.isVisible ? 1 : 0),
      0
    );
    const nextAllocatedRowCount =
      traversal.state.allocatedRowCount - (candidate.isVisible ? 1 : 0) + visibleChildCount;
    if (nextAllocatedRowCount > this.maximumActiveRows) {
      if (!candidate.isVisible) {
        return this.selectCapacityLimitedChildren(candidate, traversal);
      }
      return false;
    }
    candidate.isCapacityLimited = false;
    traversal.selectedRows.delete(candidate.globalRowIndex);
    traversal.state.allocatedRowCount = nextAllocatedRowCount;
    traversal.state.refinedRows.add(candidate.globalRowIndex);
    for (const child of children) {
      traversal.selectedRows.set(child.globalRowIndex, child);
    }
    return true;
  }

  /** Coarsens the lowest retained branch needed to keep newly visible rows inside capacity. */
  private collapseFrontierForCapacity(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADIncrementalTraversal
  ): void {
    let highestOffscreenAncestor: SplatRADFrontierCandidate | undefined;
    for (let ancestor = candidate.parent; ancestor; ancestor = ancestor.parent) {
      if (!ancestor.isVisible && ancestor.children) {
        highestOffscreenAncestor = ancestor;
      }
    }
    if (highestOffscreenAncestor) {
      this.selectCapacityLimitedChildren(highestOffscreenAncestor, traversal, candidate);
      if (traversal.state.allocatedRowCount <= this.maximumActiveRows) {
        return;
      }
    }
    let ancestor = candidate.parent;
    while (ancestor && traversal.state.allocatedRowCount > this.maximumActiveRows) {
      if (!ancestor.isVisible && ancestor.children) {
        this.selectCapacityLimitedChildren(ancestor, traversal);
      } else {
        this.collapseFrontierCandidate(ancestor, traversal);
      }
      ancestor = ancestor.parent;
    }
  }

  /** Keeps the highest-priority visible descendants when their offscreen parent cannot cover them. */
  private selectCapacityLimitedChildren(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADFrontierSelection,
    preferredDescendant?: SplatRADFrontierCandidate
  ): boolean {
    const {selectedRows, refinementQueue, state} = traversal;
    const children = candidate.children;
    if (!children) {
      return false;
    }
    if (selectedRows.delete(candidate.globalRowIndex)) {
      state.allocatedRowCount -= candidate.isVisible ? 1 : 0;
    }
    const selectedBranchVisibleRowCount = this.getSelectedBranchCounts(
      candidate,
      selectedRows
    ).visible;
    let remainingVisibleCapacity = Math.max(
      this.maximumActiveRows - (state.allocatedRowCount - selectedBranchVisibleRowCount),
      0
    );
    const orderedChildren = [...children].sort(
      (left, right) =>
        Number(this.isCandidateInBranch(right, preferredDescendant)) -
          Number(this.isCandidateInBranch(left, preferredDescendant)) ||
        Number(left.isVisible) - Number(right.isVisible) ||
        right.priority - left.priority ||
        left.globalRowIndex - right.globalRowIndex
    );
    let omittedVisibleChildCount = 0;
    for (const child of orderedChildren) {
      const currentSelection = this.getSelectedBranchCounts(child, selectedRows);
      const currentVisibleRowCount = currentSelection.visible;
      const hasCurrentSelection = currentSelection.total > 0;
      const shouldKeepVisibleBranch = !child.isVisible || remainingVisibleCapacity > 0;
      if (
        hasCurrentSelection &&
        shouldKeepVisibleBranch &&
        currentVisibleRowCount <= remainingVisibleCapacity &&
        (!child.isVisible || currentVisibleRowCount > 0)
      ) {
        remainingVisibleCapacity -= currentVisibleRowCount;
        continue;
      }
      if (hasCurrentSelection) {
        this.rememberCapacitySelectedBranch(child, selectedRows, state);
        this.removeSelectedCandidateBranch(child, selectedRows, state);
      }
      if (!shouldKeepVisibleBranch) {
        omittedVisibleChildCount++;
        continue;
      }
      const restoredVisibleRowCount = this.restoreCapacitySelectedBranch(
        child,
        traversal,
        remainingVisibleCapacity
      );
      if (restoredVisibleRowCount !== undefined) {
        remainingVisibleCapacity -= restoredVisibleRowCount;
        continue;
      }
      this.addFrontierCandidate(child, selectedRows, refinementQueue);
      state.allocatedRowCount += child.isVisible ? 1 : 0;
      remainingVisibleCapacity -= child.isVisible ? 1 : 0;
    }
    state.refinedRows.add(candidate.globalRowIndex);
    candidate.isCapacityLimited ||= omittedVisibleChildCount > 0;
    return true;
  }

  private isCandidateInBranch(
    branch: SplatRADFrontierCandidate,
    candidate?: SplatRADFrontierCandidate
  ): boolean {
    while (candidate) {
      if (candidate === branch) {
        return true;
      }
      candidate = candidate.parent;
    }
    return false;
  }

  /** Retargets dormant retained branches before touching the leaf currently carrying continuity. */
  private makeRetargetQueue(
    selectedRows: ReadonlyMap<number, SplatRADFrontierCandidate>
  ): SplatRADPriorityQueue {
    const visibleSelectedBranches = new Set<number>();
    for (const candidate of selectedRows.values()) {
      if (!candidate.isVisible) {
        continue;
      }
      let ancestor: SplatRADFrontierCandidate | undefined = candidate;
      while (ancestor) {
        visibleSelectedBranches.add(ancestor.globalRowIndex);
        ancestor = ancestor.parent;
      }
    }
    return new SplatRADPriorityQueue((first, second) => {
      const firstHasVisibleSelection = visibleSelectedBranches.has(first.globalRowIndex);
      const secondHasVisibleSelection = visibleSelectedBranches.has(second.globalRowIndex);
      return (
        Number(secondHasVisibleSelection) - Number(firstHasVisibleSelection) ||
        compareSplatRADCandidates(first, second)
      );
    });
  }

  private getCapacityLimitedAncestor(
    candidate: SplatRADFrontierCandidate
  ): SplatRADFrontierCandidate | undefined {
    let ancestor = candidate.parent;
    while (ancestor) {
      if (ancestor.isCapacityLimited) {
        return ancestor;
      }
      ancestor = ancestor.parent;
    }
    return undefined;
  }

  private rememberCapacitySelectedBranch(
    candidate: SplatRADFrontierCandidate,
    selectedRows: ReadonlyMap<number, SplatRADFrontierCandidate>,
    state: SplatRADTraversalState
  ): void {
    this.clearCapacityRetainedBranch(candidate, state.retainedCapacityRows);
    this.captureSelectedBranch(candidate, selectedRows, state.retainedCapacityRows);
  }

  private clearCapacityRetainedBranch(
    candidate: SplatRADFrontierCandidate,
    retainedRows: Set<number>
  ): void {
    this.visitCandidateBranch(candidate, branchCandidate => {
      retainedRows.delete(branchCandidate.globalRowIndex);
    });
  }

  private captureSelectedBranch(
    candidate: SplatRADFrontierCandidate,
    selectedRows: ReadonlyMap<number, SplatRADFrontierCandidate>,
    retainedRows: Set<number>
  ): void {
    this.visitCandidateBranch(candidate, branchCandidate => {
      if (selectedRows.get(branchCandidate.globalRowIndex) === branchCandidate) {
        retainedRows.add(branchCandidate.globalRowIndex);
        return false;
      }
      return true;
    });
  }

  /** Restores a previously resolved dormant branch without republishing its coarse direct row. */
  private restoreCapacitySelectedBranch(
    candidate: SplatRADFrontierCandidate,
    traversal: SplatRADFrontierSelection,
    maximumVisibleRows: number
  ): number | undefined {
    const retainedCandidates: SplatRADFrontierCandidate[] = [];
    this.collectCapacityRetainedCandidates(
      candidate,
      traversal.state.retainedCapacityRows,
      retainedCandidates
    );
    const visibleRowCount = retainedCandidates.reduce(
      (count, retainedCandidate) => count + (retainedCandidate.isVisible ? 1 : 0),
      0
    );
    if (
      retainedCandidates.length === 0 ||
      visibleRowCount > maximumVisibleRows ||
      (candidate.isVisible && visibleRowCount === 0)
    ) {
      return undefined;
    }
    for (const retainedCandidate of retainedCandidates) {
      this.addFrontierCandidate(
        retainedCandidate,
        traversal.selectedRows,
        traversal.refinementQueue
      );
    }
    traversal.state.allocatedRowCount += visibleRowCount;
    return visibleRowCount;
  }

  private collectCapacityRetainedCandidates(
    candidate: SplatRADFrontierCandidate,
    retainedRows: ReadonlySet<number>,
    retainedCandidates: SplatRADFrontierCandidate[]
  ): void {
    this.visitCandidateBranch(candidate, branchCandidate => {
      if (retainedRows.has(branchCandidate.globalRowIndex)) {
        retainedCandidates.push(branchCandidate);
        return false;
      }
      return true;
    });
  }

  private removeSelectedCandidateBranch(
    candidate: SplatRADFrontierCandidate,
    selectedRows: Map<number, SplatRADFrontierCandidate>,
    state: SplatRADTraversalState
  ): void {
    this.visitCandidateBranch(candidate, branchCandidate => {
      if (selectedRows.delete(branchCandidate.globalRowIndex)) {
        state.allocatedRowCount -= branchCandidate.isVisible ? 1 : 0;
      }
      state.refinedRows.delete(branchCandidate.globalRowIndex);
    });
  }

  private getSelectedBranchCounts(
    candidate: SplatRADFrontierCandidate,
    selectedRows: ReadonlyMap<number, SplatRADFrontierCandidate>
  ): {total: number; visible: number} {
    let total = 0;
    let visible = 0;
    this.visitCandidateBranch(candidate, branchCandidate => {
      if (selectedRows.get(branchCandidate.globalRowIndex) === branchCandidate) {
        total++;
        visible += branchCandidate.isVisible ? 1 : 0;
      }
    });
    return {total, visible};
  }

  private visitCandidateBranch(
    candidate: SplatRADFrontierCandidate,
    visit: (candidate: SplatRADFrontierCandidate) => boolean | void
  ): void {
    const candidates = [candidate];
    while (candidates.length > 0) {
      const branchCandidate = candidates.pop()!;
      if (visit(branchCandidate) === false) {
        continue;
      }
      const children = branchCandidate.children ?? [];
      for (let childIndex = children.length - 1; childIndex >= 0; childIndex--) {
        candidates.push(children[childIndex]);
      }
    }
  }

  /** Returns whether a queued retained row is now covered by a coherently selected ancestor. */
  private hasSelectedFrontierAncestor(
    candidate: SplatRADFrontierCandidate,
    selectedRows: ReadonlyMap<number, SplatRADFrontierCandidate>
  ): boolean {
    let ancestor = candidate.parent;
    while (ancestor) {
      if (selectedRows.get(ancestor.globalRowIndex) === ancestor) {
        return true;
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  /** Publishes one coherent partial or complete frontier without changing source ownership. */
  private publishTraversal(traversal: SplatRADIncrementalTraversal): void {
    const {selectedRows, state} = traversal;
    state.selectedPages.clear();
    this.fallbackRowCount = 0;
    for (const candidate of selectedRows.values()) {
      if (!candidate.isVisible) {
        continue;
      }
      this.selectRow(
        candidate.registeredPage,
        candidate.localRowIndex,
        candidate.node.geometricError,
        candidate.priority,
        candidate.isFallback,
        state
      );
    }

    this.previouslyRefinedRows = new Set(state.refinedRows);
    const selectedFrontier = this.makeFrontier(state);
    const hasPendingTraversal =
      this.requiresRetarget ||
      traversal.retargetQueue.length > 0 ||
      traversal.refinementQueue.length > 0;
    const activePageIds = new Set([
      ...state.protectedPageIds,
      ...selectedFrontier.map(entry => entry.id),
      ...(hasPendingTraversal ? this.ownedPinnedIds : [])
    ]);
    for (const entry of selectedFrontier) {
      const chunk = this.residencyManager.getChunk(entry.id);
      if (chunk) {
        this.protectChunk(chunk);
        this.residencyManager.setPriority(chunk, entry.priority);
      }
    }
    this.releaseInactivePins(activePageIds);
    this.requiresRefresh = false;
    this.updateFrontier(selectedFrontier);
    if (hasPendingTraversal) {
      this.synchronizeRequests(new Map([...this.pendingRequests, ...state.requestedPages]));
    } else {
      this.synchronizeRequests(state.requestedPages);
    }
    for (const page of this.sortedPages) {
      page.lastDataRevision = page.page.data.revision;
    }
  }

  private makeFrontierCandidate(
    registeredPage: RegisteredSplatRADPage,
    globalRowIndex: number,
    parent?: SplatRADFrontierCandidate
  ): SplatRADFrontierCandidate | undefined {
    const page = registeredPage.page;
    const localRowIndex = globalRowIndex - page.data.rowIndexBase;
    const node = this.makeRowNode(registeredPage, localRowIndex);
    const view = this.currentView;
    if (!view) {
      return undefined;
    }
    const isVisible = isSplatHierarchyNodeVisible(node, view.modelViewProjectionMatrix);
    if (isVisible) {
      this.visibleRowCount++;
    } else {
      this.culledRowCount++;
    }
    const screenSpaceError = getSplatRADScreenSpaceError(node, view);
    const priority = isVisible
      ? getSplatHierarchyFoveatedPriority(
          node,
          view,
          view.foveation ?? this.foveation,
          screenSpaceError
        ) *
        this.getAngularFoveation(node, view) *
        this.lodSplatScale
      : 0;
    return {
      registeredPage,
      globalRowIndex,
      localRowIndex,
      node,
      priority,
      isFallback: false,
      isCapacityLimited: false,
      isVisible,
      ...(parent ? {parent} : {})
    };
  }

  private addFrontierCandidate(
    candidate: SplatRADFrontierCandidate,
    selectedRows: Map<number, SplatRADFrontierCandidate>,
    refinementQueue: SplatRADPriorityQueue
  ): void {
    selectedRows.set(candidate.globalRowIndex, candidate);
    const childCount = candidate.registeredPage.page.childCounts?.[candidate.localRowIndex] ?? 0;
    if (
      childCount > 0 &&
      (!candidate.isVisible || candidate.priority > this.getRefinementThreshold(candidate))
    ) {
      refinementQueue.push(candidate);
    }
  }

  private refineFrontierCandidate(
    candidate: SplatRADFrontierCandidate,
    selectedRows: Map<number, SplatRADFrontierCandidate>,
    refinementQueue: SplatRADPriorityQueue,
    refinementProgress: Map<number, SplatRADRefinementProgress>,
    state: SplatRADTraversalState,
    remainingTraversalRows: number
  ): boolean {
    const {registeredPage, globalRowIndex, localRowIndex, priority} = candidate;
    const page = registeredPage.page;
    const childCount = page.childCounts?.[localRowIndex] ?? 0;
    const childStart = page.childStarts?.[localRowIndex] ?? 0;
    const hasValidChildRange =
      Number.isSafeInteger(childStart + childCount) && childStart + childCount <= 0x8000_0000;
    if (
      childCount === 0 ||
      (candidate.isVisible && priority <= this.getRefinementThreshold(candidate)) ||
      !hasValidChildRange
    ) {
      refinementProgress.delete(globalRowIndex);
      return false;
    }

    const progress = refinementProgress.get(globalRowIndex) ?? {
      nextChildOffset: 0,
      residentChildCount: 0,
      childCandidates: []
    };
    const childOffsetLimit = Math.min(
      childCount,
      progress.nextChildOffset + remainingTraversalRows
    );
    for (; progress.nextChildOffset < childOffsetLimit; progress.nextChildOffset++) {
      const childOffset = progress.nextChildOffset;
      const childRowIndex = childStart + childOffset;
      const childPage = this.getRegisteredPageForRow(childRowIndex);
      if (hasSplatRADAncestor(candidate, childRowIndex)) {
        continue;
      }
      if (!childPage) {
        this.requestRow(state, childRowIndex, priority, globalRowIndex);
        continue;
      }
      progress.residentChildCount++;
      const child = this.makeFrontierCandidate(childPage, childStart + childOffset, candidate);
      const childHierarchyCount =
        childPage.page.childCounts?.[childStart + childOffset - childPage.page.data.rowIndexBase] ??
        0;
      const needsPublishedFallbackProtection = candidate.isVisible || Boolean(child?.isVisible);
      if (
        childPage.page.id !== page.id &&
        (needsPublishedFallbackProtection || childHierarchyCount > 0)
      ) {
        const chunk = this.residencyManager.getChunk(childPage.page.id);
        if (chunk) {
          this.protectChunk(chunk);
          if (needsPublishedFallbackProtection) {
            state.protectedPageIds.add(chunk.id);
          }
        }
      }
      if (child) {
        progress.childCandidates.push(child);
      }
    }

    if (progress.nextChildOffset < childCount) {
      refinementProgress.set(globalRowIndex, progress);
      return true;
    }
    refinementProgress.delete(globalRowIndex);
    if (progress.residentChildCount !== childCount) {
      candidate.isFallback = true;
      return false;
    }

    const {childCandidates} = progress;
    const visibleChildCount = childCandidates.reduce(
      (visibleRowCount, child) => visibleRowCount + (child.isVisible ? 1 : 0),
      0
    );
    const nextAllocatedRowCount =
      state.allocatedRowCount - (candidate.isVisible ? 1 : 0) + visibleChildCount;
    if (childCandidates.length === 0) {
      return false;
    }
    candidate.children = childCandidates;
    if (nextAllocatedRowCount > this.maximumActiveRows) {
      if (!candidate.isVisible) {
        this.selectCapacityLimitedChildren(candidate, {selectedRows, refinementQueue, state});
      }
      return false;
    }

    selectedRows.delete(globalRowIndex);
    state.allocatedRowCount = nextAllocatedRowCount;
    state.refinedRows.add(globalRowIndex);
    candidate.isCapacityLimited = false;
    for (const child of childCandidates) {
      this.addFrontierCandidate(child, selectedRows, refinementQueue);
    }
    return false;
  }

  private getRefinementThreshold(candidate: SplatRADFrontierCandidate): number {
    const wasRefined = this.previouslyRefinedRows.has(candidate.globalRowIndex);
    const hysteresisFactor = wasRefined
      ? 1 - this.refinementHysteresis
      : 1 + this.refinementHysteresis;
    return this.maximumScreenSpaceError * hysteresisFactor;
  }

  private selectRow(
    registeredPage: RegisteredSplatRADPage,
    localRowIndex: number,
    geometricError: number,
    priority: number,
    isFallback: boolean,
    state: SplatRADTraversalState
  ): void {
    const page = registeredPage.page;
    let selectedPage = state.selectedPages.get(page.id);
    if (!selectedPage) {
      selectedPage = {
        registeredPage,
        activeRows: [],
        activeMask: new Uint8Array(page.data.length),
        geometricError: 0,
        priority: 0,
        isFallback: false
      };
      state.selectedPages.set(page.id, selectedPage);
    }
    if (!selectedPage.activeMask[localRowIndex]) {
      selectedPage.activeRows.push(localRowIndex);
      selectedPage.activeMask[localRowIndex] = 1;
      if (isFallback) {
        this.fallbackRowCount++;
      }
    }
    selectedPage.geometricError = Math.max(selectedPage.geometricError, geometricError);
    selectedPage.priority = Math.max(selectedPage.priority, priority);
    selectedPage.isFallback ||= isFallback;
  }

  private requestRow(
    state: SplatRADTraversalState,
    rowIndex: number,
    priority: number,
    parentRowIndex?: number
  ): void {
    const pageIndex = Math.floor(rowIndex / this.pageSize);
    const previousRequest = state.requestedPages.get(pageIndex);
    if (previousRequest && previousRequest.priority >= priority) {
      return;
    }
    state.requestedPages.set(pageIndex, {
      rowIndex,
      pageIndex,
      ...(parentRowIndex === undefined ? {} : {parentRowIndex}),
      priority
    });
  }

  private synchronizeRequests(nextRequests: Map<number, SplatRADHierarchyRequest>): void {
    for (const [pageIndex, request] of this.pendingRequests) {
      if (!nextRequests.has(pageIndex)) {
        this.pendingRequests.delete(pageIndex);
        this.onPageCancel?.(request);
      }
    }
    for (const [pageIndex, request] of nextRequests) {
      const previousRequest = this.pendingRequests.get(pageIndex);
      this.pendingRequests.set(pageIndex, request);
      if (!previousRequest) {
        this.onPageRequest?.(request);
      }
    }
  }

  private makeFrontier(state: SplatRADTraversalState): SplatRADHierarchyFrontierEntry[] {
    return Array.from(state.selectedPages.values())
      .sort(
        (firstPage, secondPage) =>
          firstPage.registeredPage.page.data.rowIndexBase -
          secondPage.registeredPage.page.data.rowIndexBase
      )
      .map(selectedPage => {
        selectedPage.activeRows.sort((firstRow, secondRow) => firstRow - secondRow);
        return {
          id: selectedPage.registeredPage.page.id,
          data: selectedPage.registeredPage.page.data,
          activeRows: Uint32Array.from(selectedPage.activeRows),
          activeMask: selectedPage.activeMask,
          bounds: selectedPage.registeredPage.bounds,
          geometricError: selectedPage.geometricError,
          priority: selectedPage.priority,
          isFallback: selectedPage.isFallback
        };
      });
  }

  private updateFrontier(selectedFrontier: SplatRADHierarchyFrontierEntry[]): void {
    const hasChanged =
      selectedFrontier.length !== this.currentFrontier.length ||
      selectedFrontier.some((entry, entryIndex) => {
        const previousEntry = this.currentFrontier[entryIndex];
        return (
          entry.id !== previousEntry.id ||
          entry.data !== previousEntry.data ||
          entry.isFallback !== previousEntry.isFallback ||
          entry.activeRows.length !== previousEntry.activeRows.length ||
          entry.activeRows.some(
            (rowIndex, rowOffset) => rowIndex !== previousEntry.activeRows[rowOffset]
          )
        );
      });
    if (hasChanged) {
      this.currentFrontier = selectedFrontier;
      this.onFrontierChange?.(selectedFrontier, this.stats);
      return;
    }
    for (let entryIndex = 0; entryIndex < selectedFrontier.length; entryIndex++) {
      this.currentFrontier[entryIndex].priority = selectedFrontier[entryIndex].priority;
      this.currentFrontier[entryIndex].geometricError = selectedFrontier[entryIndex].geometricError;
    }
  }

  private makeRowNode(
    registeredPage: RegisteredSplatRADPage,
    localRowIndex: number
  ): SplatHierarchyNode {
    const {data, geometricError} = registeredPage.page;
    const componentOffset = localRowIndex * 3;
    const center = [
      data.source.positions[componentOffset],
      data.source.positions[componentOffset + 1],
      data.source.positions[componentOffset + 2]
    ] as const;
    const maximumScale = Math.max(
      Math.abs(data.source.scales[componentOffset]),
      Math.abs(data.source.scales[componentOffset + 1]),
      Math.abs(data.source.scales[componentOffset + 2])
    );
    const averageScale =
      (Math.abs(data.source.scales[componentOffset]) +
        Math.abs(data.source.scales[componentOffset + 1]) +
        Math.abs(data.source.scales[componentOffset + 2])) /
      3;
    const opacity = data.source.opacities[localRowIndex];
    const expandedOpacity = this.lodOpacity && opacity > 1 ? Math.min(opacity * 4 - 3, 5) : 1;
    const opacityExpansion = expandedOpacity > 1 ? 1 + 0.7 * (expandedOpacity - 1) : 1;
    return {
      id: `${registeredPage.page.id}:${localRowIndex}`,
      bounds: {
        center,
        radius: maximumScale * GAUSSIAN_SUPPORT_RADIUS * opacityExpansion
      },
      geometricError: geometricError ?? 2 * averageScale * opacityExpansion
    };
  }

  /**
   * Maps angular distance from the view axis to the documented full, peripheral, and rear detail
   * levels. Angle-space easing avoids coupling the hierarchy policy to a renderer implementation.
   */
  private getAngularFoveation(node: SplatHierarchyNode, view: SplatHierarchyView): number {
    const matrix = view.modelViewProjectionMatrix;
    if (!matrix) {
      return 1;
    }
    const forwardLength = Math.hypot(matrix[3], matrix[7], matrix[11]);
    if (!Number.isFinite(forwardLength) || forwardLength <= Number.EPSILON) {
      return 1;
    }

    const directionX = node.bounds.center[0] - view.cameraPosition[0];
    const directionY = node.bounds.center[1] - view.cameraPosition[1];
    const directionZ = node.bounds.center[2] - view.cameraPosition[2];
    const distance = Math.hypot(directionX, directionY, directionZ);
    if (distance <= Number.EPSILON) {
      return 1;
    }

    const directionCosine =
      (directionX * matrix[3] + directionY * matrix[7] + directionZ * matrix[11]) /
      (distance * forwardLength);
    const angularDistance = Math.acos(Math.min(Math.max(directionCosine, -1), 1));
    if (angularDistance <= this.fullDetailHalfAngleRadians) {
      return 1;
    }
    if (angularDistance <= this.peripheralHalfAngleRadians) {
      return interpolateAngularDetail(
        angularDistance,
        this.fullDetailHalfAngleRadians,
        this.peripheralHalfAngleRadians,
        1,
        this.coneFoveate
      );
    }
    return interpolateAngularDetail(
      angularDistance,
      this.peripheralHalfAngleRadians,
      Math.PI,
      this.coneFoveate,
      this.behindFoveate
    );
  }

  private getPagePriority(page: SplatRADHierarchyPage, bounds: SplatResidencyBounds): number {
    if (!this.currentView) {
      return 0;
    }
    const node: SplatHierarchyNode = {
      id: page.id,
      bounds,
      geometricError: page.geometricError ?? Math.max(bounds.radius ?? 0, Number.EPSILON)
    };
    return getSplatHierarchyFoveatedPriority(
      node,
      this.currentView,
      this.currentView.foveation ?? this.foveation
    );
  }

  private getRegisteredPageForRow(rowIndex: number): RegisteredSplatRADPage | undefined {
    let lowerIndex = 0;
    let upperIndex = this.sortedPages.length - 1;
    while (lowerIndex <= upperIndex) {
      const middleIndex = lowerIndex + Math.floor((upperIndex - lowerIndex) / 2);
      const page = this.sortedPages[middleIndex];
      if (rowIndex < page.page.data.rowIndexBase) {
        upperIndex = middleIndex - 1;
      } else if (rowIndex >= page.endRowIndex) {
        lowerIndex = middleIndex + 1;
      } else if (!page.page.data.destroyed && this.residencyManager.has(page.page.id)) {
        return page;
      } else {
        return undefined;
      }
    }
    return undefined;
  }

  private protectChunk(chunk: SplatResidencyChunk): void {
    if (!chunk.pinned && this.residencyManager.pin(chunk)) {
      this.ownedPinnedIds.add(chunk.id);
    }
  }

  private releaseInactivePins(activePageIds: ReadonlySet<string>): void {
    for (const pageId of this.ownedPinnedIds) {
      if (!activePageIds.has(pageId)) {
        this.ownedPinnedIds.delete(pageId);
        this.residencyManager.unpin(pageId);
      }
    }
  }

  private pruneEvictedPages(): boolean {
    let removedPage = false;
    for (const [pageId, registeredPage] of this.pagesById) {
      if (registeredPage.page.data.destroyed || !this.residencyManager.has(pageId)) {
        this.pagesById.delete(pageId);
        this.ownedPinnedIds.delete(pageId);
        removedPage = true;
      }
    }
    if (removedPage) {
      this.sortedPages = this.sortedPages.filter(page => this.pagesById.has(page.page.id));
    }
    return removedPage;
  }

  private haveSourceRowsChanged(): boolean {
    return this.sortedPages.some(page => page.lastDataRevision !== page.page.data.revision);
  }

  private invalidateIncrementalTraversal(): void {
    this.incrementalTraversal = undefined;
    this.requiresRetarget = false;
  }

  private validateRootRows(rootRows: readonly number[]): void {
    if (
      rootRows.some(
        rowIndex => !Number.isSafeInteger(rowIndex) || rowIndex < 0 || rowIndex > 0x7fff_ffff
      )
    ) {
      throw new RangeError('Gaussian hierarchy roots must be nonnegative signed GPU row indices');
    }
  }

  private validatePage(page: SplatRADHierarchyPage): void {
    if (!page.id || page.data.destroyed || page.data.length === 0) {
      throw new Error('Gaussian source pages require a stable identity and live prepared batch');
    }
    if (
      Boolean(page.childCounts) !== Boolean(page.childStarts) ||
      (page.childCounts && page.childCounts.length !== page.data.length) ||
      (page.childStarts && page.childStarts.length !== page.data.length)
    ) {
      throw new Error('Gaussian source hierarchy arrays must match original source-row counts');
    }
    const endRowIndex = page.data.rowIndexBase + page.data.length;
    if (
      this.sortedPages.some(
        registeredPage =>
          registeredPage.page.id !== page.id &&
          page.data.rowIndexBase < registeredPage.endRowIndex &&
          endRowIndex > registeredPage.page.data.rowIndexBase
      )
    ) {
      throw new Error('Gaussian source page global row ranges must not overlap');
    }
  }

  private assertLive(): void {
    if (this.isDestroyed || this.residencyManager.destroyed) {
      throw new Error('Gaussian row hierarchy or its residency manager has been destroyed');
    }
  }
}

/** Keeps the highest-value original source row at the frontier without sorting every update. */
class SplatRADPriorityQueue {
  private readonly candidates: SplatRADFrontierCandidate[] = [];

  constructor(
    private readonly compareCandidates: (
      first: SplatRADFrontierCandidate,
      second: SplatRADFrontierCandidate
    ) => number = compareSplatRADCandidates
  ) {}

  get length(): number {
    return this.candidates.length;
  }

  push(candidate: SplatRADFrontierCandidate): void {
    let index = this.candidates.push(candidate) - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareCandidates(this.candidates[parentIndex], candidate) >= 0) {
        break;
      }
      this.candidates[index] = this.candidates[parentIndex];
      index = parentIndex;
    }
    this.candidates[index] = candidate;
  }

  pop(): SplatRADFrontierCandidate | undefined {
    const first = this.candidates[0];
    const last = this.candidates.pop();
    if (!first || !last || this.candidates.length === 0) {
      return first;
    }

    let index = 0;
    while (true) {
      const firstChildIndex = index * 2 + 1;
      if (firstChildIndex >= this.candidates.length) {
        break;
      }
      const secondChildIndex = firstChildIndex + 1;
      const largestChildIndex =
        secondChildIndex < this.candidates.length &&
        this.compareCandidates(
          this.candidates[secondChildIndex],
          this.candidates[firstChildIndex]
        ) > 0
          ? secondChildIndex
          : firstChildIndex;
      if (this.compareCandidates(last, this.candidates[largestChildIndex]) >= 0) {
        break;
      }
      this.candidates[index] = this.candidates[largestChildIndex];
      index = largestChildIndex;
    }
    this.candidates[index] = last;
    return first;
  }
}

function compareSplatRADCandidates(
  first: SplatRADFrontierCandidate,
  second: SplatRADFrontierCandidate
): number {
  return first.priority - second.priority || second.globalRowIndex - first.globalRowIndex;
}

/** Smoothly blends two detail levels over an angular interval without renderer-specific math. */
function interpolateAngularDetail(
  angularDistance: number,
  startAngle: number,
  endAngle: number,
  startDetail: number,
  endDetail: number
): number {
  const angleRange = endAngle - startAngle;
  if (angleRange <= Number.EPSILON) {
    return endDetail;
  }
  const linearProgress = Math.min(Math.max((angularDistance - startAngle) / angleRange, 0), 1);
  const smoothProgress = linearProgress * linearProgress * (3 - 2 * linearProgress);
  return startDetail + (endDetail - startDetail) * smoothProgress;
}

/** Validates one per-call row-evaluation slice before mutating traversal state. */
function validateSplatRADTraversalBudget(maxTraversalRows: number): void {
  if (
    maxTraversalRows !== Number.POSITIVE_INFINITY &&
    (!Number.isSafeInteger(maxTraversalRows) || maxTraversalRows <= 0)
  ) {
    throw new RangeError('Gaussian traversal capacity must be a positive safe integer');
  }
}

function hasSplatRADAncestor(candidate: SplatRADFrontierCandidate, rowIndex: number): boolean {
  let current: SplatRADFrontierCandidate | undefined = candidate;
  while (current) {
    if (current.globalRowIndex === rowIndex) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function getSplatRADScreenSpaceError(node: SplatHierarchyNode, view: SplatHierarchyView): number {
  const distance = Math.max(
    Math.hypot(
      node.bounds.center[0] - view.cameraPosition[0],
      node.bounds.center[1] - view.cameraPosition[1],
      node.bounds.center[2] - view.cameraPosition[2]
    ),
    1e-6
  );
  const verticalFieldOfView = Math.min(
    Math.max(view.verticalFieldOfView ?? Math.PI / 3, 1e-6),
    Math.PI - 1e-6
  );
  const focalLengthPixels =
    Math.max(view.viewportSize[1], 0) / (2 * Math.tan(verticalFieldOfView / 2));
  return (Math.max(node.geometricError, 0) * focalLengthPixels) / distance;
}

function areSplatRADViewsEqual(first: SplatHierarchyView, second: SplatHierarchyView): boolean {
  if (
    first.verticalFieldOfView !== second.verticalFieldOfView ||
    !areSplatRADValuesEqual(first.cameraPosition, second.cameraPosition) ||
    !areSplatRADValuesEqual(first.viewportSize, second.viewportSize) ||
    !areSplatRADValuesEqual(first.modelViewProjectionMatrix, second.modelViewProjectionMatrix)
  ) {
    return false;
  }
  if (!first.foveation || !second.foveation) {
    return first.foveation === second.foveation;
  }
  return (
    first.foveation.radius === second.foveation.radius &&
    first.foveation.strength === second.foveation.strength &&
    areSplatRADValuesEqual(first.foveation.center, second.foveation.center)
  );
}

function areSplatRADValuesEqual(
  first: readonly number[] | undefined,
  second: readonly number[] | undefined
): boolean {
  return (
    first === second ||
    (first !== undefined &&
      second !== undefined &&
      first.length === second.length &&
      first.every((value, index) => value === second[index]))
  );
}

/** Derives a conservative sphere from original decoded page positions and Gaussian source scales. */
export function getSplatRADPageBounds(
  page: Pick<SplatRADHierarchyPage, 'data' | 'bounds'>
): SplatResidencyBounds {
  if (page.bounds) {
    return page.bounds;
  }

  const positions = page.data.source.positions;
  const scales = page.data.source.scales;
  let minimumX = Number.POSITIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let minimumZ = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  let maximumZ = Number.NEGATIVE_INFINITY;

  for (let rowIndex = 0; rowIndex < page.data.length; rowIndex++) {
    const componentOffset = rowIndex * 3;
    const positionX = positions[componentOffset];
    const positionY = positions[componentOffset + 1];
    const positionZ = positions[componentOffset + 2];
    if (!Number.isFinite(positionX + positionY + positionZ)) {
      continue;
    }
    minimumX = Math.min(minimumX, positionX);
    minimumY = Math.min(minimumY, positionY);
    minimumZ = Math.min(minimumZ, positionZ);
    maximumX = Math.max(maximumX, positionX);
    maximumY = Math.max(maximumY, positionY);
    maximumZ = Math.max(maximumZ, positionZ);
  }

  if (!Number.isFinite(minimumX)) {
    return {center: [0, 0, 0], radius: 0};
  }
  const center = [
    (minimumX + maximumX) / 2,
    (minimumY + maximumY) / 2,
    (minimumZ + maximumZ) / 2
  ] as const;
  let radius = 0;
  for (let rowIndex = 0; rowIndex < page.data.length; rowIndex++) {
    const componentOffset = rowIndex * 3;
    const positionX = positions[componentOffset];
    const positionY = positions[componentOffset + 1];
    const positionZ = positions[componentOffset + 2];
    if (!Number.isFinite(positionX + positionY + positionZ)) {
      continue;
    }
    const maximumScale = Math.max(
      Math.abs(scales[componentOffset]),
      Math.abs(scales[componentOffset + 1]),
      Math.abs(scales[componentOffset + 2])
    );
    radius = Math.max(
      radius,
      Math.hypot(positionX - center[0], positionY - center[1], positionZ - center[2]) +
        maximumScale * GAUSSIAN_SUPPORT_RADIUS
    );
  }
  return {center, radius};
}
