import {DepthStencilTextureFormat} from './texture-formats';

export type CompareFunction =
  'never' |
  'less' |
  'equal' |
  'less-equal' |
  'greater' |
  'not-equal' |
  'greater-equal' |
  'always';

// Primitive state

export type PrimitiveTopology =
  'point-list' |
  'line-list' |
  'line-strip' |
  /** @deprecated */
  'line-loop' |
  'triangle-list' |
  'triangle-strip' |
  /** @deprecated */
  'triangle-fan';

export type IndexFormat = 'uint16' | 'uint32';

export type CullMode = 'none' | 'front' | 'back';
export type FrontFace = 'ccw' | 'cw';

// Rasterization Parameters

type _RenderParameters = {
  cullMode?: CullMode;
  frontFace?: FrontFace;
  depthClamp?: boolean;
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

export type RasterizationParameters = _RenderParameters & {
  topology?: PrimitiveTopology;
  stripIndexFormat?: IndexFormat; // WebGPU only
}

// Depth Stencil Parameters

export type StencilOperation =
  'keep' |
  'zero' |
  'replace' |
  'invert' |
  'increment-clamp' |
  'decrement-clamp' |
  'increment-wrap' |
  'decrement-wrap';

export type DepthStencilParameters = {
  depthWriteEnabled?: boolean;
  depthCompare?: CompareFunction;
  depthFormat?: DepthStencilTextureFormat;

  stencilReadMask?: number;
  stencilWriteMask?: number;

  stencilCompare?: CompareFunction;
  stencilPassOperation?: StencilOperation;
  stencilFailOperation?: StencilOperation;
  stencilDepthFailOperation?: StencilOperation;
}

// Color Parameters

export type BlendFactor =
  'zero' |
  'one' |
  'src-color' |
  'one-minus-src-color' |
  'src-alpha' |
  'one-minus-src-alpha' |
  'dst-color' |
  'one-minus-dst-color' |
  'dst-alpha' |
  'one-minus-dst-alpha' |
  'src-alpha-saturated' |
  'blend-color' |
  'one-minus-blend-color';

export type BlendOperation =
  'add' |
  'subtract' |
  'reverse-subtract' |
  'min' |
  'max';

/*
export const ColorWrite = {
  RED: 0x1,
  GREEN: 0x2,
  BLUE: 0x4,
  ALPHA: 0x8,
  ALL: 0xF
};

blend: {
  color: {operation, srcFactor, dstFactor}
  alpha: {operation, srcFactor, dstFactor}
}
colorWriteMask

rgba
rgb
rga
rba
gba
rg
rb
ra
gb
ga
ba
r
g
b
a
none
*/

export type ColorParameters = {
  blendColorOperation?: BlendOperation;
  blendColorSrcFactor?: BlendFactor;
  blendColorDstFactor?: BlendFactor;

  blendAlphaOperation?: BlendOperation;
  blendAlphaSrcFactor?: BlendFactor;
  blendAlphaDstFactor?: BlendFactor;

  colorMask?: number;
}

// Multisample
export type MultisampleParameters = {
  sampleCount?: number; //  = 1;
  sampleMask?: number; // = 0xFFFFFFFF;
  sampleAlphaToCoverageEnabled?: boolean; //  = false;
};

// These are set on the render pass encoder and are thus "cheaper" to change
export type RenderPassParameters = {
  viewport: number[]; // float x, float y, float width, float height, float minDepth, float maxDepth
  scissorRect: number[]; // (GPUIntegerCoordinate x, GPUIntegerCoordinate y, GPUIntegerCoordinate width, GPUIntegerCoordinate height);
  blendConstant: number[]; // GPUColor
  stencilReference: number; // GPUStencilValue
};

export type RenderPipelineParameters =
  RasterizationParameters &
  DepthStencilParameters &
  ColorParameters &
  MultisampleParameters;

export type Parameters =
  _RenderParameters &
  DepthStencilParameters &
  ColorParameters &
  MultisampleParameters;

// export const DEFAULT_PARAMETERS: Parameters;

export const DEFAULT_PARAMETERS: Required<Parameters> = {

  // Rasterization Parameters

  cullMode: 'none',
  frontFace: 'ccw',

  // Depth Parameters

  depthWriteEnabled: false,
  depthCompare: 'always',
  depthFormat: 'depth24plus',

  depthClamp: false,
  depthBias: 0,
  depthBiasSlopeScale: 0,
  depthBiasClamp: 0,

  // Stencil parameters

  stencilReadMask: 0xFFFFFFFF,
  stencilWriteMask: 0xFFFFFFFF,

  stencilCompare: 'always',
  stencilPassOperation: 'keep',
  stencilFailOperation: 'keep',
  stencilDepthFailOperation: 'keep',

  // Multisample parameters
  sampleCount: 0,
  sampleMask: 0xFFFFFFFF,
  sampleAlphaToCoverageEnabled: false,

  // Color and blend parameters

  blendColorOperation: 'add',
  blendColorSrcFactor: 'one',
  blendColorDstFactor: 'zero',

  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'zero',

  colorMask: 0xF
};
