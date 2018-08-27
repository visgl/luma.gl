const TYPES = ['SCALAR', 'VEC2', 'VEC3', 'VEC4'];

const ARRAY_TO_COMPONENT_TYPE = new Map([
  [Int8Array, 5120],
  [Uint8Array, 5121],
  [Int16Array, 5122],
  [Uint16Array, 5123],
  [Uint32Array, 5125],
  [Float32Array, 5126]
]);

export function getAccessorType(size) {
  const type = TYPES[size - 1];
  return type || TYPES[0];
}

export function getAccessorComponentType(typedArray) {
  const componentType = ARRAY_TO_COMPONENT_TYPE.get(typedArray.constructor);
  if (!componentType) {
    throw new Error('Illegal typed array');
  }
  return componentType;
}
