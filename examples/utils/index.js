// Create a deterministic pseudorandom number generator
export function getRandom() {
  let i = 0;
  return () => {
    return Math.abs(Math.sin(i++ * 17.23) * Math.cos(i++ * 27.92));
  };
}
