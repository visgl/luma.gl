// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';

export const NYC_EPT_URL =
  'https://s3-us-west-2.amazonaws.com/usgs-lidar-public/NY_NewYorkCity/ept.json';

export type EPTMetadata = {
  bounds: [number, number, number, number, number, number];
  boundsConforming?: [number, number, number, number, number, number];
  dataType: string;
  hierarchyType: string;
  points: number;
  span: number;
  version: string;
};

export type EPTLoadProgress = {
  downloadedTileCount: number;
  decodedPointCount: number;
  targetPointCount: number;
};

export type EPTPointBatch = {
  positions: Float32Array;
  attributes: Uint32Array;
  pointCount: number;
  downloadedTileCount: number;
  metadata: EPTMetadata;
};

export type EPTPointTile = {
  key: string;
  positions: Float32Array;
  attributes: Uint32Array;
  pointCount: number;
  /** Number of LAZ points decoded before applying the resident selection limit. */
  decodedPointCount: number;
};

export type EPTTileSelection = {
  key: string;
  /** Point count advertised by the EPT hierarchy. */
  pointCount: number;
  /** Maximum rows retained from this tile in the bounded resident selection. */
  pointLimit: number;
};

type EPTNode = {
  key: string;
  pointCount: number;
  depth: number;
  x: number;
  y: number;
  z: number;
};

/** Decoded LAZ attribute surface consumed by {@link NYCEPTTileSource}. */
export type EPTLASMesh = {
  attributes?: {
    POSITION?: {value?: Float32Array | Float64Array} | Float32Array | Float64Array;
    intensity?: {value?: Uint16Array} | Uint16Array;
    classification?: {value?: Uint8Array} | Uint8Array;
  };
};

/** Injectable EPT I/O boundary used by deterministic consumers and tests. */
export type EPTSourceAdapter = {
  fetchJSON: (url: string | URL, signal?: AbortSignal) => Promise<unknown>;
  loadLASMesh: (url: string | URL, signal?: AbortSignal) => Promise<EPTLASMesh>;
};

export type NYCEPTTileSourceOptions = {
  /** EPT metadata document. Hierarchy and LAZ paths are resolved relative to this URL. */
  metadataUrl?: string | URL;
  /** Optional transport and decoder implementation. */
  adapter?: EPTSourceAdapter;
};

const DEFAULT_EPT_SOURCE_ADAPTER: EPTSourceAdapter = {
  fetchJSON,
  async loadLASMesh(url, signal) {
    return (await load(String(url), LASLoader, {
      fetch: {signal},
      las: {shape: 'mesh', fp64: true}
    })) as EPTLASMesh;
  }
};

/**
 * Reusable NYC EPT hierarchy and LAZ source.
 *
 * Hierarchy pages are retained between selections. Each selection is ordered around a local
 * display-space focus, allowing a bounded tile cache to be refreshed as the query moves without
 * rebuilding or downloading the hierarchy from scratch.
 */
export class NYCEPTTileSource {
  readonly metadata: EPTMetadata;

  private readonly root: URL;
  private readonly adapter: EPTSourceAdapter;
  private readonly nodes = new Map<string, EPTNode>();
  private readonly pendingHierarchyKeys = new Set<string>();
  private readonly loadedHierarchyKeys = new Set<string>();

  private constructor(metadata: EPTMetadata, metadataUrl: string | URL, adapter: EPTSourceAdapter) {
    this.metadata = metadata;
    this.root = new URL('.', metadataUrl);
    this.adapter = adapter;
  }

  static async create(
    signal?: AbortSignal,
    options: NYCEPTTileSourceOptions = {}
  ): Promise<NYCEPTTileSource> {
    signal?.throwIfAborted();
    const metadataUrl = options.metadataUrl ?? NYC_EPT_URL;
    const adapter = options.adapter ?? DEFAULT_EPT_SOURCE_ADAPTER;
    const metadata = (await adapter.fetchJSON(metadataUrl, signal)) as EPTMetadata;
    signal?.throwIfAborted();
    const source = new NYCEPTTileSource(metadata, metadataUrl, adapter);
    await source.loadHierarchy('0-0-0-0', signal);
    return source;
  }

  /** Selects a capacity-bounded set of nodes nearest a local normalized XY focus. */
  async selectTiles(
    targetPointCount: number,
    focus: readonly [number, number],
    signal?: AbortSignal
  ): Promise<EPTTileSelection[]> {
    signal?.throwIfAborted();
    if (!Number.isSafeInteger(targetPointCount) || targetPointCount <= 0) {
      throw new Error('EPT targetPointCount must be a positive integer');
    }

    // Expanding a few nearby hierarchy pages on each refresh progressively improves spatial
    // locality without downloading the complete multi-billion-point hierarchy.
    for (let expansion = 0; expansion < 4; expansion++) {
      const nearestHierarchyKey = this.getNearestPendingHierarchyKey(focus);
      if (!nearestHierarchyKey) break;
      await this.loadHierarchy(nearestHierarchyKey, signal);
    }

    const orderedNodes = [...this.nodes.values()].sort(
      (left, right) =>
        getNodeDistanceSquared(left, focus, this.metadata) -
          getNodeDistanceSquared(right, focus, this.metadata) ||
        left.depth - right.depth ||
        left.key.localeCompare(right.key)
    );
    const selection: EPTTileSelection[] = [];
    let remainingPointCount = targetPointCount;
    for (const node of orderedNodes) {
      if (remainingPointCount <= 0) break;
      const pointLimit = Math.min(node.pointCount, remainingPointCount);
      selection.push({key: node.key, pointCount: node.pointCount, pointLimit});
      remainingPointCount -= pointLimit;
    }
    return selection;
  }

  /** Downloads and decodes one selected LAZ node. */
  async loadTile(selection: EPTTileSelection, signal?: AbortSignal): Promise<EPTPointTile> {
    signal?.throwIfAborted();
    const mesh = await this.adapter.loadLASMesh(
      new URL(`ept-data/${selection.key}.laz`, this.root),
      signal
    );
    signal?.throwIfAborted();
    const source = getPositionValues(mesh);
    const decodedPointCount = Math.floor(source.length / 3);
    const pointCount = Math.min(decodedPointCount, selection.pointLimit);
    const positions = new Float32Array(pointCount * 3);
    normalizeEPTPositions(
      source,
      positions,
      0,
      pointCount,
      this.metadata.boundsConforming ?? this.metadata.bounds
    );
    return {
      key: selection.key,
      positions,
      attributes: packPointAttributes(mesh, pointCount),
      pointCount,
      decodedPointCount
    };
  }

  private async loadHierarchy(key: string, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    if (this.loadedHierarchyKeys.has(key)) return;
    const hierarchy = (await this.adapter.fetchJSON(
      new URL(`ept-hierarchy/${key}.json`, this.root),
      signal
    )) as Record<string, number>;
    signal?.throwIfAborted();
    this.loadedHierarchyKeys.add(key);
    this.pendingHierarchyKeys.delete(key);
    for (const [nodeKey, pointCount] of Object.entries(hierarchy)) {
      if (pointCount === -1) {
        if (!this.loadedHierarchyKeys.has(nodeKey)) this.pendingHierarchyKeys.add(nodeKey);
      } else if (pointCount > 0) {
        this.nodes.set(nodeKey, makeEPTNode(nodeKey, pointCount));
      }
    }
  }

  private getNearestPendingHierarchyKey(focus: readonly [number, number]): string | undefined {
    return [...this.pendingHierarchyKeys].sort((leftKey, rightKey) => {
      const left = makeEPTNode(leftKey, 0);
      const right = makeEPTNode(rightKey, 0);
      return (
        getNodeDistanceSquared(left, focus, this.metadata) -
          getNodeDistanceSquared(right, focus, this.metadata) || leftKey.localeCompare(rightKey)
      );
    })[0];
  }
}

/** Creates a reusable source whose hierarchy cache survives repeated spatial refreshes. */
export async function createNYCEPTTileSource(
  signal?: AbortSignal,
  options?: NYCEPTTileSourceOptions
): Promise<NYCEPTTileSource> {
  return NYCEPTTileSource.create(signal, options);
}

/** Loads enough independently addressable EPT LAZ nodes to fill a resident GPU window. */
export async function loadNYCEPTPointBatch(
  targetPointCount: number,
  onProgress?: (progress: EPTLoadProgress) => void,
  signal?: AbortSignal,
  onTile?: (tile: EPTPointTile) => void
): Promise<EPTPointBatch> {
  const source = await createNYCEPTTileSource(signal);
  const metadata = source.metadata;
  const nodes = await source.selectTiles(targetPointCount, [0, 0], signal);
  const output = new Float32Array(targetPointCount * 3);
  const outputAttributes = new Uint32Array(targetPointCount);
  let outputPointCount = 0;
  let downloadedTileCount = 0;

  for (const selection of nodes) {
    if (outputPointCount >= targetPointCount) {
      break;
    }
    signal?.throwIfAborted();
    const tile = await source.loadTile(
      {
        ...selection,
        pointLimit: Math.min(selection.pointLimit, targetPointCount - outputPointCount)
      },
      signal
    );
    output.set(tile.positions, outputPointCount * 3);
    outputAttributes.set(tile.attributes, outputPointCount);
    onTile?.(tile);
    outputPointCount += tile.pointCount;
    downloadedTileCount++;
    onProgress?.({downloadedTileCount, decodedPointCount: outputPointCount, targetPointCount});
  }

  return {
    positions:
      outputPointCount === targetPointCount ? output : output.slice(0, outputPointCount * 3),
    attributes:
      outputPointCount === targetPointCount
        ? outputAttributes
        : outputAttributes.slice(0, outputPointCount),
    pointCount: outputPointCount,
    downloadedTileCount,
    metadata
  };
}

function packPointAttributes(mesh: EPTLASMesh, pointCount: number): Uint32Array {
  const intensity = getScalarValues(mesh.attributes?.intensity, Uint16Array);
  const classification = getScalarValues(mesh.attributes?.classification, Uint8Array);
  const output = new Uint32Array(pointCount);
  for (let index = 0; index < pointCount; index++) {
    output[index] = ((intensity?.[index] ?? 0) << 8) | (classification?.[index] ?? 0);
  }
  return output;
}

function getScalarValues<T extends Uint8Array | Uint16Array>(
  attribute: {value?: T} | T | undefined,
  ArrayType: {new (buffer: ArrayBufferLike): T}
): T | undefined {
  if (!attribute) return undefined;
  const value = 'value' in attribute ? attribute.value : attribute;
  return value instanceof ArrayType ? value : undefined;
}

async function fetchJSON(url: string | URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {signal});
  if (!response.ok) {
    throw new Error(`EPT request failed with ${response.status}: ${String(url)}`);
  }
  return response.json();
}

function getPositionValues(mesh: EPTLASMesh): Float32Array | Float64Array {
  const position = mesh.attributes?.POSITION;
  const values = position && 'value' in position ? position.value : position;
  if (!(values instanceof Float32Array) && !(values instanceof Float64Array)) {
    throw new Error('EPT LAZ tile did not contain a POSITION attribute');
  }
  return values;
}

function normalizeEPTPositions(
  source: Float32Array | Float64Array,
  target: Float32Array,
  targetPointOffset: number,
  pointCount: number,
  bounds: readonly [number, number, number, number, number, number]
): void {
  const centerX = (bounds[0] + bounds[3]) * 0.5;
  const centerY = (bounds[1] + bounds[4]) * 0.5;
  const minimumZ = bounds[2];
  const horizontalScale = 2 / Math.max(bounds[3] - bounds[0], bounds[4] - bounds[1]);
  // Use an independent display scale for height so Manhattan's relief remains legible when the
  // roughly 63 km horizontal EPT extent is normalized to two local units.
  const verticalScale = 1.7 / Math.max(1, bounds[5] - minimumZ);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const sourceOffset = pointIndex * 3;
    const targetOffset = (targetPointOffset + pointIndex) * 3;
    target[targetOffset] = (source[sourceOffset] - centerX) * horizontalScale;
    target[targetOffset + 1] = (source[sourceOffset + 1] - centerY) * horizontalScale;
    target[targetOffset + 2] = (source[sourceOffset + 2] - minimumZ) * verticalScale;
  }
}

function makeEPTNode(key: string, pointCount: number): EPTNode {
  const components = key.split('-').map(Number);
  if (components.length !== 4 || components.some(component => !Number.isSafeInteger(component))) {
    throw new Error(`Invalid EPT hierarchy key: ${key}`);
  }
  return {
    key,
    pointCount,
    depth: components[0],
    x: components[1],
    y: components[2],
    z: components[3]
  };
}

function getNodeDistanceSquared(
  node: EPTNode,
  focus: readonly [number, number],
  metadata: EPTMetadata
): number {
  const displayBounds = metadata.boundsConforming ?? metadata.bounds;
  const displayWidth = displayBounds[3] - displayBounds[0];
  const displayHeight = displayBounds[4] - displayBounds[1];
  const maximumHorizontalSpan = Math.max(displayWidth, displayHeight);
  const worldFocusX =
    (displayBounds[0] + displayBounds[3]) / 2 + (focus[0] * maximumHorizontalSpan) / 2;
  const worldFocusY =
    (displayBounds[1] + displayBounds[4]) / 2 + (focus[1] * maximumHorizontalSpan) / 2;
  const octreeWidth = metadata.bounds[3] - metadata.bounds[0];
  const octreeHeight = metadata.bounds[4] - metadata.bounds[1];
  const focusX = Math.max(0, Math.min(1, (worldFocusX - metadata.bounds[0]) / octreeWidth));
  const focusY = Math.max(0, Math.min(1, (worldFocusY - metadata.bounds[1]) / octreeHeight));
  const scale = 2 ** node.depth;
  const minimumX = node.x / scale;
  const maximumX = (node.x + 1) / scale;
  const minimumY = node.y / scale;
  const maximumY = (node.y + 1) / scale;
  const deltaX = Math.max(minimumX - focusX, 0, focusX - maximumX);
  const deltaY = Math.max(minimumY - focusY, 0, focusY - maximumY);
  return deltaX * deltaX + deltaY * deltaY;
}
