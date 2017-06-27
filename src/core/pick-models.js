// TODO - this is the new picking for deck.gl
/* global window */
import {GL, withParameters, Framebuffer, isWebGL} from '../webgl';
import Group from './group';
import assert from 'assert';

const ILLEGAL_ARG = 'Illegal argument to pick';

export default function pickModels(gl, {
  models,
  x,
  y,
  uniforms = {picking_uActive: true}, // eslint-disable-line
  settings = {},
  framebuffer = null
}) {
  assert(isWebGL(gl), ILLEGAL_ARG);

  // Compensate for devicePixelRatio and reverse y coordinate
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const deviceX = x * dpr;
  const deviceY = gl.canvas.height - y * dpr;

  // Set up a frame buffer if not supplied
  framebuffer = framebuffer || new Framebuffer(gl);

  framebuffer.resize({width: gl.canvas.width, height: gl.canvas.height});

  return withParameters(gl, {
    framebuffer,
    // We are only interested in one pixel, no need to render anything else
    scissorTest: {x: deviceX, y: deviceY, w: 1, h: 1}
  }, () => {
    const group = new Group({children: models});
    return group.traverseReverse(model => {

      if (model.isPickable()) {
        // Clear the frame buffer
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // Render picking colors
        model.draw({uniforms, settings});

        // Sample Read color in the central pixel, to be mapped as a picking color
        const color = new Uint8Array(4);
        gl.readPixels(deviceX, deviceY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

        const isPicked = color[0] !== 0 || color[1] !== 0 || color[2] !== 0 || color[3] !== 0;

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

      return null;
    });
  });
}
