export function fp64ify(a) {
  const hi = Math.fround(a);
  const lo = a - Math.fround(a);
  return new Float32Array([hi, lo]);
}
