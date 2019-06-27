import {
  AnimationLoop,
  setParameters,
  ModelNode,
  picking,
  dirlight,
  readPixelsToArray,
  Buffer,
  CubeGeometry,
  createShaderHook,
  createModuleInjection
} from '@luma.gl/core';
import {Timeline} from '@luma.gl/addons';
import {mapToDevicePosition} from '@luma.gl/webgl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
Cube drawn with <b>instanced rendering</b>.
<p>
A luma.gl <code>Cube</code>, rendering 65,536 instances in a
single GPU draw call using instanced vertex attributes.
`;

const SIDE = 256;

createShaderHook('vs:MY_SHADER_HOOK_pickColor(inout vec4 color)');

createShaderHook('fs:MY_SHADER_HOOK_fragmentColor(inout vec4 color)');

createModuleInjection('picking', {
  hook: 'vs:MY_SHADER_HOOK_pickColor',
  injection: 'picking_setPickingColor(color.rgb);'
});

createModuleInjection('dirlight', {
  hook: 'fs:MY_SHADER_HOOK_fragmentColor',
  injection: 'color = dirlight_filterColor(color);'
});

createModuleInjection('picking', {
  hook: 'fs:MY_SHADER_HOOK_fragmentColor',
  injection: 'color = picking_filterColor(color);',
  order: Number.POSITIVE_INFINITY
});

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends ModelNode {
  constructor(gl, props) {
    let offsets = [];
    for (let i = 0; i < SIDE; i++) {
      const x = ((-SIDE + 1) * 3) / 2 + i * 3;
      for (let j = 0; j < SIDE; j++) {
        const y = ((-SIDE + 1) * 3) / 2 + j * 3;
        offsets.push(x, y);
      }
    }
    offsets = new Float32Array(offsets);

    const pickingColors = new Uint8ClampedArray(SIDE * SIDE * 2);
    for (let i = 0; i < SIDE; i++) {
      for (let j = 0; j < SIDE; j++) {
        pickingColors[(i * SIDE + j) * 2 + 0] = i;
        pickingColors[(i * SIDE + j) * 2 + 1] = j;
      }
    }

    const colors = new Float32Array(SIDE * SIDE * 3).map(() => Math.random() * 0.75 + 0.25);

    const vs = `\
attribute float instanceSizes;
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 instanceOffsets;
attribute vec3 instanceColors;
attribute vec2 instancePickingColors;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uTime;

varying vec3 color;

void main(void) {
  vec3 normal = vec3(uModel * vec4(normals, 1.0));

  // Set up data for modules
  color = instanceColors;
  project_setNormal(normal);
  vec4 pickColor = vec4(0., instancePickingColors, 1.0);
  MY_SHADER_HOOK_pickColor(pickColor);

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((uTime + delta) * 0.1) * 16.0, 0);
  gl_Position = uProjection * uView * (uModel * vec4(positions * instanceSizes, 1.0) + offset);
}
`;
    const fs = `\
precision highp float;

varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  MY_SHADER_HOOK_fragmentColor(gl_FragColor);
}
`;

    const offsetsBuffer = new Buffer(gl, offsets);
    const colorsBuffer = new Buffer(gl, colors);
    const pickingColorsBuffer = new Buffer(gl, pickingColors);

    super(
      gl,
      Object.assign({}, props, {
        vs,
        fs,
        modules: [dirlight, picking],
        isInstanced: 1,
        instanceCount: SIDE * SIDE,
        geometry: new CubeGeometry(),
        attributes: {
          instanceSizes: new Float32Array([1]), // Constant attribute
          instanceOffsets: [offsetsBuffer, {divisor: 1}],
          instanceColors: [colorsBuffer, {divisor: 1}],
          instancePickingColors: [pickingColorsBuffer, {divisor: 1}]
        }
      })
    );
  }
}

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({createFramebuffer: true, debug: true});
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl, _animationLoop}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    this.attachTimeline(new Timeline());
    this.timeline.play();

    const timeChannel = this.timeline.addChannel({
      rate: 0.01
    });

    const eyeXChannel = this.timeline.addChannel({
      rate: 0.0003
    });

    const eyeYChannel = this.timeline.addChannel({
      rate: 0.0004
    });

    const eyeZChannel = this.timeline.addChannel({
      rate: 0.0002
    });

    this.cube = new InstancedCube(gl, {
      _animationLoop,
      // inject: {
      //   'fs:#main-end': 'gl_FragColor = picking_filterColor(gl_FragColor)'
      // },
      uniforms: {
        uTime: () => this.timeline.getTime(timeChannel),
        // Basic projection matrix
        uProjection: ({aspect}) =>
          new Matrix4().perspective({fov: radians(60), aspect, near: 1, far: 2048.0}),
        // Move the eye around the plane
        uView: () =>
          new Matrix4().lookAt({
            center: [0, 0, 0],
            eye: [
              (Math.cos(this.timeline.getTime(eyeXChannel)) * SIDE) / 2,
              (Math.sin(this.timeline.getTime(eyeYChannel)) * SIDE) / 2,
              ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * SIDE) / 4 + 32
            ]
          }),
        // Rotate all the individual cubes
        uModel: ({tick}) => new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
  }

  onRender(animationProps) {
    const {gl} = animationProps;

    const {framebuffer, _mousePosition} = animationProps;

    if (_mousePosition) {
      const devicePosition = mapToDevicePosition(_mousePosition, gl);
      pickInstance(gl, devicePosition[0], devicePosition[1], this.cube, framebuffer);
    }

    // Draw the cubes
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.cube.draw();
  }

  onFinalize({gl}) {
    this.cube.delete();
  }
}

function pickInstance(gl, pickX, pickY, model, framebuffer) {
  framebuffer.clear({color: true, depth: true});
  // Render picking colors
  /* eslint-disable camelcase */
  model.setUniforms({picking_uActive: 1});
  model.draw({framebuffer});
  model.setUniforms({picking_uActive: 0});

  const color = readPixelsToArray(framebuffer, {
    sourceX: pickX,
    sourceY: pickY,
    sourceWidth: 1,
    sourceHeight: 1,
    sourceFormat: gl.RGBA,
    sourceType: gl.UNSIGNED_BYTE
  });

  if (color[0] + color[1] + color[2] > 0) {
    model.updateModuleSettings({
      pickingSelectedColor: color
    });
  } else {
    model.updateModuleSettings({
      pickingSelectedColor: null
    });
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
