// One of the good things about GL is that there are so many ways to draw things
import {getExtension} from './context';
import assert from 'assert';

// For drawElements, size of indices
const INDEX_TYPES =
  gl => [gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT];

const DRAW_MODES =
  gl => [
    gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES,
    gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLES
  ];

// Call the proper draw function for the used program based on attributes etc
export function draw2({gl, drawMode, elementType, count, indices, vertices, instanced, numInstances}) {
  const numIndices = indices ? indices.value.length : 0;
  const numVertices = vertices ? vertices.value.length / 3 : 0;
  count = count || numIndices || numVertices;
  return draw({gl, drawMode, elementType, count, });
}

// Call the proper draw function for the used program based on attributes etc
export function draw({gl, drawMode, indexType, numPoints, numInstances}) {
  drawMode = drawMode || gl.POINTS;

  assert(DRAW_MODES(gl).indexOf(indexType) > -1, 'Invalid draw mode');
  assert(INDEX_TYPES(gl).indexOf(indexType) > -1, 'Invalid index type');

  if (numInstances) {
    // this instanced primitive does has indices, use drawElements extension
    const extension = getExtension('ANGLE_instanced_arrays');
    extension.drawElementsInstancedANGLE(
      drawMode, numPoints, indexType, 0, numInstances
    );
  } else if (indices) {
    gl.drawElements(drawMode, numIndices, indexType, 0);
  } else if (numInstances !== undefined) {
    // this instanced primitive does not have indices, use drawArrays ext
    const extension = getExtension('ANGLE_instanced_arrays');
    extension.drawArraysInstancedANGLE(
      drawMode, 0, numPoints, numInstances
    );
  } else {
    // else if this.primitive does not have indices
    gl.drawArrays(drawMode, 0, numPoints);
  }
}
