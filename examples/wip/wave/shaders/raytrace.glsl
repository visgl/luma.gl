vec3 plainRT(vec3 dir, vec3 eye, vec3 u, vec3 v, vec3 c) {
  eye -= c;
  vec3 cuv = cross(u, v);
  float det = -dot(cuv, dir);
  mat3 mat = mat3(cross(dir, v), cross(u, dir), cuv);
  return eye * mat / det;
}