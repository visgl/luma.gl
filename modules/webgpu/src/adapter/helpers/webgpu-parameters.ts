import {Parameters} from '@luma.gl/api';

function addDepthStencil(descriptor: GPURenderPipelineDescriptor): void {
  descriptor.depthStencil = descriptor.depthStencil || {
    // required, set something
    format: 'depth24plus',
    stencilFront: {},
    stencilBack: {}
  };
}

/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a GPURenderPipelineDescriptor
 */
// @ts-expect-error
export const PARAMETER_TABLE: Record<keyof Parameters, Function> = {
  // RASTERIZATION PARAMETERS

  cullMode: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive.cullMode = value;
  },

  frontFace: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.primitive.frontFace = value;
  },

  // DEPTH

  depthWriteEnabled: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthWriteEnabled = value;
  },

  depthCompare: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthCompare = value;
  },

  depthFormat: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.format = value;
  },

  depthBias: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBias = value;
  },

  depthBiasSlopeScale: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilReadMask = value;
  },

  stencilWriteMask: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilWriteMask = value;
  },

  stencilCompare: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.compare = value;
    descriptor.depthStencil.stencilBack.compare = value;
  },

  stencilPassOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.passOp = value;
    descriptor.depthStencil.stencilBack.passOp = value;
  },

  stencilFailOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.failOp = value;
    descriptor.depthStencil.stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.depthFailOp = value;
    descriptor.depthStencil.stencilBack.depthFailOp = value;
  },

  // MULTISAMPLE

  sampleCount: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.count = value;
  },

  sampleMask: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.mask = value;
  },

  sampleAlphaToCoverageEnabled: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.alphaToCoverageEnabled = value;
  },

  // COLOR

  colorMask: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].writeMask = value;
  },

  blendColorOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.operation = value;
  }

  /*
  blendColorSrcTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.srcTarget = value;
  },

  blendColorDstTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.dstTarget = value;
  },

  blendAlphaOperation: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.operation = value;
  },

  blendAlphaSrcTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.srcTarget = value;
  },

  blendAlphaDstTarget: (parameter, value, descriptor: GPURenderPipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.dstTarget = value;
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
    module: undefined,
    entryPoint: 'main'
  },

  fragment: {
    module: undefined,
    entryPoint: 'main',
    targets: [
      // { format: props.color0Format || 'bgra8unorm' }
    ]
  }
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
  for (const key in parameters) {
    const value = parameters[key];
    const setterFunction = PARAMETER_TABLE[key];
    if (!setterFunction) {
      throw new Error(`Illegal parameter ${key}`);
    }
    setterFunction(key, value, pipelineDescriptor);
  }
}

function addColorState(descriptor: GPURenderPipelineDescriptor): void {
  descriptor.fragment.targets = descriptor.fragment.targets || [];
  // @ts-expect-error
  if (descriptor.fragment.targets.length === 0) {
    // @ts-expect-error
    descriptor.fragment.targets.push({});
  }
}
