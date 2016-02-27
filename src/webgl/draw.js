// One of the good things about GL is that there are so many ways to draw things
import {getExtension} from './context';

// Call the proper draw function for the used program based on attributes etc
export function draw({gl, drawType, attributes, instanced, numInstances}) {
  const {indices, vertices} = attributes;
  // TODO - shouldn't the caller do this lookup
  drawType = drawType ? gl.get(drawType) : gl.POINTS;

  const numIndices = indices ? indices.value.length : 0;

  if (instanced && indices) {
    // this instanced primitive does has indices, use drawElements extension
    const extension = getExtension('ANGLE_instanced_arrays');
    extension.drawElementsInstancedANGLE(
      drawType, numIndices, gl.UNSIGNED_SHORT, 0, numInstances
    );
  } else if (instanced) {
    // this instanced primitive does not have indices, use drawArrays ext
    const extension = getExtension('ANGLE_instanced_arrays');
    const numVertices = vertices ? vertices.value.length : 0;
    extension.drawArraysInstancedANGLE(
      drawType, 0, numVertices / 3, numInstances
    );
  } else if (attributes.indices) {
    gl.drawElements(drawType, numIndices, gl.UNSIGNED_SHORT, 0);
  } else {
    // else if this.primitive does not have indices
    gl.drawArrays(drawType, 0, numInstances);
  }
}
