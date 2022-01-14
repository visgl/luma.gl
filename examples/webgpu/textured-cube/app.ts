import {luma, Device, Buffer, Texture, loadImageBitmap, ShaderLayout} from '@luma.gl/api';
import {ModelV2 as Model, CubeGeometry, RenderLoop, AnimationProps} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Rotating Cube';
export const description = 'Shows rendering a basic triangle.';

/** @todo - Provide both GLSL and WGSL shaders */
const SHADERS = {
  vs: {
    glsl: ``,
    wgsl: `
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>;
};
[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
  [[location(1)]] fragPosition: vec4<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec4<f32>,
        [[location(1)]] uv : vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}        `
  },
  fs: {
    glsl: ``,
    wgsl: `
[[group(0), binding(1)]] var mySampler: sampler;
[[group(0), binding(2)]] var myTexture: texture_2d<f32>;

[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>,
        [[location(1)]] fragPosition: vec4<f32>) -> [[location(0)]] vec4<f32> {
  let flippedUV = vec2<f32>(1.0 - fragUV.x, fragUV.y);
  return textureSample(myTexture, mySampler, flippedUV) * fragPosition;
}
        `
  }
};

const SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, format: 'float32x4'},
    {name: 'uvs', location: 1, format: 'float32x2'}
  ],
  bindings: [
    {name: 'uniforms', location: 0, type: 'uniform'},
    {name: 'sampler', location: 1, type: 'sampler'},
    {name: 'texture', location: 2, type: 'texture'}
  ]
};

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

export default class AppRenderLoop extends RenderLoop {
  model: Model;
  uniformBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();
    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = device.createTexture({
      data: loadImageBitmap('./vis-logo.png'),
      usage: Texture.TEXTURE_BINDING | Texture.COPY_DST | Texture.RENDER_ATTACHMENT,
      sampler: {magFilter: 'linear', minFilter: 'linear'} // linear filtering for smooth interpolation.
      // mipmaps: true // Create mipmaps
    });

    // Create vertex buffers for the cube data.
    const cube = new CubeGeometry({indices: false});
    const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
    const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

    this.uniformBuffer = device.createBuffer({
      id: 'uniforms',
      byteLength: UNIFORM_BUFFER_SIZE,
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
    });

    this.model = new Model(device, {
      id: 'cube',
      // Shader description
      vs: SHADERS.vs,
      fs: SHADERS.fs,
      layout: SHADER_LAYOUT,
      //
      topology: 'triangle-list',
      vertexCount: cube.vertexCount,
      attributes: {
        positions: positionBuffer,
        uvs: uvBuffer
      },
      bindings: {
        uniforms: this.uniformBuffer,
        sampler: cubeTexture.sampler,
        texture: cubeTexture
      },
      parameters: {
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthWriteEnabled: true,
        depthCompare: 'less',
        depthFormat: 'depth24plus',

        // Backface culling since the cube is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back',
      }
    });
  }

  destroy() {
    this.model.destroy();
    this.uniformBuffer.destroy();
  }

  render({device}: AnimationProps) {
    const projectionMatrix = new Matrix4();
    const viewMatrix = new Matrix4();
    const modelViewProjectionMatrix = new Matrix4();

    const aspect = device.canvasContext.getAspect();
    const now = Date.now() / 1000;

    viewMatrix.identity().translate([0, 0, -4]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    projectionMatrix.perspective({fov: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer.write(new Float32Array(modelViewProjectionMatrix));

    // device.beginRenderPass();
    this.model.draw();
    device.submit();
  }
}

if (!globalThis.website) {
  RenderLoop.run(AppRenderLoop, {type: 'webgpu', canvas: 'canvas'});
}

