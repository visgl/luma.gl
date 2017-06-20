export default `\
#define SHADER_NAME luma-modular-fragment

#ifdef GL_ES
precision highp float;
#endif

// varyings
varying vec4 vColor;

void main(){
  gl_FragColor = vec4(1., 0., 0., 1.);

#ifdef MODULE_MATERIAL
  gl_FragColor = material_filterColor(gl_FragColor);
#endif

#ifdef MODULE_LIGHTING
  gl_FragColor = lighting_filterColor(gl_FragColor);
#endif

#ifdef MODULE_FOG
  gl_FragColor = fog_filterColor(gl_FragColor);
#endif

#ifdef MODULE_PICKING
  gl_FragColor = picking_filterColor(gl_FragColor);
#endif
}
`;
