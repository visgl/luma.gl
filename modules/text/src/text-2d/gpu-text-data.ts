// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextAttributeRenderProps, TextAttributeState} from './models/text-attribute-model';
import type {TextStorageRenderProps} from './models/text-storage-model';
import type {TextDictionaryRenderProps} from './models/text-dictionary-model';
import type {TextDictionaryState, TextStorageState} from './model-utils/text-storage-state';

/** Prepared text representation selected by an adapter or forced through the experimental API. */
export type GPUTextStrategy = 'attribute' | 'storage' | 'storage-row-indexed' | 'dictionary';

/** Representation-independent preparation and memory statistics for {@link GPUTextData}. */
export type GPUTextStats = {
  /** Strategy used to prepare and render the data. */
  strategy: GPUTextStrategy;
  /** Number of source text rows. */
  rowCount: number;
  /** Number of visible glyph instances generated from all source rows. */
  glyphCount: number;
  /** Number of preserved source batches or chunks. */
  sourceBatchCount: number;
  /** Number of draw batches after applying device buffer-size limits. */
  renderBatchCount: number;
  /** CPU preparation time in milliseconds. */
  preparationTimeMs: number;
  /** Bytes retained by prepared glyph, row, atlas-definition, and control data. */
  retainedByteLength: number;
  /** Bytes used by temporary compute inputs that are released after preparation. */
  transientByteLength: number;
};

type GPUTextAttributeData = {
  strategy: 'attribute';
  modelProps: TextAttributeRenderProps;
  state: TextAttributeState;
};

type GPUTextStorageData = {
  strategy: 'storage' | 'storage-row-indexed';
  modelProps: TextStorageRenderProps;
  state: TextStorageState;
};

type GPUTextDictionaryData = {
  strategy: 'dictionary';
  modelProps: TextDictionaryRenderProps;
  state: TextDictionaryState;
};

/** @internal Strategy-specific prepared data accepted by the experimental factory. */
export type GPUTextDataProps = GPUTextAttributeData | GPUTextStorageData | GPUTextDictionaryData;

/**
 * Caller-owned prepared text data shared by render and picking models.
 *
 * The public surface intentionally exposes only representation-independent counts, statistics,
 * and destruction. Strategy-specific state is available only through the experimental entry
 * point. Destroy every borrowing renderer before destroying its data.
 */
export interface GPUTextData {
  /** Strategy selected while preparing this data. */
  readonly strategy: GPUTextStrategy;
  /** Number of source text rows. */
  readonly rowCount: number;
  /** Number of visible glyph instances. */
  readonly glyphCount: number;
  /** Compact representation-independent preparation statistics. */
  readonly stats: GPUTextStats;
  /** Releases owned source batches, generated buffers, atlas resources, and tables. Idempotent. */
  destroy(): void;
}

/** @internal */
export class GPUTextDataImpl implements GPUTextData {
  readonly strategy: GPUTextStrategy;
  readonly rowCount: number;
  readonly glyphCount: number;
  readonly stats: GPUTextStats;
  private readonly props: GPUTextDataProps;
  private readonly destroySource?: () => void;
  private destroyed = false;

  constructor(props: GPUTextDataProps, options: {rowCount: number; destroySource?: () => void}) {
    this.props = props;
    this.strategy = props.strategy;
    this.rowCount = options.rowCount;
    this.destroySource = options.destroySource;
    this.glyphCount =
      props.strategy === 'attribute' ? props.state.glyphLayout.glyphCount : props.state.glyphCount;
    this.stats = makeGPUTextStats(props, options.rowCount);
  }

  /** Releases all prepared and source resources owned by this data object exactly once. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    destroyGPUTextState(this.props);
    this.destroySource?.();
  }

  getInternalProps(): GPUTextDataProps {
    if (this.destroyed) {
      throw new Error('GPUTextData has been destroyed');
    }
    return this.props;
  }
}

/** @internal */
export function createGPUTextData(
  props: GPUTextDataProps,
  options: {rowCount: number; destroySource?: () => void}
): GPUTextData {
  return new GPUTextDataImpl(props, options);
}

/** @internal */
export function getGPUTextDataProps(data: GPUTextData): GPUTextDataProps {
  if (!(data instanceof GPUTextDataImpl)) {
    throw new Error('TextRenderer requires GPUTextData created by @luma.gl/text');
  }
  return data.getInternalProps();
}

function makeGPUTextStats(props: GPUTextDataProps, rowCount: number): GPUTextStats {
  if (props.strategy === 'attribute') {
    const state = props.state;
    return {
      strategy: props.strategy,
      rowCount,
      glyphCount: state.glyphLayout.glyphCount,
      sourceBatchCount: state.modelProps.table?.batches.length ?? state.renderBatches.length,
      renderBatchCount: state.renderBatches.length,
      preparationTimeMs: state.glyphAttributeBuildTimeMs,
      retainedByteLength: state.glyphAttributeByteLength,
      transientByteLength: 0
    };
  }
  const state = props.state;
  return {
    strategy: props.strategy,
    rowCount,
    glyphCount: state.glyphCount,
    sourceBatchCount: state.batches.length,
    renderBatchCount: state.renderBatches.length,
    preparationTimeMs: state.glyphAttributeBuildTimeMs + state.compactStreamBuildTimeMs,
    retainedByteLength:
      state.glyphAttributeByteLength +
      state.compactStreamByteLength +
      state.rowStorageByteLength +
      state.glyphDefinitionStorageByteLength,
    transientByteLength: state.transientComputeInputByteLength
  };
}

function destroyGPUTextState(props: GPUTextDataProps): void {
  if (props.strategy === 'attribute') {
    const state = props.state;
    state.atlasTexture?.destroy();
    for (const renderBatch of state.renderBatches) {
      renderBatch.expandedGlyphVertexData.destroy();
    }
    state.modelProps.table?.destroy();
    return;
  }
  props.state.destroy();
}
