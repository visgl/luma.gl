// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import type {DynamicTexture, ModelProps} from '@luma.gl/engine';
import {GPUTableModel, getGPUDataBuffersForLayout, type GPUTableModelProps} from '@luma.gl/tables';
import type {TextGlyphLayout} from '../model-utils/gpu-text-types';
import {EXPANDED_GLYPH_VERTEX_DATA} from '../model-utils/text-shaders';
import {
  TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA,
  type TextAttributeInputProps
} from '../model-utils/text-model-props';

export type {TextAttributeInputProps};

/** Generated glyph batch consumed by one attribute-model draw call. */
export type TextAttributeRenderBatchState = {
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
};

/** Prepared GPU table and generated glyph resources consumed by {@link TextAttributeModel}. */
export type TextAttributeState = {
  /** Model props with a GPU table containing label/style attributes. */
  modelProps: GPUTableModelProps;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: TextGlyphLayout;
  /** Optional atlas texture owned by this state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Bytes occupied by generated glyph-instance attributes. */
  glyphAttributeByteLength: number;
  /** CPU time spent building generated glyph-instance attributes. */
  glyphAttributeBuildTimeMs: number;
  /** First generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: TextAttributeRenderBatchState[];
  /** Raster font render settings retained for built-in fragment shader uniforms. */
  fontRenderSettings?: unknown;
  /** Default fragment shader uniforms, when the built-in shader is used. */
  defaultFragmentShaderUniforms?: Record<string, unknown>;
  /** Releases generated batch buffers and the generated GPU table. */
  destroy: () => void;
};

/**
 * Render and shader options for an attribute text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts and generated glyph buffers come from the
 * prepared {@link TextAttributeState}.
 */
export interface TextAttributeRenderProps extends ModelProps {}

/** Explicit prepared-state constructor props. The model borrows `attributeState`. */
export type TextAttributeModelProps = TextAttributeRenderProps & {
  attributeState: TextAttributeState;
};

export type PreparedTextAttributeModelProps = TextAttributeModelProps;

/**
 * Attribute text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass one borrowed prepared
 * state object through {@link TextAttributeModelProps}.
 */
export class TextAttributeModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the attribute-backed text model. */
  static readonly gpuInputSchema = TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA;

  /** Borrowed generated glyph layouts and render resources in append order. */
  readonly attributeStates: TextAttributeState[];

  /** First borrowed state retained for compatibility with low-level integrations. */
  get attributeState(): TextAttributeState {
    return this.attributeStates[0]!;
  }

  constructor(device: Device, props: TextAttributeModelProps) {
    const {attributeState, ...modelProps} = props;
    super(device, {...attributeState.modelProps, ...modelProps});
    this.attributeStates = [attributeState];
  }

  /** Appends one prepared batch without replacing existing state or models. */
  addState(attributeState: TextAttributeState): void {
    this.attributeStates.push(attributeState);
    this.setNeedsRedraw('Text attribute batch appended');
  }

  /** Draws each generated glyph render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    try {
      for (const attributeState of this.attributeStates) {
        const gpuTable = attributeState.modelProps.table!;
        for (const [batchIndex, renderBatch] of attributeState.renderBatches.entries()) {
          const gpuBatch = gpuTable.batches[batchIndex]!;
          this.setAttributes({
            ...getGPUDataBuffersForLayout(gpuBatch.bufferLayout, gpuBatch.gpuData),
            [EXPANDED_GLYPH_VERTEX_DATA]: renderBatch.expandedGlyphVertexData
          });
          this.setInstanceCount(renderBatch.glyphCount);
          drawSuccess = super.draw(renderPass) && drawSuccess;
        }
      }
    } finally {
      const gpuTable = this.attributeState.modelProps.table;
      const firstGpuBatch = gpuTable?.batches[0];
      this.setAttributes({
        ...(firstGpuBatch
          ? getGPUDataBuffersForLayout(firstGpuBatch.bufferLayout, firstGpuBatch.gpuData)
          : {}),
        [EXPANDED_GLYPH_VERTEX_DATA]: this.attributeState.expandedGlyphVertexData
      });
      this.setInstanceCount(
        this.attributeStates.reduce(
          (glyphCount, attributeState) => glyphCount + attributeState.glyphLayout.glyphCount,
          0
        )
      );
    }

    return drawSuccess;
  }
}
