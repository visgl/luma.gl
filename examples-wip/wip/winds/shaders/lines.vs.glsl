#define PI2 1.5707963267949

attribute vec3 position;
attribute vec2 texCoord1;
attribute vec3 data;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D sampler1;
uniform float delta;

float getHue(vec4 sampling) {
  float r = sampling.r;
  float g = sampling.g;
  float b = sampling.b;
  float maxComp = max( max(r, g), b);
  float minComp = min( min(r, g), b);
  float c = maxComp - minComp;
  float hue;
  if (c <= 0.01) {
      hue = -1.;
  } else {
    if (maxComp == r) {
      hue = mod((g - b) / c, 6.);
    } else if (maxComp == g) {
      hue = (b - r) / c + 2.;
    } else {
      hue = (r - g) / c + 4.;
    }
    hue *= 60.; //hue [0, 360)
  }
  return hue;
}

void main(void) {
  float first = position.z;
  float angle = data.x * PI2;
  float windSpeed = data.y * delta / 5.;
  float temp = data.z;

  const float offset = (4096. - 3764.) / 2. * (1. / 4096.);
  const float fromy = 25.;
  const float toy = 50.;
  const float fromx = 65.;
  const float tox = 125.;

  const float fromyt = -0.25;
  const float toyt = 0.25;
  const float fromxt = 0.5 - offset;
  const float toxt = -0.5 + offset;
  
  vec4 pos  = vec4(position, 1.0);
  vec4 pos2 = vec4(position, 1.0);

  if (first > 0.) {
    pos2.x += cos (angle) * windSpeed;
    pos2.y += sin (angle) * windSpeed;
  }

  pos.x  = (pos.x - fromx) / (tox - fromx) * (toxt - fromxt) + fromxt;
  pos.y  = (pos.y - fromy) / (toy - fromy) * (toyt - fromyt) + fromyt;
  
  pos2.x = (pos2.x - fromx) / (tox - fromx) * (toxt - fromxt) + fromxt;
  pos2.y = (pos2.y - fromy) / (toy - fromy) * (toyt - fromyt) + fromyt;
  
  vec4 sampling = texture2D(sampler1, vec2(pos.x + 0.5, pos.y + 0.25 * 2.));
  float hue = getHue(sampling);
  
  if (hue == -1.) {
      pos.z = -.01;
  } else {
    float z;
    if (texCoord1.s <= 0.5 && texCoord1.s >= 0.25) {
      z = mod((360. - hue - 5.), 360.);
    } else {
      z = mod((360. - hue + 2.), 360.);
    }
    if (z < 0.) {
      z += 360.;
    }
    pos.z = exp(z / 3600.) -1.01;
  }
  
  pos.z += .01;

  gl_Position = projectionMatrix * worldMatrix * vec4(pos2.x, pos2.y, pos.z, 1.0);
  gl_PointSize = 3.;
}


