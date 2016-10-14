float random(vec3 scale, float seed) {
 return fract(asin(sin(dot(gl_FragCoord.xyz + seed, scale))) * 43758.5453 + seed);
}

vec3 noise(vec3 pos) {
  return vec3(
      random(vec3(12.9898, 78.233, 151.7182), pos.x),
      random(vec3(63.7264, 10.873, 623.6736), pos.y + 243.5),
      random(vec3(36.7539, 50.3658, 306.2759), pos.z)
    );
}
