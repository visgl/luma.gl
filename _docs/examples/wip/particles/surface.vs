attribute vec3 position;

uniform sampler2D sampler1;
uniform float size;
uniform float pointSize;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying vec3 vPosition;
varying float opacity;

void main(void) {
  gl_PointSize = pointSize;

  vec2 uv = position.xy;
  vec4 data = texture2D(sampler1, uv);
  data.x *= 15.;
  data.y -= 0.4 - data.z * 4.;
  data.z *= 15.;
  vPosition = data.xyz;
  opacity = data.z * data.y;

  gl_Position = projectionMatrix * worldMatrix * vec4(vPosition, 1.0);

}

