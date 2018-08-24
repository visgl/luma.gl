/* eslint-disable camelcase */
// import 'luma.gl/debug';
import GL from 'luma.gl/constants';
import {AnimationLoop, setParameters, Cube, picking, dirlight} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

import {
  _MultiPassRenderer as MultiPassRenderer,
  _ClearPass as ClearPass,
  // _RenderPass as RenderPass,
  _PickingPass as PickingPass,
  _CopyPass as CopyPass
} from 'luma.gl';

import {
  depth,
  // SSAOPass,
  OutlinePass
  // ConvolutionPass
} from 'luma.gl-imageprocessing';

import * as glfx from 'luma.gl-glfx';

const INFO_HTML = `
<p>
Cube drawn with <b>instanced rendering</b>.
<p>
A luma.gl <code>Cube</code>, rendering 65,536 instances in a
single GPU draw call using instanced vertex attributes.
`;

const SIDE = 256;

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends Cube {

  constructor(gl, props) {
    let offsets = [];
    for (let i = 0; i < SIDE; i++) {
      const x = (-SIDE + 1) * 3 / 2 + i * 3;
      for (let j = 0; j < SIDE; j++) {
        const y = (-SIDE + 1) * 3 / 2 + j * 3;
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

    const colors = new Float32Array(SIDE * SIDE * 3).map(
      () => Math.random() * 0.25 + 0.75
    );

    const vs = `\
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
  picking_setPickingColor(vec3(0., instancePickingColors));

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((uTime + delta) * 0.1) * 16.0, 0);
  gl_Position = uProjection * uView * (uModel * vec4(positions, 1.0) + offset);
}
`;
    const fs = `\
precision highp float;

uniform vec4 uOverrideColor;
varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  gl_FragColor = dirlight_filterColor(gl_FragColor);
  gl_FragColor = picking_filterColor(gl_FragColor);
  // check that color !== 0, 0, 0
  if (dot(uOverrideColor, uOverrideColor) > 0.0001) {
    gl_FragColor = uOverrideColor / 256.;
  }
  gl_FragColor = depth_filterColor(gl_FragColor);
}
`;

    super(gl, Object.assign({}, props, {
      vs,
      fs,
      modules: [picking, dirlight, depth],
      isInstanced: 1,
      instanceCount: SIDE * SIDE,
      attributes: {
        instanceSizes: {value: new Float32Array([1]), size: 1, instanced: 1, isGeneric: true},
        instanceOffsets: {value: offsets, size: 2, instanced: 1},
        instanceColors: {value: colors, size: 3, instanced: 1},
        instancePickingColors: {value: pickingColors, size: 2, instanced: 1}
      }
    }));
  }
}

class AppAnimationLoop extends AnimationLoop {

  constructor() {
    super({
      createFramebuffer: true,
      debug: true,
      useDevicePixels: false,
      glOptions: {
        stencil: true
      }
    });
  }

  getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    this.cube = new InstancedCube(gl, {
      _animationLoop: this,
      uniforms: {
        uTime: ({tick}) => tick * 0.1,
        // Basic projection matrix
        uProjection: ({aspect}) =>
          new Matrix4().perspective({fov: radians(60), aspect, near: 1, far: 2048.0}),
        // Move the eye around the plane
        uView: ({tick}) => new Matrix4().lookAt({
          center: [0, 0, 0],
          eye: [
            Math.cos(tick * 0.0005) * SIDE / 4,
            Math.sin(tick * 0.0006) * SIDE / 4,
            (Math.sin(tick * 0.00035) + 1) * SIDE / 16 + 4
          ]
        }),
        // Rotate all the individual cubes
        uModel: ({tick}) => new Matrix4().rotateX(tick * 0.001).rotateY(tick * 0.0013)
      }
    });

    this.multiPassRenderer = new MultiPassRenderer(gl, [
      // picking pass updates selectedPickingColor uniform, call before rendering
      new PickingPass(gl, {
        models: [this.cube]
      }),

      new ClearPass(gl),

      // new RenderPass(gl, {
      //   models: [this.cube]
      // }),

      // new SSAOPass(gl, {
      //   models: [this.cube],
      //   cameraNear: 1,
      //   cameraFar: 2048,
      //   onlyAO: ({tick}) => Boolean(Math.round(tick / 200) % 2),
      //   ssao_uEnabled: ({tick}) => Boolean(Math.round(tick / 100) % 2)
      // }),

      // Draws once into stencil, draws again clipped by same stencil (i.e. shape of first draw)
      new OutlinePass(gl, {
        models: [this.cube],

        normalUniforms: {
          // Standard cube size, disables outline color
          uModel: ({tick}) => new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
          uOverrideColor: [0, 0, 0, 0]
        },

        outlineUniforms: {
          // Make the cubes a little bigger, to create the "outline"
          uModel: ({tick}) => new Matrix4()
            .scale([1.1, 1.1, 1.1])
            .rotateX(tick * 0.01)
            .rotateY(tick * 0.013),
          // Override with an "outline" color
          uOverrideColor: ({tick}) => [Math.sin(tick * 0.1) * 64 + 192, 0, 0, 255]
        }
      }),

      // new ConvolutionPass(gl, {kernel: ConvolutionPass.KERNEL.EMBOSS}),
      // new ConvolutionPass(gl, {kernel: ConvolutionPass.KERNEL.EDGE_DETECT_3}),
      // new ConvolutionPass(gl, {kernel: ConvolutionPass.KERNEL.TRIANGLE_BLUR}),

      new glfx.ShaderModulePass(gl, glfx.sepia, {amount: 1}),

      new CopyPass(gl, {screen: true})
    ]);
  }

  onRender(animationProps) {
    this.multiPassRenderer.render(this.animationProps);
  }

  onFinalize({gl}) {
    // gl.canvas.removeEventListener('mousemove', mousemove);
    this.cube.delete();
  }
}

const animationLoop = new AppAnimationLoop();

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
