#define PI4 0.78539816339745
#define PI2 6.28318530717959
#define DELTA 0.001

attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

uniform float lat;
uniform float lon;

uniform vec3 dataFrom;
uniform vec3 dataTo;
uniform float delta;

uniform bool selected;

varying vec2 vTexCoord;
varying vec3 vColor;
varying float vAngle;
varying float vRadius;

vec3 getRGB(float h, float s, float v) {
  float c = v * s;
  h /= 60.;
  float x = c * (1. - abs( mod(h, 2.) - 1. ));
  vec3 rgbp;

  if (h < 1.) {
    rgbp = vec3(c, x, 0);
  } else if (h < 2.) {
    rgbp = vec3(x, c, 0);
  } else if (h < 3.) {
    rgbp = vec3(0, c, x);
  } else if (h < 4.) {
    rgbp = vec3(0, x, c);
  } else if (h < 5.) {
    rgbp = vec3(x, 0, c);
  } else {
    rgbp = vec3(c, 0, x);
  }

  float m = v - c;

  return rgbp + vec3(m);
}

void main(void) {
  vec3 pos = vec3(lon, lat, 0);
  vec3 data = dataFrom + (dataTo - dataFrom) * delta;

  //check angle direction
  float angleFrom = dataFrom.x * PI4;
  float angleTo = dataTo.x * PI4;
  float angle;

  if (abs(data.x - 8.) < DELTA) {
    vAngle = -1.;
  } else {
    if (angleFrom > angleTo
     && angleFrom - angleTo > PI2 + angleTo - angleFrom) {
      angleTo += PI2;
    } else if (angleTo > angleFrom
            && angleTo - angleFrom > PI2 + angleFrom - angleTo) {
      angleFrom += PI2;
    }
    angle = angleFrom + delta * (angleTo - angleFrom);
    vAngle = angle;
  }

  float scale = data.y / 350.;
  float h;
  if (data.z == 0.) {
    h = 150.;
  } else {
    h = clamp((data.z - 77.) / 204., 0., 1.) - .3;
  }

  const float offset = (4096. - 3764.) / 2. * (1. / 4096.);
  const float fromy = 25.;
  const float toy = 50.;
  const float fromx = 65.;
  const float tox = 125.;

  const float fromyt = -0.25;
  const float toyt = 0.25;
  const float fromxt = 0.5 - offset;
  const float toxt = -0.5 + offset;

  pos.x  = (pos.x - fromx) / (tox - fromx) * (toxt - fromxt) + fromxt;
  pos.y  = (pos.y - fromy) / (toy - fromy) * (toyt - fromyt) + fromyt;
  pos.z = .0001 / (scale + .1);

  pos = vec3(position.xy * scale, 0) + pos;

  vTexCoord = texCoord1;
  vColor = getRGB(clamp(.5 - h, 0., 1.) * 360., 1., 1.);
  vRadius = scale;

  gl_Position = projectionMatrix * worldMatrix * vec4(pos, 1);
}

