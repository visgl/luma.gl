// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {GPUCompaction} from './gpu-compaction';
import {createTransientView, getViewBinding, getViewElementOffset} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

/** Inputs and outputs for graph-native glyph selection from source-row visibility. */
export type GPUTextSelectionProps = {
  /** Prefix for generated graph nodes and transient resources. */
  id?: string;
  /** Source row index for every prepared glyph. Strided uint32 views are supported. */
  glyphRows: GraphDataView<'uint32'>;
  /** Packed uint32 visibility flags indexed by source row. */
  rowFlags: GraphDataView<'uint32'>;
  /** Packed destination receiving selected source glyph indices. */
  output: GraphDataView<'uint32'>;
  /** One uint32 destination receiving the selected glyph count. */
  count: GraphDataView<'uint32'>;
  /** Optional packed source glyph records, expressed as uint32 words. */
  sourceRecords?: GraphDataView<'uint32'>;
  /** Optional packed destination records in selected-glyph order. */
  outputRecords?: GraphDataView<'uint32'>;
  /** Number of uint32 words in one glyph record. Inferred when omitted. */
  recordWordLength?: number;
};

/**
 * Selects prepared glyphs whose source rows are visible.
 *
 * The primitive preserves glyph order and writes the result count directly to caller-owned GPU
 * storage, including an indirect draw command's `instanceCount` field.
 */
export class GPUTextSelection {
  readonly id: string;
  readonly glyphRows: GraphDataView<'uint32'>;
  readonly rowFlags: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly sourceRecords?: GraphDataView<'uint32'>;
  readonly outputRecords?: GraphDataView<'uint32'>;
  readonly recordWordLength: number;

  constructor(props: GPUTextSelectionProps) {
    this.id = props.id ?? 'gpu-text-selection';
    this.glyphRows = props.glyphRows;
    this.rowFlags = props.rowFlags;
    this.output = props.output;
    this.count = props.count;
    this.sourceRecords = props.sourceRecords;
    this.outputRecords = props.outputRecords;
    if (this.output.length < this.glyphRows.length) {
      throw new Error(`${this.id} output must contain at least glyphRows.length rows`);
    }
    if (this.count.length < 1) {
      throw new Error(`${this.id} count must contain one uint32 row`);
    }
    if (Boolean(this.sourceRecords) !== Boolean(this.outputRecords)) {
      throw new Error(`${this.id} sourceRecords and outputRecords must be supplied together`);
    }
    const inferredRecordWordLength =
      this.sourceRecords && this.glyphRows.length > 0
        ? this.sourceRecords.length / this.glyphRows.length
        : 0;
    this.recordWordLength = props.recordWordLength ?? inferredRecordWordLength;
    if (this.sourceRecords) {
      if (!Number.isSafeInteger(this.recordWordLength) || this.recordWordLength < 1) {
        throw new Error(`${this.id} recordWordLength must be a positive integer`);
      }
      const requiredWordCount = this.glyphRows.length * this.recordWordLength;
      if (
        this.sourceRecords.length < requiredWordCount ||
        this.outputRecords!.length < requiredWordCount
      ) {
        throw new Error(`${this.id} record buffers are smaller than the glyph record stream`);
      }
      if (
        this.sourceRecords.byteStride !== Uint32Array.BYTES_PER_ELEMENT ||
        this.outputRecords!.byteStride !== Uint32Array.BYTES_PER_ELEMENT
      ) {
        throw new Error(`${this.id} record buffers must be packed uint32 words`);
      }
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [
      this.glyphRows,
      this.rowFlags,
      this.output,
      this.count,
      this.sourceRecords,
      this.outputRecords
    ]) {
      if (!view) continue;
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
      if (view.format !== 'uint32') {
        throw new Error(`${this.id} views must use uint32 format`);
      }
    }

    if (this.glyphRows.length === 0) {
      addClearTextSelectionCount(graph, this.id, this.count);
      return;
    }

    const glyphIds = createTransientView(
      graph,
      `${this.id}-glyph-ids`,
      'uint32',
      this.glyphRows.length
    );
    const glyphFlags = createTransientView(
      graph,
      `${this.id}-glyph-flags`,
      'uint32',
      this.glyphRows.length
    );
    addGlyphVisibilityPass(graph, this, glyphIds, glyphFlags);
    new GPUCompaction({
      id: `${this.id}-compaction`,
      input: glyphIds,
      flags: glyphFlags,
      output: this.output,
      count: this.count
    }).addToGraph(graph);
    if (this.sourceRecords && this.outputRecords) {
      addGatherGlyphRecordsPass(graph, this);
    }
  }
}

function addGatherGlyphRecordsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUTextSelection
): void {
  const sourceRecords = selection.sourceRecords!;
  const outputRecords = selection.outputRecords!;
  const passId = `${selection.id}-gather-records`;
  const sourceOffset = sourceRecords.byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  const outputOffset = outputRecords.byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  const selectedOffset = selection.output.byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  const countOffset = selection.count.byteOffset / Uint32Array.BYTES_PER_ELEMENT;
  const selectedStride = selection.output.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const source = /* wgsl */ `
const GLYPH_COUNT: u32 = ${selection.glyphRows.length}u;
const RECORD_WORD_LENGTH: u32 = ${selection.recordWordLength}u;
const SOURCE_OFFSET: u32 = ${sourceOffset}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
const SELECTED_OFFSET: u32 = ${selectedOffset}u;
const SELECTED_STRIDE: u32 = ${selectedStride}u;
const COUNT_OFFSET: u32 = ${countOffset}u;
@group(0) @binding(0) var<storage, read> sourceRecords: array<u32>;
@group(0) @binding(1) var<storage, read> selectedGlyphIds: array<u32>;
@group(0) @binding(2) var<storage, read> selectedCount: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputRecords: array<u32>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let selectedIndex = globalId.x;
  if (selectedIndex >= GLYPH_COUNT || selectedIndex >= selectedCount[COUNT_OFFSET]) { return; }
  let sourceIndex = selectedGlyphIds[SELECTED_OFFSET + selectedIndex * SELECTED_STRIDE];
  for (var wordIndex = 0u; wordIndex < RECORD_WORD_LENGTH; wordIndex++) {
    outputRecords[OUTPUT_OFFSET + selectedIndex * RECORD_WORD_LENGTH + wordIndex] =
      sourceRecords[SOURCE_OFFSET + sourceIndex * RECORD_WORD_LENGTH + wordIndex];
  }
}`;
  graph.addComputePass({
    id: passId,
    resources: [
      {buffer: sourceRecords, usage: 'storage-read'},
      {buffer: selection.output, usage: 'storage-read'},
      {buffer: selection.count, usage: 'storage-read'},
      {buffer: outputRecords, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: passId,
        source,
        shaderLayout: {
          bindings: [
            {name: 'sourceRecords', type: 'storage', group: 0, location: 0},
            {name: 'selectedGlyphIds', type: 'storage', group: 0, location: 1},
            {name: 'selectedCount', type: 'storage', group: 0, location: 2},
            {name: 'outputRecords', type: 'storage', group: 0, location: 3}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            sourceRecords: getBuffer(sourceRecords),
            selectedGlyphIds: getBuffer(selection.output),
            selectedCount: getBuffer(selection.count),
            outputRecords: getBuffer(outputRecords)
          });
          computation.dispatch(computePass, Math.ceil(selection.glyphRows.length / WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addGlyphVisibilityPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUTextSelection,
  glyphIds: GraphDataView<'uint32'>,
  glyphFlags: GraphDataView<'uint32'>
): void {
  const passId = `${selection.id}-visibility`;
  const source = /* wgsl */ `
const GLYPH_COUNT: u32 = ${selection.glyphRows.length}u;
const ROW_COUNT: u32 = ${selection.rowFlags.length}u;
const GLYPH_ROW_OFFSET: u32 = ${getViewElementOffset(selection.glyphRows)}u;
const GLYPH_ROW_STRIDE: u32 = ${selection.glyphRows.byteStride / Uint32Array.BYTES_PER_ELEMENT}u;
const ROW_FLAG_OFFSET: u32 = ${getViewElementOffset(selection.rowFlags)}u;
const ROW_FLAG_STRIDE: u32 = ${selection.rowFlags.byteStride / Uint32Array.BYTES_PER_ELEMENT}u;
@group(0) @binding(0) var<storage, read> glyphRows: array<u32>;
@group(0) @binding(1) var<storage, read> rowFlags: array<u32>;
@group(0) @binding(2) var<storage, read_write> glyphIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> glyphFlags: array<u32>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let glyphIndex = globalId.x;
  if (glyphIndex >= GLYPH_COUNT) { return; }
  let rowIndex = glyphRows[GLYPH_ROW_OFFSET + glyphIndex * GLYPH_ROW_STRIDE];
  glyphIds[glyphIndex] = glyphIndex;
  glyphFlags[glyphIndex] = 0u;
  if (rowIndex < ROW_COUNT) {
    glyphFlags[glyphIndex] = rowFlags[ROW_FLAG_OFFSET + rowIndex * ROW_FLAG_STRIDE];
  }
}`;
  graph.addComputePass({
    id: passId,
    resources: [
      {buffer: selection.glyphRows, usage: 'storage-read'},
      {buffer: selection.rowFlags, usage: 'storage-read'},
      {buffer: glyphIds, usage: 'storage-write'},
      {buffer: glyphFlags, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: passId,
        source,
        shaderLayout: {
          bindings: [
            {name: 'glyphRows', type: 'storage', group: 0, location: 0},
            {name: 'rowFlags', type: 'storage', group: 0, location: 1},
            {name: 'glyphIds', type: 'storage', group: 0, location: 2},
            {name: 'glyphFlags', type: 'storage', group: 0, location: 3}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            glyphRows: getViewBinding(selection.glyphRows, getBuffer),
            rowFlags: getViewBinding(selection.rowFlags, getBuffer),
            glyphIds: getViewBinding(glyphIds, getBuffer),
            glyphFlags: getViewBinding(glyphFlags, getBuffer)
          });
          computation.dispatch(computePass, Math.ceil(selection.glyphRows.length / WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addClearTextSelectionCount<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: GraphDataView<'uint32'>
): void {
  graph.addComputePass({
    id: `${id}-clear-count`,
    resources: [{buffer: count, usage: 'storage-write'}],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${id}-clear-count`,
        source: `const COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
@group(0) @binding(0) var<storage, read_write> count: array<u32>;
@compute @workgroup_size(1) fn main() { count[COUNT_OFFSET] = 0u; }`,
        shaderLayout: {
          bindings: [{name: 'count', type: 'storage', group: 0, location: 0}]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {count: getViewBinding(count, getBuffer)};
          computation.setBindings(bindings);
          computation.dispatch(computePass, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
