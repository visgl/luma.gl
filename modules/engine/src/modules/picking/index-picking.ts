// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

import type {PickingBindings, PickingProps, PickingUniforms} from './picking-uniforms';
import {pickingUniforms, GLSL_UNIFORMS, WGSL_UNIFORMS, INVALID_INDEX} from './picking-uniforms';

// SHADERS

const source = /* wgsl */ `\
${WGSL_UNIFORMS}

const INDEX_PICKING_MODE_INSTANCE = 0;
const INDEX_PICKING_MODE_CUSTOM = 1;
const INDEX_PICKING_INVALID_INDEX = ${INVALID_INDEX}; // 2^32 - 1

struct indexPickingFragmentInputs = {
  objectIndex: int32;
};

let indexPickingFragmentInputs: indexPickingFragmentInputs;

/**
 * Vertex shaders should call this function to set the object index.
 * If using instance or vertex mode, argument will be ignored, 0 can be supplied.
 */
fn picking_setObjectIndex(objectIndex: int32) {
  switch (picking.indexMode) {
    case INDEX_PICKING_MODE_INSTANCE, default: {
      picking_objectIndex = instance_index;
    };
    case INDEX_PICKING_MODE_CUSTOM: {
      picking_objectIndex = objectIndex;
    };
  }
}

`;

const vs = /* glsl */ `\
${GLSL_UNIFORMS}

const int INDEX_PICKING_MODE_INSTANCE = 0;
const int INDEX_PICKING_MODE_CUSTOM = 1;

const int INDEX_PICKING_INVALID_INDEX = ${INVALID_INDEX}; // 2^32 - 1

flat out int picking_objectIndex;

/**
 * Vertex shaders should call this function to set the object index.
 * If using instance or vertex mode, argument will be ignored, 0 can be supplied.
 */
void picking_setObjectIndex(int objectIndex) {
  switch (picking.indexMode) {
    case INDEX_PICKING_MODE_INSTANCE:
      picking_objectIndex = gl_InstanceID;
      break;
    case INDEX_PICKING_MODE_CUSTOM:
      picking_objectIndex = objectIndex;
      break;
  }
}
`;

const fs = /* glsl */ `\
${GLSL_UNIFORMS}

const int INDEX_PICKING_INVALID_INDEX = ${INVALID_INDEX}; // 2^32 - 1

flat in int picking_objectIndex;

/**
 * Check if this vertex is highlighted (part of the selected batch and object)
 */ 
bool picking_isFragmentHighlighted() {
  return 
    bool(picking.isHighlightActive) &&
    picking.highlightedBatchIndex == picking.batchIndex &&
    picking.highlightedObjectIndex == picking_objectIndex
    ;
}

/**
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (bool(picking.isActive)) {
    return color;
  }

  // If we are not highlighted, return color as is
  if (!picking_isFragmentHighlighted()) {
    return color;
  }
   
  // Blend in highlight color based on its alpha value
  float highLightAlpha = picking.highlightColor.a;
  float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
  float highLightRatio = highLightAlpha / blendedAlpha;

  vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
ivec4 picking_getPickingColor() {
  // Assumes that colorAttachment0 is rg32int
  // TODO? - we could render indices into a second color attachment and not mess with fragColor
  return ivec4(picking_objectIndex, picking.batchIndex, 0u, 0u);  
}

vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_objectIndex == INDEX_PICKING_INVALID_INDEX) {
      discard;
    }
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 outColor = color;
  outColor = picking_filterHighlightColor(outColor);
  outColor = picking_filterPickingColor(outColor);
  return outColor;
}
`;

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
export const picking = {
  ...pickingUniforms,
  name: 'picking',
  source,
  vs,
  fs
} as const satisfies ShaderModule<PickingProps, PickingUniforms, PickingBindings>;
