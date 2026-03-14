// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Default color for auto highlight, a cyan color */
const DEFAULT_HIGHLIGHT_COLOR = [0, 1, 1, 1];
export const INVALID_INDEX = -1;
// GLSL_UNIFORMS
const uniformTypes = {
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
function getUniforms(props = {}, prevUniforms) {
    const uniforms = { ...prevUniforms };
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
    props: {},
    uniforms: {},
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
};
