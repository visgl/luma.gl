// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

import type {PickingProps, PickingUniforms, PickingBindings} from './picking-uniforms';
import {pickingUniforms, GLSL_UNIFORMS, WGSL_UNIFORMS} from './picking-uniforms';

const source = /* wgsl */ `\
${WGSL_UNIFORMS}
`;

const vs = /* glsl */ `\
${GLSL_UNIFORMS}
out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useFloatColors > 0.5 ? color : color / 255.0;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useFloatColors > 0.5 ? color : color / 255.0;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setObjectIndex(uint objectIndex) {
  if (bool(picking.isActive)) {
    uint index = objectIndex;
    if (picking.indexMode == PICKING_INDEX_MODE_INSTANCE) {
      index = uint(gl_InstanceID);
    }
    picking_vRGBcolor_Avalid.r = float(index % 255) / 255.0;
    picking_vRGBcolor_Avalid.g = float((index / 255) % 255) / 255.0;
    picking_vRGBcolor_Avalid.b = float((index / 255 / 255) %255) / 255.0;
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`;

const fs = /* glsl */ `\
${GLSL_UNIFORMS}

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`;

/**
 * Provides support for color-coding-based picking and highlighting.
 * In particular, supports picking a specific instance in an instanced
 * draw call and highlighting an instance based on its picking color,
 * and correspondingly, supports picking and highlighting groups of
 * primitives with the same picking color in non-instanced draw-calls
 */
export const picking = {
  ...pickingUniforms,
  name: 'picking',
  source,
  vs,
  fs
} as const satisfies ShaderModule<PickingProps, PickingUniforms, PickingBindings>;

// function getUniforms(opts: PickingProps = {}, prevUniforms?: PickingUniforms): PickingUniforms {
//   const uniforms = {} as PickingUniforms;

//   if (opts.highlightedObjectColor === undefined) {
//     // Unless highlightedObjectColor explicitly null or set, do not update state
//   } else if (opts.highlightedObjectColor === null) {
//     uniforms.isHighlightActive = false;
//   } else {
//     uniforms.isHighlightActive = true;
//     const highlightedObjectColor = opts.highlightedObjectColor.slice(0, 3);
//     uniforms.highlightedObjectColor = highlightedObjectColor;
//   }

//   if (opts.highlightColor) {
//     const color = Array.from(opts.highlightColor, x => x / 255);
//     if (!Number.isFinite(color[3])) {
//       color[3] = 1;
//     }
//     uniforms.highlightColor = color;
//   }

//   if (opts.isActive !== undefined) {
//     uniforms.isActive = Boolean(opts.isActive);
//     uniforms.isAttribute = Boolean(opts.isAttribute);
//   }

//   if (opts.useFloatColors !== undefined) {
//     uniforms.useFloatColors = Boolean(opts.useFloatColors);
//   }

//   return uniforms;
// }
