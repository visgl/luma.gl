#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler1;
uniform bool picking;
uniform float level;

varying vec2 vTexCoord;


void main(void) {
  if (picking) {
    gl_FragColor = vec4(0, 0, 0, 0);
    return;
  }
  vec4 color = texture2D(sampler1, vTexCoord);
  float avg = (color.r + color.g + color.b) / 3.;
  gl_FragColor = vec4(clamp((color.r + avg * level) / (level + 1.), 0., 1.), 
                      clamp((color.g + avg * level) / (level + 1.), 0., 1.), 
                      clamp((color.b + avg * level) / (level + 1.), 0., 1.), 1.0) * 0.5;
}

