// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {makeArrowGPURecordBatch} from '@luma.gl/arrow';
import {planGeneratedBufferBatches} from '@luma.gl/tables';
import {Table} from 'apache-arrow';
import {
  appendArrowGlyphLayout,
  assertArrowTextAppendPrefixStable,
  assertArrowTextAppendProps,
  assertArrowTextSourceAppendPrefixStable,
  assertArrowTextVectorBatchAlignment,
  assertArrowTextVectorTypes,
  buildArrowTextGlyphTable,
  createArrowAttributeTextState,
  createArrowTextRenderTable,
  createExpandedGlyphVertexData,
  resolveArrowTextBatchInputs,
  resolveArrowTextShaderLayout,
  type ArrowAttributeTextModelStateProps,
  type ArrowTextModelProps,
  type ResolvedCharacterMapping
} from './arrow-text-model';
import {
  CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE,
  EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
} from '../model-utils/text-shaders';
import {AttributeTextModel} from '../models/attribute-text-model';
import {updateArrowTextDefaultFragmentShaderUniforms} from '../model-utils/text-fragment-uniforms';

export class ArrowAttributeTextModel extends AttributeTextModel {
  /** Expanded Arrow table containing glyph-instance columns. */
  glyphTable: Table;
  private textProps: ArrowTextModelProps;
  private mappingState: ResolvedCharacterMapping;
  private processedTextBatchCount: number;
  private processedTextRowCount: number;

  /** Creates an attribute-backed Arrow text model from prepared text props. */
  constructor(device: Device, props: ArrowTextModelProps | ArrowAttributeTextModelStateProps) {
    const prepared = hasArrowAttributeTextState(props)
      ? props.attributeState
      : createArrowAttributeTextState(device, props);
    super(device, {attributeState: prepared, ownsAttributeState: true});
    this.textProps = prepared.textProps;
    this.glyphTable = prepared.glyphTable.table;
    this.mappingState = prepared.mappingState;
    this.processedTextBatchCount = prepared.textProps.texts.data.length;
    this.processedTextRowCount = prepared.textProps.texts.length;
  }

  /** Rebuild generated glyph attributes when label rows, text, or font layout inputs change. */
  override setProps(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.positions !== undefined ||
      props.colors !== undefined ||
      props.angles !== undefined ||
      props.sizes !== undefined ||
      props.pixelOffsets !== undefined ||
      props.texts !== undefined ||
      props.sourceVectors !== undefined ||
      props.clipRects !== undefined ||
      props.characterSet !== undefined ||
      props.fontSettings !== undefined ||
      props.lineHeight !== undefined ||
      props.characterMapping !== undefined ||
      props.fontAtlas !== undefined;

    this.textProps = nextProps;
    if (!shouldRebuild) {
      super.setProps({});
      return;
    }

    const prepared = createArrowAttributeTextState(this.device, nextProps);
    this.glyphTable = prepared.glyphTable.table;
    this.mappingState = prepared.mappingState;
    this.processedTextBatchCount = nextProps.texts.data.length;
    this.processedTextRowCount = nextProps.texts.length;
    if (this.defaultFragmentShaderUniforms && prepared.defaultFragmentShaderUniforms) {
      updateArrowTextDefaultFragmentShaderUniforms(
        this.defaultFragmentShaderUniforms,
        prepared.sdfRenderSettings
      );
    }
    this.setAttributeState(prepared, true);
  }

  /** Converts only newly appended source GPUVector batches into retained glyph render batches. */
  appendTextBatches(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    assertArrowTextAppendProps(props);
    assertArrowTextVectorTypes(nextProps);
    assertArrowTextVectorBatchAlignment(nextProps);
    assertArrowTextAppendPrefixStable(this.textProps, nextProps, this.processedTextBatchCount);
    assertArrowTextSourceAppendPrefixStable(
      this.textProps,
      nextProps,
      this.processedTextBatchCount
    );

    const nextBatchCount = nextProps.texts.data.length;
    if (nextBatchCount < this.processedTextBatchCount) {
      throw new Error('ArrowTextModel appended text batches cannot remove existing batches');
    }
    if (nextBatchCount === this.processedTextBatchCount) {
      this.textProps = nextProps;
      return;
    }
    const gpuTable = this.table;
    if (!gpuTable) {
      throw new Error('ArrowTextModel appended text batches require an Arrow GPU render table');
    }

    const shaderLayout = resolveArrowTextShaderLayout(nextProps);
    let batchRowIndexBase = this.processedTextRowCount;
    for (let batchIndex = this.processedTextBatchCount; batchIndex < nextBatchCount; batchIndex++) {
      const batchInputs = resolveArrowTextBatchInputs(nextProps, batchIndex);
      const glyphTable = buildArrowTextGlyphTable({
        labelTable: batchInputs.labelTable,
        texts: batchInputs.texts,
        clipRects: batchInputs.clipRects,
        mapping: this.mappingState.mapping,
        baselineOffset: this.mappingState.baselineOffset,
        lineHeight: this.mappingState.lineHeight,
        characterSet: this.mappingState.characterSet,
        rowIndexBase: batchRowIndexBase
      });
      const generatedBufferBatches = planGeneratedBufferBatches({
        device: this.device,
        recordOffsets: glyphTable.glyphLayout.startIndices,
        recordByteStride: batchInputs.clipRects
          ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
          : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE,
        resourceLabel: 'ArrowTextModel expanded glyph vertex data'
      });
      const renderTable = createArrowTextRenderTable(glyphTable.table, generatedBufferBatches);

      for (const recordBatch of renderTable.batches) {
        gpuTable.addBatch(
          makeArrowGPURecordBatch(this.device, recordBatch, {
            shaderLayout
          })
        );
      }

      for (const generatedBufferBatch of generatedBufferBatches) {
        const expandedGlyphVertexState = createExpandedGlyphVertexData(this.device, nextProps, {
          glyphTable,
          shaderLayout,
          generatedBufferBatch,
          rowIndexBase: batchRowIndexBase
        });
        this.renderBatches.push({
          rowStart: batchRowIndexBase + generatedBufferBatch.rowStart,
          rowEnd: batchRowIndexBase + generatedBufferBatch.rowEnd,
          glyphCount: generatedBufferBatch.recordCount,
          expandedGlyphVertexData: expandedGlyphVertexState.buffer
        });
      }

      this.glyphLayout = appendArrowGlyphLayout(this.glyphLayout, glyphTable.glyphLayout);
      this.glyphTable = new Table(this.glyphTable.schema, [
        ...this.glyphTable.batches,
        ...glyphTable.table.batches
      ]);
      this.glyphAttributeBuildTimeMs += glyphTable.glyphAttributeBuildTimeMs;
      this.glyphAttributeByteLength += glyphTable.attributeByteLength;
      batchRowIndexBase += batchInputs.texts.length;
    }

    this.textProps = nextProps;
    this.processedTextBatchCount = nextBatchCount;
    this.processedTextRowCount = nextProps.texts.length;
    this.setInstanceCount(this.glyphLayout.glyphCount);
    this.setNeedsRedraw('Arrow text glyph batches appended');
  }
}

function hasArrowAttributeTextState(
  props: ArrowTextModelProps | ArrowAttributeTextModelStateProps
): props is ArrowAttributeTextModelStateProps {
  return 'attributeState' in props && props.attributeState !== undefined;
}
