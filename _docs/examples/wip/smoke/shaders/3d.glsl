uniform float FIELD_RESO;
float pixel = 1./ FIELD_RESO;

vec3 get(sampler2D field, float x, float y, float z) {
  if (x < 0. || x >= 1. || y < 0. || y >= 1. || z < 0. || z >= 1.) {
    return vec3(0);
  }
  return texture2D(sampler1, vec2(floor(x * FIELD_RESO) / FIELD_RESO, (floor(y * FIELD_RESO) + floor(z * FIELD_RESO) / FIELD_RESO) / FIELD_RESO)).xyz;
}

float interp(float x) {
  return ((6. * x - 15.) * x + 10.) * x * x * x;
}

vec3 getAA(sampler2D field, float x, float y, float z) {
  return 
  mix(
    mix(
      mix(get(field, x, y, z), get(field, x + pixel, y, z), interp(fract(x * FIELD_RESO))), 
      mix(get(field, x, y + pixel, z), get(field, x + pixel, y + pixel, z), interp(fract(x * FIELD_RESO))), 
      interp(fract(y * FIELD_RESO))
    ), 
    mix(
      mix(get(field, x, y, z + pixel), get(field, x + pixel, y, z + pixel), interp(fract(x * FIELD_RESO))), 
      mix(get(field, x, y + pixel, z + pixel), get(field, x + pixel, y + pixel, z + pixel), interp(fract(x * FIELD_RESO))), 
      interp(fract(y * FIELD_RESO))
    ), 
    interp(fract(z * FIELD_RESO))
  );
}

vec3 getAA(sampler2D field, vec3 position){
  float x = position.x - 0.5 / FIELD_RESO;
  float y = position.y - 0.5 / FIELD_RESO;
  float z = position.z - 0.5 / FIELD_RESO;
  return getAA(field, x, y, z);
}

vec3 dx(sampler2D field, float x, float y, float z) {
  return (get(field,x + pixel, y, z) - get(field, x, y, z));
}

vec3 dy(sampler2D field, float x, float y, float z) {
  return (get(field,x, y + pixel, z) - get(field, x, y, z));
}

vec3 dz(sampler2D field, float x, float y, float z) {
  return (get(field,x, y, z + pixel) - get(field, x, y, z));
}