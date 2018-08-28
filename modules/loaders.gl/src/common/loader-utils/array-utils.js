export function padTo4Bytes(byteLength) {
  return (byteLength + 3) & ~3;
}

/* Creates a new Uint8Array based on two different ArrayBuffers
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
export function copyArrayBuffer(
  targetBuffer,
  sourceBuffer,
  byteOffset,
  byteLength = sourceBuffer.byteLength
) {
  const targetArray = new Uint8Array(targetBuffer, byteOffset, byteLength);
  const sourceArray = new Uint8Array(sourceBuffer);
  targetArray.set(sourceArray);
  return targetBuffer;
}
