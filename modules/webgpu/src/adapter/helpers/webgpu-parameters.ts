import {Parameters} from '@luma.gl/api';

type PipelineDescriptor = Omit<GPURenderPipelineDescriptor, 'vertexStage'>;


function addDepthStencil(descriptor: GPURenderPipelineDescriptor): void {
  descriptor.depthStencil = descriptor.depthStencil || {
    // required, set something
    format: 'depth24plus',
    stencilFront: {},
    stencilBack: {},
  };
}

/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a PipelineDescriptor
 */
// @ts-expect-error
export const PARAMETER_TABLE: Record<keyof Parameters, Function> = {

  // RASTERIZATION PARAMETERS

  cullMode: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.primitive.cullMode = value;
  },
  
  frontFace: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.primitive.frontFace = value;
  },

  // DEPTH

  depthWriteEnabled: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthWriteEnabled = value;
  },

  depthCompare: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthCompare = value;
  },
  
  depthFormat: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.format = value;
  },

  depthBias: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBias = value;
  },

  depthBiasSlopeScale: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilReadMask = value;
  },

  stencilWriteMask: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilWriteMask = value;
  },

  stencilCompare: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.compare = value;
    descriptor.depthStencil.stencilBack.compare = value;
  },

  stencilPassOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.passOp = value;
    descriptor.depthStencil.stencilBack.passOp = value;
  },

  stencilFailOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.failOp = value;
    descriptor.depthStencil.stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addDepthStencil(descriptor);
    descriptor.depthStencil.stencilFront.depthFailOp = value;
    descriptor.depthStencil.stencilBack.depthFailOp = value;
  },

  // MULTISAMPLE

  sampleCount: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.count = value;
  },

  sampleMask: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.mask = value;
  },

  sampleAlphaToCoverageEnabled: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.multisample = descriptor.multisample || {};
    descriptor.multisample.alphaToCoverageEnabled = value;
  },

  // COLOR

  colorMask: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].writeMask = value;
  },

  blendColorOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.operation = value;
  },

  /*
  blendColorSrcTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.srcTarget = value;
  },

  blendColorDstTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.color = descriptor.fragment.targets[0].blend.color || {};
    descriptor.fragment.targets[0].blend.color.dstTarget = value;
  },

  blendAlphaOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.operation = value;
  },

  blendAlphaSrcTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.srcTarget = value;
  },

  blendAlphaDstTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.fragment.targets[0].blend = descriptor.fragment.targets[0].blend || {};
    descriptor.fragment.targets[0].blend.alpha = descriptor.fragment.targets[0].blend.alpha || {};
    descriptor.fragment.targets[0].blend.alpha.dstTarget = value;
  },
  */
};

const DEFAULT_PIPELINE_DESCRIPTOR: PipelineDescriptor = {
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
}

export function applyParametersToRenderPipelineDescriptor(pipelineDescriptor, parameters: Parameters = {}): PipelineDescriptor {
  pipelineDescriptor = {...DEFAULT_PIPELINE_DESCRIPTOR, ...pipelineDescriptor};
  setParameters(pipelineDescriptor, parameters);
  return pipelineDescriptor;
}

// Apply any supplied parameters
function setParameters(pipelineDescriptor: PipelineDescriptor, parameters: Parameters): void {
  for (const key in parameters) {
    const value = parameters[key];
    const setterFunction = PARAMETER_TABLE[key];
    if (!setterFunction) {
      throw new Error(`Illegal parameter ${key}`);
    }
    setterFunction(key, value, pipelineDescriptor);
  }
}

function addColorState(descriptor: PipelineDescriptor): void {
  descriptor.fragment.targets = descriptor.fragment.targets || [];
  // @ts-expect-error
  if (descriptor.fragment.targets.length === 0) {
    // @ts-expect-error
    descriptor.fragment.targets.push({});
  }
}
