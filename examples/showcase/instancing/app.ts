import {Device, Framebuffer, getRandom, glsl} from '@luma.gl/core';
import type {AnimationProps, ModelProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, Timeline, Model} from '@luma.gl/engine';
import {readPixelsToArray} from '@luma.gl/webgl';
import {picking, dirlight} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
Cube drawn with <b>instanced rendering</b>.
<p>
A luma.gl <code>Cube</code>, rendering 65,536 instances in a
single GPU draw call using instanced vertex attributes.
`;

const random = getRandom();

const vs = glsl`\
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
  // vec4 pickColor = vec4(0., instancePickingColors, 1.0);
  picking_setPickingColor(vec3(0., instancePickingColors));

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((uTime + delta) * 0.1) * 16.0, 0);
  gl_Position = uProjection * uView * (uModel * vec4(positions * 1., 1.0) + offset);
}
`;

const fs = glsl`\
precision highp float;

varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  gl_FragColor = dirlight_filterColor(gl_FragColor);
  // TODO - 
  gl_FragColor = picking_filterColor(gl_FragColor);
}
`;

const SIDE = 256;

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends Model {
  constructor(device: Device, props: ModelProps = {}) {
    const offsets = [];
    for (let i = 0; i < SIDE; i++) {
      const x = ((-SIDE + 1) * 3) / 2 + i * 3;
      for (let j = 0; j < SIDE; j++) {
        const y = ((-SIDE + 1) * 3) / 2 + j * 3;
        offsets.push(x, y);
      }
    }

    const offsets32 = new Float32Array(offsets);

    const pickingColors = new Uint8Array(SIDE * SIDE * 2);
    for (let i = 0; i < SIDE; i++) {
      for (let j = 0; j < SIDE; j++) {
        pickingColors[(i * SIDE + j) * 2 + 0] = i;
        pickingColors[(i * SIDE + j) * 2 + 1] = j;
      }
    }

    const colors = new Uint8Array(SIDE * SIDE * 4).map((n, i) => (random() * 0.75 + 0.25) * 255);
    for (let i = 0; i < colors.length; i += 4) {
      colors[i + 3] = 255;
    }

    const offsetsBuffer = device.createBuffer(offsets32);
    const colorsBuffer = device.createBuffer(colors);
    const pickingColorsBuffer = device.createBuffer(pickingColors);

    // TODO - Should we really be setting global hooks in a simple example?
    // const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(device);
    // pipelineFactory.addShaderHook('vs:MY_SHADER_HOOK_pickColor(inout vec4 color)');
    // pipelineFactory.addShaderHook('fs:MY_SHADER_HOOK_fragmentColor(inout vec4 color)');

    // Model
    super(device, {
      ...props,
      vs,
      fs,
      modules: [dirlight, picking],
      instanceCount: SIDE * SIDE,
      geometry: new CubeGeometry(),
      layout: {
        attributes: [
          {name: 'positions', location: 0, format: 'float32x3', stepMode: 'vertex'},
          {name: 'normals', location: 1, format: 'float32x3', stepMode: 'vertex'},
          {name: 'instanceOffsets', location: 2, format: 'float32x2', stepMode: 'instance'},
          {name: 'instanceColors', location: 3, format: 'float32x3', stepMode: 'instance'},
          {name: 'instancePickingColors', location: 4, format: 'float32x2', stepMode: 'instance'}
        ],
        bindings: []
      },
      attributes: {
        // instanceSizes: device.createBuffer(new Float32Array([1])), // Constant attribute
        instanceOffsets: offsetsBuffer,
        instanceColors: colorsBuffer,
        instancePickingColors: pickingColorsBuffer
      },
      bufferMap: [
        {name: 'instanceColors', format: 'unorm8x4'},
        {name: 'instancePickingColors', format: 'unorm8x2'},
      ],
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {createFramebuffer: true, debug: true};

  cube: InstancedCube;
  timeline: Timeline;
  timelineChannels: Record<string, number>;
  pickingFramebuffer: Framebuffer;

  constructor({device, animationLoop}: AnimationProps) {
    super();

    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    this.timelineChannels = {
      timeChannel: this.timeline.addChannel({rate: 0.01}),
      eyeXChannel: this.timeline.addChannel({rate: 0.0003}),
      eyeYChannel: this.timeline.addChannel({rate: 0.0004}),
      eyeZChannel: this.timeline.addChannel({rate: 0.0002})
    };

    this.cube = new InstancedCube(device);
    this.cube.updateModuleSettings({
      pickingSelectedColor: null
    });


    this.pickingFramebuffer = device.createFramebuffer({
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth24plus'
    });
  }

  onRender(animationProps: AnimationProps) {
    const {device, aspect, tick} = animationProps;
    const {_mousePosition} = animationProps;
    const {timeChannel, eyeXChannel, eyeYChannel, eyeZChannel} = this.timelineChannels;

    if (_mousePosition) {
      pickInstance(device, _mousePosition, this.cube, this.pickingFramebuffer);
    }

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      clearStencil: 0
    });
    this.cube.setUniforms({
      uTime: this.timeline.getTime(timeChannel),
      // Basic projection matrix
      uProjection: new Matrix4().perspective({fovy: radians(60), aspect, near: 1, far: 2048.0}),
      // Move the eye around the plane
      uView: new Matrix4().lookAt({
        center: [0, 0, 0],
        eye: [
          (Math.cos(this.timeline.getTime(eyeXChannel)) * SIDE) / 2,
          (Math.sin(this.timeline.getTime(eyeYChannel)) * SIDE) / 2,
          ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * SIDE) / 4 + 32
        ]
      }),
      // Rotate all the individual cubes
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
    });
    // this.cube.updateModuleSettings({pickingActive: 0});
    this.cube.draw(renderPass);
    renderPass.end();
  }

  onFinalize(animationProps: AnimationProps): void {
    this.cube.destroy();
  }
}

export function pickInstance(
  device: Device,
  mousePosition: number[],
  model: Model,
  framebuffer: Framebuffer
) {
  // use the center pixel location in device pixel range
  const devicePixels = device.canvasContext.cssToDevicePixels(mousePosition);
  const pickX = devicePixels.x + Math.floor(devicePixels.width / 2);
  const pickY = devicePixels.y + Math.floor(devicePixels.height / 2);

  // Render picking colors
  framebuffer.resize(device.canvasContext.getPixelSize());
  const pickingPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
  model.updateModuleSettings({pickingActive: 1});
  model.draw(pickingPass);
  model.updateModuleSettings({pickingActive: 0});

  pickingPass.end();

  // Read back 
  const color = readPixelsToArray(framebuffer, {
    sourceX: pickX,
    sourceY: pickY,
    sourceWidth: 1,
    sourceHeight: 1,
    // sourceFormat: GL.RGBA,
    // sourceType: GL.UNSIGNED_BYTE
  });

  if (color[0] + color[1] + color[2] > 0) {
    console.log('setting picking color', color);
    model.updateModuleSettings({
      pickingSelectedColor: color
    });
  } else {
    model.updateModuleSettings({
      pickingSelectedColor: null
    });
  }
}
