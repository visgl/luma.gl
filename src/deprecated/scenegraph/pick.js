// TODO - this is the new picking for deck.gl
/* eslint-disable max-statements, no-try-catch */
/* global window */
import {GL, glContextWithState, Framebuffer} from '../../webgl';
import {assertWebGLContext} from '../../webgl/webgl-checks';
import Group from './group';
import assert from 'assert';

const ILLEGAL_ARG = 'Illegal argument to pick';

export function pickModels(gl, {
  group,
  uniforms,
  x,
  y,
  framebuffer = null,
  pickingFBO = null,
  pickingProgram = null,
  pickingColors = null
}) {
  assertWebGLContext(gl);
  assert(group instanceof Group, ILLEGAL_ARG);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const deviceX = x * dpr;
  const deviceY = gl.canvas.height - y * dpr;

  // Set up a frame buffer if needed
  // TODO - cache picking fbo (needs to be resized)?
  framebuffer = framebuffer || pickingFBO || new Framebuffer(gl, {
    width: gl.canvas.width,
    height: gl.canvas.height
  });

  framebuffer.resize({width: gl.canvas.width, height: gl.canvas.height});

  // Make sure we clear scissor test and fbo bindings in case of exceptions
  return glContextWithState(gl, {
    framebuffer,
    // We are only interested in one pixel, no need to render anything else
    scissorTest: {x: deviceX, y: deviceY, w: 1, h: 1}
  }, () => {
    for (const model of group.traverseReverse()) {
      if (model.isPickable()) {

        // Clear the frame buffer, render and sample
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        model.setUniforms({
          renderPickingBuffer: 1,
          enablePicking: true
        });

        model.render(uniforms);

        model.setUniforms({
          renderPickingBuffer: false,
          enablePicking: false
        });

        // Read color in the central pixel, to be mapped with picking colors
        const color = new Uint8Array(4);
        gl.readPixels(
          deviceX, deviceY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color
        );

        const isPicked =
          color[0] !== 0 || color[1] !== 0 || color[2] !== 0 || color[3] !== 0;

        // Add the information to the stack
        if (isPicked) {
          return {
            model,
            color,
            x,
            y,
            deviceX,
            deviceY
          };
        }
      }
    }

    return null;
  });
}
