// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {
  GPURasterTileHaloAssembler,
  GPURasterTileCache,
  GPURasterTileReader,
  type GPURasterTileHaloLease,
  type GPURasterTileGraphLease,
  type GPURasterTileLease,
  type GPURasterTileRequest
} from '@luma.gl/experimental/luraster';
import type {RasterLabDataset} from './raster-data';
import {
  RasterLabEngine,
  type RasterLabGeneratedOverviewSources,
  type RasterLabGlobalSources,
  type RasterLabHaloSources,
  type RasterLabResidentSources,
  type RasterLabSummary
} from './raster-engine';
import {
  RasterLabInterface,
  type RasterLabAnalysisScope,
  type RasterLabCategoryPolicy,
  type RasterLabHaloMode,
  type RasterLabOverviewLevel,
  type RasterLabOverviewPolicy,
  type RasterLabReplayOrder,
  type RasterLabSourceTile
} from './raster-interface';
import type {
  RasterLabComponentConnectivity,
  RasterLabComponentLabelMode,
  RasterLabDisplayMode,
  RasterLabDisplaySettings,
  RasterLabEdgeDirection,
  RasterLabEdgeMode,
  RasterLabMorphologyBorderMode,
  RasterLabMorphologyMode,
  RasterLabMorphologyNoDataPolicy,
  RasterLabMorphologyOperation,
  RasterLabMorphologyShape,
  RasterLabSmoothingMode
} from './raster-renderer';
import {
  makeRasterLabGeneratedOverviewDataset,
  makeRasterLabTileDataset,
  RasterLabTileSource
} from './raster-tile-source';

export const title = 'LuRaster: Satellite Raster Lab';
export const description =
  'Dense GPU-connected components, bounded region counts, global reductions, overviews, and halos.';

type RasterLabDebugController = {
  readonly ready: boolean;
  readonly width: number;
  readonly height: number;
  readonly pixelCount: number;
  readonly validPixelCount: number;
  readonly nodeCount: number;
  readonly frameCount: number;
  readonly executionCount: number;
  readonly sourceTile: RasterLabSourceTile;
  readonly overviewLevel: RasterLabOverviewLevel;
  readonly overviewPolicy: RasterLabOverviewPolicy;
  readonly categoryPolicy: RasterLabCategoryPolicy;
  readonly generatedOverview: boolean;
  readonly overviewSourceDimensions: readonly [number, number];
  readonly overviewCoverage: number;
  readonly tileOrigin: readonly [number, number];
  readonly coordinateReferenceSystem: string;
  readonly tileLoadCount: number;
  readonly sourceReadCount: number;
  readonly abortedTileRequestCount: number;
  readonly sourceLoading: boolean;
  readonly cacheCapacity: number;
  readonly residentTileCount: number;
  readonly residentGraphCount: number;
  readonly residentCpuBytes: number;
  readonly residentGpuBytes: number;
  readonly maximumCpuBytes: number;
  readonly maximumGpuBytes: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly cacheEvictions: number;
  readonly graphCompileCount: number;
  readonly graphReuseCount: number;
  readonly pinnedTileCount: number;
  readonly pinnedGraphCount: number;
  readonly haloEnabled: boolean;
  readonly haloRadius: number;
  readonly haloLevelZeroRadius: readonly [number, number];
  readonly haloCoreBounds: readonly [number, number, number, number];
  readonly haloAvailableBounds: readonly [number, number, number, number];
  readonly haloSourceTileCount: number;
  readonly haloTransferCount: number;
  readonly analysisScope: RasterLabAnalysisScope;
  readonly replayOrder: RasterLabReplayOrder;
  readonly globalTileCount: number;
  readonly globalReplayPassCount: number;
  readonly globalPixelCount: number;
  readonly globalMedian: number | null;
  readonly componentsEnabled: boolean;
  readonly componentConnectivity: RasterLabComponentConnectivity;
  readonly componentLabelMode: RasterLabComponentLabelMode;
  readonly componentCapacity: number;
  readonly componentCount: number;
  readonly componentPublishedCount: number;
  readonly componentOverflow: boolean;
  readonly componentMaximumIterations: number;
  readonly componentIterations: number;
  readonly componentConverged: boolean;
  readonly mode: RasterLabDisplayMode;
  readonly smoothingMode: RasterLabSmoothingMode;
  readonly smoothingRadius: number;
  readonly smoothingSigma: number;
  readonly edgeMode: RasterLabEdgeMode;
  readonly edgeDirection: RasterLabEdgeDirection;
  readonly morphologyOperation: RasterLabMorphologyOperation;
  readonly morphologyMode: RasterLabMorphologyMode;
  readonly morphologyShape: RasterLabMorphologyShape;
  readonly morphologyRadius: number;
  readonly morphologyNoDataPolicy: RasterLabMorphologyNoDataPolicy;
  readonly morphologyBorderMode: RasterLabMorphologyBorderMode;
  readonly morphologyBorderValue: number;
  readonly contrast: number;
  readonly gamma: number;
  readonly threshold: number;
  readonly thresholdEnabled: boolean;
  readonly automaticThreshold: boolean;
  readonly contoursEnabled: boolean;
  readonly contourLevel: number;
  readonly contourSegmentCount: number;
  readonly contourOverflow: boolean;
  readonly domain: readonly [number, number];
  readonly bins: readonly number[];
  readonly sum: number;
  readonly mean: number;
  readonly epsilon: number;
  setSourceTile: (tile: RasterLabSourceTile) => void;
  setSourceOverview: (level: RasterLabOverviewLevel) => void;
  setOverviewPolicy: (policy: RasterLabOverviewPolicy) => void;
  setCategoryPolicy: (policy: RasterLabCategoryPolicy) => void;
  setHaloMode: (mode: RasterLabHaloMode) => void;
  setAnalysisScope: (scope: RasterLabAnalysisScope) => void;
  setReplayOrder: (order: RasterLabReplayOrder) => void;
  setCacheCapacity: (capacity: number) => void;
  setMode: (mode: RasterLabDisplayMode) => void;
  setSmoothingMode: (mode: RasterLabSmoothingMode) => void;
  setSmoothingRadius: (radius: number) => void;
  setSmoothingSigma: (sigma: number) => void;
  setEdgeMode: (mode: RasterLabEdgeMode) => void;
  setEdgeDirection: (direction: RasterLabEdgeDirection) => void;
  setMorphologyOperation: (operation: RasterLabMorphologyOperation) => void;
  setMorphologyMode: (mode: RasterLabMorphologyMode) => void;
  setMorphologyShape: (shape: RasterLabMorphologyShape) => void;
  setMorphologyRadius: (radius: number) => void;
  setMorphologyNoDataPolicy: (policy: RasterLabMorphologyNoDataPolicy) => void;
  setMorphologyBorderMode: (mode: RasterLabMorphologyBorderMode) => void;
  setMorphologyBorderValue: (value: number) => void;
  setComponentsEnabled: (enabled: boolean) => void;
  setComponentConnectivity: (connectivity: RasterLabComponentConnectivity) => void;
  setComponentLabelMode: (mode: RasterLabComponentLabelMode) => void;
  setComponentCapacity: (capacity: number) => void;
  setComponentMaximumIterations: (iterations: number) => void;
  setContrast: (contrast: number) => void;
  setGamma: (gamma: number) => void;
  setThreshold: (threshold: number, enabled?: boolean) => void;
  setAutomaticThreshold: (enabled?: boolean) => void;
  setContours: (enabled?: boolean) => void;
  setContourLevel: (level: number) => void;
  setEpsilon: (epsilon: number) => void;
};

type RasterLabDebugWindow = Window & {__luRasterLab?: RasterLabDebugController};

/** Interactive, validity-aware earth-observation analysis on one GPU-resident command graph. */
export default class RasterLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = '';

  readonly device: Device;

  private readonly rasterSize: readonly [number, number];
  private readonly tileSource: RasterLabTileSource;
  private readonly tileReader: GPURasterTileReader;
  private readonly tileCache: GPURasterTileCache;
  private readonly haloAssembler: GPURasterTileHaloAssembler;
  private readonly display: RasterLabDisplaySettings = {
    mode: 'ndvi',
    smoothingMode: 'none',
    smoothingRadius: 2,
    smoothingSigma: 1.25,
    edgeMode: 'none',
    edgeDirection: 'magnitude',
    morphologyOperation: 'none',
    morphologyMode: 'grayscale',
    morphologyShape: 'square',
    morphologyRadius: 2,
    morphologyNoDataPolicy: 'ignore',
    morphologyBorderMode: 'clamp',
    morphologyBorderValue: 0,
    contrast: 1.15,
    gamma: 1,
    threshold: 0.35,
    thresholdEnabled: false,
    automaticThreshold: false,
    componentsEnabled: false,
    componentConnectivity: 4,
    componentLabelMode: 'sparse',
    componentCapacity: 1024,
    componentMaximumIterations: 24,
    contoursEnabled: true,
    contourLevel: 0.35
  };
  private interface: RasterLabInterface | null = null;
  private engine: RasterLabEngine | null = null;
  private activeTileLease: GPURasterTileLease | null = null;
  private activeHaloLease: GPURasterTileHaloLease | null = null;
  private activeGlobalLeases: readonly GPURasterTileLease[] = [];
  private activeGlobal: RasterLabGlobalSources | null = null;
  private activeOverview: RasterLabGeneratedOverviewSources | null = null;
  private activeGraphLease: GPURasterTileGraphLease<RasterLabEngine> | null = null;
  private activePipelineKey: string | null = null;
  private activeDataset: RasterLabDataset | null = null;
  private latestSummary: RasterLabSummary | null = null;
  private debugController: RasterLabDebugController | null = null;
  private requestedEpsilon: number | null = null;
  private epsilon = 0.0001;
  private updateRequested = false;
  private updateInFlight = false;
  private redrawRequested = true;
  private frameCount = 0;
  private analysisExecutionCount = 0;
  private sourceTile: RasterLabSourceTile = 'full';
  private overviewLevel: RasterLabOverviewLevel = 0;
  private overviewPolicy: RasterLabOverviewPolicy = 'source';
  private categoryPolicy: RasterLabCategoryPolicy = 'nearest';
  private haloMode: RasterLabHaloMode = 'off';
  private analysisScope: RasterLabAnalysisScope = 'tile';
  private replayOrder: RasterLabReplayOrder = 'forward';
  private previousComponentContours = true;
  private cacheCapacity = 3;
  private tileLoadCount = 0;
  private abortedTileRequestCount = 0;
  private sourceRequestGeneration = 0;
  private sourceAbortController: AbortController | null = null;
  private sourceHandoff: Promise<void> | null = null;
  private sourceLoading = false;
  private finalized = false;

  constructor(animationProps: AnimationProps) {
    super(animationProps);
    if (animationProps.device.type !== 'webgpu') {
      throw new Error('LuRaster Satellite Raster Lab requires WebGPU');
    }
    this.device = animationProps.device;
    this.rasterSize = getInitialRasterSize();
    this.tileSource = new RasterLabTileSource(this.rasterSize[0], this.rasterSize[1]);
    this.tileReader = new GPURasterTileReader(this.tileSource);
    this.tileCache = new GPURasterTileCache({
      reader: this.tileReader,
      device: this.device,
      ...this.getCacheBudgets(this.cacheCapacity)
    });
    this.haloAssembler = new GPURasterTileHaloAssembler(this.tileCache);
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'GPU-rendered false-color synthetic vegetation raster');

    this.interface = new RasterLabInterface(canvas.parentElement ?? document.body, canvas, {
      onSourceTile: tile => this.setSourceTile(tile),
      onSourceOverview: level => this.setSourceOverview(level),
      onOverviewPolicy: policy => this.setOverviewPolicy(policy),
      onCategoryPolicy: policy => this.setCategoryPolicy(policy),
      onHaloMode: mode => this.setHaloMode(mode),
      onAnalysisScope: scope => this.setAnalysisScope(scope),
      onReplayOrder: order => this.setReplayOrder(order),
      onCacheCapacity: capacity => this.setCacheCapacity(capacity),
      onMode: mode => this.setMode(mode),
      onSmoothingMode: mode => this.setSmoothingMode(mode),
      onSmoothingRadius: radius => this.setSmoothingRadius(radius),
      onSmoothingSigma: sigma => this.setSmoothingSigma(sigma),
      onEdgeMode: mode => this.setEdgeMode(mode),
      onEdgeDirection: direction => this.setEdgeDirection(direction),
      onMorphologyOperation: operation => this.setMorphologyOperation(operation),
      onMorphologyMode: mode => this.setMorphologyMode(mode),
      onMorphologyShape: shape => this.setMorphologyShape(shape),
      onMorphologyRadius: radius => this.setMorphologyRadius(radius),
      onMorphologyNoDataPolicy: policy => this.setMorphologyNoDataPolicy(policy),
      onMorphologyBorderMode: mode => this.setMorphologyBorderMode(mode),
      onMorphologyBorderValue: value => this.setMorphologyBorderValue(value),
      onComponentsEnabled: enabled => this.setComponentsEnabled(enabled),
      onComponentConnectivity: connectivity => this.setComponentConnectivity(connectivity),
      onComponentLabelMode: mode => this.setComponentLabelMode(mode),
      onComponentCapacity: capacity => this.setComponentCapacity(capacity),
      onComponentMaximumIterations: iterations => this.setComponentMaximumIterations(iterations),
      onContrast: contrast => this.setContrast(contrast),
      onGamma: gamma => this.setGamma(gamma),
      onThreshold: (threshold, enabled) => this.setThreshold(threshold, enabled),
      onAutomaticThreshold: enabled => this.setAutomaticThreshold(enabled),
      onContoursEnabled: enabled => this.setContours(enabled),
      onContourLevel: level => this.setContourLevel(level),
      onEpsilon: epsilon => this.setEpsilon(epsilon),
      onResize: () => {
        this.redrawRequested = true;
      }
    });
    this.publishResidency();
    this.publishHalo();
    this.publishGlobal();
    this.publishOverview();
    this.publishComponents();
    this.interface.setStatus('Loading decoded red and near-infrared source tile');

    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (this.finalized) return;

    try {
      this.installDebugController();
      await this.loadSelectedSourceTile();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.interface?.setStatus(`WebGPU raster analysis unavailable: ${message}`, 'error');
      throw error;
    }
  }

  override onRender({canvasContext}: AnimationProps): void {
    if (
      !this.interface ||
      !this.engine ||
      !this.activeTileLease ||
      !this.activeGraphLease ||
      this.finalized ||
      this.sourceLoading ||
      !this.redrawRequested
    ) {
      return;
    }
    const viewport = this.interface.getMapViewport(canvasContext.getDrawingBufferSize());
    if (viewport.width <= 0 || viewport.height <= 0 || !this.latestSummary) return;
    const settings = this.display.componentsEnabled
      ? {
          ...this.display,
          componentsEnabled:
            this.latestSummary.componentsEnabled &&
            this.latestSummary.componentConverged &&
            (this.display.componentLabelMode === 'sparse' || !this.latestSummary.componentOverflow)
        }
      : this.display;
    this.engine.render(canvasContext, viewport, settings);
    this.redrawRequested = false;
    this.frameCount++;
  }

  override onFinalize(): void {
    this.finalized = true;
    this.sourceAbortController?.abort();
    this.sourceAbortController = null;
    this.interface?.destroy();
    this.interface = null;
    this.releaseAfterSubmittedWork(
      this.activeTileLease,
      this.activeGraphLease,
      this.activeHaloLease,
      this.activeGlobalLeases
    );
    this.activeGraphLease = null;
    this.activeTileLease = null;
    this.activeHaloLease = null;
    this.activeGlobalLeases = [];
    this.activeGlobal = null;
    this.activeOverview = null;
    this.tileCache.destroy();
    this.engine = null;

    if (typeof window !== 'undefined') {
      const debugWindow = window as RasterLabDebugWindow;
      if (debugWindow.__luRasterLab === this.debugController) delete debugWindow.__luRasterLab;
    }
  }

  private setSourceTile(tile: RasterLabSourceTile): void {
    if (tile === this.sourceTile) return;
    if (tile === 'full') this.resetGlobalAnalysis();
    this.sourceTile = tile;
    this.interface?.setSourceTile(tile);
    this.requestSourceTile();
  }

  private setSourceOverview(level: RasterLabOverviewLevel): void {
    if (level === this.overviewLevel) return;
    if (level === 0 && this.overviewPolicy === 'mean') {
      this.overviewPolicy = 'source';
      this.publishOverview();
    }
    this.overviewLevel = level;
    this.interface?.setSourceOverview(level);
    this.requestSourceTile();
  }

  private setOverviewPolicy(policy: RasterLabOverviewPolicy): void {
    if (policy === this.overviewPolicy) return;
    if (policy === 'mean') this.resetGlobalAnalysis();
    if (policy === 'mean' && this.haloMode === 'seamless') {
      this.haloMode = 'off';
      this.publishHalo();
    }
    this.overviewPolicy = policy;
    if (policy === 'mean' && this.overviewLevel === 0) {
      this.overviewLevel = 1;
      this.interface?.setSourceOverview(1);
    }
    this.publishOverview();
    this.requestSourceTile();
  }

  private setCategoryPolicy(policy: RasterLabCategoryPolicy): void {
    if (policy === this.categoryPolicy) return;
    this.categoryPolicy = policy;
    this.publishOverview();
    if (this.overviewPolicy === 'mean' && this.overviewLevel === 1) {
      this.requestSourceTile();
    }
  }

  private setHaloMode(mode: RasterLabHaloMode): void {
    if (mode === this.haloMode) return;
    if (mode === 'seamless') this.resetGlobalAnalysis();
    if (mode === 'seamless' && this.overviewPolicy === 'mean') {
      this.overviewPolicy = 'source';
      this.publishOverview();
    }
    if (mode === 'seamless' && this.cacheCapacity < 2) {
      this.setCacheCapacity(2);
      if (this.cacheCapacity < 2) return;
    }
    this.haloMode = mode;
    this.publishHalo();
    this.requestSourceTile();
  }

  private setAnalysisScope(scope: RasterLabAnalysisScope): void {
    if (scope === this.analysisScope) return;
    if (scope === 'global' && this.cacheCapacity < 2) {
      this.setCacheCapacity(2);
      if (this.cacheCapacity < 2) return;
    }
    if (scope === 'global') {
      if (this.display.componentsEnabled) this.disableComponents();
      if (this.overviewPolicy === 'mean') {
        this.overviewPolicy = 'source';
        this.publishOverview();
      }
      if (this.haloMode === 'seamless') {
        this.haloMode = 'off';
        this.publishHalo();
      }
      if (this.display.smoothingMode !== 'none') {
        this.display.smoothingMode = 'none';
        this.interface?.setSmoothingMode('none');
      }
      if (this.display.edgeMode !== 'none') {
        this.display.edgeMode = 'none';
        this.interface?.setEdgeMode('none');
      }
      if (this.display.morphologyOperation !== 'none') {
        this.display.morphologyOperation = 'none';
        this.interface?.setMorphologyOperation('none');
        this.syncBinaryMorphology();
      }
      if (this.sourceTile === 'full') {
        this.sourceTile = 'west';
        this.interface?.setSourceTile('west');
      }
    }
    this.analysisScope = scope;
    this.publishGlobal();
    this.requestSourceTile();
  }

  private setReplayOrder(order: RasterLabReplayOrder): void {
    if (order === this.replayOrder) return;
    this.replayOrder = order;
    this.publishGlobal();
    if (this.analysisScope === 'global') this.requestSourceTile();
  }

  /** Spatial/generated modes remain fully available by transparently restoring tile scope. */
  private resetGlobalAnalysis(): boolean {
    if (this.analysisScope !== 'global') return false;
    this.analysisScope = 'tile';
    this.publishGlobal();
    return true;
  }

  private setCacheCapacity(capacity: number): void {
    const requestedCapacity = Math.max(1, Math.min(4, Math.round(capacity)));
    if (requestedCapacity === this.cacheCapacity) return;
    if (this.haloMode === 'seamless' && requestedCapacity < 2) {
      this.interface?.setStatus('Seamless tile neighborhoods require two resident source tiles');
      this.publishResidency();
      return;
    }
    if (this.analysisScope === 'global' && requestedCapacity < 2) {
      this.interface?.setStatus('Global raster replay requires two resident source tiles');
      this.publishResidency();
      return;
    }
    try {
      this.tileCache.setBudgets(this.getCacheBudgets(requestedCapacity));
      this.cacheCapacity = requestedCapacity;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.interface?.setStatus(`Raster residency budget unavailable: ${message}`, 'error');
    }
    this.publishResidency();
  }

  private requestSourceTile(): void {
    if (this.finalized) return;
    void this.loadSelectedSourceTile().catch(error => {
      if (this.finalized || isAbortError(error)) return;
      const message = error instanceof Error ? error.message : String(error);
      this.interface?.setStatus(`External raster tile unavailable: ${message}`, 'error');
    });
  }

  private async waitForSourceHandoff(signal: AbortSignal): Promise<void> {
    const handoff = this.sourceHandoff;
    if (handoff) await handoff;
    signal.throwIfAborted();
  }

  private async loadSelectedSourceTile(): Promise<void> {
    if (this.finalized) return;
    if (this.sourceAbortController && !this.sourceAbortController.signal.aborted) {
      this.sourceAbortController.abort();
      this.abortedTileRequestCount++;
    }

    const controller = new AbortController();
    const generation = ++this.sourceRequestGeneration;
    const tile = this.sourceTile;
    const level = this.overviewLevel;
    const global = this.analysisScope === 'global';
    const generatesOverview = this.overviewPolicy === 'mean' && level === 1;
    const sourceLevel = generatesOverview ? 0 : level;
    this.sourceAbortController = controller;
    this.sourceLoading = true;
    this.interface?.setStatus(
      global
        ? `Replaying bounded L${level} WEST and EAST source tiles on the GPU`
        : generatesOverview
          ? `Generating L1 ${tile.toUpperCase()} overview from resident L0 samples`
          : `Loading L${level} ${tile.toUpperCase()} decoded source tile`
    );
    const request: GPURasterTileRequest = {
      level: sourceLevel,
      ...(tile === 'full' ? {} : {column: tile === 'west' ? 0 : 1, row: 0})
    };
    let replacementTileLease: GPURasterTileLease | undefined;
    let replacementHaloLease: GPURasterTileHaloLease | undefined;
    let replacementGlobalLeases: GPURasterTileLease[] | undefined;
    let replacementGraphLease: GPURasterTileGraphLease<RasterLabEngine> | undefined;
    let replacement: RasterLabEngine | undefined;
    let previousDataset: RasterLabDataset | null = null;
    let previousSources: RasterLabResidentSources | null = null;
    let replacementSubmitted = false;
    let committed = false;

    try {
      await this.waitForSourceHandoff(controller.signal);
      controller.signal.throwIfAborted();
      const secondaryRequest: GPURasterTileRequest = {
        level: sourceLevel,
        column: tile === 'west' ? 1 : 0,
        row: 0
      };
      const requestedTiles = global
        ? [
            this.tileReader.normalizeTileRequest(request),
            this.tileReader.normalizeTileRequest(secondaryRequest)
          ]
        : this.haloMode === 'seamless'
          ? this.haloAssembler.plan({...request, stages: this.getHaloStages()}).requests
          : [this.tileReader.normalizeTileRequest(request)];
      const previousTiles =
        this.activeGlobalLeases.length > 0
          ? this.activeGlobalLeases
          : (this.activeHaloLease?.tiles ?? (this.activeTileLease ? [this.activeTileLease] : []));
      const requiredTiles = new Set(
        previousTiles.map(previous => makeRasterSourceKey(previous.decoded))
      );
      for (const requested of requestedTiles) {
        requiredTiles.add(makeRasterSourceKey(requested));
      }

      if (requiredTiles.size > this.cacheCapacity) {
        const previousTileLease = this.activeTileLease;
        const previousHaloLease = this.activeHaloLease;
        const previousGlobalLeases = this.activeGlobalLeases;
        this.activeTileLease = null;
        this.activeHaloLease = null;
        this.activeGlobalLeases = [];
        this.activeGlobal = null;
        const handoff = this.releaseAfterSubmittedWork(
          previousTileLease,
          null,
          previousHaloLease,
          previousGlobalLeases
        );
        this.sourceHandoff = handoff;
        try {
          await handoff;
        } finally {
          if (this.sourceHandoff === handoff) this.sourceHandoff = null;
        }
        controller.signal.throwIfAborted();
      }

      if (global) {
        replacementTileLease = await this.tileCache.acquire(request, controller.signal);
        replacementGlobalLeases = [replacementTileLease];
        replacementGlobalLeases.push(
          await this.tileCache.acquire(secondaryRequest, controller.signal)
        );
      } else if (this.haloMode === 'seamless') {
        replacementHaloLease = await this.haloAssembler.acquire(
          {...request, stages: this.getHaloStages()},
          controller.signal
        );
        replacementTileLease = replacementHaloLease.core;
      } else {
        replacementTileLease = await this.tileCache.acquire(request, controller.signal);
      }
      controller.signal.throwIfAborted();
      if (generation !== this.sourceRequestGeneration || this.finalized) return;
      this.publishResidency();

      while (this.updateInFlight && !controller.signal.aborted && !this.finalized) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      controller.signal.throwIfAborted();
      if (generation !== this.sourceRequestGeneration || this.finalized) return;

      const sources = getResidentSources(replacementTileLease);
      const generatedOverview: RasterLabGeneratedOverviewSources | undefined = generatesOverview
        ? {
            metadata: replacementTileLease.decoded.metadata,
            sources,
            categoryPolicy: this.categoryPolicy
          }
        : undefined;
      const dataset = generatedOverview
        ? makeRasterLabGeneratedOverviewDataset(replacementTileLease.decoded, tile)
        : makeRasterLabTileDataset(replacementTileLease.decoded, tile);
      const haloSources = replacementHaloLease
        ? getResidentHaloSources(replacementHaloLease)
        : undefined;
      const globalSources: RasterLabGlobalSources | undefined = replacementGlobalLeases
        ? {
            tiles: replacementGlobalLeases
              .map(lease => ({
                name: (lease.decoded.column === 0 ? 'west' : 'east') as 'west' | 'east',
                width: lease.decoded.metadata.width,
                height: lease.decoded.metadata.height,
                sources: getResidentSources(lease)
              }))
              .sort(
                (first, second) => Number(first.name === 'east') - Number(second.name === 'east')
              ),
            order: this.replayOrder,
            pixelCount: replacementGlobalLeases.reduce(
              (pixelCount, lease) =>
                pixelCount + lease.decoded.metadata.width * lease.decoded.metadata.height,
              0
            )
          }
        : undefined;
      const requestedEpsilon = this.requestedEpsilon ?? this.epsilon;
      const settings = {...this.display};
      const pipelineKey = makeRasterPipelineKey(
        settings,
        requestedEpsilon,
        haloSources,
        generatedOverview,
        globalSources
      );
      replacementGraphLease = await this.acquireGraphLease(
        replacementTileLease,
        dataset,
        sources,
        settings,
        requestedEpsilon,
        pipelineKey,
        haloSources,
        generatedOverview,
        globalSources
      );
      controller.signal.throwIfAborted();
      if (generation !== this.sourceRequestGeneration || this.finalized) return;
      replacement = replacementGraphLease.value;
      if (replacement === this.engine && this.activeDataset && this.activeTileLease) {
        previousDataset = this.activeDataset;
        previousSources = getResidentSources(this.activeTileLease);
      }
      replacement.setResidentTile(dataset, sources, haloSources, generatedOverview, globalSources);
      replacementSubmitted = true;
      const summary = await replacement.update();
      controller.signal.throwIfAborted();
      if (generation !== this.sourceRequestGeneration || this.finalized) return;

      const previousTileLease = this.activeTileLease;
      const previousGraphLease = this.activeGraphLease;
      const previousHaloLease = this.activeHaloLease;
      const previousGlobalLeases = this.activeGlobalLeases;
      this.engine = replacement;
      this.activeTileLease = replacementTileLease;
      this.activeHaloLease = replacementHaloLease ?? null;
      this.activeGlobalLeases = replacementGlobalLeases ?? [];
      this.activeGlobal = globalSources ?? null;
      this.activeOverview = generatedOverview ?? null;
      this.activeGraphLease = replacementGraphLease;
      this.activePipelineKey = pipelineKey;
      replacementTileLease = undefined;
      replacementHaloLease = undefined;
      replacementGlobalLeases = undefined;
      replacementGraphLease = undefined;
      committed = true;
      this.activeDataset = dataset;
      this.tileLoadCount++;
      this.epsilon = requestedEpsilon;
      if (
        this.requestedEpsilon !== null &&
        Math.abs(this.requestedEpsilon - requestedEpsilon) < 0.0000001
      ) {
        this.requestedEpsilon = null;
      }
      this.interface?.setSource(dataset);
      this.publishHalo();
      this.publishGlobal();
      this.publishOverview();
      this.publishSummary(summary);
      this.releaseAfterSubmittedWork(
        previousTileLease,
        previousGraphLease,
        previousHaloLease,
        previousGlobalLeases
      );
    } finally {
      if (!committed && replacement === this.engine && previousDataset && previousSources) {
        replacement.setResidentTile(
          previousDataset,
          previousSources,
          this.activeHaloLease ? getResidentHaloSources(this.activeHaloLease) : undefined,
          this.activeOverview ?? undefined,
          this.activeGlobal ?? undefined
        );
      }
      if (replacementSubmitted) {
        this.releaseAfterSubmittedWork(
          replacementTileLease ?? null,
          replacementGraphLease ?? null,
          replacementHaloLease ?? null,
          replacementGlobalLeases ?? []
        );
      } else {
        replacementGraphLease?.release();
        if (replacementGlobalLeases?.length) {
          for (const lease of replacementGlobalLeases) lease.release();
        } else if (replacementHaloLease) {
          replacementHaloLease.release();
        } else {
          replacementTileLease?.release();
        }
      }
      if (this.sourceAbortController === controller) {
        this.sourceAbortController = null;
        this.sourceLoading = false;
        this.publishResidency();
        if (this.updateRequested && !this.finalized) this.requestUpdate();
      }
    }
  }

  private async acquireGraphLease(
    tileLease: GPURasterTileLease,
    dataset: RasterLabDataset,
    sources: RasterLabResidentSources,
    settings: RasterLabDisplaySettings,
    epsilon: number,
    pipelineKey: string,
    halo?: RasterLabHaloSources,
    overview?: RasterLabGeneratedOverviewSources,
    global?: RasterLabGlobalSources
  ): Promise<GPURasterTileGraphLease<RasterLabEngine>> {
    return await this.tileCache.acquireGraph(tileLease, {
      pipelineKey,
      halo: halo?.plan.requiredHalo ?? 0,
      estimatedByteLength: estimateRasterGraphBytes(
        global
          ? global.pixelCount
          : halo?.plan.width && halo?.plan.height
            ? halo.plan.width * halo.plan.height
            : dataset.pixelCount
      ),
      create: () => {
        const engine = new RasterLabEngine(
          this.device,
          dataset,
          sources,
          settings,
          epsilon,
          halo,
          overview,
          global
        );
        return {
          graph: engine.commandGraph,
          value: engine,
          byteLength: engine.ownedByteLength,
          destroy: () => engine.destroy()
        };
      }
    });
  }

  private setMode(mode: RasterLabDisplayMode): void {
    if (mode === this.display.mode) return;
    this.display.mode = mode;
    this.interface?.setMode(mode);
    this.requestUpdate();
  }

  private setSmoothingMode(mode: RasterLabSmoothingMode): void {
    if (mode === this.display.smoothingMode) return;
    const reloadSources = mode !== 'none' && this.resetGlobalAnalysis();
    this.display.smoothingMode = mode;
    this.interface?.setSmoothingMode(mode);
    if (reloadSources) this.requestSourceTile();
    else this.requestSpatialUpdate();
  }

  private setSmoothingRadius(radius: number): void {
    if (radius === this.display.smoothingRadius) return;
    this.display.smoothingRadius = radius;
    this.interface?.setSmoothingRadius(radius);
    if (this.display.smoothingMode !== 'none') this.requestSpatialUpdate();
  }

  private setSmoothingSigma(sigma: number): void {
    if (Math.abs(sigma - this.display.smoothingSigma) < 0.0000001) return;
    this.display.smoothingSigma = sigma;
    this.interface?.setSmoothingSigma(sigma);
    if (this.display.smoothingMode === 'gaussian') this.requestUpdate();
  }

  private setEdgeMode(mode: RasterLabEdgeMode): void {
    if (mode === this.display.edgeMode) return;
    const reloadSources = mode !== 'none' && this.resetGlobalAnalysis();
    this.display.edgeMode = mode;
    this.interface?.setEdgeMode(mode);
    if (reloadSources) this.requestSourceTile();
    else this.requestSpatialUpdate();
  }

  private setEdgeDirection(direction: RasterLabEdgeDirection): void {
    if (direction === this.display.edgeDirection) return;
    this.display.edgeDirection = direction;
    this.interface?.setEdgeDirection(direction);
    if (this.display.edgeMode !== 'none' && this.display.edgeMode !== 'laplacian') {
      this.requestUpdate();
    }
  }

  private setMorphologyOperation(operation: RasterLabMorphologyOperation): void {
    if (operation === this.display.morphologyOperation) return;
    const reloadSources = operation !== 'none' && this.resetGlobalAnalysis();
    this.display.morphologyOperation = operation;
    this.interface?.setMorphologyOperation(operation);
    this.syncBinaryMorphology();
    if (reloadSources) this.requestSourceTile();
    else this.requestSpatialUpdate();
  }

  private setMorphologyMode(mode: RasterLabMorphologyMode): void {
    if (mode === this.display.morphologyMode) return;
    this.display.morphologyMode = mode;
    this.interface?.setMorphologyMode(mode);
    this.syncBinaryMorphology();
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyShape(shape: RasterLabMorphologyShape): void {
    if (shape === this.display.morphologyShape) return;
    this.display.morphologyShape = shape;
    this.interface?.setMorphologyShape(shape);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyRadius(radius: number): void {
    if (radius === this.display.morphologyRadius) return;
    this.display.morphologyRadius = radius;
    this.interface?.setMorphologyRadius(radius);
    if (this.display.morphologyOperation !== 'none') this.requestSpatialUpdate();
  }

  private setMorphologyNoDataPolicy(policy: RasterLabMorphologyNoDataPolicy): void {
    if (policy === this.display.morphologyNoDataPolicy) return;
    this.display.morphologyNoDataPolicy = policy;
    this.interface?.setMorphologyNoDataPolicy(policy);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyBorderMode(mode: RasterLabMorphologyBorderMode): void {
    if (mode === this.display.morphologyBorderMode) return;
    this.display.morphologyBorderMode = mode;
    this.interface?.setMorphologyBorderMode(mode);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyBorderValue(value: number): void {
    if (Math.abs(value - this.display.morphologyBorderValue) < 0.0000001) return;
    this.display.morphologyBorderValue = value;
    this.interface?.setMorphologyBorderValue(value);
    if (
      this.display.morphologyOperation !== 'none' &&
      this.display.morphologyBorderMode === 'constant'
    ) {
      this.requestUpdate();
    }
  }

  private setComponentsEnabled(enabled: boolean): void {
    if (enabled === this.display.componentsEnabled) return;
    const reloadSources = enabled && this.resetGlobalAnalysis();
    if (enabled) {
      this.previousComponentContours = this.display.contoursEnabled;
      this.display.componentsEnabled = true;
      this.display.contoursEnabled = false;
      this.display.thresholdEnabled = true;
      this.interface?.setContours(false, this.display.contourLevel);
      this.interface?.setThreshold(this.display.threshold, true);
    } else {
      this.disableComponents();
    }
    this.publishComponents();
    if (reloadSources) this.requestSourceTile();
    else this.requestUpdate();
  }

  private disableComponents(): void {
    if (!this.display.componentsEnabled) return;
    this.display.componentsEnabled = false;
    this.display.contoursEnabled = this.previousComponentContours;
    this.interface?.setContours(this.display.contoursEnabled, this.display.contourLevel);
    this.publishComponents();
  }

  private setComponentConnectivity(connectivity: RasterLabComponentConnectivity): void {
    if (connectivity === this.display.componentConnectivity) return;
    this.display.componentConnectivity = connectivity;
    this.publishComponents();
    if (this.display.componentsEnabled) this.requestUpdate();
  }

  private setComponentLabelMode(mode: RasterLabComponentLabelMode): void {
    if (mode === this.display.componentLabelMode) return;
    this.display.componentLabelMode = mode;
    this.publishComponents();
    if (this.display.componentsEnabled) this.requestUpdate();
  }

  private setComponentCapacity(capacity: number): void {
    const boundedCapacity = Math.max(0, Math.min(2048, Math.round(capacity)));
    if (boundedCapacity === this.display.componentCapacity) return;
    this.display.componentCapacity = boundedCapacity;
    this.publishComponents();
    if (this.display.componentsEnabled) this.requestUpdate();
  }

  private setComponentMaximumIterations(iterations: number): void {
    const maximumIterations = Math.max(1, Math.min(32, Math.round(iterations)));
    if (maximumIterations === this.display.componentMaximumIterations) return;
    this.display.componentMaximumIterations = maximumIterations;
    this.publishComponents();
    if (this.display.componentsEnabled) this.requestUpdate();
  }

  private syncBinaryMorphology(): void {
    const binaryMorphologyEnabled =
      this.display.morphologyOperation !== 'none' && this.display.morphologyMode === 'binary';
    if (binaryMorphologyEnabled && !this.display.thresholdEnabled) {
      this.display.thresholdEnabled = true;
    }
    this.interface?.setThreshold(this.display.threshold, this.display.thresholdEnabled);
    this.interface?.setContours(
      this.display.contoursEnabled,
      binaryMorphologyEnabled ? 0.5 : this.display.contourLevel
    );
  }

  private setContrast(contrast: number): void {
    if (Math.abs(contrast - this.display.contrast) < 0.0000001) return;
    this.display.contrast = contrast;
    this.interface?.setContrast(contrast);
    this.requestUpdate();
  }

  private setGamma(gamma: number): void {
    if (Math.abs(gamma - this.display.gamma) < 0.0000001) return;
    this.display.gamma = gamma;
    this.interface?.setGamma(gamma);
    this.requestUpdate();
  }

  private setThreshold(threshold: number, enabled = true): void {
    if (
      !enabled &&
      (this.display.componentsEnabled ||
        (this.display.morphologyOperation !== 'none' && this.display.morphologyMode === 'binary'))
    ) {
      enabled = true;
    }
    if (
      Math.abs(threshold - this.display.threshold) < 0.0000001 &&
      enabled === this.display.thresholdEnabled &&
      !this.display.automaticThreshold
    ) {
      return;
    }
    this.display.threshold = threshold;
    this.display.thresholdEnabled = enabled;
    this.display.automaticThreshold = false;
    this.interface?.setAutomaticThreshold(false);
    this.interface?.setThreshold(threshold, enabled);
    this.requestUpdate();
  }

  private setAutomaticThreshold(enabled = true): void {
    if (enabled === this.display.automaticThreshold) return;
    this.display.automaticThreshold = enabled;
    this.display.thresholdEnabled = true;
    this.interface?.setAutomaticThreshold(enabled);
    this.interface?.setThreshold(this.display.threshold, true);
    this.requestUpdate();
  }

  private setContours(enabled = true): void {
    const disabledComponents = enabled && this.display.componentsEnabled;
    if (disabledComponents) this.disableComponents();
    if (enabled === this.display.contoursEnabled) {
      if (disabledComponents) this.requestUpdate();
      return;
    }
    this.display.contoursEnabled = enabled;
    this.interface?.setContours(enabled, this.display.contourLevel);
    this.requestUpdate();
  }

  private setContourLevel(level: number): void {
    if (Math.abs(level - this.display.contourLevel) < 0.0000001) return;
    this.display.contourLevel = level;
    this.interface?.setContours(this.display.contoursEnabled, level);
    this.requestUpdate();
  }

  private setEpsilon(epsilon: number): void {
    if (Math.abs(epsilon - (this.requestedEpsilon ?? this.epsilon)) < 0.0000001) return;
    this.requestedEpsilon = epsilon;
    this.interface?.setEpsilon(epsilon);
    this.requestUpdate();
  }

  private getHaloStages(): Array<{requiredHalo: number}> {
    const stages: Array<{requiredHalo: number}> = [];
    if (this.display.smoothingMode !== 'none') {
      stages.push({requiredHalo: this.display.smoothingRadius});
    }
    if (this.display.edgeMode !== 'none') {
      stages.push({requiredHalo: 1});
    }
    if (this.display.morphologyOperation !== 'none') {
      const composed =
        this.display.morphologyOperation === 'open' || this.display.morphologyOperation === 'close';
      stages.push({requiredHalo: this.display.morphologyRadius * (composed ? 2 : 1)});
    }
    return stages;
  }

  private requestSpatialUpdate(): void {
    if (this.haloMode === 'seamless') {
      this.requestSourceTile();
      return;
    }
    this.requestUpdate();
  }

  private requestUpdate(): void {
    if (this.finalized) return;
    this.updateRequested = true;
    if (!this.updateInFlight && !this.sourceLoading) {
      void this.flushUpdates().catch(error => {
        if (this.finalized) return;
        const message = error instanceof Error ? error.message : String(error);
        this.interface?.setStatus(`WebGPU raster analysis unavailable: ${message}`, 'error');
      });
    }
  }

  private async flushUpdates(): Promise<void> {
    if (!this.engine || !this.activeTileLease || !this.activeDataset) return;
    if (this.updateInFlight || this.finalized) return;
    this.updateInFlight = true;

    try {
      while (this.updateRequested && !this.finalized && !this.sourceLoading) {
        this.updateRequested = false;
        const requestedEpsilon = this.requestedEpsilon ?? this.epsilon;
        this.requestedEpsilon = null;
        const settings = {...this.display};
        const haloSources = this.activeHaloLease
          ? getResidentHaloSources(this.activeHaloLease)
          : undefined;
        const overviewSources = this.activeOverview ?? undefined;
        const globalSources = this.activeGlobal ?? undefined;
        const pipelineKey = makeRasterPipelineKey(
          settings,
          requestedEpsilon,
          haloSources,
          overviewSources,
          globalSources
        );
        const activeTileLease = this.activeTileLease;
        const activeDataset = this.activeDataset;
        if (!activeTileLease || !activeDataset || !this.engine) return;

        let replacementGraphLease: GPURasterTileGraphLease<RasterLabEngine> | undefined;
        let replacementSubmitted = false;
        try {
          if (pipelineKey !== this.activePipelineKey) {
            const sources = getResidentSources(activeTileLease);
            replacementGraphLease = await this.acquireGraphLease(
              activeTileLease,
              activeDataset,
              sources,
              settings,
              requestedEpsilon,
              pipelineKey,
              haloSources,
              overviewSources,
              globalSources
            );
            replacementGraphLease.value.setResidentTile(
              activeDataset,
              sources,
              haloSources,
              overviewSources,
              globalSources
            );
          }

          const engine: RasterLabEngine = replacementGraphLease?.value ?? this.engine;
          replacementSubmitted = Boolean(replacementGraphLease);
          const summary = await engine.update();
          if (this.finalized) return;

          if (replacementGraphLease) {
            const previousGraphLease = this.activeGraphLease;
            this.engine = engine;
            this.activeGraphLease = replacementGraphLease;
            this.activePipelineKey = pipelineKey;
            replacementGraphLease = undefined;
            await this.releaseAfterSubmittedWork(null, previousGraphLease);
          }
          this.epsilon = requestedEpsilon;
          this.publishSummary(summary);
        } finally {
          if (replacementGraphLease && replacementSubmitted) {
            this.releaseAfterSubmittedWork(null, replacementGraphLease);
          } else {
            replacementGraphLease?.release();
          }
        }
      }
    } finally {
      this.updateInFlight = false;
    }
  }

  private publishSummary(summary: RasterLabSummary): void {
    const publishedSummary = {...summary, executionCount: ++this.analysisExecutionCount};
    this.latestSummary = publishedSummary;
    if (this.activeOverview && this.activeDataset) {
      this.activeDataset.cloudPixelCount = Math.max(
        this.activeDataset.pixelCount - publishedSummary.validPixelCount,
        0
      );
      this.interface?.setSource(this.activeDataset);
    }
    this.publishGlobal();
    this.interface?.setSummary(publishedSummary);
    this.publishComponents();
    this.interface?.setStatus(
      `${publishedSummary.nodeCount} GPU graph passes · ${this.tileCache.stats.residentTiles} bounded resident tiles`,
      'ready'
    );
    this.publishOverview();
    this.publishResidency();
    this.redrawRequested = true;
  }

  private releaseAfterSubmittedWork(
    tileLease: GPURasterTileLease | null,
    graphLease: GPURasterTileGraphLease<RasterLabEngine> | null,
    haloLease: GPURasterTileHaloLease | null = null,
    globalLeases: readonly GPURasterTileLease[] = []
  ): Promise<void> {
    if (!tileLease && !graphLease && !haloLease && globalLeases.length === 0) {
      return Promise.resolve();
    }
    const fence = this.device.createFence();
    const releases: Array<Promise<void>> = [];
    if (graphLease) releases.push(graphLease.releaseAfter(fence));
    if (globalLeases.length > 0) {
      for (const lease of globalLeases) releases.push(lease.releaseAfter(fence));
    } else if (haloLease) {
      releases.push(haloLease.releaseAfter(fence));
    } else if (tileLease) {
      releases.push(tileLease.releaseAfter(fence));
    }
    return Promise.all(releases)
      .then(() => {
        if (!this.finalized) this.publishResidency();
      })
      .catch(error => {
        if (this.finalized) return;
        const message = error instanceof Error ? error.message : String(error);
        this.interface?.setStatus(`WebGPU raster completion unavailable: ${message}`, 'error');
      });
  }

  private publishHalo(): void {
    if (!this.interface || this.finalized) return;
    const activePlan = this.activeHaloLease?.plan;
    const coreBounds = activePlan?.corePixelBounds ??
      this.activeTileLease?.decoded.pixelBounds ?? [0, 0, this.rasterSize[0], this.rasterSize[1]];
    this.interface.setHalo({
      mode: this.haloMode,
      radius: activePlan?.requiredHalo ?? 0,
      levelZeroRadius: activePlan?.levelZeroHalo ?? [0, 0],
      coreBounds,
      availableBounds: activePlan?.availablePixelBounds ?? coreBounds,
      sourceTileCount: this.activeHaloLease?.tiles.length ?? Number(Boolean(this.activeTileLease))
    });
  }

  private publishGlobal(): void {
    if (!this.interface || this.finalized) return;
    const levelWidth = Math.ceil(this.rasterSize[0] / 2 ** this.overviewLevel);
    const levelHeight = Math.ceil(this.rasterSize[1] / 2 ** this.overviewLevel);
    this.interface.setGlobalAnalysis({
      scope: this.analysisScope,
      order: this.replayOrder,
      tileCount: this.activeGlobalLeases.length,
      replayPassCount: this.activeGlobal ? (this.display.automaticThreshold ? 6 : 3) : 0,
      pixelCount: this.activeGlobal?.pixelCount ?? levelWidth * levelHeight,
      domain: this.latestSummary?.domain ?? [0, 0],
      validPixelCount: this.latestSummary?.validPixelCount ?? 0,
      threshold: this.latestSummary?.threshold ?? this.display.threshold,
      automaticThreshold: this.display.automaticThreshold,
      median: this.latestSummary?.globalMedian ?? null
    });
  }

  private publishComponents(): void {
    if (!this.interface || this.finalized) return;
    const summary = this.latestSummary;
    this.interface.setComponents({
      enabled: this.display.componentsEnabled,
      connectivity: this.display.componentConnectivity,
      labelMode: this.display.componentLabelMode,
      capacity: this.display.componentCapacity,
      componentCount: summary?.componentsEnabled ? summary.componentCount : 0,
      publishedCount: summary?.componentsEnabled ? summary.componentPublishedCount : 0,
      overflow: summary?.componentsEnabled ? summary.componentOverflow : false,
      maximumIterations: this.display.componentMaximumIterations,
      iterations: summary?.componentsEnabled ? summary.componentIterations : 0,
      converged: summary?.componentsEnabled ? summary.componentConverged : false,
      foregroundPixelCount: summary?.validPixelCount ?? 0
    });
  }

  private publishOverview(): void {
    if (!this.interface || this.finalized) return;
    const dataset = this.activeDataset;
    this.interface.setOverviewProcessing({
      policy: this.overviewPolicy,
      categoryPolicy: this.categoryPolicy,
      level: dataset?.overviewLevel ?? this.overviewLevel,
      generated: Boolean(this.activeOverview),
      sourceWidth: this.activeOverview?.metadata.width ?? dataset?.width ?? this.rasterSize[0],
      sourceHeight: this.activeOverview?.metadata.height ?? dataset?.height ?? this.rasterSize[1],
      targetWidth: dataset?.width ?? this.rasterSize[0],
      targetHeight: dataset?.height ?? this.rasterSize[1],
      validPixelCount: this.latestSummary?.validPixelCount ?? 0
    });
  }

  private publishResidency(): void {
    if (!this.interface || this.finalized) return;
    const stats = this.tileCache.stats;
    const budgets = this.tileCache.budgets;
    this.interface.setResidency({
      capacity: budgets.maxTiles,
      maximumCpuBytes: budgets.maxCpuBytes,
      maximumGpuBytes: budgets.maxGpuBytes,
      residentTiles: stats.residentTiles,
      residentGraphs: stats.residentGraphs,
      cpuBytes: stats.cpuBytes,
      gpuBytes: stats.gpuBytes,
      tileHits: stats.tileHits,
      tileMisses: stats.tileMisses,
      tileEvictions: stats.tileEvictions,
      graphHits: stats.graphHits,
      graphCompilations: stats.graphCompilations,
      pinnedTiles: stats.pinnedTiles,
      pinnedGraphs: stats.pinnedGraphs
    });
  }

  private getCacheBudgets(capacity: number): {
    maxTiles: number;
    maxGraphs: number;
    maxCpuBytes: number;
    maxGpuBytes: number;
  } {
    const maximumPixelCount = this.rasterSize[0] * this.rasterSize[1];
    const maximumTileBytes = maximumPixelCount * Uint32Array.BYTES_PER_ELEMENT * 3;
    return {
      maxTiles: capacity,
      maxGraphs: 2,
      maxCpuBytes: maximumTileBytes * capacity,
      maxGpuBytes: estimateRasterGraphBytes(maximumPixelCount) * 2 + maximumTileBytes * capacity
    };
  }

  private installDebugController(): void {
    if (typeof window === 'undefined') return;
    const viewer = this;
    this.debugController = {
      get ready() {
        return viewer.latestSummary !== null;
      },
      get width() {
        return viewer.activeDataset?.width ?? viewer.rasterSize[0];
      },
      get height() {
        return viewer.activeDataset?.height ?? viewer.rasterSize[1];
      },
      get pixelCount() {
        return viewer.activeDataset?.pixelCount ?? viewer.rasterSize[0] * viewer.rasterSize[1];
      },
      get validPixelCount() {
        return viewer.latestSummary?.validPixelCount ?? 0;
      },
      get nodeCount() {
        return viewer.latestSummary?.nodeCount ?? 0;
      },
      get frameCount() {
        return viewer.frameCount;
      },
      get executionCount() {
        return viewer.analysisExecutionCount;
      },
      get sourceTile() {
        return viewer.activeDataset?.tile ?? viewer.sourceTile;
      },
      get overviewLevel() {
        return viewer.activeDataset?.overviewLevel ?? viewer.overviewLevel;
      },
      get overviewPolicy() {
        return viewer.overviewPolicy;
      },
      get categoryPolicy() {
        return viewer.categoryPolicy;
      },
      get generatedOverview() {
        return Boolean(viewer.activeOverview);
      },
      get overviewSourceDimensions(): readonly [number, number] {
        return viewer.activeOverview
          ? [viewer.activeOverview.metadata.width, viewer.activeOverview.metadata.height]
          : [
              viewer.activeDataset?.width ?? viewer.rasterSize[0],
              viewer.activeDataset?.height ?? viewer.rasterSize[1]
            ];
      },
      get overviewCoverage() {
        return (
          (viewer.latestSummary?.validPixelCount ?? 0) /
          Math.max(viewer.activeGlobal?.pixelCount ?? viewer.activeDataset?.pixelCount ?? 1, 1)
        );
      },
      get tileOrigin() {
        return viewer.activeDataset?.levelZeroOrigin ?? [0, 0];
      },
      get coordinateReferenceSystem() {
        return viewer.activeDataset?.coordinateReferenceSystem ?? 'EPSG:32610';
      },
      get tileLoadCount() {
        return viewer.tileLoadCount;
      },
      get sourceReadCount() {
        return viewer.tileSource.readCount;
      },
      get abortedTileRequestCount() {
        return viewer.abortedTileRequestCount;
      },
      get sourceLoading() {
        return viewer.sourceLoading;
      },
      get cacheCapacity() {
        return viewer.cacheCapacity;
      },
      get residentTileCount() {
        return viewer.tileCache.stats.residentTiles;
      },
      get residentGraphCount() {
        return viewer.tileCache.stats.residentGraphs;
      },
      get residentCpuBytes() {
        return viewer.tileCache.stats.cpuBytes;
      },
      get residentGpuBytes() {
        return viewer.tileCache.stats.gpuBytes;
      },
      get maximumCpuBytes() {
        return viewer.tileCache.budgets.maxCpuBytes;
      },
      get maximumGpuBytes() {
        return viewer.tileCache.budgets.maxGpuBytes;
      },
      get cacheHits() {
        return viewer.tileCache.stats.tileHits;
      },
      get cacheMisses() {
        return viewer.tileCache.stats.tileMisses;
      },
      get cacheEvictions() {
        return viewer.tileCache.stats.tileEvictions;
      },
      get graphCompileCount() {
        return viewer.tileCache.stats.graphCompilations;
      },
      get graphReuseCount() {
        return viewer.tileCache.stats.graphHits;
      },
      get pinnedTileCount() {
        return viewer.tileCache.stats.pinnedTiles;
      },
      get pinnedGraphCount() {
        return viewer.tileCache.stats.pinnedGraphs;
      },
      get haloEnabled() {
        return viewer.haloMode === 'seamless';
      },
      get haloRadius() {
        return viewer.activeHaloLease?.plan.requiredHalo ?? 0;
      },
      get haloLevelZeroRadius() {
        return viewer.activeHaloLease?.plan.levelZeroHalo ?? [0, 0];
      },
      get haloCoreBounds() {
        return (
          viewer.activeHaloLease?.plan.corePixelBounds ??
          viewer.activeTileLease?.decoded.pixelBounds ?? [0, 0, 0, 0]
        );
      },
      get haloAvailableBounds() {
        return (
          viewer.activeHaloLease?.plan.availablePixelBounds ??
          viewer.activeTileLease?.decoded.pixelBounds ?? [0, 0, 0, 0]
        );
      },
      get haloSourceTileCount() {
        return viewer.activeHaloLease?.tiles.length ?? Number(Boolean(viewer.activeTileLease));
      },
      get haloTransferCount() {
        if (!viewer.activeHaloLease) return 0;
        const binaryMorphology =
          viewer.display.morphologyOperation !== 'none' &&
          viewer.display.morphologyMode === 'binary';
        return viewer.activeHaloLease.tiles.length * 2 + 1 + Number(binaryMorphology);
      },
      get analysisScope() {
        return viewer.analysisScope;
      },
      get replayOrder() {
        return viewer.replayOrder;
      },
      get globalTileCount() {
        return viewer.activeGlobalLeases.length;
      },
      get globalReplayPassCount() {
        return viewer.activeGlobal ? (viewer.display.automaticThreshold ? 6 : 3) : 0;
      },
      get globalPixelCount() {
        return viewer.activeGlobal?.pixelCount ?? 0;
      },
      get globalMedian() {
        return viewer.latestSummary?.globalMedian ?? null;
      },
      get componentsEnabled() {
        return viewer.display.componentsEnabled;
      },
      get componentConnectivity() {
        return viewer.display.componentConnectivity;
      },
      get componentLabelMode() {
        return viewer.display.componentLabelMode;
      },
      get componentCapacity() {
        return viewer.display.componentCapacity;
      },
      get componentCount() {
        return viewer.latestSummary?.componentCount ?? 0;
      },
      get componentPublishedCount() {
        return viewer.latestSummary?.componentPublishedCount ?? 0;
      },
      get componentOverflow() {
        return viewer.latestSummary?.componentOverflow ?? false;
      },
      get componentMaximumIterations() {
        return viewer.display.componentMaximumIterations;
      },
      get componentIterations() {
        return viewer.latestSummary?.componentIterations ?? 0;
      },
      get componentConverged() {
        return viewer.latestSummary?.componentConverged ?? false;
      },
      get mode() {
        return viewer.display.mode;
      },
      get smoothingMode() {
        return viewer.display.smoothingMode;
      },
      get smoothingRadius() {
        return viewer.display.smoothingRadius;
      },
      get smoothingSigma() {
        return viewer.display.smoothingSigma;
      },
      get edgeMode() {
        return viewer.display.edgeMode;
      },
      get edgeDirection() {
        return viewer.display.edgeDirection;
      },
      get morphologyOperation() {
        return viewer.display.morphologyOperation;
      },
      get morphologyMode() {
        return viewer.display.morphologyMode;
      },
      get morphologyShape() {
        return viewer.display.morphologyShape;
      },
      get morphologyRadius() {
        return viewer.display.morphologyRadius;
      },
      get morphologyNoDataPolicy() {
        return viewer.display.morphologyNoDataPolicy;
      },
      get morphologyBorderMode() {
        return viewer.display.morphologyBorderMode;
      },
      get morphologyBorderValue() {
        return viewer.display.morphologyBorderValue;
      },
      get contrast() {
        return viewer.display.contrast;
      },
      get gamma() {
        return viewer.display.gamma;
      },
      get threshold() {
        return viewer.latestSummary?.threshold ?? viewer.display.threshold;
      },
      get thresholdEnabled() {
        return viewer.display.thresholdEnabled;
      },
      get automaticThreshold() {
        return viewer.display.automaticThreshold;
      },
      get contoursEnabled() {
        return viewer.display.contoursEnabled;
      },
      get contourLevel() {
        return viewer.latestSummary?.contourLevel ?? viewer.display.contourLevel;
      },
      get contourSegmentCount() {
        return viewer.latestSummary?.contourSegmentCount ?? 0;
      },
      get contourOverflow() {
        return viewer.latestSummary?.contourOverflow ?? false;
      },
      get domain() {
        return viewer.latestSummary?.domain ?? [0, 0];
      },
      get bins() {
        return Array.from(viewer.latestSummary?.bins ?? []);
      },
      get sum() {
        return viewer.latestSummary?.sum ?? 0;
      },
      get mean() {
        return viewer.latestSummary?.mean ?? 0;
      },
      get epsilon() {
        return viewer.epsilon;
      },
      setSourceTile: tile => viewer.setSourceTile(tile),
      setSourceOverview: level => viewer.setSourceOverview(level),
      setOverviewPolicy: policy => viewer.setOverviewPolicy(policy),
      setCategoryPolicy: policy => viewer.setCategoryPolicy(policy),
      setHaloMode: mode => viewer.setHaloMode(mode),
      setAnalysisScope: scope => viewer.setAnalysisScope(scope),
      setReplayOrder: order => viewer.setReplayOrder(order),
      setCacheCapacity: capacity => viewer.setCacheCapacity(capacity),
      setMode: mode => viewer.setMode(mode),
      setSmoothingMode: mode => viewer.setSmoothingMode(mode),
      setSmoothingRadius: radius => viewer.setSmoothingRadius(radius),
      setSmoothingSigma: sigma => viewer.setSmoothingSigma(sigma),
      setEdgeMode: mode => viewer.setEdgeMode(mode),
      setEdgeDirection: direction => viewer.setEdgeDirection(direction),
      setMorphologyOperation: operation => viewer.setMorphologyOperation(operation),
      setMorphologyMode: mode => viewer.setMorphologyMode(mode),
      setMorphologyShape: shape => viewer.setMorphologyShape(shape),
      setMorphologyRadius: radius => viewer.setMorphologyRadius(radius),
      setMorphologyNoDataPolicy: policy => viewer.setMorphologyNoDataPolicy(policy),
      setMorphologyBorderMode: mode => viewer.setMorphologyBorderMode(mode),
      setMorphologyBorderValue: value => viewer.setMorphologyBorderValue(value),
      setComponentsEnabled: enabled => viewer.setComponentsEnabled(enabled),
      setComponentConnectivity: connectivity => viewer.setComponentConnectivity(connectivity),
      setComponentLabelMode: mode => viewer.setComponentLabelMode(mode),
      setComponentCapacity: capacity => viewer.setComponentCapacity(capacity),
      setComponentMaximumIterations: iterations => viewer.setComponentMaximumIterations(iterations),
      setContrast: contrast => viewer.setContrast(contrast),
      setGamma: gamma => viewer.setGamma(gamma),
      setThreshold: (threshold, enabled) => viewer.setThreshold(threshold, enabled),
      setAutomaticThreshold: enabled => viewer.setAutomaticThreshold(enabled),
      setContours: enabled => viewer.setContours(enabled),
      setContourLevel: level => viewer.setContourLevel(level),
      setEpsilon: epsilon => viewer.setEpsilon(epsilon)
    };
    (window as RasterLabDebugWindow).__luRasterLab = this.debugController!;
  }
}

function getResidentSources(tileLease: GPURasterTileLease): RasterLabResidentSources {
  const red = tileLease.bands.find(band => band.id === 'red');
  const nearInfrared = tileLease.bands.find(band => band.id === 'near-infrared');
  const validity = red?.validity ?? nearInfrared?.validity;
  if (
    !red ||
    !nearInfrared ||
    red.format !== 'float32' ||
    nearInfrared.format !== 'float32' ||
    !validity
  ) {
    throw new Error('Raster analysis requires resident float reflectance and shared validity');
  }
  return {red: red.buffer, nearInfrared: nearInfrared.buffer, validity};
}

function getResidentHaloSources(lease: GPURasterTileHaloLease): RasterLabHaloSources {
  return {
    plan: lease.plan,
    tiles: lease.tiles.map(tile => ({
      pixelBounds: tile.decoded.pixelBounds,
      sources: getResidentSources(tile)
    }))
  };
}

function makeRasterSourceKey(source: {
  level: number;
  pixelBounds?: readonly [number, number, number, number];
}): string {
  return `${source.level}:${source.pixelBounds?.join(',') ?? 'full'}`;
}

function makeRasterPipelineKey(
  settings: RasterLabDisplaySettings,
  epsilon: number,
  halo?: RasterLabHaloSources,
  overview?: RasterLabGeneratedOverviewSources,
  global?: RasterLabGlobalSources
): string {
  return JSON.stringify({
    ...settings,
    epsilon,
    ...(halo
      ? {
          halo: {
            availableBounds: halo.plan.availablePixelBounds,
            coreBounds: halo.plan.corePixelBounds,
            sourceBounds: halo.tiles.map(tile => tile.pixelBounds)
          }
        }
      : {}),
    ...(overview
      ? {
          overview: {
            categoryPolicy: overview.categoryPolicy,
            sourceWidth: overview.metadata.width,
            sourceHeight: overview.metadata.height
          }
        }
      : {}),
    ...(global
      ? {
          global: {
            order: global.order,
            tiles: global.tiles.map(tile => ({
              name: tile.name,
              width: tile.width,
              height: tile.height
            }))
          }
        }
      : {})
  });
}

function estimateRasterGraphBytes(pixelCount: number): number {
  // Covers output/indirect records plus every physically allocated graph scratch buffer.
  return pixelCount * 256 + 65_536;
}

function getInitialRasterSize(): readonly [number, number] {
  if (typeof window === 'undefined') return [768, 512];
  return new URLSearchParams(window.location.search).has('visual-smoke') ? [320, 224] : [768, 512];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
