// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Parameters, log} from '@luma.gl/core';

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

  cullMode: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive = descriptor.primitive || {};
    descriptor.primitive.cullMode = value;
  },

  frontFace: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive = descriptor.primitive || {};
    descriptor.primitive.frontFace = value;
  },

  // DEPTH

  depthWriteEnabled: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthWriteEnabled = value;
  },

  depthCompare: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthCompare = value;
  },

  depthFormat: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.format = value;
  },

  depthBias: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBias = value;
  },

  depthBiasSlopeScale: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilReadMask = value;
  },

  stencilWriteMask: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilWriteMask = value;
  },

  stencilCompare: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.compare = value;
    stencilBack.compare = value;
  },

  stencilPassOperation: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.passOp = value;
    stencilBack.passOp = value;
  },

  stencilFailOperation: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.failOp = value;
    stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    const stencilFront = addDepthStencilFront(descriptor);
    const stencilBack = addDepthStencilBack(descriptor);
    stencilFront.depthFailOp = value;
    stencilBack.depthFailOp = value;
  },

  // MULTISAMPLE

  sampleCount: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.count = value;
  },

  sampleMask: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.mask = value;
  },

  sampleAlphaToCoverageEnabled: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.alphaToCoverageEnabled = value;
  },

  // COLOR

  colorMask: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const targets = addColorState(descriptor);
    targets[0].writeMask = value;
  },

  blendColorOperation: (
    parameter: keyof Parameters,
    value: any,
    descriptor: GPURenderPipelineDescriptor
  ) => {
    addColorState(descriptor);
    // const targets = addColorState(descriptor);
    // const target = targets[0];
    // const blend: GPUBlendState = target.blend || {color: {alpha: 0}};
    // blend.color = blend.color || {};
    // target.blend.color.operation = value;
  }

  /*
  blendColorSrcTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    targets[0].blend = targets[0].blend || {};
    targets[0].blend.color = targets[0].blend.color || {};
    targets[0].blend.color.srcTarget = value;
  },

  blendColorDstTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    targets[0].blend = targets[0].blend || {};
    targets[0].blend.color = targets[0].blend.color || {};
    targets[0].blend.color.dstTarget = value;
  },

  blendAlphaOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    targets[0].blend = targets[0].blend || {};
    targets[0].blend.alpha = targets[0].blend.alpha || {};
    targets[0].blend.alpha.operation = value;
  },

  blendAlphaSrcTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    targets[0].blend = targets[0].blend || {};
    targets[0].blend.alpha = targets[0].blend.alpha || {};
    targets[0].blend.alpha.srcTarget = value;
  },

  blendAlphaDstTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    targets[0].blend = targets[0].blend || {};
    targets[0].blend.alpha = targets[0].blend.alpha || {};
    targets[0].blend.alpha.dstTarget = value;
  },
  */
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
      log.warn(`Illegal parameter ${key}`)();
      continue;
    }
    setterFunction(key, value, pipelineDescriptor);
  }
}

function addColorState(descriptor: GPURenderPipelineDescriptor): GPUColorTargetState[] {
  // @ts-ignore
  descriptor.fragment.targets = descriptor.fragment?.targets || [];
  if (!Array.isArray(descriptor.fragment?.targets)) {
    log.warn('parameters: no targets array')();
  }
  if (descriptor.fragment?.targets?.length === 0) {
    descriptor.fragment.targets?.push({});
  }
  return descriptor.fragment?.targets as GPUColorTargetState[];
}
