#line 1

vec4 envSampling(vec3 direction, vec3 from, sampler2D sampler1, sampler2D sampler2, sampler2D sampler3, sampler2D sampler4, sampler2D sampler5) {
  direction = normalize(direction);
  vec2 tex = vec2(atan(direction.y, direction.x) / 2. / PI - 0.3, -atan(direction.z, length(direction.xy)) / 2. / PI  + 0.5);
  vec3
    color0 = texture2D(sampler1, tex).xyz,
    color1 = texture2D(sampler2, tex).xyz,
    color2 = texture2D(sampler3, tex).xyz,
    color3 = texture2D(sampler4, tex).xyz; 
  return vec4((color0 + color1 + color2 + color3), 1);
}