// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicTexture, type ModelProps} from '@luma.gl/engine';
import {GPUTableModel, type GPUTableModelProps, type GPUTable} from '@luma.gl/tables';
import FontAtlasManager from '../atlas/font-atlas-manager';
import type {TextGlyphLayout} from '../model-utils/gpu-text-types';
import {EXPANDED_GLYPH_VERTEX_DATA} from '../model-utils/text-shaders';
import {
  assertAttributeTextGPUVectorInputs,
  ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA,
  type AttributeTextInputProps
} from '../model-utils/text-model-props';

export type {AttributeTextInputProps};

/** Generated glyph batch consumed by one attribute-model draw call. */
export type AttributeTextRenderBatchState = {
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
};

/** Prepared GPU table and generated glyph resources consumed by {@link AttributeTextModel}. */
export type AttributeTextState = {
  /** Model props with a GPU table containing label/style attributes. */
  modelProps: GPUTableModelProps;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: TextGlyphLayout;
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
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
  renderBatches: AttributeTextRenderBatchState[];
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings?: unknown;
  /** Default fragment shader uniforms, when the built-in shader is used. */
  defaultFragmentShaderUniforms?: Record<string, unknown>;
};

/**
 * Render and shader options for an attribute text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts and generated glyph buffers come from the
 * prepared {@link AttributeTextState}.
 */
export interface AttributeTextRenderProps extends ModelProps {}

/** Flat prepared props accepted by the attribute text renderer. */
export type AttributeTextModelProps = AttributeTextInputProps &
  AttributeTextState & {
    /** Whether this model owns and should destroy the prepared attribute state. */
    ownsAttributeState?: boolean;
  };

/** Explicit prepared-state constructor props, used when sharing state with a companion model. */
export type PreparedAttributeTextModelProps = AttributeTextRenderProps &
  Partial<AttributeTextInputProps> &
  AttributeTextState & {
    /** Whether this model owns and should destroy the prepared attribute state. */
    ownsAttributeState?: boolean;
  };

/**
 * Attribute text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass flat prepared GPU
 * vectors and generated render resources through {@link AttributeTextModelProps}.
 */
export class AttributeTextModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the attribute-backed text model. */
  static readonly gpuInputSchema = ATTRIBUTE_TEXT_GPU_INPUT_SCHEMA;

  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model. */
  atlasTexture?: DynamicTexture;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: TextGlyphLayout;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** CPU time spent building generated glyph-instance attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph-instance attributes. */
  glyphAttributeByteLength: number;
  /** First generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: AttributeTextRenderBatchState[];
  protected defaultFragmentShaderUniforms?: Record<string, unknown>;
  private ownsAttributeState: boolean;
  private attributeState: AttributeTextState;

  constructor(device: Device, props: AttributeTextModelProps | PreparedAttributeTextModelProps) {
    if (isAttributeTextInputProps(props)) {
      assertAttributeTextGPUVectorInputs(props);
    }
    super(device, props.modelProps);
    this.attributeState = props;
    this.ownsAttributeState = props.ownsAttributeState === true;
    this.fontAtlasManager = props.fontAtlasManager;
    this.atlasTexture = props.atlasTexture;
    this.glyphLayout = props.glyphLayout;
    this.characterSet = props.characterSet;
    this.glyphAttributeBuildTimeMs = props.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = props.glyphAttributeByteLength;
    this.expandedGlyphVertexData = props.expandedGlyphVertexData;
    this.renderBatches = props.renderBatches;
    this.defaultFragmentShaderUniforms = props.defaultFragmentShaderUniforms;
  }

  /** Constructs a render-only model from an existing prepared attribute state. */
  static fromState(device: Device, props: PreparedAttributeTextModelProps): AttributeTextModel {
    return new AttributeTextModel(device, props);
  }

  /** Draws each generated glyph render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    const gpuTable = this.table;
    if (!gpuTable || gpuTable.batches.length !== this.renderBatches.length) {
      throw new Error('AttributeTextModel draw batches must align with generated glyph batches');
    }

    let drawSuccess = true;
    try {
      for (const [batchIndex, renderBatch] of this.renderBatches.entries()) {
        const gpuBatch = gpuTable.batches[batchIndex];
        if (!gpuBatch) {
          throw new Error('AttributeTextModel is missing a GPU render batch');
        }
        this.setAttributes({
          ...gpuBatch.attributes,
          [EXPANDED_GLYPH_VERTEX_DATA]: renderBatch.expandedGlyphVertexData
        });
        this.setInstanceCount(renderBatch.glyphCount);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes({
        ...(gpuTable.attributes || {}),
        [EXPANDED_GLYPH_VERTEX_DATA]: this.expandedGlyphVertexData
      });
      this.setInstanceCount(this.glyphLayout.glyphCount);
    }

    return drawSuccess;
  }

  /** Releases owned atlas and generated glyph render buffers. */
  override destroy(): void {
    if (this.ownsAttributeState) {
      destroyAttributeTextState(this.attributeState);
      this.ownsAttributeState = false;
    }
    super.destroy();
  }

  protected setAttributeState(attributeState: AttributeTextState, ownsAttributeState = true): void {
    if (this.ownsAttributeState) {
      destroyAttributeTextState(this.attributeState);
    }
    this.attributeState = attributeState;
    this.ownsAttributeState = ownsAttributeState;
    this.fontAtlasManager = attributeState.fontAtlasManager;
    this.atlasTexture = attributeState.atlasTexture;
    this.glyphLayout = attributeState.glyphLayout;
    this.characterSet = attributeState.characterSet;
    this.glyphAttributeBuildTimeMs = attributeState.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = attributeState.glyphAttributeByteLength;
    this.expandedGlyphVertexData = attributeState.expandedGlyphVertexData;
    this.renderBatches = attributeState.renderBatches;
    this.defaultFragmentShaderUniforms = attributeState.defaultFragmentShaderUniforms;
    this.setProps({table: attributeState.modelProps.table as GPUTable});
    this.setAttributes({
      ...(attributeState.modelProps.attributes || {}),
      [EXPANDED_GLYPH_VERTEX_DATA]: attributeState.expandedGlyphVertexData
    });
    this.setBindings(attributeState.modelProps.bindings || {});
    this.setInstanceCount(attributeState.glyphLayout.glyphCount);
    this.setNeedsRedraw('Attribute text state updated');
  }
}

function isAttributeTextInputProps(
  props: AttributeTextModelProps | PreparedAttributeTextModelProps
): props is AttributeTextModelProps {
  return 'positions' in props && 'texts' in props;
}

function destroyAttributeTextState(attributeState: AttributeTextState): void {
  attributeState.atlasTexture?.destroy();
  for (const renderBatch of attributeState.renderBatches) {
    renderBatch.expandedGlyphVertexData.destroy();
  }
}
