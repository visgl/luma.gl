// Recommendation is to ignore message but current test suite checks agains the
// message so keep it for now.
export function assert(condition: unknown, message?: string): void {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}

export default assert;
