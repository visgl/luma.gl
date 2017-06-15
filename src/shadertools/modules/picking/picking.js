const DEFAULT_SELECTION_COLOR = new Uint8Array([0, 64, 128, 64]);

/* eslint-disable camelcase */
function getUniforms({
  selectedPickingColor = -1,
  highlightColor = DEFAULT_SELECTION_COLOR,
  active = false // Usually only set to true when rendering to off-screen "picking" buffer
} = {}) {
  return {
    picking_uHighlightColor: highlightColor,
    picking_uSelectedPickingColor: selectedPickingColor,
    picking_uActive: active
  };
}

const vertexShader = `\
uniform vec3 picking_uSelectedPickingColor;

varying vec3 picking_vPickingColor;
varying float picking_vHighlightThisItem;

void picking_setPickingColor(vec3 pickingColor) {
  // Stores the picking color so that the fragment shader can render it during picking
  picking_vPickingColor = pickingColor;
  // Do the comparison with selected item color in vertex shader as it should mean fewer compares
  picking_vHighlightThisItem = float(pickingColor == picking_uSelectedPickingColor);
}

void picking_setPickingColor(vec4 pickingColor) {
  picking_setPickingColor(pickingColor.rgb);
}
`;

const fragmentShader = `\
uniform bool picking_uActive; // true during rendering to offscreen picking buffer
uniform vec4 picking_uHighlightColor;

varying vec3 picking_vPickingColor;
varying float picking_vHighlightThisItem;

/*
 * Returns highlight color if picking enabled
 * Note: Should be normally be called before other
 */
vec4 picking_filterHighlight(vec4 color) {
  return bool(picking_vHighlightThisItem) ? picking_uHighlightColor : color;
}

/*
 * Returns picking color if picking enabled
 * Note: Should be called last, picking color must not be modified.
 */
vec4 picking_filterColor(vec4 color) {
  return picking_uActive ?
    vec4(picking_vPickingColor, 1.0) :
    picking_filterHighlight(color);
}
`;

export default {
  name: 'picking',
  vertexShader,
  fragmentShader,
  getUniforms
};

