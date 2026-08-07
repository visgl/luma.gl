// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSplatData} from './splat-data';
import {
  getSplatHierarchyFoveatedPriority,
  getSplatHierarchyScreenSpaceError,
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
  /** Default gaze-aware priority controls for views without an explicit override. */
  foveation?: SplatHierarchyFoveation;
  /** Receives intact source pages plus original batch-local active-row indirection. */
  onFrontierChange?: (
    frontier: readonly SplatRADHierarchyFrontierEntry[],
    stats: SplatRADHierarchyStats
  ) => void;
  /** Requests a missing source page; transport, decoding, workers, and upload remain external. */
  onPageRequest?: (request: SplatRADHierarchyRequest) => void;
  /** Cancels a previously requested page after it leaves the selected camera frontier. */
  onPageCancel?: (request: SplatRADHierarchyRequest) => void;
};

type RegisteredSplatRADPage = {
  page: SplatRADHierarchyPage;
  bounds: SplatResidencyBounds;
  endRowIndex: number;
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
  ancestorRows: Set<number>;
  allocatedRowCount: number;
};

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
  private readonly pageSize: number;
  private readonly foveation?: SplatHierarchyFoveation;

  private sortedPages: RegisteredSplatRADPage[] = [];
  private rootRows: readonly number[];
  private currentView?: SplatHierarchyView;
  private currentFrontier: SplatRADHierarchyFrontierEntry[] = [];
  private visibleRowCount = 0;
  private culledRowCount = 0;
  private fallbackRowCount = 0;
  private isDestroyed = false;

  /** Creates a loader-neutral global-row hierarchy without fetching or decoding source pages. */
  constructor(props: SplatRADHierarchyManagerProps = {}) {
    this.residencyManager =
      props.residencyManager ?? new SplatResidencyManager(props.residencyBudget);
    this.ownsResidencyManager = !props.residencyManager;
    this.rootRows = [...(props.rootRows ?? [0])];
    this.pageSize = props.pageSize ?? DEFAULT_RAD_PAGE_SIZE;
    this.maximumScreenSpaceError = Math.max(props.maximumScreenSpaceError ?? 8, 0);
    this.maximumActiveRows = props.maximumActiveRows ?? Number.POSITIVE_INFINITY;
    this.foveation = props.foveation;
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
      endRowIndex: page.data.rowIndexBase + page.data.length
    };
    this.pagesById.set(page.id, registeredPage);
    this.sortedPages.push(registeredPage);
    this.sortedPages.sort(
      (firstPage, secondPage) =>
        firstPage.page.data.rowIndexBase - secondPage.page.data.rowIndexBase
    );
    this.pruneEvictedPages();
    this.pendingRequests.delete(Math.floor(page.data.rowIndexBase / this.pageSize));
    this.refresh();
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
    this.refresh();
    return true;
  }

  /** Allows an externally cancelled or failed source-page request to be retried by the view. */
  clearRequestedPage(pageIndex: number): void {
    this.pendingRequests.delete(pageIndex);
  }

  /** Computes coherent camera-selected original source rows without copying source page buffers. */
  update(view: SplatHierarchyView): readonly SplatRADHierarchyFrontierEntry[] {
    this.assertLive();
    this.currentView = view;
    this.refresh();
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
    if (this.ownsResidencyManager) {
      this.residencyManager.destroy();
    }
  }

  private refresh(): void {
    if (this.isDestroyed || !this.currentView) {
      return;
    }

    this.pruneEvictedPages();
    this.visibleRowCount = 0;
    this.culledRowCount = 0;
    this.fallbackRowCount = 0;
    const rootRows = this.rootRows.slice(0, this.maximumActiveRows);
    const state: SplatRADTraversalState = {
      selectedPages: new Map(),
      protectedPageIds: new Set(),
      requestedPages: new Map(),
      ancestorRows: new Set(),
      allocatedRowCount: rootRows.length
    };

    for (const rootRow of rootRows) {
      const rootPage = this.getRegisteredPageForRow(rootRow);
      if (!rootPage) {
        this.requestRow(state, rootRow, Number.MAX_SAFE_INTEGER);
        continue;
      }
      this.traverseRow(rootPage, rootRow, state);
    }

    const selectedFrontier = this.makeFrontier(state);
    const activePageIds = new Set([
      ...state.protectedPageIds,
      ...selectedFrontier.map(entry => entry.id)
    ]);
    for (const entry of selectedFrontier) {
      const chunk = this.residencyManager.getChunk(entry.id);
      if (chunk) {
        this.protectChunk(chunk);
        this.residencyManager.setPriority(chunk, entry.priority);
      }
    }
    this.releaseInactivePins(activePageIds);
    this.updateFrontier(selectedFrontier);
    this.synchronizeRequests(state.requestedPages);
  }

  private traverseRow(
    registeredPage: RegisteredSplatRADPage,
    globalRowIndex: number,
    state: SplatRADTraversalState
  ): boolean {
    const page = registeredPage.page;
    const localRowIndex = globalRowIndex - page.data.rowIndexBase;
    const node = this.makeRowNode(registeredPage, localRowIndex);
    if (!isSplatHierarchyNodeVisible(node, this.currentView?.modelViewProjectionMatrix)) {
      this.culledRowCount++;
      return false;
    }
    this.visibleRowCount++;

    const view = this.currentView;
    if (!view) {
      return false;
    }
    const screenSpaceError = getSplatHierarchyScreenSpaceError(node, view);
    const priority = getSplatHierarchyFoveatedPriority(
      node,
      view,
      view.foveation ?? this.foveation,
      screenSpaceError
    );
    const childCount = page.childCounts?.[localRowIndex] ?? 0;
    const childStart = page.childStarts?.[localRowIndex] ?? 0;
    if (
      childCount === 0 ||
      priority <= this.maximumScreenSpaceError ||
      state.allocatedRowCount + childCount - 1 > this.maximumActiveRows ||
      !Number.isSafeInteger(childStart + childCount) ||
      childStart + childCount > 0x8000_0000
    ) {
      this.selectRow(registeredPage, localRowIndex, node.geometricError, priority, false, state);
      return true;
    }

    state.ancestorRows.add(globalRowIndex);
    const childPages: RegisteredSplatRADPage[] = [];
    let allChildrenResident = true;
    for (let childOffset = 0; childOffset < childCount; childOffset++) {
      const childRowIndex = childStart + childOffset;
      const childPage = this.getRegisteredPageForRow(childRowIndex);
      if (state.ancestorRows.has(childRowIndex)) {
        allChildrenResident = false;
        continue;
      }
      if (!childPage) {
        allChildrenResident = false;
        this.requestRow(state, childRowIndex, priority, globalRowIndex);
        continue;
      }
      childPages.push(childPage);
      if (childPage.page.id !== page.id) {
        const chunk = this.residencyManager.getChunk(childPage.page.id);
        if (chunk) {
          this.protectChunk(chunk);
          state.protectedPageIds.add(chunk.id);
        }
      }
    }

    if (!allChildrenResident || childPages.length !== childCount) {
      this.selectRow(registeredPage, localRowIndex, node.geometricError, priority, true, state);
      state.ancestorRows.delete(globalRowIndex);
      return true;
    }

    state.allocatedRowCount += childCount - 1;
    let hasVisibleChild = false;
    for (let childOffset = 0; childOffset < childCount; childOffset++) {
      hasVisibleChild =
        this.traverseRow(childPages[childOffset], childStart + childOffset, state) ||
        hasVisibleChild;
    }
    state.ancestorRows.delete(globalRowIndex);
    if (!hasVisibleChild) {
      state.allocatedRowCount -= childCount - 1;
      this.selectRow(registeredPage, localRowIndex, node.geometricError, priority, false, state);
    }
    return true;
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
    return {
      id: `${registeredPage.page.id}:${localRowIndex}`,
      bounds: {center, radius: maximumScale * GAUSSIAN_SUPPORT_RADIUS},
      geometricError: geometricError ?? maximumScale
    };
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

  private pruneEvictedPages(): void {
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
