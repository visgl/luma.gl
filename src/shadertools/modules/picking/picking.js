const DEFAULT_HIGHLIGHT_COLOR = new Uint8Array([0, 64, 128, 64]);

const DEFAULT_MODULE_OPTIONS = {
  pickingSelectedColor: null, //  Set to a picking color to visually highlight that item
  pickingHighlightColor: DEFAULT_HIGHLIGHT_COLOR, // Color of visual highlight of "selected" item
  pickingNullColor: [-1, 0, 0],
  pickingThreshold: 1.0,
  pickingActive: false // Set to true when rendering to off-screen "picking" buffer
};

/* eslint-disable camelcase */
function getUniforms(opts = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};
  if (opts.pickingSelectedColor !== undefined) {
    let selectedColor = opts.pickingNullColor || DEFAULT_MODULE_OPTIONS.pickingNullColor;
    if (opts.pickingSelectedColor) {
      selectedColor = [
        opts.pickingSelectedColor[0],
        opts.pickingSelectedColor[1],
        opts.pickingSelectedColor[2]
      ];
      // console.log('selected picking color', selectedColor);
      uniforms.picking_uSelectedPickingColor = selectedColor;
    }
  }
  if (opts.pickingHighlightColor !== undefined) {
    uniforms.picking_uHighlightColor = opts.pickingHighlightColor;
  }
  // TODO - major hack - decide on normalization and remove
  if (opts.pickingThreshold !== undefined) {
    uniforms.picking_uThreshold = opts.pickingThreshold;
  }
  if (opts.pickingActive !== undefined) {
    uniforms.picking_uActive = opts.pickingActive ? 1 : 0;
  }
  return uniforms;
}

const vs = `\
uniform vec3 picking_uSelectedPickingColor;
uniform float picking_uThreshold;

varying vec4 picking_vRGBcolor_Aselected;

const float COLOR_SCALE = 1. / 256.;

bool equalColors(vec3 color1, vec3 color2) {
  return
    abs(color1.r - color2.r) < picking_uThreshold &&
    abs(color1.g - color2.g) < picking_uThreshold &&
    abs(color1.b - color2.b) < picking_uThreshold;
}

void picking_setPickingColor(vec3 pickingColor) {
  // Do the comparison with selected item color in vertex shader as it should mean fewer compares
  picking_vRGBcolor_Aselected.a =
    float(equalColors(pickingColor, picking_uSelectedPickingColor));

  // Stores the picking color so that the fragment shader can render it during picking
  picking_vRGBcolor_Aselected.rgb = pickingColor * COLOR_SCALE;
}
`;

const fs = `\
uniform bool picking_uActive; // true during rendering to offscreen picking buffer
uniform vec3 picking_uSelectedPickingColor;
uniform vec4 picking_uHighlightColor;

varying vec4 picking_vRGBcolor_Aselected;

const float COLOR_SCALE = 1. / 256.;

/*
 * Returns highlight color if this item is selected
 * Note: Should be normally be called before other
 */
vec4 picking_filterHighlight(vec4 color) {
  bool selected = bool(picking_vRGBcolor_Aselected.a);
  return selected ? picking_uHighlightColor : color;
}

/*
 * Returns picking color if picking enabled
 * Note: Should be called last, picking color must not be modified.
 */
vec4 picking_filterColor(vec4 color) {
  vec3 pickingColor = picking_vRGBcolor_Aselected.rgb;
  return picking_uActive ?
    vec4(pickingColor, 1.0) :
    picking_filterHighlight(color);
}
`;

export default {
  name: 'picking',
  vs,
  fs,
  getUniforms
};

