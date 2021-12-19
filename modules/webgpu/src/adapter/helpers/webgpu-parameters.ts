import {Parameters} from '@luma.gl/api';

type PipelineDescriptor = Omit<GPURenderPipelineDescriptor, 'vertexStage'>;

/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a PipelineDescriptor
 */
export const PARAMETER_TABLE = {

  // RASTERIZATION PARAMETERS

  /*
  cullMode: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.rasterizationState.cullMode = value;
  },
  cullFace: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.rasterizationState.frontFace = value;
  },

  depthBias: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.rasterizationState.depthBias = value;
  },

  depthBiasSlopeScale: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.rasterizationState.depthBiasSlopeScale = value;
  },

  depthBiasClamp: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.rasterizationState.depthBiasClamp = value;
  },

  // STENCIL

  stencilReadMask: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilReadMask = value;
  },

  stencilWriteMask: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilWriteMask = value;
  },

  stencilCompare: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilFront.compare = value;
    descriptor.depthStencilState.stencilBack.compare = value;
  },

  stencilPassOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilFront.passOp = value;
    descriptor.depthStencilState.stencilBack.passOp = value;
  },

  stencilFailOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilFront.failOp = value;
    descriptor.depthStencilState.stencilBack.failOp = value;
  },

  stencilDepthFailOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.stencilFront.depthFailOp = value;
    descriptor.depthStencilState.stencilBack.depthFailOp = value;
  },

  // DEPTH

  depthWriteEnabled: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.depthWriteEnabled = value;
  },

  depthCompare: (parameter, value, descriptor: PipelineDescriptor) => {
    descriptor.depthStencilState.depthCompare = value;
  },

  colorMask: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].writeMask = value;
  },

  blendColorOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.color = descriptor.colorStates[0].blend.color || {};
    descriptor.colorStates[0].blend.color.operation = value;
  },

  blendColorSrcTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.color = descriptor.colorStates[0].blend.color || {};
    descriptor.colorStates[0].blend.color.srcTarget = value;
  },

  blendColorDstTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.color = descriptor.colorStates[0].blend.color || {};
    descriptor.colorStates[0].blend.color.dstTarget = value;
  },

  blendAlphaOperation: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.alpha = descriptor.colorStates[0].blend.alpha || {};
    descriptor.colorStates[0].blend.alpha.operation = value;
  },

  blendAlphaSrcTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.alpha = descriptor.colorStates[0].blend.alpha || {};
    descriptor.colorStates[0].blend.alpha.srcTarget = value;
  },

  blendAlphaDstTarget: (parameter, value, descriptor: PipelineDescriptor) => {
    addColorState(descriptor);
    descriptor.colorStates[0].blend = descriptor.colorStates[0].blend || {};
    descriptor.colorStates[0].blend.alpha = descriptor.colorStates[0].blend.alpha || {};
    descriptor.colorStates[0].blend.alpha.dstTarget = value;
  },
  */
};

const DEFAULT_PIPELINE_DESCRIPTOR: PipelineDescriptor = {
  depthStencil: {
    stencilFront: {},
    stencilBack: {},
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus-stencil8',
  },

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
    ]
  }
}

export function getRenderPipelineDescriptor(parameters: Parameters = {}, props = {}): PipelineDescriptor {
  const pipelineDescriptor: PipelineDescriptor = {...DEFAULT_PIPELINE_DESCRIPTOR};
  // pipelineDescriptor.
  //   rasterizationState: {
  //     cullMode: 'back',
  //   },

  //   depthStencilState: {
  //     depthWriteEnabled: true,
  //     depthCompare: 'less',
  //     format: props.depthStencilFormat || 'depth24plus-stencil8',
  //   },

  //   colorStates: [
  //     {
  //       format: props.color0Format || 'bgra8unorm',
  //     }
  //   ],

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

// function addColorState(descriptor: PipelineDescriptor): void {
//   descriptor.colorStates = descriptor.colorStates || [];
//   // @ts-expect-error
//   if (descriptor.colorStates.length === 0) {
//     // @ts-expect-error
//     descriptor.colorStates.push({});
//   }
// }
