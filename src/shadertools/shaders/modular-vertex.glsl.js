export default `\
#define SHADER_NAME luma_modular_vertex

// object attributes
attribute vec3 positions;
attribute vec3 normals;
attribute vec4 colors;
attribute vec2 texCoords;
attribute vec4 pickingColors;

void main(void) {

#ifdef MODULE_MATERIAL
  material_setDiffuseColor(colors);
  material_setDiffuseTextureCoordinates(texCoords);
#endif

#ifdef MODULE_LIGHTING
  lighting_setPositionAndNormal(positions, normals);
  lighting_apply_light(positions);
  lighting_apply_reflection(positions);
#endif

#ifdef MODULE_PICKING
  picking_setPickingColor(pickingColors);
#endif

  gl_Position = vec4(positions, 1.0);
#ifdef MODULE_PROJECT
  gl_Position = project_position(gl_Position);
#endif
}
`;
