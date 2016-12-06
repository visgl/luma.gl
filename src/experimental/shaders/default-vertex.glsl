#define SHADER_NAME luma_default_vertex

// object attributes
attribute vec3 positions;
attribute vec3 normals;
attribute vec4 colors;
attribute vec4 pickingColors;
attribute vec2 texCoords;

void main(void) {
  lighting_setPositionAndNormal(positions, normals);
  lighting_apply_light(positions);
  lighting_apply_reflection(positions);

  vTexCoord = texCoords;

  gl_Position = projectionMatrix * worldMatrix * vec4(positions, 1.0);
}
