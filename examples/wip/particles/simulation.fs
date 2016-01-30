#ifdef GL_ES
precision highp float;
#endif

#define WAVES_LENGTH 2
#define POINTS_LENGTH 12

/*uniform float opacity;*/
uniform sampler2D sampler1;

uniform float timer;
varying vec2 vTexCoord1;

uniform vec4 waves[WAVES_LENGTH];
uniform vec4 points[POINTS_LENGTH];

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(void) {

  vec4 pos = texture2D(sampler1, vTexCoord1);
  vec2 p = vTexCoord1;

  float wave = 0.;
  vec4 w;
  for (int i = 0; i < WAVES_LENGTH; ++i) {
    w = waves[i];
    wave += sin(mix(p.s, p.t, w.x) * w.y + timer * w.z) * 0.02;
  }
  /*pos.y = wave;*/

  for (int i = 0; i < POINTS_LENGTH; i++) {
    vec4 point = points[i];
    float radius = mod(timer * 1.1 + point.z, 50.) / 50.;
    float dist = distance(point.xy, p);
    if (dist > radius) {
      continue;
    }
    float d = abs(radius - dist);
    vec2 diff = (point.xy - p);
    wave += sin(dot(diff, diff) * 400. + radius) * 0.2 * pow((1. - radius), 10.) / (d * 10. + 1.);
  }
  pos.y = wave;

  /*if ( pos.w <= 0.0 ) discard;*/

  /*float x = pos.x + timer * 5.0;*/
  /*float y = pos.y;*/
  /*float z = pos.z + timer * 4.0;*/

  /*pos.x += sin( y * 0.033 ) * cos( z * 0.037 ) * 0.4;*/
  /*pos.y += sin( x * 0.035 ) * cos( x * 0.035 ) * 0.4;*/
  /*pos.z += sin( x * 0.037 ) * cos( y * 0.033 ) * 0.4;*/
  /*pos.w -= 0.00001;*/

  gl_FragColor = pos;
  /*gl_FragColor = vec4(vUv, length(vUv), 1);*/
  /*gl_FragColor = vec4(1, 0, 0, 1);*/
}
