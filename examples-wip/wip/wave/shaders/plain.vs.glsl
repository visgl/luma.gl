attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float currentTime;

varying vec2 vTexCoord;

void main(void) {
   vTexCoord = texCoord1;
   gl_Position = vec4(position.x * 2., position.y * 2., 0, 1);
}