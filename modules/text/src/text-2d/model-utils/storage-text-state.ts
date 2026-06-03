// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import FontAtlasManager from '../atlas/font-atlas-manager';
import type {GpuDictionaryCompressedTextStream, GpuExpandedTextStream} from './gpu-text-types';

export type StorageTextBuffer = Buffer | DynamicBuffer;

export type TextSdfRenderSettings = {
  sdf: boolean;
  threshold: number;
  smoothing: number;
};

type StorageTextOwnedResource = {
  destroy: () => void;
};

/** Per-source-batch row bindings retained by prepared storage text state. */
export type StorageTextBatchState = {
  /** Global source text row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Global row-storage index assigned to local row zero. */
  rowStorageIndexBase: number;
  /** Source text rows included in this storage batch. */
  rowCount: number;
  /** Glyph instances generated from this storage batch. */
  glyphCount: number;
  /** Read-only storage buffer for label origins. */
  rowPositionsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed RGBA8 row colors. */
  rowColorsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row angles. */
  rowAnglesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row text sizes. */
  rowSizesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row pixel offsets. */
  rowPixelOffsetsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row text anchor enums. */
  rowTextAnchorsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row alignment baseline enums. */
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row clip rectangles. */
  rowClipRectsBuffer: Buffer;
  /** Optional read-only storage buffer for cumulative row glyph starts. */
  rowGlyphStartsBuffer?: Buffer;
  /** Uniform buffer selecting row style binding usage and constant fallbacks. */
  styleConfigBuffer: DynamicBuffer;
};

/** Generated storage text render-batch state. */
export type StorageTextRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global glyph index assigned to local glyph zero. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Uniform buffer scoping row/glyph lookup to this render batch. */
  storageRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU storage text expansion and row-binding state. */
export type StorageTextState = {
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compact glyph stream retained for CPU-expanded storage mode. */
  glyphStream?: GpuExpandedTextStream;
  /** Glyph instances across all preserved render batches. */
  glyphCount: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph attributes and render control buffers. */
  glyphAttributeByteLength: number;
  /** CPU time spent building compact glyph stream inputs. */
  compactStreamBuildTimeMs: number;
  /** Bytes occupied by compact glyph stream inputs. */
  compactStreamByteLength: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by row glyph starts and per-render-batch config buffers. */
  renderControlByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by retained glyph frame/lookup definition resources. */
  glyphDefinitionStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** Whether generated glyph records include a per-glyph source-row index attribute. */
  hasGlyphRowIndices?: boolean;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer: Buffer;
  /** Per-source-batch row bindings. */
  batches: StorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: StorageTextRenderBatchState[];
  /** Row/default binding resources owned by this storage state. */
  ownedRowBindingResources: StorageTextOwnedResource[];
  /** Glyph definition and render-control resources owned by this storage state. */
  ownedGlyphResources: StorageTextOwnedResource[];
  /** First batch label origin buffer. */
  rowPositionsBuffer: StorageTextBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer: StorageTextBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer: StorageTextBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer: StorageTextBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer: StorageTextBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer: StorageTextBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer: Buffer;
  /** First batch cumulative row glyph start buffer. */
  rowGlyphStartsBuffer: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** First render batch row/glyph lookup config uniform buffer. */
  storageRenderConfigBuffer: DynamicBuffer;
  /** First generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Releases owned atlas, row, glyph, and generated render resources. */
  destroy: () => void;
};

/** Per-source-batch dictionary glyph storage retained by compressed dictionary text state. */
export type DictionaryTextBatchState = StorageTextBatchState & {
  /** Per row `(dictionary index, row glyph start)` records plus one terminal sentinel. */
  rowDictionaryRecordsBuffer: Buffer;
  /** Per dictionary value half-open ranges into `dictionaryGlyphRecordsBuffer`. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** Shared per-glyph layout records for unique dictionary values in this Arrow batch. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** Glyph atlas frames referenced by the shared dictionary glyph records. */
  glyphFramesBuffer: Buffer;
  /** Shared dictionary glyph records in this batch. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values in this batch. */
  dictionaryValueCount: number;
};

/** Generated compressed dictionary text render-batch state. */
export type DictionaryTextRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global visible-glyph base for this draw batch; added to `instance_index` in WGSL. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Tiny uniform that scopes row lookup to this render batch. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU compressed dictionary text storage and row-binding state. */
export type DictionaryTextState = Omit<
  StorageTextState,
  | 'glyphStream'
  | 'batches'
  | 'renderBatches'
  | 'ownedGlyphResources'
  | 'rowGlyphStartsBuffer'
  | 'storageRenderConfigBuffer'
  | 'compactGlyphVertexData'
  | 'renderControlByteLength'
> & {
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuDictionaryCompressedTextStream;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values retained across data chunks. */
  dictionaryValueCount: number;
  /** Per-source-batch row and dictionary glyph bindings. */
  batches: DictionaryTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: DictionaryTextRenderBatchState[];
  /** Dictionary glyph and render-control resources owned by this dictionary storage state. */
  ownedDictionaryResources: StorageTextOwnedResource[];
  /** First batch per-row dictionary reference buffer. */
  rowDictionaryRecordsBuffer: Buffer;
  /** First batch per-dictionary-value glyph range buffer. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** First batch shared dictionary glyph record buffer. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** First render batch dictionary lookup config uniform buffer. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
};

export function getFirstStorageTextBatch(
  storageState: Pick<StorageTextState, 'batches'>
): StorageTextBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('StorageTextState requires at least one row-binding batch');
  }
  return firstBatch;
}

export function getFirstStorageTextRenderBatch(
  storageState: Pick<StorageTextState, 'renderBatches'>
): StorageTextRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('StorageTextState requires at least one render batch');
  }
  return firstRenderBatch;
}

export function getStorageRowGlyphStartsBuffer(batch: StorageTextBatchState): Buffer {
  if (!batch.rowGlyphStartsBuffer) {
    throw new Error('StorageTextState batch is missing row glyph starts');
  }
  return batch.rowGlyphStartsBuffer;
}

export function getFirstDictionaryTextBatch(
  storageState: Pick<DictionaryTextState, 'batches'>
): DictionaryTextBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('DictionaryTextState requires at least one row-binding batch');
  }
  return firstBatch;
}

export function getFirstDictionaryTextRenderBatch(
  storageState: Pick<DictionaryTextState, 'renderBatches'>
): DictionaryTextRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('DictionaryTextState requires at least one render batch');
  }
  return firstRenderBatch;
}
