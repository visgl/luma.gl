/* eslint-disable max-params */

export function multiDrawArraysPolyfill(
  gl,
  mode,
  firstsList,
  firstsOffset,
  countsList,
  countsOffset,
  drawCount
) {
  for (let i = 0; i < drawCount; i++) {
    const first = firstsList[firstsOffset + i];
    const count = countsList[countsOffset + i];
    if (count > 0) {
      gl.drawArray(mode, first, count);
    }
  }
}

export function multiDrawElementsPolyfill(
  gl,
  mode,
  countsList,
  countsOffset,
  type,
  offsetsList,
  offsetsOffset,
  drawCount
) {
  for (let i = 0; i < drawCount; i++) {
    const offset = offsetsList[offsetsOffset + i];
    const count = countsList[countsOffset + i];
    if (count[i] > 0) {
      gl.drawElements(mode, count, type, offset);
    }
  }
}

export function multiDrawArraysInstancedPolyfill(
  gl,
  mode,
  firstsList,
  firstsOffset,
  countsList,
  countsOffset,
  instanceCountsList,
  instanceCountsOffset,
  drawCount
) {
  for (let i = 0; i < drawCount; i++) {
    const first = firstsList[firstsOffset + i];
    const count = countsList[countsOffset + i];
    if (count > 0) {
      gl.drawArray(mode, first, count);
    }
  }
}

export function multiDrawElementsInstancedPolyfill(
  gl,
  mode,
  countsList,
  countsOffset,
  type,
  offsetsList,
  offsetsOffset,
  instanceCountsList,
  instanceCountsOffset,
  drawCount
) {
  for (let i = 0; i < drawCount; i++) {
    const offset = offsetsList[offsetsOffset + i];
    const count = countsList[countsOffset + i];
    if (count[i] > 0) {
      gl.drawElements(mode, count, type, offset);
    }
  }
}
