// luma.gl, MIT license
// Forked from Kangz/mipmapper.js under MIT license Copyright 2020 Brandon Jones
// https://gist.github.com/Kangz/782d5f1ae502daf53910a13f55db2f83

// @ts-nocheck this is written against outdated WebGPU API, needs an update pass

const VS_GEN_MIPMAP = `\#version 450
const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
layout(location = 0) out vec2 vTex;
void main() {
  gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
  vTex = gl_Position / 2.0f + vec2(0.5f);
}`;

const FS_GEN_MIPMAP = `#version 450
layout(set = 0, binding = 0) uniform sampler imgSampler;
layout(set = 0, binding = 1) uniform texture2D img;
layout(location = 0) in vec2 vTex;
layout(location = 0) out vec4 outColor;
void main() {
  outColor = texture(sampler2D(img, imgSampler), vTex);
}`;

/** WebGPU does not have built-in mipmap creation */
export class WebGPUMipmapGenerator {
  device: GPUDevice;
  mipmapSampler: GPUSampler;
  mipmapPipeline: GPURenderPipeline;

  constructor(device: GPUDevice, glslang) {
    this.device = device;

    this.mipmapSampler = device.createSampler({ minFilter: 'linear' });

    this.mipmapPipeline = device.createRenderPipeline({
      vertexStage: {
        module: device.createShaderModule({
          code: glslang.compileGLSL(VS_GEN_MIPMAP, 'vertex')
        }),
        entryPoint: 'main'
      },
      fragmentStage: {
        module: device.createShaderModule({
          code: glslang.compileGLSL(FS_GEN_MIPMAP, 'fragment')
        }),
        entryPoint: 'main'
      },
      primitiveTopology: 'triangle-strip',
      colorStates: [{
        format: 'rgba8unorm',
      }]
    });
  }

  generateMipmappedTexture(imageBitmap: ImageBitmap) {
    const textureSize = {
      width: imageBitmap.width,
      height: imageBitmap.height,
      depth: 1,
    }
    const mipLevelCount = Math.floor(Math.log2(Math.max(imageBitmap.width, imageBitmap.height))) + 1;

    // Populate the top level of the srcTexture with the imageBitmap.
    const texture = this.device.createTexture({
      size: textureSize,
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
      mipLevelCount
    });
    this.device.queue.copyImageBitmapToTexture({ imageBitmap }, { texture: srcTexture }, textureSize);

    const commandEncoder = this.device.createCommandEncoder({});
    for (let i = 1; i < mipLevelCount; ++i) {
      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
          attachment: texture.createView({
            baseMipLevel: i,
            mipLevelCount: 1
          }),
          loadValue: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 },
        }],
      });

      const bindGroup = this.device.createBindGroup({
        layout: this.mipmapPipeline.getBindGroupLayout(0),
        bindings: [{
          binding: 0,
          resource: this.mipmapSampler,
        }, {
          binding: 1,
          resource: texture.createView({
            baseMipLevel: i - 1,
            mipLevelCount: 1
          }),
        }],
      });

      passEncoder.setPipeline(this.mipmapPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.draw(4);
      passEncoder.endPass();
    }

    this.device.queue.submit([commandEncoder.finish()]);
    return texture;
  }
}
