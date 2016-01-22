#ifdef GL_ES
precision highp float;
#endif

#define PI 3.141592654
#define PI2 (3.141592654 * 2.)

#define PATTERN_DIM 128.0

uniform float offset;
uniform float rotation;
uniform vec2 scaling;
uniform vec2 resolution;
uniform float radialFactor;

uniform sampler2D sampler1;

float cubic(float x) {
  x = abs(x);
  const float a = -0.5;
  if (x <= 1.0) {
    return ((a + 2.0) * x - (a + 3.0)) * x * x + 1.0;
  } else if (x < 2.0) {
    return a * (((x - 5.0) * x + 8.0) * x - 4.0);
  } else {
    return 0.0;
  }
}

vec4 sampDirNearest(float x, float y) {
  return texture2D(sampler1, vec2(floor(mod(x, PATTERN_DIM)) / PATTERN_DIM, floor(mod(y, PATTERN_DIM)) / PATTERN_DIM));
}

vec4 sampNearest(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  return sampDirNearest(x, y);
}

vec4 sampLinear(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix(
    mix(sampDirNearest(x, y), sampDirNearest(x + 1.0, y), fx),
    mix(sampDirNearest(x, y + 1.0), sampDirNearest(x + 1.0, y + 1.0), fx),
    fy);
}

vec4 mix4(vec4 c1, vec4 c2, vec4 c3, vec4 c4, float fr) {
  return ((((-c1+c2-c3+c4)*fr+(2.0*c1-2.0*c2+c3-c4))*fr)+(-c1+c3))*fr+c2;
}

vec4 sampCubic(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix4(
    mix4(sampDirNearest(x-1.0,y-1.0), sampDirNearest(x,y-1.0), sampDirNearest(x+1.0,y-1.0), sampDirNearest(x+2.0,y-1.0),fx),
    mix4(sampDirNearest(x-1.0,y),     sampDirNearest(x,y),     sampDirNearest(x+1.0,y),     sampDirNearest(x+2.0,y),    fx),
    mix4(sampDirNearest(x-1.0,y+1.0), sampDirNearest(x,y+1.0), sampDirNearest(x+1.0,y+1.0), sampDirNearest(x+2.0,y+1.0),fx),
    mix4(sampDirNearest(x-1.0,y+2.0), sampDirNearest(x,y+2.0), sampDirNearest(x+1.0,y+2.0), sampDirNearest(x+2.0,y+2.0),fx),
    fy
  );
}

vec2 resampling(float xt, float yt) {
  const float w = 1.154700538379251529; // sqrt(4/3)
  const float w_2 = 0.5773502691896257; // sqrt(1/3)
  const float l = 0.3333333333;
  const float offsetX = 0.21132486540518711774542560; // (1 - sqrt(1/3))/2;

  float xtmod = mod(xt, w * PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(floor(yt / PATTERN_DIM), 2.0) < l) {
    xtmod = mod(xtmod + w_2, w);
  }

  if (xtmod > w_2) {
    if (ytmod > l && ytmod < l + l ||
      ytmod < l && ytmod > (w - xtmod) * w_2 ||
      ytmod > l + l && ytmod < 1.0 - (xtmod - w_2) * w_2
      ) {
      return vec2(xtmod - w_2 + offsetX, ytmod);
    }
  } else {
    if (ytmod > l && ytmod < l + l ||
        ytmod < l && ytmod > xtmod * w_2 ||
        ytmod > l + l && ytmod < 1.0 - (w_2 - xtmod) * w_2
        ) {
        return vec2(- xtmod * 0.5 + ytmod / w + offsetX, 1.0 - ytmod * 0.5 - xtmod / w);
      }
  }

  if (ytmod > l) {
    ytmod -= 1.0;
    xtmod = mod(xtmod + w_2, w);
  }

  return vec2(offsetX + (w - xtmod) * 0.5 - ytmod / w, 1.0 - (w - xtmod) / w - ytmod * 0.5);
}

float sinc(float x) {
  x *= PI;
  if (x == 0.0) return 1.0;
  return sin(x) / x;
}

void main(void) {
  vec2 pos = gl_FragCoord.xy;

  float xt =  pos.x * cos(rotation) * scaling.x + pos.y * sin(rotation) * scaling.y;
  float yt = -pos.x * sin(rotation) * scaling.x + pos.y * cos(rotation) * scaling.y;

  vec4 color = vec4(0, 0, 0, 0);
  const float d = 0.5;
  for (int i = 0; i < 7; i++) {
    float dx = -2.0 + d * float(i);
    float cx = cubic(dx);
    if (cx != 0.0) {
      for (int j = 0; j < 7; j++) {
        float dy = -2.0 + d * float(j);
        float cy = cubic(dy);
        if (cy != 0.0) {
          vec2 samp = resampling(xt + dx, yt + dy);
          color += sampNearest(samp.x, samp.y) * cx * cy * d * d;
        }
      }
    }
  }

  //add a radial blend
  vec4 colorFrom = color;
  vec4 colorTo = colorFrom * radialFactor;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float ratio = resolution.y / resolution.x;
  vec2 center = vec2(.5, .5);

  gl_FragColor = mix(colorFrom, colorTo, distance(uv, center) / distance(vec2(1., 1.), center));
}
