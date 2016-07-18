// TODO - this is the new picking for deck.gl
/* eslint-disable max-statements, no-try-catch */
import {GL, glContextWithState, FramebufferObject} from '../webgl';
import {assertWebGLRenderingContext} from '../webgl/webgl-checks';
import Group from './group';
import assert from 'assert';

const ILLEGAL_ARG = 'Illegal argument to pick';

export function pickModels(gl, {
  group,
  camera,
  viewMatrix,
  x,
  y,
  pickingFBO = null,
  pickingProgram = null,
  pickingColors = null
}) {
  assertWebGLRenderingContext(gl);
  assert(group instanceof Group, ILLEGAL_ARG);
  assert(Array.isArray(viewMatrix), ILLEGAL_ARG);

  // Set up a frame buffer if needed
  // TODO - cache picking fbo (needs to be resized)?
  pickingFBO = pickingFBO || new FramebufferObject(gl, {
    width: gl.canvas.width,
    height: gl.canvas.height
  });

  const picked = [];

  // Make sure we clear scissor test and fbo bindings in case of exceptions
  glContextWithState(gl, {
    frameBuffer: pickingFBO,
    // We are only interested in one pixel, no need to render anything else
    scissorTest: {x, y: gl.canvas.height - y, w: 1, h: 1}
  }, () => {
    for (const model of group.traverseReverse({viewMatrix})) {
      if (model.isPickable()) {

        // Clear the frame buffer, render and sample
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        model.setUniforms({renderPickingBuffer: 1});
        model.render(gl, {camera, viewMatrix});
        model.setUniforms({renderPickingBuffer: 0});

        // Read color in the central pixel, to be mapped with picking colors
        const color = new Uint8Array(4);
        gl.readPixels(
          x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color
        );

        const isPicked =
          color[0] !== 0 || color[1] !== 0 || color[2] !== 0 || color[3] !== 0;

        // Add the information to the stack
        picked.push({model, color, isPicked});
      }
    }
  });

  return picked;
}
