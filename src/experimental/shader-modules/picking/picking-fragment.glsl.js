export default `\
// picking configs
uniform bool picking_uEnabled;
uniform vec3 picking_uSelectedPickingColor;
uniform vec3 picking_uHighlightColor;
varying vec3 picking_vPickingColor;

/*
 * Returns picking color if picking enabled
 * Note: Should be called last, picking color must not be modified.
 */
vec4 picking_filterColor(vec4 color) {
  // set picking
  if (picking_uEnabled) {
  	return picking_vPickingColor;
  } else {
  	return color;
  }
}
`;
