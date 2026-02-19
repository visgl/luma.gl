// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/greggman/webgpu-utils under MIT license
// Copyright (c) 2022 Gregg Tavares

import {Device, Texture, Buffer} from '@luma.gl/core';
import {Model} from '../model/model';

type TextureViewDimension = '1d' | '2d' | '2d-array' | '3d';

/**
 * Generates mip levels from level 0 to the last mip for an existing texture
 * The texture must have been created with TEXTURE_BINDING and RENDER_ATTACHMENT
 * and been created with mip levels
 *
 * @param device A GPUDevice
 * @param texture The texture to create mips for
 * @param viewDimension This is only needed in compatibility mode
 *   and it is only needed when the texture is going to be used as a cube map.
 */
export function generateMipmap(device: Device, texture: Texture) {
  const source = getMipmapGenerationWGSL(texture.dimension as any);

  const uniformValues = new Uint32Array(1);
  const uniformBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const sampler = device.createSampler({minFilter: 'linear', magFilter: 'linear'});

  const model = new Model(device, {
    id: `${texture.format}.${viewDimension}`,
    source,
    colorAttachmentFormats: [texture.format as any],
    vertexCount: 3,
    instanceCount: 1,
    bindings: {
      uniforms: uniformBuffer,
      sampler
    }
  });

  for (let baseMipLevel = 1; baseMipLevel < texture.mipLevelCount; ++baseMipLevel) {
    for (let baseArrayLayer = 0; baseArrayLayer < texture.depthOrArrayLayers; ++baseArrayLayer) {
      uniformValues[0] = baseArrayLayer;
      device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

      const previousMipLevelView = texture.createView({
        dimension: viewDimension,
        baseMipLevel: baseMipLevel - 1,
        mipLevelCount: 1
      });

      const mipLevelTextureView = texture.createView({
        dimension: '2d',
        baseMipLevel,
        mipLevelCount: 1,
        baseArrayLayer,
        arrayLayerCount: 1
      });

      const mipLevelView = texture.createView({
        dimension: viewDimension,
        baseMipLevel: baseMipLevel - 1,
        mipLevelCount: 1,
        baseArrayLayer,
        arrayLayerCount: 1
      });

      const framebuffer = device.createFramebuffer({
        colorAttachments: [mipLevelView]
      });

      model.setBindings({
        previousMipLevelView,
        previousMipLevelViewSampler: sampler
      });
      const renderPass = device.beginRenderPass({id: 'mip-gen-pass', framebuffer});
      model.draw(renderPass);
      renderPass.end();
    }
  }

  uniformBuffer.destroy();
}

function getMipmapGenerationWGSL(viewDimension: TextureViewDimension): string {
  let textureSnippet;
  let sampleSnippet;
  switch (viewDimension) {
    case '2d':
      textureSnippet = 'texture_2d<f32>';
      sampleSnippet = 'textureSample(ourTexture, ourSampler, fsInput.texcoord)';
      break;
    case '2d-array':
      textureSnippet = 'texture_2d_array<f32>';
      sampleSnippet = `
        textureSample(
            ourTexture,
            ourSampler,
            fsInput.texcoord,
            uni.layer)`;
      break;
    case 'cube':
      textureSnippet = 'texture_cube<f32>';
      sampleSnippet = `
        textureSample(
            ourTexture,
            ourSampler,
            faceMat[uni.layer] * vec3f(fract(fsInput.texcoord), 1))`;
      break;
    case 'cube-array':
      textureSnippet = 'texture_cube_array<f32>';
      sampleSnippet = `
        textureSample(
            ourTexture,
            ourSampler,
            faceMat[uni.layer] * vec3f(fract(fsInput.texcoord), 1), uni.layer)`;
      break;
    default:
      throw new Error(`unsupported view: ${viewDimension}`);
  }
  return `
      const faceMat = array(
        mat3x3f( 0,  0,  -2,  0, -2,   0,  1,  1,   1),   // pos-x
        mat3x3f( 0,  0,   2,  0, -2,   0, -1,  1,  -1),   // neg-x
        mat3x3f( 2,  0,   0,  0,  0,   2, -1,  1,  -1),   // pos-y
        mat3x3f( 2,  0,   0,  0,  0,  -2, -1, -1,   1),   // neg-y
        mat3x3f( 2,  0,   0,  0, -2,   0, -1,  1,   1),   // pos-z
        mat3x3f(-2,  0,   0,  0, -2,   0,  1,  1,  -1));  // neg-z

      struct FragmentInputs {
        @builtin(position) position: vec4f,
        @location(0) texcoord: vec2f,
      };

      @vertex fn vertexMain(
        @builtin(vertex_index) vertexIndex : u32
      ) -> FragmentInputs {
        var pos = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f(-1.0,  3.0),
          vec2f( 3.0, -1.0),
        );

        var vsOutput: FragmentInputs;
        let xy = pos[vertexIndex];
        vsOutput.position = vec4f(xy, 0.0, 1.0);
        vsOutput.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
        return vsOutput;
      }

      struct Uniforms {
        layer: u32,
      };

      @group(0) @binding(0) var ourSampler: sampler;
      @group(0) @binding(1) var ourTexture: ${textureSnippet};
      @group(0) @binding(2) var<uniform> uni: Uniforms;

      @fragment fn fragmentMain(fsInput: FragmentInputs) -> @location(0) vec4f {
        _ = uni.layer; // make sure this is used so all pipelines have the same bindings
        return ${sampleSnippet};
      }
    `;
}
