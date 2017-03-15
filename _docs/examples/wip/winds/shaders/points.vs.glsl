attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

void main(void) {
  vec4 pos = vec4(position, 1.);

  const float offset = (4096. - 3764.) / (2. * 3764.);
  const float fromy = 25.;
  const float toy = 50.;
  const float fromx = 65.;
  const float tox = 125.;

  const float fromyt = -0.5;
  const float toyt = 0.5;
  const float fromxt = 1. - offset;
  const float toxt = -1. + offset;
  
  pos.x = (pos.x - fromx) / (tox - fromx) * (toxt - fromxt) + fromxt;
  pos.y = (pos.y - fromy) / (toy - fromy) * (toyt - fromyt) + fromyt;
  pos.z = 0.;
  
  gl_Position = projectionMatrix * worldMatrix * pos;
  gl_PointSize = 1.;
}


