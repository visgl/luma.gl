/* global window */
import {isWebGL, clear, readPixelsToArray} from '@luma.gl/webgl2';
import GroupNode from '../scenegraph/group-node';
import {assert} from '../utils';

function getDevicePixelRatio() {
  return typeof window !== 'undefined' ? window.devicePixelRatio : 1;
}

export default function pickModels(gl, props) {
  const {
    models,
    position,
    uniforms = {}, // eslint-disable-line
    parameters = {},
    settings,
    useDevicePixels = true,
    framebuffer,
    context
  } = props;

  assert(isWebGL(gl) && framebuffer && position);

  const [x, y] = position;

  // Match our picking framebuffer with the size of the canvas drawing buffer
  framebuffer.resize({width: gl.canvas.width, height: gl.canvas.height});

  // Compensate for devicePixelRatio
  // Note: this assumes the canvas framebuffer has been matched
  const dpr = useDevicePixels ? getDevicePixelRatio() : 1;
  // Reverse the y coordinate
  const deviceX = x * dpr;
  const deviceY = gl.canvas.height - y * dpr;

  // return withParameters(gl, {
  //   // framebuffer,
  //   // // We are only interested in one pixel, no need to render anything else
  //   // scissorTest: {x: deviceX, y: deviceY, w: 1, h: 1}
  // }, () => {
  const group = new GroupNode({children: models});
  return group.traverseReverse(model => {
    if (model.pickable) {
      // Clear the frame buffer
      clear(gl, {framebuffer, color: true, depth: true});

      // Render picking colors
      /* eslint-disable camelcase */
      model.setUniforms({picking_uActive: 1});
      model.draw(Object.assign({}, props, {uniforms, parameters, settings, framebuffer, context}));
      model.setUniforms({picking_uActive: 0});

      // Sample Read color in the central pixel, to be mapped as a picking color
      const color = readPixelsToArray(framebuffer, {
        sourceX: deviceX,
        sourceY: deviceY,
        sourceWidth: 1,
        sourceHeight: 1,
        sourceFormat: gl.RGBA,
        sourceType: gl.UNSIGNED_BYTE
      });

      const isPicked = color[0] !== 0 || color[1] !== 0 || color[2] !== 0;

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
  // });
}
