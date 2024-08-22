// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/types';
import type {ShaderModule} from '@luma.gl/shadertools';

/** Default color for auto highlight, a cyan color */
const DEFAULT_HIGHLIGHT_COLOR: NumberArray4 = [0, 1, 1, 1];

export const INVALID_INDEX = -1;

/**
 * Props for the picking module, which depending on mode renders picking colors or highlighted item.
 * When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer.
 * When inactive, renders normal colors, with the exception of selected object which is rendered with highlight
 * can distinguish between 2^32 different objects in each of 2^32 different batches.
 */
export type PickingProps = {
  /** Are we picking? I.e. rendering picking colors? */
  isActive?: boolean;
  /** Whether to use instance_index (built-in) or a custom application supplied index (usually from an attribute) */
  indexMode?: 'instance' | 'custom';
  /** Batch index (used when rendering multiple models to identify which model was picked), defaults to 0 */
  batchIndex?: number;

  /** Index of the highlighted batch, defaults to 0 */
  highlightedBatchIndex?: number | null;
  /** Set an index to highlight that item, or `null` to explicitly clear **/
  highlightedObjectIndex?: number | null;
  /** Color of visual highlight of "selected" item () */
  highlightColor?: NumberArray4;
};

/**
 * Uniforms for the picking module, which renders picking colors and highlighted item.
 * When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer.
 * When inactive, renders normal colors, with the exception of selected object which is rendered with highlight
 */
export type PickingUniforms = {
  /**
   * When true, renders picking colors. Set when rendering to off-screen "picking" buffer.
   * When false, renders normal colors, with the exception of selected object which is rendered with highlight
   */
  isActive: boolean;
  /** Set to true when picking an attribute value instead of object index */
  indexMode: 0 | 1;
  /** Index of batch currently being rendered */
  batchIndex: number;

  /** Do we have a highlighted item? */
  isHighlightActive: boolean;
  /** Color of visual highlight of "selected" item. Note: RGBA components must in the range 0-1 */
  highlightColor: NumberArray4;
  /** Indicates which batch to visually highlight an item in (defaults to 0) */
  highlightedBatchIndex: number;
  /** Indicates which index in the batch to highlight an item in */
  highlightedObjectIndex: number;
};

export type PickingBindings = {};

// GLSL_UNIFORMS

const uniformTypes: Required<ShaderModule<PickingProps, PickingUniforms>>['uniformTypes'] = {
  isActive: 'i32',
  indexMode: 'i32',
  batchIndex: 'i32',

  isHighlightActive: 'i32',
  highlightedBatchIndex: 'i32',
  highlightedObjectIndex: 'i32',
  highlightColor: 'vec4<f32>'
};

export const GLSL_UNIFORMS = /* glsl */ `\
precision highp float;
precision highp int;

uniform pickingUniforms {
  int isActive;
  int indexMode;
  int batchIndex;

  int isHighlightActive;
  int highlightedBatchIndex;
  int highlightedObjectIndex;
  vec4 highlightColor;
} picking;
`;

export const WGSL_UNIFORMS = /* wgsl */ `\
struct pickingUniforms {
  isActive: int32;
  indexMode: int32;
  batchIndex: int32;

  isHighlightActive: int32;
  highlightedBatchIndex: int32;
  highlightedObjectIndex: int32;
  highlightColor: vec4<f32>;
} picking;
`;

function getUniforms(props: PickingProps = {}, prevUniforms?: PickingUniforms): PickingUniforms {
  const uniforms = {...prevUniforms} as PickingUniforms;

  // picking
  if (props.isActive !== undefined) {
    uniforms.isActive = Boolean(props.isActive);
  }

  switch (props.indexMode) {
    case 'instance':
      uniforms.indexMode = 0;
      break;
    case 'custom':
      uniforms.indexMode = 1;
      break;
    case undefined:
      // no change
      break;
  }

  switch (props.highlightedObjectIndex) {
    case undefined:
      // Unless highlightedObjectColor explicitly null or set, do not update state
      break;
    case null:
      // Clear highlight
      uniforms.isHighlightActive = false;
      uniforms.highlightedObjectIndex = INVALID_INDEX;
      break;
    default:
      uniforms.isHighlightActive = true;
      uniforms.highlightedObjectIndex = props.highlightedObjectIndex;
  }

  if (typeof props.highlightedBatchIndex === 'number') {
    uniforms.highlightedBatchIndex = props.highlightedBatchIndex;
  }

  if (props.highlightColor) {
    uniforms.highlightColor = props.highlightColor;
  }

  return uniforms;
}

/**
 * Provides support for color-based picking and highlighting.
 *
 * In particular, supports picking a specific instance in an instanced
 * draw call and highlighting an instance based on its picking color,
 * and correspondingly, supports picking and highlighting groups of
 * primitives with the same picking color in non-instanced draw-calls
 *
 * @note Color based picking has the significant advantage in that it can be added to any
 * existing shader without requiring any additional picking logic.
 */
export const pickingUniforms = {
  props: {} as PickingProps,
  uniforms: {} as PickingUniforms,

  name: 'picking',

  uniformTypes,
  defaultUniforms: {
    isActive: false,
    indexMode: 0,
    batchIndex: 0,
    isHighlightActive: true,
    highlightedBatchIndex: INVALID_INDEX,
    highlightedObjectIndex: INVALID_INDEX,
    highlightColor: DEFAULT_HIGHLIGHT_COLOR
  },

  getUniforms
} as const satisfies ShaderModule<PickingProps, PickingUniforms, PickingBindings>;
