// Avoid bundling assert polyfill module
export function assert(condition, message?: string): void {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}
