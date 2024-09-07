import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const colorShaderModule = {
  name: 'color',
  source: /* wgsl */ `\

  `,
  vs: /* glsl */ `\
out vec3 color_vColor;

void color_setColor(vec3 color) {
  color_vColor = color;
}
  `,
  fs: /* glsl */ `\
in vec3 color_vColor;

vec3 color_getColor() {
  return color_vColor;
}
  `
};

const source = /* wgsl */ `\
type VertexInputs {
  @location(0) position: vec2<f32>;
  @location(1) instanceColor: vec3<f32>;
  @location(2) instanceOffset: vec2<f32>;
};  

type FragmentInputs {
  Position: vec4<f32>;
  color: vec4<f32>;
}

@vertexMain
fn vertexMain(inputs: VertexInputs) -> [[builtin(position)]] vec4<f32> {
  color_setColor(inputs.instanceColor);
  return vec4<f32>(inputs.position + inputs.instanceOffset, 0.0, 1.0);
}

@fragmentMain
fn fragmentMain(inputs: FragmentInputs) -> [[location(0)]] vec4<f32 {
  return vec4<f32>(color_getColor(), 1.0);
}
`;

const vs = /* glsl */ `\
#version 300 es
in vec2 position;
in vec3 instanceColor;
in vec2 instanceOffset;

void main() {
  color_setColor(instanceColor);
  gl_Position = vec4(position + instanceOffset, 0.0, 1.0);
}
`;
      
const fs = /* glsl */ `\
#version 300 es
out vec4 fragColor;
void main() {
  fragColor = vec4(color_getColor(), 1.0);
}
`;


export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  model: Model;
  positionBuffer: Buffer;
  colorBuffer: Buffer;
  offsetBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]));
    this.colorBuffer = device.createBuffer(
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0])
    );
    this.offsetBuffer = device.createBuffer(
      new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5])
    );

    this.model = new Model(device, {
      source,
      vs,
      fs,
      modules: [colorShaderModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'instanceColor', format: 'float32x3', stepMode: 'instance'},
        {name: 'instanceOffset', format: 'float32x2', stepMode: 'instance'}
      ],
      attributes: {
        position: this.positionBuffer,
        instanceColor: this.colorBuffer,
        instanceOffset: this.offsetBuffer
      },
      vertexCount: 3,
      instanceCount: 4
    });
  }

  onFinalize() {
    this.model.destroy();
    this.positionBuffer.destroy();
    this.colorBuffer.destroy();
    this.offsetBuffer.destroy();
  }

  onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
