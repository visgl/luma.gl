#define SHADER_NAME scene.vs

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uShadowView;
uniform mat4 uShadowProj;

varying vec4 shadowCoord;
varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  normal = vec3(uModel * vec4(aNormal, 0.0));
  mat4 bias = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.5, 0.5, 0.5, 1.0
  );
  shadowCoord = bias * uShadowProj * uShadowView * uModel * vec4(aPosition, 1.0);
}
