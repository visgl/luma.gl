#define SHADER_NAME scene.vs

attribute vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
