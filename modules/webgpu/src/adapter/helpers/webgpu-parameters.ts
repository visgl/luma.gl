// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Parameters} from '@luma.gl/core';

function addDepthStencil(descriptor: GPURenderPipelineDescriptor): GPUDepthStencilState {
  descriptor.depthStencil = descriptor.depthStencil || {
    // required, set something
    format: 'depth24plus',
    stencilFront: {},
    stencilBack: {},
    // TODO can this cause trouble? Should we set to WebGPU defaults? Are there defaults?
    depthWriteEnabled: false,
    depthCompare: 'less-equal'
  };
  return descriptor.depthStencil;
}

function addDepthStencilFront(descriptor: GPURenderPipelineDescriptor): GPUStencilFaceState {
  const depthStencil = addDepthStencil(descriptor);
  // @ts-ignore
  return depthStencil.stencilFront;
}

function addDepthStencilBack(descriptor: GPURenderPipelineDescriptor): GPUStencilFaceState {
  const depthStencil = addDepthStencil(descriptor);
  // @ts-ignore
  return depthStencil.stencilBack;
}

/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a GPURenderPipelineDescriptor
 */
// @ts-expect-error
export const PARAMETER_TABLE: Record<keyof Parameters, Function> = {
  // RASTERIZATION PARAMETERS

  cullMode: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive = descriptor.primitive || {};
    descriptor.primitive.cullMode = value;
  },

  frontFace: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive = descriptor.primitive || {};
    descriptor.primitive.frontFace = value;
  },

  // DEPTH

  depthWriteEnabled: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    if (value) {
      const depthStencil = addDepthStencil(descriptor);
      depthStencil.depthWriteEnabled = value;
    }
  },

  depthCompare: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthCompare = value;
  },

  depthFormat: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.format = value;
  },

  depthBias: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBias = value;
  },

  depthBiasSlopeScale: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilReadMask = value;
  },

  stencilWriteMask: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilWriteMask = value;
  },

  stencilCompare: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.compare = value;
    stencilBack.compare = value;
  },

  stencilPassOperation: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.passOp = value;
    stencilBack.passOp = value;
  },

  stencilFailOperation: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.failOp = value;
    stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.depthFailOp = value;
    stencilBack.depthFailOp = value;
  },

  // MULTISAMPLE

  sampleCount: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.count = value;
  },

  sampleMask: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.mask = value;
  },

  sampleAlphaToCoverageEnabled: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.alphaToCoverageEnabled = value;
  },

  // COLOR

  colorMask: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const target = addColorState(descriptor, 0);
    target.writeMask = value;
  },

  blend: (_: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    if (value) {
      addBlendState(descriptor, 0);
    }
  },

  blendColorOperation: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.color = blend.color || {};
    blend.color.operation = value;
  },

  blendColorSrcFactor: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.color = blend.color || {};
    blend.color.srcFactor = value;
  },

  blendColorDstFactor: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.color.dstFactor = value;
  },

  blendAlphaOperation: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.alpha = blend.alpha || {};
    blend.alpha.operation = value;
  },

  blendAlphaSrcFactor: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.alpha = blend.alpha || {};
    blend.alpha.srcFactor = value;
  },

  blendAlphaDstFactor: (
    _: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const blend = addBlendState(descriptor, 0);
    blend.alpha = blend.alpha || {};
    blend.alpha.dstFactor = value;
  }
};

const DEFAULT_PIPELINE_DESCRIPTOR: GPURenderPipelineDescriptor = {
  // depthStencil: {
  //   stencilFront: {},
  //   stencilBack: {},
  //   // depthWriteEnabled: true,
  //   // depthCompare: 'less',
  //   // format: 'depth24plus-stencil8',
  // },

  primitive: {
    cullMode: 'back',
    topology: 'triangle-list'
  },

  vertex: {
    module: undefined!,
    entryPoint: 'main'
  },

  fragment: {
    module: undefined!,
    entryPoint: 'main',
    targets: [
      // { format: props.color0Format || 'bgra8unorm' }
    ]
  },

  layout: 'auto'
};

export function applyParametersToRenderPipelineDescriptor(
  pipelineDescriptor: GPURenderPipelineDescriptor,
  parameters: Parameters = {}
): void {
  // Apply defaults
  Object.assign(pipelineDescriptor, {...DEFAULT_PIPELINE_DESCRIPTOR, ...pipelineDescriptor});
  setParameters(pipelineDescriptor, parameters);
}

// Apply any supplied parameters
function setParameters(
  pipelineDescriptor: GPURenderPipelineDescriptor,
  parameters: Parameters
): void {
  for (const [key, value] of Object.entries(parameters)) {
    const setterFunction = PARAMETER_TABLE[key as keyof Parameters];
    if (!setterFunction) {
      throw new Error(`Illegal parameter ${key}`);
    }
    setterFunction(key, value, pipelineDescriptor);
  }
}

/** @todo - support multiple color targets... */
function addColorState(
  descriptor: GPURenderPipelineDescriptor,
  attachment: number
): GPUColorTargetState {
  // @ts-ignore
  descriptor.fragment.targets = descriptor.fragment?.targets || ([] as GPUColorTargetState[]);
  if (!Array.isArray(descriptor.fragment?.targets)) {
    throw new Error('colorstate');
  }
  if (descriptor.fragment?.targets?.length === 0) {
    descriptor.fragment.targets?.push({});
  }
  return descriptor.fragment?.targets[0] as GPUColorTargetState;
}

function addBlendState(descriptor: GPURenderPipelineDescriptor, attachment: number): GPUBlendState {
  const target = addColorState(descriptor, attachment);
  target.blend = target.blend || {color: {}, alpha: {}};
  return target.blend;
}
