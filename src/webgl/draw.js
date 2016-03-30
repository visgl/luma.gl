/* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
import {getExtension} from './context';
import {GL_INDEX_TYPES, GL_DRAW_MODES} from './types';
import assert from 'assert';

// A good thing about webGL is that there are so many ways to draw things,
// depending on whether data is indexed and/or instanced.
// This function unifies those into a single call with simple parameters
// that have sane defaults.
export function draw(gl, {
  drawMode = null, vertexCount, offset = 0,
  indexed, indexType = null,
  instanced = false, instanceCount = 0
}) {
  drawMode = drawMode ? gl.get(drawMode) : gl.TRIANGLES;
  indexType = indexType ? gl.get(indexType) : gl.UNSIGNED_SHORT;

  assert(GL_DRAW_MODES(gl).indexOf(drawMode) > -1, 'Invalid draw mode');
  assert(GL_INDEX_TYPES(gl).indexOf(indexType) > -1, 'Invalid index type');

  // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
  if (instanced) {
    const extension = gl.getExtension('ANGLE_instanced_arrays');
    if (indexed) {
      extension.drawElementsInstancedANGLE(
        drawMode, vertexCount, indexType, offset, instanceCount
      );
    } else {
      extension.drawArraysInstancedANGLE(
        drawMode, offset, vertexCount, instanceCount
      );
    }
  } else if (indexed) {
    gl.drawElements(drawMode, vertexCount, indexType, offset);
  } else {
    gl.drawArrays(drawMode, offset, vertexCount);
  }
}
