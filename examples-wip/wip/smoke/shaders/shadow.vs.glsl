attribute float indices;

uniform sampler2D sampler1;
uniform vec3 lightPosition;
uniform float platform;
uniform float SHADOW_RESO;
varying vec3 position;
varying vec4 color;

void main(void) {
  vec4 samp = texture2D(sampler1, vec2(mod(indices, 256.0) / 256.0, floor(indices / 256.0) /256.0));
  position = samp.xyz * 2. - 1.;
  float z = samp.z, ratio = (platform - lightPosition.z) / (position.z - lightPosition.z);
  position = mix(lightPosition, position, ratio);
  gl_Position = vec4(position.xy / 1.5, 1. - z, 1);
  
  float alpha = clamp(1. - pow((1. - samp.w), .5), 0., 1.);
  gl_PointSize = SHADOW_RESO / 30. / (z + 1.) * (max(0.5, alpha)) * ratio;
  
  color = vec4(0, 0, z, clamp(0.5 / (abs(z - platform) + 1.), 0., 1.));
}