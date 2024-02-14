function addDepthStencil(descriptor) {
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
/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a GPURenderPipelineDescriptor
 */
// @ts-expect-error
export const PARAMETER_TABLE = {
    // RASTERIZATION PARAMETERS
    cullMode: (parameter, value, descriptor) => {
        descriptor.primitive = descriptor.primitive || {};
        descriptor.primitive.cullMode = value;
    },
    frontFace: (parameter, value, descriptor) => {
        descriptor.primitive = descriptor.primitive || {};
        descriptor.primitive.frontFace = value;
    },
    // DEPTH
    depthWriteEnabled: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthWriteEnabled = value;
    },
    depthCompare: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthCompare = value;
    },
    depthFormat: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.format = value;
    },
    depthBias: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBias = value;
    },
    depthBiasSlopeScale: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBiasSlopeScale = value;
    },
    depthBiasClamp: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBiasClamp = value;
    },
    // STENCIL
    stencilReadMask: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilReadMask = value;
    },
    stencilWriteMask: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilWriteMask = value;
    },
    stencilCompare: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilFront.compare = value;
        depthStencil.stencilBack.compare = value;
    },
    stencilPassOperation: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilFront.passOp = value;
        depthStencil.stencilBack.passOp = value;
    },
    stencilFailOperation: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilFront.failOp = value;
        depthStencil.stencilBack.failOp = value;
    },
    stencilDepthFailOperation: (parameter, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilFront.depthFailOp = value;
        depthStencil.stencilBack.depthFailOp = value;
    },
    // MULTISAMPLE
    sampleCount: (parameter, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.count = value;
    },
    sampleMask: (parameter, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.mask = value;
    },
    sampleAlphaToCoverageEnabled: (parameter, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.alphaToCoverageEnabled = value;
    },
    // COLOR
    colorMask: (parameter, value, descriptor) => {
        const targets = addColorState(descriptor);
        targets[0].writeMask = value;
    },
    blendColorOperation: (parameter, value, descriptor) => {
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
const DEFAULT_PIPELINE_DESCRIPTOR = {
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
    },
    layout: 'auto'
};
export function applyParametersToRenderPipelineDescriptor(pipelineDescriptor, parameters = {}) {
    // Apply defaults
    Object.assign(pipelineDescriptor, { ...DEFAULT_PIPELINE_DESCRIPTOR, ...pipelineDescriptor });
    setParameters(pipelineDescriptor, parameters);
}
// Apply any supplied parameters
function setParameters(pipelineDescriptor, parameters) {
    for (const [key, value] of Object.entries(parameters)) {
        const setterFunction = PARAMETER_TABLE[key];
        if (!setterFunction) {
            throw new Error(`Illegal parameter ${key}`);
        }
        setterFunction(key, value, pipelineDescriptor);
    }
}
function addColorState(descriptor) {
    descriptor.fragment.targets = descriptor.fragment?.targets || [];
    if (!Array.isArray(descriptor.fragment?.targets)) {
        throw new Error('colorstate');
    }
    if (descriptor.fragment?.targets?.length === 0) {
        descriptor.fragment.targets?.push({});
    }
    return descriptor.fragment?.targets;
}
