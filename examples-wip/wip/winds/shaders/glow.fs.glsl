#ifdef GL_ES
precision highp float;
#endif

#define WIDTH 1024.
#define HEIGHT 512.
#define DELTA 10.
#define DELTA_SQ 100.

varying vec2 vTexCoord1;

uniform sampler2D sampler1;

void main(void) {
  vec4 fragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
  float dx;
  float dy;

  //Add glow
  for (float i = - DELTA; i <= DELTA; i+=0.5) {
    dx = float(i);
    for (float j = - DELTA; j <= DELTA; j+=0.5) {
      dy = float(j);
      vec4 sampling = texture2D(sampler1, vec2((gl_FragCoord.x + dx) / WIDTH,
                                               (gl_FragCoord.y + dy) / HEIGHT));
      fragmentColor += sampling * 1. / (5. + abs(float(dx)) + abs(float(dy)));
    }
  }
  /* fragmentColor += texture2D(sampler1, vec2(gl_FragCoord.x / WIDTH, gl_FragCoord.y / HEIGHT));*/
  
  gl_FragColor = vec4(fragmentColor.rgb, 1.0);
}


