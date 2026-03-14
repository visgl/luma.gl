// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '@luma.gl/core';
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
function addDepthStencilFront(descriptor) {
    const depthStencil = addDepthStencil(descriptor);
    // @ts-ignore
    return depthStencil.stencilFront;
}
function addDepthStencilBack(descriptor) {
    const depthStencil = addDepthStencil(descriptor);
    // @ts-ignore
    return depthStencil.stencilBack;
}
/**
 * Supports for luma.gl's flat parameter space
 * Populates the corresponding sub-objects in a GPURenderPipelineDescriptor
 */
export const PARAMETER_TABLE = {
    // RASTERIZATION PARAMETERS
    cullMode: (_, value, descriptor) => {
        descriptor.primitive = descriptor.primitive || {};
        descriptor.primitive.cullMode = value;
    },
    frontFace: (_, value, descriptor) => {
        descriptor.primitive = descriptor.primitive || {};
        descriptor.primitive.frontFace = value;
    },
    // DEPTH
    depthWriteEnabled: (_, value, descriptor) => {
        if (value) {
            const depthStencil = addDepthStencil(descriptor);
            depthStencil.depthWriteEnabled = value;
        }
    },
    depthCompare: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthCompare = value;
    },
    depthFormat: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.format = value;
    },
    depthBias: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBias = value;
    },
    depthBiasSlopeScale: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBiasSlopeScale = value;
    },
    depthBiasClamp: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.depthBiasClamp = value;
    },
    // STENCIL
    stencilReadMask: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilReadMask = value;
    },
    stencilWriteMask: (_, value, descriptor) => {
        const depthStencil = addDepthStencil(descriptor);
        depthStencil.stencilWriteMask = value;
    },
    stencilCompare: (_, value, descriptor) => {
        const stencilFront = addDepthStencilFront(descriptor);
        const stencilBack = addDepthStencilBack(descriptor);
        stencilFront.compare = value;
        stencilBack.compare = value;
    },
    stencilPassOperation: (_, value, descriptor) => {
        const stencilFront = addDepthStencilFront(descriptor);
        const stencilBack = addDepthStencilBack(descriptor);
        stencilFront.passOp = value;
        stencilBack.passOp = value;
    },
    stencilFailOperation: (_, value, descriptor) => {
        const stencilFront = addDepthStencilFront(descriptor);
        const stencilBack = addDepthStencilBack(descriptor);
        stencilFront.failOp = value;
        stencilBack.failOp = value;
    },
    stencilDepthFailOperation: (_, value, descriptor) => {
        const stencilFront = addDepthStencilFront(descriptor);
        const stencilBack = addDepthStencilBack(descriptor);
        stencilFront.depthFailOp = value;
        stencilBack.depthFailOp = value;
    },
    // MULTISAMPLE
    sampleCount: (_, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.count = value;
    },
    sampleMask: (_, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.mask = value;
    },
    sampleAlphaToCoverageEnabled: (_, value, descriptor) => {
        descriptor.multisample = descriptor.multisample || {};
        descriptor.multisample.alphaToCoverageEnabled = value;
    },
    // COLOR
    colorMask: (_, value, descriptor) => {
        const target = addColorState(descriptor, 0);
        target.writeMask = value;
    },
    blend: (_, value, descriptor) => {
        if (value) {
            addBlendState(descriptor, 0);
        }
    },
    blendColorOperation: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.color = blend.color || {};
        blend.color.operation = value;
    },
    blendColorSrcFactor: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.color = blend.color || {};
        blend.color.srcFactor = value;
    },
    blendColorDstFactor: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.color.dstFactor = value;
    },
    blendAlphaOperation: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.alpha = blend.alpha || {};
        blend.alpha.operation = value;
    },
    blendAlphaSrcFactor: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.alpha = blend.alpha || {};
        blend.alpha.srcFactor = value;
    },
    blendAlphaDstFactor: (_, value, descriptor) => {
        const blend = addBlendState(descriptor, 0);
        blend.alpha = blend.alpha || {};
        blend.alpha.dstFactor = value;
    },
    unclippedDepth: notSupported,
    provokingVertex: notSupported,
    polygonMode: notSupported,
    polygonOffsetLine: notSupported,
    clipDistance0: notSupported,
    clipDistance1: notSupported,
    clipDistance2: notSupported,
    clipDistance3: notSupported,
    clipDistance4: notSupported,
    clipDistance5: notSupported,
    clipDistance6: notSupported,
    clipDistance7: notSupported
};
function notSupported(key, value, descriptor) {
    log.warn(`${key} parameter not supported in WebGPU`)();
}
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
        if (setterFunction) {
            setterFunction(key, value, pipelineDescriptor);
        }
        else {
            log.error(`Illegal parameter ${key} in WebGPU`)();
        }
    }
}
/** @todo - support multiple color targets... */
function addColorState(descriptor, attachment) {
    // @ts-ignore
    descriptor.fragment.targets = descriptor.fragment?.targets || [];
    if (!Array.isArray(descriptor.fragment?.targets)) {
        log.warn('parameters: no targets array')();
    }
    // @ts-expect-error GPU types as iterator
    if (descriptor.fragment?.targets?.length === 0) {
        // @ts-expect-error GPU types as iterator
        descriptor.fragment.targets?.push({});
    }
    // @ts-expect-error GPU types as iterator
    return descriptor.fragment?.targets?.[0];
}
function addBlendState(descriptor, attachment) {
    const target = addColorState(descriptor, attachment);
    target.blend = target.blend || { color: {}, alpha: {} };
    return target.blend;
}
