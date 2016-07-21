attribute vec3 position;
attribute vec3 normal;

uniform float RESOLUTIONX;
uniform float RESOLUTIONY;

varying vec4 vPosition;
attribute vec2 texCoord1;

uniform sampler2D sampler1;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

varying vec2 vTexCoord;

#include "packing.glsl"

float height(vec2 position) {
  return decode(texture2D(sampler1, position));
} 

void main(void) {
  vTexCoord = texCoord1;
  vPosition = vec4(position.xyz - normal * height(vTexCoord), 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}
