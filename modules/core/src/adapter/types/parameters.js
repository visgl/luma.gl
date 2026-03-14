// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// export const DEFAULT_PARAMETERS: Parameters;
export const DEFAULT_PARAMETERS = {
    // Rasterization Parameters
    cullMode: 'none',
    frontFace: 'ccw',
    // Depth Parameters
    depthWriteEnabled: false,
    depthCompare: 'always',
    depthFormat: 'depth24plus',
    depthBias: 0,
    depthBiasSlopeScale: 0,
    depthBiasClamp: 0,
    // Stencil parameters
    stencilReadMask: 0xffffffff,
    stencilWriteMask: 0xffffffff,
    stencilCompare: 'always',
    stencilPassOperation: 'keep',
    stencilFailOperation: 'keep',
    stencilDepthFailOperation: 'keep',
    // Multisample parameters
    sampleCount: 0,
    sampleMask: 0xffffffff,
    sampleAlphaToCoverageEnabled: false,
    // Color and blend parameters
    blend: false,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'zero',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'zero',
    colorMask: 0xf,
    // Extensions
    unclippedDepth: false,
    provokingVertex: 'last',
    polygonMode: 'fill',
    polygonOffsetLine: false,
    clipDistance0: undefined,
    clipDistance1: undefined,
    clipDistance2: undefined,
    clipDistance3: undefined,
    clipDistance4: undefined,
    clipDistance5: undefined,
    clipDistance6: undefined,
    clipDistance7: undefined
};
