/* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
import {getExtension, glGet} from './context';
import {assertWebGLRenderingContext, assertDrawMode, assertIndexType}
  from './webgl-checks';
import assert from 'assert';

// A good thing about webGL is that there are so many ways to draw things,
// e.g. depending on whether data is indexed and/or isInstanced.
// This function unifies those into a single call with simple parameters
// that have sane defaults.
export function draw(gl, {
  drawMode = gl.TRIANGLES,
  vertexCount,
  offset = 0,
  isIndexed = false,
  indexType = gl.UNSIGNED_SHORT,
  isInstanced = false,
  instanceCount = 0
}) {
  assertWebGLRenderingContext(gl);

  drawMode = glGet(gl, drawMode);
  indexType = glGet(gl, indexType);

  assertDrawMode(drawMode, 'in draw');
  if (isIndexed) {
    assertIndexType(indexType, 'in draw');
  }

  // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
  if (isInstanced) {
    const extension = gl.getExtension('ANGLE_instanced_arrays');
    if (isIndexed) {
      extension.drawElementsInstancedANGLE(
        drawMode, vertexCount, indexType, offset, instanceCount
      );
    } else {
      extension.drawArraysInstancedANGLE(
        drawMode, offset, vertexCount, instanceCount
      );
    }
  } else if (isIndexed) {
    gl.drawElements(drawMode, vertexCount, indexType, offset);
  } else {
    gl.drawArrays(drawMode, offset, vertexCount);
  }
}
