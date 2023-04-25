/** Helper for type downcasts, e.g. Buffer -> WebGPUBuffer */
export function cast<T>(value: any) {
  return value as T;
}
