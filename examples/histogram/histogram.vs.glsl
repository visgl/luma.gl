attribute vec3 sphereVertices;
attribute vec3 sphereNormals;
attribute vec3 colors;
attribute vec3 rgb;
attribute vec3 hsl;
attribute vec3 hsv;
uniform float from;
uniform float to;
uniform float delta;
attribute float histogram;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 worldInverseTransposeMatrix;
uniform float size;

varying vec4 vTransformedNormal;
varying vec4 vPosition;
varying vec3 vColor;


void main(void) {
  vec3 fromPos;
  if (from == 0.0) {
    fromPos = rgb;
  } else if (from == 1.0) {
    fromPos = hsl;
  } else {
    fromPos = hsv;
  }
  
  vec3 toPos;
  if (to == 0.0) {
    toPos = rgb;
  } else if (to == 1.0) {
    toPos = hsl;
  } else {
    toPos = hsv;
  }

  vec3 translation = vec3(fromPos.x + (toPos.x - fromPos.x) * delta,
                          fromPos.y + (toPos.y - fromPos.y) * delta,
                          fromPos.z + (toPos.z - fromPos.z) * delta);


  float r = size + histogram;
  float theta = acos(sphereVertices.z / 0.1);
  float phi = atan(sphereVertices.y, sphereVertices.x);
  vec3 position = vec3(r * sin(theta) * cos(phi), 
                       r * sin(theta) * sin(phi), 
                       r * cos(theta));
  
  vPosition = worldMatrix * vec4(translation + position, 1.0);
  vTransformedNormal = worldInverseTransposeMatrix * vec4(sphereNormals, 1.0);
  vColor = colors;
  gl_Position = projectionMatrix * vPosition;
}
