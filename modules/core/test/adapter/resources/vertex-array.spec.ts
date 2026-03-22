import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { VertexArray } from '@luma.gl/core';
test('VertexArray#construct/delete', async () => {
  for (const device of [await getWebGLTestDevice()]) {
    const vertexArray = device.createVertexArray({
      shaderLayout: {
        attributes: [],
        bindings: []
      },
      bufferLayout: []
    });
    expect(vertexArray instanceof VertexArray, 'VertexArray construction successful').toBeTruthy();
    vertexArray.destroy();
    expect(vertexArray instanceof VertexArray, 'VertexArray delete successful').toBeTruthy();
    vertexArray.destroy();
    expect(vertexArray instanceof VertexArray, 'VertexArray repeated destroy successful').toBeTruthy();
  }
});
