attribute vec3 position;
attribute vec2 texCoord1;
varying vec2 vTexCoord1;

void main(void) {
  vTexCoord1 = texCoord1;
  gl_Position = vec4(position.x * 2., position.y * 2., 0, 1);
}