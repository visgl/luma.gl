//
import type {ShaderUniformType, NumberArray} from '@luma.gl/core';
import {Device, Framebuffer, makeRandomNumberGenerator, glsl} from '@luma.gl/core';
import type {AnimationProps, ModelProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, Timeline, Model, _ShaderInputs} from '@luma.gl/engine';
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

// INSTANCE CUBE

const random = makeRandomNumberGenerator();

// WGSL

// const VS_WGSL = /* WGSL */`\  
// void dirlight_setNormal(normal: vec3<f32>) {
//   dirlight_vNormal = normalize(normal);
// }
// `;

// const FS_WGSL = /* WGSL */`\
// uniform dirlightUniforms {
//   vec3 lightDirection;
// } dirlight;

// // Returns color attenuated by angle from light source
// fn dirlight_filterColor(color: vec4<f32>, dirlightInputs): vec4<f32> {
//   const d: float = abs(dot(dirlight_vNormal, normalize(dirlight.lightDirection)));
//   return vec4<f32>(color.rgb * d, color.a);
// }
// `;

const VS_WGSL = /* WGSL */ `\
struct AppUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  time: f32,
};

@binding(0) @group(0) var<uniform> app : AppUniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>,
  // INSTANCED ATTRIBUTES
  @location(2) instanceOffsets : vec2<f32>,
  @location(3) instanceColors : vec4<f32>,
  @location(4) instancePickingColors : vec2<f32>,
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color : vec4<f32>,
}

@vertex
fn main(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;

  outputs.normal = (app.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz;
  outputs.color = inputs.instanceColors;

  // vec4 pickColor = vec4(0., instancePickingColors, 1.0);
  // picking_setPickingColor(pickColor.rgb);

  // Vertex position (z coordinate undulates with time), and model rotates around center
  let delta = length(inputs.instanceOffsets);
  let offset = vec4<f32>(inputs.instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  outputs.Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * inputs.positions + offset);
  return outputs;
}
`;

const FS_WGSL = /* WGSL */`\

struct DirlightUniforms {
  lightDirection: vec3<f32>,
}

// @binding(1) @group(0) var<uniform> dirlight : DirlightUniforms;

fn dirlight_filterColor(color: vec4<f32>, normal: vec3<f32>) -> vec4<f32> {
  const dirlight_lightDirection = vec3<f32>(1, 1, 2);
  let d: f32 = abs(dot(normal, normalize(dirlight_lightDirection)));
  return vec4<f32>(color.rgb * d, color.a);
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color : vec4<f32>,
}

@fragment
fn main(inputs: FragmentInputs) -> @location(0) vec4<f32> { 
  return dirlight_filterColor(inputs.color, inputs.normal); 
}
`;

// GLSL

const VS_GLSL = glsl`\
#version 300 es

in vec3 positions;
in vec3 normals;

in vec2 instanceOffsets;
in vec3 instanceColors;
in vec2 instancePickingColors;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  float time;
} app;

out vec3 color;

void main(void) {
  color = instanceColors;

  vec3 normal = vec3(app.modelMatrix * vec4(normals, 1.0));
  dirlight_setNormal(normal);

  vec4 pickColor = vec4(0., instancePickingColors, 1.0);
  picking_setPickingColor(pickColor.rgb);

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  gl_Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * vec4(positions * 1., 1.0) + offset);
}
`;

const FS_GLSL = glsl`\
#version 300 es
precision highp float;

in vec3 color;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(color, 1.);
  fragColor = dirlight_filterColor(fragColor);
  fragColor = picking_filterColor(fragColor);
}
`;

const SIDE = 256;

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends Model {
  // uniformBuffer: Buffer;

  constructor(device: Device, props?: Partial<ModelProps>) {
    const offsets = [];
    for (let i = 0; i < SIDE; i++) {
      const x = ((-SIDE + 1) * 3) / 2 + i * 3;
      for (let j = 0; j < SIDE; j++) {
        const y = ((-SIDE + 1) * 3) / 2 + j * 3;
        offsets.push(x, y);
      }
    }

    const offsets32 = new Float32Array(offsets);

    const colors = new Uint8Array(SIDE * SIDE * 4).map((n, i) => (random() * 0.75 + 0.25) * 255);
    for (let i = 0; i < colors.length; i += 4) {
      colors[i + 3] = 255;
    }

    const pickingColors = new Uint8Array(SIDE * SIDE * 4);
    for (let i = 0; i < SIDE; i++) {
      for (let j = 0; j < SIDE; j++) {
        pickingColors[(i * SIDE + j) * 2 + 0] = i;
        pickingColors[(i * SIDE + j) * 2 + 1] = j;
        pickingColors[(i * SIDE + j) * 2 + 2] = 0;
        pickingColors[(i * SIDE + j) * 2 + 3] = 0;
      }
    }

    const offsetsBuffer = device.createBuffer(offsets32);
    const colorsBuffer = device.createBuffer(colors);
    const pickingColorsBuffer = device.createBuffer(pickingColors);

    // Model
    super(device, {
      ...props,
      vs: {wgsl: VS_WGSL, glsl: VS_GLSL},
      fs: {wgsl: FS_WGSL, glsl: FS_GLSL},
      modules: device.info.type !== 'webgpu' ? [dirlight, picking] : [],
      instanceCount: SIDE * SIDE,
      geometry: new CubeGeometry({indices: true}),
      bufferLayout: [
        {name: 'instanceOffsets', format: 'float32x2'},
        {name: 'instanceColors', format: 'unorm8x4'},
        {name: 'instancePickingColors', format: 'unorm8x4'}
        // TODO - normalizing picking colors breaks picking
        // {name: 'instancePickingColors', format: 'unorm8x2'},
      ],
      attributes: {
        // instanceSizes: device.createBuffer(new Float32Array([1])), // Constant attribute
        instanceOffsets: offsetsBuffer,
        instanceColors: colorsBuffer,
        instancePickingColors: pickingColorsBuffer
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }
}

type AppUniforms = {
  modelMatrix: NumberArray;
  viewMatrix: NumberArray;
  projectionMatrix: NumberArray;
  time: number;
};

const app: {uniformTypes: Record<string, ShaderUniformType>} = {
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    time: 'f32'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {createFramebuffer: true, debug: true};

  cube: InstancedCube;
  timeline: Timeline;
  timelineChannels: Record<string, number>;
  pickingFramebuffer: Framebuffer;

  shaderInputs = new _ShaderInputs<{
    app: AppUniforms;
    dirlight: typeof dirlight.props;
    picking: typeof picking.props;
  }>({
    app,
    dirlight,
    picking
  });

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

    if (device.info.type !== 'webgpu') {
      this.pickingFramebuffer = device.createFramebuffer({
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      });
    }

    this.cube = new InstancedCube(device, {
      // @ts-ignore
      shaderInputs: this.shaderInputs
    });
  }

  onRender(animationProps: AnimationProps) {
    const {device, aspect, tick} = animationProps;
    const {_mousePosition} = animationProps;
    const {timeChannel, eyeXChannel, eyeYChannel, eyeZChannel} = this.timelineChannels;

    this.shaderInputs.setProps({
      app: {
        time: this.timeline.getTime(timeChannel),
        // Basic projection matrix
        projectionMatrix: new Matrix4().perspective({
          fovy: radians(60),
          aspect,
          near: 1,
          far: 2048.0
        }),
        // Move the eye around the plane
        viewMatrix: new Matrix4().lookAt({
          center: [0, 0, 0],
          eye: [
            (Math.cos(this.timeline.getTime(eyeXChannel)) * SIDE) / 2,
            (Math.sin(this.timeline.getTime(eyeYChannel)) * SIDE) / 2,
            ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * SIDE) / 4 + 32
          ]
        }),
        // Rotate all the individual cubes
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });

    if (device.info.type !== 'webgpu') {
      this.pickInstance(device, _mousePosition, this.cube, this.pickingFramebuffer);
    }

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      clearStencil: 0
    });

    this.cube.draw(renderPass);
    renderPass.end();
  }

  onFinalize(animationProps: AnimationProps): void {
    this.cube.destroy();
  }

  pickInstance(
    device: Device,
    mousePosition: number[] | null | undefined,
    model: Model,
    framebuffer: Framebuffer
  ) {
    if (!mousePosition) {
      this.shaderInputs.setProps({picking: {highlightedObjectColor: null}});
      return;
    }
    
    // use the center pixel location in device pixel range
    const devicePixels = device.canvasContext!.cssToDevicePixels(mousePosition);
    const pickX = devicePixels.x + Math.floor(devicePixels.width / 2);
    const pickY = devicePixels.y + Math.floor(devicePixels.height / 2);

    // Render picking colors
    framebuffer.resize(device.canvasContext!.getPixelSize());

    this.shaderInputs.setProps({picking: {isActive: true}});

    const pickingPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    model.draw(pickingPass);
    pickingPass.end();

    // Read back
    const color255 = readPixelsToArray(framebuffer, {
      sourceX: pickX,
      sourceY: pickY,
      sourceWidth: 1,
      sourceHeight: 1
    });
    // console.log(color255);

    let highlightedObjectColor = new Float32Array(color255).map((x) => x / 255);
    const isHighlightActive =  highlightedObjectColor[0] + highlightedObjectColor[1] + highlightedObjectColor[2] > 0;
    if (!isHighlightActive) {
      highlightedObjectColor = null;
    }

    this.shaderInputs.setProps({
      picking: {isActive: false, highlightedObjectColor}
    });
  }
}
