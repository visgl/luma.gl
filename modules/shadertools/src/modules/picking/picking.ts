import {NumberArray} from '../../types';
import {glsl} from '../../lib/glsl-utils/highlight';

/* eslint-disable camelcase */

const DEFAULT_HIGHLIGHT_COLOR = new Uint8Array([0, 255, 255, 255]);

export type PickingOptions = {
  pickingSelectedColor?: NumberArray | null, //  Set to a picking color to visually highlight that item
  pickingHighlightColor?: NumberArray, // Color of visual highlight of "selected" item
  pickingActive?: boolean, // Set to true when rendering to off-screen "picking" buffer
  pickingAttribute: boolean // Set to true when picking an attribute value instead of object index
}

export type PickingUniforms = {
  picking_uActive?: boolean;
  picking_uAttribute?: boolean;
  picking_uSelectedColorValid?: number;
  picking_uSelectedColor?: NumberArray;
  picking_uHighlightColor?: NumberArray;
}

const DEFAULT_MODULE_OPTIONS: Required<PickingOptions> = {
  pickingActive: false, // Set to true when rendering to off-screen "picking" buffer
  pickingAttribute: false, // Set to true when picking an attribute value instead of object index
  pickingSelectedColor: null, //  Set to a picking color to visually highlight that item
  pickingHighlightColor: DEFAULT_HIGHLIGHT_COLOR, // Color of visual highlight of "selected" item
};

function getUniforms(options = DEFAULT_MODULE_OPTIONS): PickingUniforms {
  const uniforms: PickingUniforms = {};
  if (options.pickingActive !== undefined) {
    uniforms.picking_uActive = Boolean(options.pickingActive);
    uniforms.picking_uAttribute = Boolean(options.pickingAttribute);
  }

  if (options.pickingSelectedColor !== undefined) {
    if (options.pickingSelectedColor) {
      const selectedColor = options.pickingSelectedColor.slice(0, 3);
      uniforms.picking_uSelectedColorValid = 1;
      uniforms.picking_uSelectedColor = selectedColor;
    } else {
      uniforms.picking_uSelectedColorValid = 0;
    }
  }
  if (options.pickingHighlightColor) {
    const color = Array.from(options.pickingHighlightColor, (x) => x / 255);
    if (!Number.isFinite(color[3])) {
      color[3] = 1;
    }
    uniforms.picking_uHighlightColor = color;
  }
  return uniforms;
}

const vs = glsl`\
uniform bool picking_uActive;
uniform bool picking_uAttribute;
uniform vec3 picking_uSelectedColor;
uniform bool picking_uSelectedColorValid;

out vec4 picking_vRGBcolor_Avalid;

const float COLOR_SCALE = 1. / 255.;

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.001;
}

bool isVertexPicked(vec3 vertexColor) {
  return
    picking_uSelectedColorValid &&
    !picking_isColorValid(abs(vertexColor - picking_uSelectedColor));
}

void picking_setPickingColor(vec3 pickingColor) {
  if (picking_uActive) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    // if (!picking_uAttribute) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor; //  * COLOR_SCALE;
    // }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexPicked(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.r = value;
  }
}
void picking_setPickingAttribute(vec2 value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}
void picking_setPickingAttribute(vec3 value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`;

const fs = glsl`\
uniform bool picking_uActive;
uniform vec3 picking_uSelectedColor;
uniform vec4 picking_uHighlightColor;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  if (picking_uActive) {
    return color;
  }
  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    float highLightAlpha = picking_uHighlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking_uHighlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (picking_uActive) {
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
  vec4 highightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highightColor);
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
  name: 'picking',
  vs,
  fs,
  getUniforms
};
