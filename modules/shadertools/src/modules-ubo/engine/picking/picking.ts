import {NumberArray} from '../../../types';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {ShaderModule} from '../../../lib/shader-module/shader-module';

// cyan color
const DEFAULT_HIGHLIGHT_COLOR = new Float32Array([0, 1, 1, 1]);

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
  isActive?: boolean;
  /** Set to true when picking an attribute value instead of object index */
  isAttribute: boolean;
  /** Color range 0-1 or 0-255 */
  useNormalizedColors?: boolean;
  /** Do we have a highlighted item? */
  isHighlightActive?: boolean;
  /** Set to a picking color to visually highlight that item */
  highlightedObjectColor?: NumberArray; 
  /** Color of visual highlight of "selected" item */
  highlightColor?: NumberArray;
};

const vs = glsl`\
uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useNormalizedColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return color;
  // return picking.useNormalizedColors > 0.5 ? color : color / 255.0;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return color;
  // return picking.useNormalizedColors > 0.5 ? color : color / 255.0;
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

    // if (!bool(picking.isAttribute)) {
    // Stores the picking color so that the fragment shader can render it during picking
    picking_vRGBcolor_Avalid.rgb = pickingColor;
    // }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
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

const fs = glsl`\
uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useNormalizedColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

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
export const colorPicking: ShaderModule<PickingUniforms> = {
  name: 'colorPicking',
  vs,
  fs,
  uniformTypes: {
    isActive: 'f32',
    isAttribute: 'f32',
    useNormalizedColors: 'f32',
    isHighlightActive: 'f32',
    highlightedObjectColor: 'vec3<f32>',
    highlightColor: 'vec4<f32>'
  },
  defaultUniforms: {
    isActive: false,
    isAttribute: false,
    useNormalizedColors: true,
    isHighlightActive: false,
    highlightedObjectColor: new Float32Array([0, 0, 0]),
    highlightColor: DEFAULT_HIGHLIGHT_COLOR
  },
  getUniforms
};

function getUniforms(opts: Partial<PickingUniforms> = {}, prevUniforms?: PickingUniforms): PickingUniforms {
  const uniforms = {...colorPicking.defaultUniforms};

  if (opts.highlightedObjectColor !== undefined) {
    if (!opts.highlightedObjectColor) {
      uniforms.isHighlightActive = false;
    } else {
      uniforms.isHighlightActive = true;
      const highlightedObjectColor = opts.highlightedObjectColor.slice(0, 3);
      uniforms.highlightedObjectColor = highlightedObjectColor;
    }
  }

  if (opts.highlightColor) {
    const color = Array.from(opts.highlightColor, (x) => x / 255);
    if (!Number.isFinite(color[3])) {
      color[3] = 1;
    }
    uniforms.highlightColor = color;
  }

  if (opts.isActive !== undefined) {
    uniforms.isActive = Boolean(opts.isActive);
    uniforms.isAttribute = Boolean(opts.isAttribute);
  }

  return uniforms;
}
