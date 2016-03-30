// TODO - this is the new picking for deck.gl
/* eslint-disable max-statements, no-try-catch */
import {WebGLRenderingContext} from '../webgl/webgl-types';
import {Framebuffer, glContextWithState} from '../webgl';
import Group from './group';
import assert from 'assert';

const ILLEGAL_ARG = 'Illegal argument to pick';

export function pickModels(gl, {
  group, camera, viewMatrix, x, y,
  pickingFBO = null,
  pickingProgram = null,
  pickingColors = null
}) {
  assert(gl instanceof WebGLRenderingContext, ILLEGAL_ARG);
  assert(group instanceof Group, ILLEGAL_ARG);
  assert(Array.isArray(viewMatrix), ILLEGAL_ARG);

  // Set up a frame buffer if needed
  // TODO - cache picking fbo (needs to be resized)?
  pickingFBO = pickingFBO || new Framebuffer(gl, {
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
        const program = model.getProgram();
        program.use();
        program.setUniforms({renderPickingBuffer: 1});
        model.setProgramState(program);

        // Clear the frame buffer, render and sample
        gl.clear(gl.COLOR_BUFFER_BIT);
        model.render(gl, {camera, viewMatrix});

        // Read color in the central pixel, to be mapped with picking colors
        const color = new Uint8Array(4);
        gl.readPixels(
          x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color
        );

        program.setUniform('renderPickingBuffer', 0);
        model.unsetProgramState(program);

        // Add the information to the stack
        picked.push({model, color});
      }
    }

  });

  return picked;
}
