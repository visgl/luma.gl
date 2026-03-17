// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

import type {PickingBindings, PickingProps, PickingUniforms} from './picking-uniforms';
import {pickingUniforms, GLSL_UNIFORMS, WGSL_UNIFORMS, INVALID_INDEX} from './picking-uniforms';

const source = /* wgsl */ `\
${WGSL_UNIFORMS}

const INDEX_PICKING_MODE_INSTANCE = 0;
const INDEX_PICKING_MODE_CUSTOM = 1;
const COLOR_PICKING_INVALID_INDEX = ${INVALID_INDEX};
const COLOR_PICKING_MAX_OBJECT_INDEX = 16777214;
const COLOR_PICKING_MAX_BATCH_INDEX = 254;

fn picking_setObjectIndex(objectIndex: i32) -> i32 {
  return objectIndex;
}

fn picking_isObjectHighlighted(objectIndex: i32) -> bool {
  return
    picking.isHighlightActive != 0 &&
    picking.highlightedBatchIndex == picking.batchIndex &&
    picking.highlightedObjectIndex == objectIndex;
}

fn picking_filterHighlightColor(color: vec4<f32>, objectIndex: i32) -> vec4<f32> {
  if (picking.isActive != 0 || !picking_isObjectHighlighted(objectIndex)) {
    return color;
  }

  let highLightAlpha = picking.highlightColor.a;
  let blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
  if (blendedAlpha == 0.0) {
    return vec4<f32>(color.rgb, 0.0);
  }

  let highLightRatio = highLightAlpha / blendedAlpha;
  let blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
  return vec4<f32>(blendedRGB, blendedAlpha);
}

fn picking_canEncodePickInfo(objectIndex: i32) -> bool {
  return
    objectIndex != COLOR_PICKING_INVALID_INDEX &&
    objectIndex >= 0 &&
    objectIndex <= COLOR_PICKING_MAX_OBJECT_INDEX &&
    picking.batchIndex >= 0 &&
    picking.batchIndex <= COLOR_PICKING_MAX_BATCH_INDEX;
}

fn picking_getPickingColor(objectIndex: i32) -> vec4<f32> {
  if (!picking_canEncodePickInfo(objectIndex)) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }

  let encodedObjectIndex = objectIndex + 1;
  let red = encodedObjectIndex % 256;
  let green = (encodedObjectIndex / 256) % 256;
  let blue = (encodedObjectIndex / 65536) % 256;
  let alpha = picking.batchIndex + 1;

  return vec4<f32>(
    f32(red) / 255.0,
    f32(green) / 255.0,
    f32(blue) / 255.0,
    f32(alpha) / 255.0
  );
}

fn picking_filterPickingColor(color: vec4<f32>, objectIndex: i32) -> vec4<f32> {
  if (picking.isActive != 0) {
    if (!picking_canEncodePickInfo(objectIndex)) {
      discard;
    }
    return picking_getPickingColor(objectIndex);
  }

  return color;
}
`;

const vs = /* glsl */ `\
${GLSL_UNIFORMS}

const int INDEX_PICKING_MODE_INSTANCE = 0;
const int INDEX_PICKING_MODE_CUSTOM = 1;

const int COLOR_PICKING_INVALID_INDEX = ${INVALID_INDEX};

flat out int picking_objectIndex;

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

const int COLOR_PICKING_INVALID_INDEX = ${INVALID_INDEX};
const int COLOR_PICKING_MAX_OBJECT_INDEX = 16777214;
const int COLOR_PICKING_MAX_BATCH_INDEX = 254;

flat in int picking_objectIndex;

bool picking_isFragmentHighlighted() {
  return
    bool(picking.isHighlightActive) &&
    picking.highlightedBatchIndex == picking.batchIndex &&
    picking.highlightedObjectIndex == picking_objectIndex
    ;
}

vec4 picking_filterHighlightColor(vec4 color) {
  if (bool(picking.isActive)) {
    return color;
  }

  if (!picking_isFragmentHighlighted()) {
    return color;
  }

  float highLightAlpha = picking.highlightColor.a;
  float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
  float highLightRatio = highLightAlpha / blendedAlpha;

  vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

bool picking_canEncodePickInfo(int objectIndex) {
  return
    objectIndex != COLOR_PICKING_INVALID_INDEX &&
    objectIndex >= 0 &&
    objectIndex <= COLOR_PICKING_MAX_OBJECT_INDEX &&
    picking.batchIndex >= 0 &&
    picking.batchIndex <= COLOR_PICKING_MAX_BATCH_INDEX;
}

vec4 picking_getPickingColor() {
  if (!picking_canEncodePickInfo(picking_objectIndex)) {
    return vec4(0.0);
  }

  int encodedObjectIndex = picking_objectIndex + 1;
  int red = encodedObjectIndex % 256;
  int green = (encodedObjectIndex / 256) % 256;
  int blue = (encodedObjectIndex / 65536) % 256;
  int alpha = picking.batchIndex + 1;

  return vec4(float(red), float(green), float(blue), float(alpha)) / 255.0;
}

vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (!picking_canEncodePickInfo(picking_objectIndex)) {
      discard;
    }
    return picking_getPickingColor();
  }

  return color;
}

vec4 picking_filterColor(vec4 color) {
  vec4 outColor = color;
  outColor = picking_filterHighlightColor(outColor);
  outColor = picking_filterPickingColor(outColor);
  return outColor;
}
`;

/**
 * Provides support for object-index based color picking and highlighting.
 */
export const picking = {
  ...pickingUniforms,
  name: 'picking',
  source,
  vs,
  fs
} as const satisfies ShaderModule<PickingProps, PickingUniforms, PickingBindings>;
