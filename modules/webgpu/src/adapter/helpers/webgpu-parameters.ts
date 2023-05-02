import {Parameters} from '@luma.gl/api';

function addDepthStencil(descriptor: GPURenderPipelineDescriptor): GPUDepthStencilState {
  descriptor.depthStencil = descriptor.depthStencil || {
    // required, set something
    format: 'depth24plus',
    stencilFront: {},
    stencilBack: {},
    // TODO can this cause trouble? Should we set to WebGPU defaults? Are there defaults?
    depthWriteEnabled: undefined!,
    depthCompare: undefined!
  };
  return descriptor.depthStencil;
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

  depthWriteEnabled: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthWriteEnabled = value;
  },

  depthCompare: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthCompare = value;
  },

  depthFormat: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.format = value;
  },

  depthBias: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBias = value;
  },

  depthBiasSlopeScale: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilReadMask = value;
  },

  stencilWriteMask: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilWriteMask = value;
  },

  stencilCompare: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilFront.compare = value;
    depthStencil.stencilBack.compare = value;
  },

  stencilPassOperation: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilFront.passOp = value;
    depthStencil.stencilBack.passOp = value;
  },

  stencilFailOperation: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilFront.failOp = value;
    depthStencil.stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const depthStencil = addDepthStencil(descriptor);
    depthStencil.stencilFront.depthFailOp = value;
    depthStencil.stencilBack.depthFailOp = value;
  },

  // MULTISAMPLE

  sampleCount: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.count = value;
  },

  sampleMask: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.mask = value;
  },

  sampleAlphaToCoverageEnabled: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.alphaToCoverageEnabled = value;
  },

  // COLOR

  colorMask: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
    const targets = addColorState(descriptor);
    targets[0].writeMask = value;
  },

  blendColorOperation: (parameter: keyof Parameters, value: any, descriptor: GPURenderPipelineDescriptor) => {
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
      throw new Error(`Illegal parameter ${key}`);
    }
    setterFunction(key, value, pipelineDescriptor);
  }
}

function addColorState(descriptor: GPURenderPipelineDescriptor): GPUColorTargetState[] {
  descriptor.fragment.targets = descriptor.fragment?.targets || [];
  if (!Array.isArray(descriptor.fragment?.targets)) {
    throw new Error('colorstate');
  }
  if (descriptor.fragment?.targets?.length === 0) {
    descriptor.fragment.targets?.push({});
  }
  return descriptor.fragment?.targets as GPUColorTargetState[];
}
