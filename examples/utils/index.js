// Create a deterministic pseudorandom number generator
export function getRandom() {
  let s = 1;
  let c = 1;
  return () => {
    s = Math.sin(c * 17.23);
    c = Math.cos(s * 27.92);
    return fract(Math.abs(s * c) * 1432.71);
  };
}

function fract(n) {
  return n - Math.floor(n);
}
