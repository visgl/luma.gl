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
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = mod(yt, heightDim) / heightDim * (to - from) + from;
    } else {
      xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    }
  } else {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      xt = 1. - mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    } else {
      xt = 1. - mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = mod(yt, heightDim) / heightDim * (to - from) + from;
    }
  }
  return vec2(xt, yt);
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
