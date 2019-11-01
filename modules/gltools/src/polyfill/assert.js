export default function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'gltools: assertion failed.');
  }
}
