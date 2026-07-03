// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

export type ABufferResolveShaderPassPipelineOptions = {
  /** Maximum captured fragments sorted for one pixel. */
  maxFragmentsPerPixel: number;
};

/** Runtime state for resolving one captured A-buffer slice. */
export type ABufferResolveProps = {
  framebufferSize?: [number, number];
  sliceStartY?: number;
  sliceHeight?: number;
  headPointers?: Buffer;
  fragments?: Buffer;
};

type ABufferResolveUniforms = {
  framebufferSize: [number, number];
  sliceStartY: number;
  sliceHeight: number;
};

type ABufferResolveBindings = {
  headPointers?: Buffer;
  fragments?: Buffer;
};

function createABufferResolveShaderPass(
  maxFragmentsPerPixel: number
): ShaderPass<ABufferResolveProps, ABufferResolveUniforms, ABufferResolveBindings> {
  return {
    name: 'aBufferResolve',
    source: /* wgsl */ `\
const A_BUFFER_EMPTY_FRAGMENT_POINTER: u32 = 0u;

struct ABufferResolveUniforms {
  framebufferSize: vec2<f32>,
  sliceStartY: i32,
  sliceHeight: i32,
};

struct ABufferHeadPointers {
  nextFragmentIndex: atomic<u32>,
  droppedFragmentCount: atomic<u32>,
  heads: array<atomic<u32>>,
};

struct ABufferFragment {
  color: u32,
  depth: f32,
  next: u32,
};

struct ABufferFragments {
  fragments: array<ABufferFragment>,
};

@group(0) @binding(auto) var<uniform> aBufferResolve: ABufferResolveUniforms;
@group(0) @binding(auto) var<storage, read_write> headPointers: ABufferHeadPointers;
@group(0) @binding(auto) var<storage, read_write> fragments: ABufferFragments;

fn aBufferResolve_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let pixelCoordinates = min(
    vec2<u32>(texCoord * aBufferResolve.framebufferSize),
    vec2<u32>(aBufferResolve.framebufferSize) - vec2<u32>(1u)
  );
  let pixelY = i32(pixelCoordinates.y);
  let sliceEndY = aBufferResolve.sliceStartY + aBufferResolve.sliceHeight;
  if (pixelY < aBufferResolve.sliceStartY || pixelY >= sliceEndY) {
    return sourceColor;
  }

  let localPixelY = u32(pixelY - aBufferResolve.sliceStartY);
  let pixelIndex = localPixelY * u32(aBufferResolve.framebufferSize.x) + pixelCoordinates.x;
  if (pixelIndex >= arrayLength(&headPointers.heads)) {
    return sourceColor;
  }

  var fragmentPointer = atomicLoad(&headPointers.heads[pixelIndex]);
  var capturedFragments: array<ABufferFragment, ${maxFragmentsPerPixel}>;
  var fragmentCount = 0u;

  while (
    fragmentPointer != A_BUFFER_EMPTY_FRAGMENT_POINTER &&
    fragmentCount < ${maxFragmentsPerPixel}u
  ) {
    let fragmentIndex = fragmentPointer - 1u;
    if (fragmentIndex >= arrayLength(&fragments.fragments)) {
      break;
    }
    capturedFragments[fragmentCount] = fragments.fragments[fragmentIndex];
    fragmentPointer = capturedFragments[fragmentCount].next;
    fragmentCount += 1u;
  }

  if (fragmentCount == 0u) {
    return sourceColor;
  }

  var sortIndex = 1u;
  while (sortIndex < fragmentCount) {
    let fragmentToInsert = capturedFragments[sortIndex];
    var insertIndex = sortIndex;
    while (insertIndex > 0u && capturedFragments[insertIndex - 1u].depth < fragmentToInsert.depth) {
      capturedFragments[insertIndex] = capturedFragments[insertIndex - 1u];
      insertIndex -= 1u;
    }
    capturedFragments[insertIndex] = fragmentToInsert;
    sortIndex += 1u;
  }

  var transparentColor = vec4<f32>(0.0);
  var compositeIndex = 0u;
  while (compositeIndex < fragmentCount) {
    let fragmentColor = unpack4x8unorm(capturedFragments[compositeIndex].color);
    transparentColor = fragmentColor + transparentColor * (1.0 - fragmentColor.a);
    compositeIndex += 1u;
  }

  return transparentColor + sourceColor * (1.0 - transparentColor.a);
}
`,
    bindingLayout: [
      {name: 'headPointers', group: 0, visibility: 0x2},
      {name: 'fragments', group: 0, visibility: 0x2}
    ],
    props: {} as ABufferResolveProps,
    uniforms: {} as ABufferResolveUniforms,
    bindings: {} as ABufferResolveBindings,
    uniformTypes: {
      framebufferSize: 'vec2<f32>',
      sliceStartY: 'i32',
      sliceHeight: 'i32'
    },
    defaultUniforms: {
      framebufferSize: [1, 1],
      sliceStartY: 0,
      sliceHeight: 1
    },
    passes: [{sampler: true}]
  };
}

/** Creates the fullscreen resolve pipeline used for each captured A-buffer slice. */
export function createABufferResolveShaderPassPipeline(
  options: ABufferResolveShaderPassPipelineOptions
): ShaderPassPipeline {
  const maxFragmentsPerPixel = Math.floor(options.maxFragmentsPerPixel);
  if (maxFragmentsPerPixel < 1) {
    throw new Error('maxFragmentsPerPixel must be at least 1.');
  }

  const shaderPass = createABufferResolveShaderPass(maxFragmentsPerPixel);
  return {
    name: 'aBufferResolveShaderPassPipeline',
    steps: [
      {
        shaderPass,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
