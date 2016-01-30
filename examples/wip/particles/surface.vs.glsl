attribute vec3 position;

uniform sampler2D map;
uniform float size;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseTransposeMatrix;

varying vec2 vUv;
varying vec3 vPosition;
varying float opacity;

void main() {

  vec2 uv = position.xy + vec2( 0.5 / size, 0.5 / size );
  vec4 data = texture2D(map, uv);

  vPosition = data.xyz;
  opacity = data.w;

  gl_PointSize = 1.0; // data.w * 10.0 + 1.0;
  gl_Position = projectionMatrix * worldMatrix * vec4( vPosition, 1.0 );

}

