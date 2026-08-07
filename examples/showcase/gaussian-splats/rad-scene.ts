// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUSplatDataFromArrow, type GPUSplatArrowSource} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {
  SplatRADHierarchyManager,
  type SplatHierarchyView,
  type SplatRADHierarchyFrontierEntry,
  type SplatRADHierarchyPage,
  type SplatRADHierarchyStats
} from '@luma.gl/splats';
import {
  type LocalGaussianSplatRADPage,
  type LocalGaussianSplatRADPageDemand,
  type LocalGaussianSplatRADPageSource
} from './local-loaders';

/** Integrates independent loader-owned RAD pages with row-level source residency. */
export type GaussianSplatRADSceneControllerProps = {
  /** Device receiving each independently decoded, source-faithful Gaussian page. */
  device: Device;
  /** Metadata-only, demand-driven source opened by the isolated loaders.gl adapter. */
  source: LocalGaussianSplatRADPageSource;
  /** Hard limit across intact, independently uploaded source pages. */
  maxResidentSplatCount: number;
  /** Maximum accepted projected error before requesting finer source rows. */
  maximumScreenSpaceError?: number;
  /** Receives original source pages and batch-local active-row selections. */
  onFrontierChange?: (
    frontier: readonly SplatRADHierarchyFrontierEntry[],
    stats: SplatRADHierarchyStats
  ) => void;
  /** Reports successful admission of one independently prepared source page. */
  onPageLoad?: (page: SplatRADHierarchyPage, stats: SplatRADHierarchyStats) => void;
  /** Reports a genuine range, decode, or upload failure outside cancelled camera demand. */
  onError?: (error: unknown) => void;
};

/**
 * Loads only camera-requested RAD pages and preserves their original row hierarchy.
 *
 * The source owns transport and decoding; the hierarchy owns complete GPU source pages. Parent
 * rows remain visible until every required child page is resident, and camera motion cancels
 * obsolete demand without concatenating pages or replacing mixed parent-and-leaf source chunks.
 */
export class GaussianSplatRADSceneController {
  /** Original demand-driven range source; completed Arrow pages are never retained here. */
  readonly source: LocalGaussianSplatRADPageSource;
  /** Loader-neutral row frontier and bounded, explicitly owned GPU source residency. */
  readonly hierarchy: SplatRADHierarchyManager;

  private readonly device: Device;
  private readonly onPageLoad?: GaussianSplatRADSceneControllerProps['onPageLoad'];
  private readonly onError?: GaussianSplatRADSceneControllerProps['onError'];
  private readonly pendingPageLoads = new Map<number, Promise<void>>();
  private readonly rejectedPageIndices = new Set<number>();
  private currentView?: SplatHierarchyView;
  private demandRefreshScheduled = false;
  private isDestroyed = false;

  constructor(props: GaussianSplatRADSceneControllerProps) {
    this.device = props.device;
    this.source = props.source;
    this.onPageLoad = props.onPageLoad;
    this.onError = props.onError;
    this.hierarchy = new SplatRADHierarchyManager({
      pageSize: props.source.metadata.chunkSize ?? 65_536,
      residencyBudget: {maxResidentSplats: props.maxResidentSplatCount},
      maximumActiveRows: props.maxResidentSplatCount,
      maximumScreenSpaceError: props.maximumScreenSpaceError,
      onFrontierChange: props.onFrontierChange,
      onPageRequest: () => this.scheduleDemandRefresh(),
      onPageCancel: request => {
        const chunkIndex = this.source.getChunkForRow(request.rowIndex);
        if (chunkIndex !== undefined) {
          this.source.cancelPage(chunkIndex);
        }
      }
    });
  }

  /** Fetches exactly the Spark root page, then starts camera-prioritized row refinement. */
  async start(view?: SplatHierarchyView): Promise<void> {
    if (view) {
      this.currentView = view;
    }
    const admitted = await this.loadSourcePage(0, Number.MAX_SAFE_INTEGER);
    if (!admitted && !this.isDestroyed) {
      throw new RangeError('The RAD root page exceeds the resident source budget.');
    }
    if (this.currentView && !this.isDestroyed) {
      this.hierarchy.update(this.currentView);
      this.scheduleDemandRefresh();
    }
  }

  /** Updates the row-level camera frontier and schedules only newly relevant source pages. */
  update(view: SplatHierarchyView): readonly SplatRADHierarchyFrontierEntry[] {
    if (this.isDestroyed) {
      return [];
    }
    this.currentView = view;
    this.rejectedPageIndices.clear();
    const frontier = this.hierarchy.update(view);
    this.scheduleDemandRefresh();
    return frontier;
  }

  /** Waits for the currently requested page queue; useful for deterministic integration tests. */
  async waitForIdle(): Promise<void> {
    while (!this.isDestroyed && (this.demandRefreshScheduled || this.pendingPageLoads.size > 0)) {
      await Promise.resolve();
      const pendingPageLoads = [...this.pendingPageLoads.values()];
      if (pendingPageLoads.length > 0) {
        await Promise.allSettled(pendingPageLoads);
      }
    }
  }

  /** Cancels transport before releasing every hierarchy-owned independent GPU source page. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.source.destroy();
    this.hierarchy.destroy();
    this.pendingPageLoads.clear();
    this.rejectedPageIndices.clear();
  }

  private scheduleDemandRefresh(): void {
    if (this.isDestroyed || this.demandRefreshScheduled) {
      return;
    }
    this.demandRefreshScheduled = true;
    queueMicrotask(() => {
      this.demandRefreshScheduled = false;
      if (!this.isDestroyed) {
        this.refreshDemand();
      }
    });
  }

  private refreshDemand(): void {
    const demandByChunkIndex = new Map<number, LocalGaussianSplatRADPageDemand>();
    for (const request of this.hierarchy.requests) {
      const chunkIndex = this.source.getChunkForRow(request.rowIndex);
      if (chunkIndex === undefined || this.rejectedPageIndices.has(chunkIndex)) {
        continue;
      }
      const previousDemand = demandByChunkIndex.get(chunkIndex);
      if (!previousDemand || request.priority > (previousDemand.priority ?? 0)) {
        demandByChunkIndex.set(chunkIndex, {chunkIndex, priority: request.priority});
      }
    }

    const demands = [...demandByChunkIndex.values()].sort(
      (left, right) => (right.priority ?? 0) - (left.priority ?? 0)
    );
    this.source.setPageDemand(demands);
    for (const demand of demands) {
      if (this.pendingPageLoads.has(demand.chunkIndex)) {
        continue;
      }
      const pageLoad = this.loadSourcePage(demand.chunkIndex, demand.priority ?? 0)
        .then(admitted => {
          if (!admitted && !this.isDestroyed) {
            this.rejectedPageIndices.add(demand.chunkIndex);
          }
        })
        .catch(error => {
          if (!this.isDestroyed && !isRADPageAbortError(error)) {
            this.rejectedPageIndices.add(demand.chunkIndex);
            this.onError?.(error);
          }
        })
        .finally(() => {
          if (this.pendingPageLoads.get(demand.chunkIndex) === pageLoad) {
            this.pendingPageLoads.delete(demand.chunkIndex);
            if (
              !this.isDestroyed &&
              !this.rejectedPageIndices.has(demand.chunkIndex) &&
              this.hierarchy.requests.some(
                request => this.source.getChunkForRow(request.rowIndex) === demand.chunkIndex
              )
            ) {
              this.scheduleDemandRefresh();
            }
          }
        });
      this.pendingPageLoads.set(demand.chunkIndex, pageLoad);
    }
  }

  private async loadSourcePage(chunkIndex: number, priority: number): Promise<boolean> {
    const sourceChunk = this.source.metadata.chunks[chunkIndex];
    if (!sourceChunk) {
      return false;
    }

    const sourcePageId = `rad:${chunkIndex}`;
    const sourceHarmonicDegree = Math.min(Math.max(this.source.metadata.maxSh ?? 0, 0), 3);
    const coefficientCount = ((sourceHarmonicDegree + 1) ** 2 - 1) * 3;
    const sourceBytesPerRow = 68 + coefficientCount * Float32Array.BYTES_PER_ELEMENT;
    let arrowSource: LocalGaussianSplatRADPage | undefined;
    const residentChunk = await this.hierarchy.residencyManager.load(
      sourcePageId,
      async () => {
        arrowSource = await this.source.loadPage(chunkIndex, {priority});
        return makeSingleGPUSplatPage(this.device, arrowSource);
      },
      {
        priority,
        estimatedGpuBytes: sourceChunk.count * sourceBytesPerRow,
        estimatedSplatCount: sourceChunk.count,
        ownsData: true
      }
    );
    if (!residentChunk || !arrowSource || this.isDestroyed) {
      return false;
    }

    const {childCounts, childStarts} = arrowSource.loaderData;
    const page: SplatRADHierarchyPage = {
      id: sourcePageId,
      data: residentChunk.data,
      ...(childCounts ? {childCounts} : {}),
      ...(childStarts ? {childStarts} : {}),
      ownsData: true
    };

    if (!this.hierarchy.registerPage(page)) {
      this.hierarchy.residencyManager.remove(sourcePageId);
      return false;
    }

    this.onPageLoad?.(page, this.hierarchy.stats);
    if (this.currentView) {
      this.hierarchy.update(this.currentView);
    }
    this.scheduleDemandRefresh();
    return true;
  }
}

/** Keeps one RAD source page intact and releases every batch on malformed multi-batch input. */
function makeSingleGPUSplatPage(device: Device, source: GPUSplatArrowSource) {
  const batches = makeGPUSplatDataFromArrow(device, source);
  if (batches.length === 1) {
    return batches[0];
  }
  for (const batch of batches) {
    batch.destroy();
  }
  throw new Error('A RAD source page must contain exactly one independent Arrow record batch.');
}

function isRADPageAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
