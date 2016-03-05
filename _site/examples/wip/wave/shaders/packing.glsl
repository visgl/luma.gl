#if HAS_EXTENSION(OES_texture_float)
float decode(vec4 vec) {
  return vec.x;
}

vec4 encode(float number) {
  return vec4(number);
}

float texture2DBilinearDecoded(sampler2D tex, vec2 coord) {
  coord *= RESOLUTIONX;
  vec2 fxy = fract(coord),
    ixy = floor(coord) / RESOLUTIONX;
  float px = 1. / RESOLUTIONX;
  return mix( 
    mix(
      texture2D(tex, ixy).x,
      texture2D(tex, ixy + vec2(px, 0)).x,
      fxy.x
      ),
    mix(
      texture2D(tex, ixy + vec2(0, px)).x,
      texture2D(tex, ixy + vec2(px, px)).x,
      fxy.x
      ),
    fxy.y);
}
#else
const float SIGN_MARK = 128. / 255.;
const float SIGN_ADJUST = 127.;
float decode(vec4 vec) {
  if (vec.x > SIGN_MARK) {
    vec.x -= SIGN_MARK;
    return -float(vec.x + (vec.y + vec.z / 255.) / 255.) * exp2(vec.w * 255. - SIGN_ADJUST);
  } else {
    return float(vec.x + (vec.y + vec.z / 255.) / 255.) * exp2(vec.w * 255. - SIGN_ADJUST);
  }
  return vec.x;
}
vec4 encode(float number) {
  if (number > 0.) {
    float w = ceil(log2(number)) + 2.;
    number /= exp2(w);
    number *= 255.;
    w += SIGN_ADJUST;
    float x = floor(number);
    number = (number - x) * 255.;
    float y = floor(number);
    float z = (number - y) * 255.;
    return vec4(x, y, z, w) / 255.;
  } else if (number < 0.){
    number = -number;
    float w = ceil(log2(number)) + 2.;
    number /= exp2(w);
    number *= 255.;
    w += SIGN_ADJUST;
    float x = floor(number);
    number = (number - x) * 255.;
    float y = floor(number);
    float z = (number - y) * 255.;
    return vec4(x + 128., y, z, w) / 255.;
  } else {
    return vec4(0);
  }
}

float texture2DBilinearDecoded(sampler2D tex, vec2 coord) {
  coord *= RESOLUTIONX;
  vec2 fxy = fract(coord),
    ixy = floor(coord) / RESOLUTIONX;
  float px = 1. / RESOLUTIONX;
  return mix( 
    mix(
      decode(texture2D(tex, ixy)),
      decode(texture2D(tex, ixy + vec2(px, 0))),
      fxy.x
      ),
    mix(
      decode(texture2D(tex, ixy + vec2(0, px))),
      decode(texture2D(tex, ixy + vec2(px, px))),
      fxy.x
      ),
    fxy.y);
}
#endif