attribute vec3 position;
attribute vec3 endPosition;
attribute vec3 normal;
attribute vec3 endNormal;
attribute vec2 texCoord1;
attribute vec2 texCoord2;
attribute vec2 texCoord3;
attribute vec4 color;

uniform int action;
uniform float delta;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vEndTransformedNormal;
varying vec4 vTransformedNormal;
varying vec4 vEndPosition;
varying vec4 vPosition;
varying vec4 vColor;


void main(void) {
  //set delta
  float currentDelta = delta;
  //folding
  if (action == 1) {
    currentDelta = 1.0 - currentDelta;
  }
  
  vec3 currentPosition = position + (endPosition - position) * currentDelta;
  vec3 currentNormal = normal + (endNormal - normal) * currentDelta;

  vPosition = modelViewMatrix * vec4(currentPosition, 1.0);
  vTransformedNormal = normalMatrix * vec4(currentNormal, 1.0);
  vTexCoord1 = texCoord1;
  vTexCoord2 = texCoord2;
  vTexCoord3 = texCoord3;
  vColor = color;
  gl_Position = projectionMatrix * vPosition;
}
