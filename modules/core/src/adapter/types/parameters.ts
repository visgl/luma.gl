// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray4, NumberArray6} from '@math.gl/types';
import {DepthStencilTextureFormat} from '../../gpu-type-utils/texture-formats';

export type CompareFunction =
  | 'never'
  | 'less'
  | 'equal'
  | 'less-equal'
  | 'greater'
  | 'not-equal'
  | 'greater-equal'
  | 'always';

// Primitive state

export type PrimitiveTopology =
  | 'point-list'
  | 'line-list'
  | 'line-strip'
  | 'triangle-list'
  | 'triangle-strip';

export type IndexFormat = 'uint16' | 'uint32';

export type CullMode = 'none' | 'front' | 'back';
export type FrontFace = 'ccw' | 'cw';
export type PolygonMode = 'fill' | 'line';
export type ProvokingVertex = 'first' | 'last';

// Rasterization Parameters

type _RenderParameters = {
  /** Defines which polygon orientation will be culled, if any. Only applies to triangle topologies/ */
  cullMode?: CullMode;
  /** Defines which polygons are considered front-facing. Only applies to triangle topologies. Default to "ccw" */
  frontFace?: FrontFace;
  /** Constant depth bias (polygon offset) added to each fragment. */
  depthBias?: number;
  /** Depth bias (polygon offset) that scales with the fragment’s slope. */
  depthBiasSlopeScale?: number;
  /** Maximum depth bias of a fragment. */
  depthBiasClamp?: number;

  // Extensions

  /** Disable depth clipping. Requires 'depth-clip-control' */
  unclippedDepth?: boolean;

  /** Which vertex in primitive to use for flat shading (perf may improve). Requires 'provoking-vertex-webgl' */
  provokingVertex?: 'first' | 'last';
  /** Debug: Set polygon rasterization mode to 'line' for wire frames. Requires: 'polygon-mode-webgl' */
  polygonMode?: 'fill' | 'line';
  /** Debug: Enable polygon offset (`depthBias`) for 'line' primitives: Requires 'polygon-mode-webgl' */
  polygonOffsetLine?: boolean;

  /** Enables gl_ClipDistance[0] and gl_CullDistance[0]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance0?: boolean;
  /** Enables gl_ClipDistance[1] and gl_CullDistance[1]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance1?: boolean;
  /** Enables gl_ClipDistance[2] and gl_CullDistance[2]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance2?: boolean;
  /** Enables gl_ClipDistance[3] and gl_CullDistance[3]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance3?: boolean;
  /** Enables gl_ClipDistance[4] and gl_CullDistance[4]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance4?: boolean;
  /** Enables gl_ClipDistance[5] and gl_CullDistance[5]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance5?: boolean;
  /** Enables gl_ClipDistance[6] and gl_CullDistance[6]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance6?: boolean;
  /** Enables gl_ClipDistance[7] and gl_CullDistance[7]. Requires 'shader-clip-cull-distance-webgl' */
  clipDistance7?: boolean;
};

export type RasterizationParameters = _RenderParameters & {
  /** The type of primitive to be constructed from the vertex inputs. Defaults to "triangle-list". */
  topology?: PrimitiveTopology;
  /** For pipelines with strip topologies ("line-strip" or "triangle-strip"), this determines the index buffer format and primitive restart value ("uint16"/0xFFFF or "uint32"/0xFFFFFFFF). It is not allowed on pipelines with non-strip topologies. */
  stripIndexFormat?: IndexFormat; // WebGPU only
};

// Depth Stencil Parameters

/** Types of operations that can be performed on stencil buffers when various tests pass */
export type StencilOperation =
  | 'keep'
  | 'zero'
  | 'replace'
  | 'invert'
  | 'increment-clamp'
  | 'decrement-clamp'
  | 'increment-wrap'
  | 'decrement-wrap';

export type DepthStencilParameters = {
  /** Whether this GPURenderPipeline can modify depthStencilAttachment depth values. */
  depthWriteEnabled?: boolean;
  /** The comparison operation used to test fragment depths against existing depthStencilAttachment depth values. */
  depthCompare?: CompareFunction;
  /** The format of depthStencilAttachment this GPURenderPipeline will be compatible with. */
  depthFormat?: DepthStencilTextureFormat;

  /** Bitmask controlling which depthStencilAttachment stencil value bits are read when performing stencil comparison tests. */
  stencilReadMask?: number;
  /** Bitmask controlling which depthStencilAttachment stencil value bits are written to when performing stencil operations. */
  stencilWriteMask?: number;

  /** The CompareFunction used when testing fragments against depthStencilAttachment stencil values. */
  stencilCompare?: CompareFunction;
  /** The StencilOperation performed if the fragment stencil comparison test described by compare fails. */
  stencilPassOperation?: StencilOperation;
  /** The GPUStencilOperation performed if the fragment depth comparison described by depthCompare fails. */
  stencilFailOperation?: StencilOperation;
  /** The GPUStencilOperation performed if the fragment stencil comparison test described by compare passes. */
  stencilDepthFailOperation?: StencilOperation;
};

// Color Parameters

/** BlendFactor defines how either a source or destination blend factors is calculated */
export type BlendFactor =
  | 'zero'
  | 'one'
  | 'src-color'
  | 'one-minus-src-color'
  | 'src-alpha'
  | 'one-minus-src-alpha'
  | 'dst-color'
  | 'one-minus-dst-color'
  | 'dst-alpha'
  | 'one-minus-dst-alpha'
  | 'src-alpha-saturated'
  | 'constant-color'
  | 'one-minus-constant-color'
  | 'constant-alpha'
  | 'one-minus-constant-alpha';

/** BlendOperation defines the algorithm used to combine source and destination blend factors: */
export type BlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';

/* Color parameters are set on the RenderPipeline */
export type ColorParameters = {
  /** Enable blending */
  blend?: boolean;

  /** Defines the operation used to calculate the values written to the target attachment components. */
  blendColorOperation?: BlendOperation;
  /** Defines the operation to be performed on values from the fragment shader. */
  blendColorSrcFactor?: BlendFactor;
  /** Defines the operation to be performed on values from the target attachment. */
  blendColorDstFactor?: BlendFactor;

  /** Defines the operation used to calculate the values written to the target attachment components. */
  blendAlphaOperation?: BlendOperation;
  /** Defines the operation to be performed on values from the fragment shader. */
  blendAlphaSrcFactor?: BlendFactor;
  /** Defines the operation to be performed on values from the target attachment. */
  blendAlphaDstFactor?: BlendFactor;

  /** Bitmask controlling which channels are are written to when drawing to this color target. defaulting to 0xF */
  colorMask?: number;
};

/** Multisample */
export type MultisampleParameters = {
  /** Number of samples per pixel. RenderPipeline will be compatible only with attachment textures with matching sampleCounts. */
  sampleCount?: number; //  = 1;
  /** Mask determining which samples are written to. defaulting to 0xFFFFFFFF */
  sampleMask?: number;
  /** When true indicates that a fragment’s alpha channel should be used to generate a sample coverage mask. */
  sampleAlphaToCoverageEnabled?: boolean; //  = false;
};

/** These parameters are set on the render pass and are thus easy to change frequently */
export type RenderPassParameters = {
  /** Linear map from normalized device coordinates to viewport coordinates [x, y, width, height, minDepth, maxDepth] */
  viewport?: NumberArray4 | NumberArray6;
  /** Sets scissor rectangle used during rasterization. Discards fragments outside viewport coords [x, y, width, height]. */
  scissorRect?: NumberArray4;
  /** Sets constant blend color and alpha values used with "constant" and "one-minus-constant" blend factors. */
  blendConstant?: NumberArray4;
  /** Stencil operation "replace" sets the value to stencilReference */
  stencilReference?: number; // GPUStencilValue

  /** Bitmask controlling which channels are are written to when drawing/clearing. defaulting to 0xF */
  colorMask?: number;
};

export type RenderPipelineParameters = RasterizationParameters &
  DepthStencilParameters &
  ColorParameters &
  MultisampleParameters;

export type Parameters = _RenderParameters &
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

  clipDistance0: undefined!,
  clipDistance1: undefined!,
  clipDistance2: undefined!,
  clipDistance3: undefined!,
  clipDistance4: undefined!,
  clipDistance5: undefined!,
  clipDistance6: undefined!,
  clipDistance7: undefined!
};
