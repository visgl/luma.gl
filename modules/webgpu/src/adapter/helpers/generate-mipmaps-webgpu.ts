// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/greggman/webgpu-utils under MIT license
// Copyright (c) 2022 Gregg Tavares

import type {
  Texture,
  TextureFormat,
  TextureFormatColor,
  TextureBindingLayout,
  StorageTextureBindingLayout,
  UniformBufferBindingLayout,
  SamplerBindingLayout
} from '@luma.gl/core';
import {Buffer, textureFormatDecoder} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';
import type {WebGPUComputePass} from '../resources/webgpu-compute-pass';
import type {WebGPURenderPass} from '../resources/webgpu-render-pass';

type RenderTextureViewDimension = '2d' | '2d-array' | 'cube' | 'cube-array';
type TextureCapability = 'render' | 'filter' | 'store';
type MipmapPath = 'render' | 'compute';

const RENDER_DIMENSIONS: ReadonlyArray<RenderTextureViewDimension> = [
  '2d',
  '2d-array',
  'cube',
  'cube-array'
];

const WORKGROUP_SIZE = {
  x: 4,
  y: 4,
  z: 4
} as const;

const RENDER_SOURCE_SAMPLER_LAYOUT: SamplerBindingLayout = {
  type: 'sampler',
  name: 'sourceSampler',
  group: 0,
  location: 0
};

const COMPUTE_SOURCE_TEXTURE_LAYOUT: TextureBindingLayout = {
  type: 'texture',
  name: 'sourceTexture',
  group: 0,
  location: 0,
  viewDimension: '3d',
  sampleType: 'float'
};

const COMPUTE_UNIFORMS_LAYOUT: UniformBufferBindingLayout = {
  type: 'uniform',
  name: 'uniforms',
  group: 0,
  location: 2
};

/**
 * Generates mip levels from level 0 to the last mip for an existing WebGPU texture.
 */
export function generateMipmapsWebGPU(device: WebGPUDevice, texture: Texture): void {
  if (texture.mipLevels <= 1) {
    return;
  }

  if (texture.dimension === '3d') {
    generateMipmaps3D(device, texture);
    return;
  }

  if (RENDER_DIMENSIONS.includes(texture.dimension as RenderTextureViewDimension)) {
    generateMipmapsRender(device, texture);
    return;
  }

  throw new Error(
    `Cannot generate mipmaps for texture dimension "${texture.dimension}" with WebGPU.`
  );
}

function generateMipmapsRender(device: WebGPUDevice, texture: Texture): void {
  validateFormatCapabilities(device, texture, ['render', 'filter'], 'render');
  const colorAttachmentFormat = getColorAttachmentFormat(
    texture.format,
    'render',
    texture.dimension
  );

  const viewDimension = texture.dimension as RenderTextureViewDimension;
  const shaderSource = getRenderMipmapWGSL(viewDimension);
  const sampler = device.createSampler({minFilter: 'linear', magFilter: 'linear'});
  const uniformsBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const uniformValues = new Uint32Array(1);
  const sourceTextureLayout: TextureBindingLayout = {
    type: 'texture',
    name: 'sourceTexture',
    group: 0,
    location: 1,
    viewDimension,
    sampleType: 'float'
  };
  const uniformsLayout: UniformBufferBindingLayout = {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 2
  };
  const renderShaderLayout = {
    attributes: [],
    bindings: [RENDER_SOURCE_SAMPLER_LAYOUT, sourceTextureLayout, uniformsLayout]
  };
  const vertexShader = device.createShader({
    id: 'mipmap-generation-render-vs',
    source: shaderSource,
    language: 'wgsl',
    stage: 'vertex'
  });
  const fragmentShader = device.createShader({
    id: 'mipmap-generation-render-fs',
    source: shaderSource,
    language: 'wgsl',
    stage: 'fragment'
  });
  const renderPipeline = device.createRenderPipeline({
    id: `mipmap-generation-render:${texture.dimension}:${texture.format}`,
    vs: vertexShader,
    fs: fragmentShader,
    shaderLayout: renderShaderLayout,
    colorAttachmentFormats: [colorAttachmentFormat],
    topology: 'triangle-list'
  });

  let sourceWidth = texture.width;
  let sourceHeight = texture.height;
  const layerCount = texture.dimension === '2d' ? 1 : texture.depth;

  try {
    for (let baseMipLevel = 1; baseMipLevel < texture.mipLevels; ++baseMipLevel) {
      validateFormatCapabilities(device, texture, ['render', 'filter'], 'render');
      const sourceMipLevel = baseMipLevel - 1;
      const destinationWidth = Math.max(1, sourceWidth >> 1);
      const destinationHeight = Math.max(1, sourceHeight >> 1);

      const sourceView = texture.createView({
        dimension: viewDimension,
        baseMipLevel: sourceMipLevel,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: texture.depth
      });
      renderPipeline.setBindings({
        sourceSampler: sampler,
        sourceTexture: sourceView,
        uniforms: uniformsBuffer
      });

      try {
        for (let baseArrayLayer = 0; baseArrayLayer < layerCount; ++baseArrayLayer) {
          uniformValues[0] = baseArrayLayer;
          uniformsBuffer.write(uniformValues);

          const destinationView = texture.createView({
            dimension: '2d',
            baseMipLevel,
            mipLevelCount: 1,
            baseArrayLayer,
            arrayLayerCount: 1
          });
          const framebuffer = device.createFramebuffer({
            colorAttachments: [destinationView]
          });
          const renderPass = device.beginRenderPass({
            id: `mipmap-generation:${texture.format}:${baseMipLevel}:${baseArrayLayer}`,
            framebuffer
          }) as WebGPURenderPass;

          try {
            renderPass.setPipeline(renderPipeline);
            renderPass.setBindings({
              sourceSampler: sampler,
              sourceTexture: sourceView,
              uniforms: uniformsBuffer
            });
            renderPass.setParameters({
              viewport: [0, 0, destinationWidth, destinationHeight, 0, 1],
              scissorRect: [0, 0, destinationWidth, destinationHeight]
            });
            renderPass.draw({vertexCount: 3});
            renderPass.end();
            device.submit();
          } finally {
            destinationView.destroy();
            framebuffer.destroy();
          }
        }
      } finally {
        sourceView.destroy();
      }

      sourceWidth = destinationWidth;
      sourceHeight = destinationHeight;
    }
  } finally {
    renderPipeline.destroy();
    vertexShader.destroy();
    fragmentShader.destroy();
    sampler.destroy();
    uniformsBuffer.destroy();
  }
}

function getColorAttachmentFormat(
  format: TextureFormat,
  path: MipmapPath,
  dimension: string
): TextureFormatColor {
  if (textureFormatDecoder.isColor(format)) {
    return format;
  }

  throw new Error(
    `Cannot run ${path} mipmap generation for ${dimension} texture with format "${format}". ` +
      `Only color textures can be used for this operation. ` +
      `Required capabilities: color. ` +
      `Actual capabilities: color=false.`
  );
}

function generateMipmaps3D(device: WebGPUDevice, texture: Texture): void {
  validateFormatCapabilities(device, texture, ['filter', 'store'], 'compute');
  const format = getColorAttachmentFormat(texture.format, 'compute', texture.dimension);
  const shaderSource = get3DComputeMipmapWGSL(format);
  const destinationTextureLayout: StorageTextureBindingLayout = {
    type: 'storage',
    name: 'destinationTexture',
    group: 0,
    location: 1,
    format,
    viewDimension: '3d',
    access: 'write-only'
  };
  const computeShaderLayout = {
    bindings: [COMPUTE_SOURCE_TEXTURE_LAYOUT, destinationTextureLayout, COMPUTE_UNIFORMS_LAYOUT]
  };
  const computeShader = device.createShader({
    id: 'mipmap-generation-compute',
    source: shaderSource,
    language: 'wgsl',
    stage: 'compute'
  });
  const computePipeline = device.createComputePipeline({
    id: `mipmap-generation-compute:${texture.format}`,
    shader: computeShader,
    shaderLayout: computeShaderLayout
  });
  const uniformsBuffer = device.createBuffer({
    byteLength: 32,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const uniformValues = new Uint32Array(8);

  let sourceWidth = texture.width;
  let sourceHeight = texture.height;
  let sourceDepth = texture.depth;

  try {
    for (
      let destinationMipLevel = 1;
      destinationMipLevel < texture.mipLevels;
      ++destinationMipLevel
    ) {
      validateFormatCapabilities(device, texture, ['filter', 'store'], 'compute');
      const destinationWidth = Math.max(1, sourceWidth >> 1);
      const destinationHeight = Math.max(1, sourceHeight >> 1);
      const destinationDepth = Math.max(1, sourceDepth >> 1);

      uniformValues[0] = sourceWidth;
      uniformValues[1] = sourceHeight;
      uniformValues[2] = sourceDepth;
      uniformValues[3] = destinationWidth;
      uniformValues[4] = destinationHeight;
      uniformValues[5] = destinationDepth;
      uniformValues[6] = 0;
      uniformsBuffer.write(uniformValues);

      const sourceView = texture.createView({
        dimension: '3d',
        baseMipLevel: destinationMipLevel - 1,
        mipLevelCount: 1
      });
      const destinationView = texture.createView({
        dimension: '3d',
        baseMipLevel: destinationMipLevel,
        mipLevelCount: 1
      });
      computePipeline.setBindings({
        sourceTexture: sourceView,
        destinationTexture: destinationView,
        uniforms: uniformsBuffer
      });

      try {
        const workgroupsX = Math.ceil(destinationWidth / WORKGROUP_SIZE.x);
        const workgroupsY = Math.ceil(destinationHeight / WORKGROUP_SIZE.y);
        const workgroupsZ = Math.ceil(destinationDepth / WORKGROUP_SIZE.z);
        const computePass = device.beginComputePass({}) as WebGPUComputePass;

        computePass.setPipeline(computePipeline);
        computePass.dispatch(workgroupsX, workgroupsY, workgroupsZ);
        computePass.end();
        device.submit();
      } finally {
        sourceView.destroy();
        destinationView.destroy();
      }

      sourceWidth = destinationWidth;
      sourceHeight = destinationHeight;
      sourceDepth = destinationDepth;
    }
  } finally {
    computePipeline.destroy();
    computeShader.destroy();
    uniformsBuffer.destroy();
  }
}

function validateFormatCapabilities(
  device: WebGPUDevice,
  texture: Texture,
  requiredCapabilities: ReadonlyArray<TextureCapability>,
  path: MipmapPath
): void {
  const {format, dimension} = texture;
  const capabilities = device.getTextureFormatCapabilities(format);
  const missingCapabilities = requiredCapabilities.filter(capability => !capabilities[capability]);

  if (missingCapabilities.length > 0) {
    const required = requiredCapabilities.join(' + ');
    const actual = requiredCapabilities
      .map(capability => `${capability}=${capabilities[capability]}`)
      .join(', ');
    throw new Error(
      `Cannot run ${path} mipmap generation for ${dimension} texture with format "${format}". ` +
        `Required capabilities: ${required}. ` +
        `Actual capabilities: ${actual}.`
    );
  }
}

function getSourceTextureType(dimension: RenderTextureViewDimension): string {
  switch (dimension) {
    case '2d':
      return 'texture_2d<f32>';
    case '2d-array':
      return 'texture_2d_array<f32>';
    case 'cube':
      return 'texture_cube<f32>';
    case 'cube-array':
      return 'texture_cube_array<f32>';
    default:
      throw new Error(`Unsupported render dimension "${dimension}" for mipmap generation.`);
  }
}

function getRenderMipmapWGSL(dimension: RenderTextureViewDimension): string {
  const sourceSnippet = getRenderMipmapSampleSnippet(dimension);

  return `
struct MipmapUniforms {
  sourceLayer: u32,
};

fn _touchUniform(uniforms: MipmapUniforms) {
  let unusedSourceLayer = uniforms.sourceLayer;
}

const faceMat = array(
  mat3x3f(
    0.0,  0.0,  -2.0,
    0.0, -2.0,   0.0,
    1.0,  1.0,   1.0
  ),  // pos-x
  mat3x3f(
    0.0,  0.0,   2.0,
    0.0, -2.0,   0.0,
    -1.0,  1.0,  -1.0
  ),  // neg-x
  mat3x3f(
    2.0,  0.0,   0.0,
    0.0,  0.0,   2.0,
    -1.0,  1.0,  -1.0
  ),  // pos-y
  mat3x3f(
    2.0,  0.0,   0.0,
    0.0,  0.0,  -2.0,
    -1.0, -1.0,   1.0
  ),  // neg-y
  mat3x3f(
    2.0,  0.0,   0.0,
    0.0, -2.0,   0.0,
    -1.0,  1.0,   1.0
  ),  // pos-z
  mat3x3f(
    -2.0, 0.0,   0.0,
    0.0, -2.0,   0.0,
    1.0,   1.0,  -1.0
  )   // neg-z
);

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f
};

@group(0) @binding(0) var sourceSampler: sampler;
@group(0) @binding(1) var sourceTexture: ${getSourceTextureType(dimension)};
@group(0) @binding(2) var<uniform> uniforms: MipmapUniforms;

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
  const positions = array(
    vec2f(-1.0, -1.0),
    vec2f(-1.0,  3.0),
    vec2f( 3.0, -1.0)
  );

  let xy = positions[vertexIndex];
  return VertexOutput(
    vec4f(xy, 0.0, 1.0),
    xy * vec2f(0.5, -0.5) + vec2f(0.5)
  );
}

@fragment
fn fragmentMain(fsInput: VertexOutput) -> @location(0) vec4f {
  _touchUniform(uniforms);
  return ${sourceSnippet};
}
`;
}

function getRenderMipmapSampleSnippet(dimension: RenderTextureViewDimension): string {
  const layer = 'uniforms.sourceLayer';

  switch (dimension) {
    case '2d':
      return 'textureSampleLevel(sourceTexture, sourceSampler, fsInput.texcoord, 0.0)';
    case '2d-array':
      return (
        'textureSampleLevel(sourceTexture, sourceSampler, fsInput.texcoord, ' +
        `i32(${layer}), 0.0)`
      );
    case 'cube':
      return (
        'textureSampleLevel(sourceTexture, sourceSampler, ' +
        `faceMat[i32(${layer})] * vec3f(fract(fsInput.texcoord), 1.0), 0.0)`
      );
    case 'cube-array':
      return (
        'textureSampleLevel(sourceTexture, sourceSampler, ' +
        `faceMat[i32(${layer} % 6u)] * vec3f(fract(fsInput.texcoord), 1.0), ` +
        `i32(${layer} / 6u), 0.0)`
      );
    default:
      throw new Error(`Unsupported render dimension "${dimension}" for mipmap generation.`);
  }
}

function get3DComputeMipmapWGSL(format: TextureFormatColor): string {
  return `
struct MipmapUniforms {
  sourceWidth: u32,
  sourceHeight: u32,
  sourceDepth: u32,
  destinationWidth: u32,
  destinationHeight: u32,
  destinationDepth: u32,
  padding: u32,
};

@group(0) @binding(0) var sourceTexture: texture_3d<f32>;
@group(0) @binding(1) var destinationTexture: texture_storage_3d<${format}, write>;
@group(0) @binding(2) var<uniform> uniforms: MipmapUniforms;

@compute @workgroup_size(${WORKGROUP_SIZE.x}, ${WORKGROUP_SIZE.y}, ${WORKGROUP_SIZE.z})
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  if (
    id.x >= uniforms.destinationWidth ||
    id.y >= uniforms.destinationHeight ||
    id.z >= uniforms.destinationDepth
  ) {
    return;
  }

  let sourceBase = id * 2u;
  let sourceX0 = min(sourceBase.x, uniforms.sourceWidth - 1u);
  let sourceY0 = min(sourceBase.y, uniforms.sourceHeight - 1u);
  let sourceZ0 = min(sourceBase.z, uniforms.sourceDepth - 1u);

  let sourceX1 = min(sourceBase.x + 1u, uniforms.sourceWidth - 1u);
  let sourceY1 = min(sourceBase.y + 1u, uniforms.sourceHeight - 1u);
  let sourceZ1 = min(sourceBase.z + 1u, uniforms.sourceDepth - 1u);

  var sum = textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX0), i32(sourceY0), i32(sourceZ0)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX1), i32(sourceY0), i32(sourceZ0)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX0), i32(sourceY1), i32(sourceZ0)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX1), i32(sourceY1), i32(sourceZ0)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX0), i32(sourceY0), i32(sourceZ1)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX1), i32(sourceY0), i32(sourceZ1)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX0), i32(sourceY1), i32(sourceZ1)),
    0
  );
  sum += textureLoad(
    sourceTexture,
    vec3<i32>(i32(sourceX1), i32(sourceY1), i32(sourceZ1)),
    0
  );

  textureStore(
    destinationTexture,
    vec3<i32>(i32(id.x), i32(id.y), i32(id.z)),
    vec4<f32>(sum.xyz / 8.0, sum.w / 8.0)
  );
}
`;
}
