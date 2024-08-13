// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompareFunction, StencilOperation, BlendOperation, BlendFactor} from '@luma.gl/core';
import {Device, log, Parameters, PolygonMode, ProvokingVertex} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import type {
  GLBlendEquation,
  GLBlendFunction,
  GLFunction,
  GLParameters,
  GLPolygonMode,
  GLProvokingVertex,
  GLStencilOp
} from '@luma.gl/constants';
import {setGLParameters} from '../../context/parameters/unified-parameter-api';
import {WebGLDevice} from '../webgl-device';

/* eslint-disable no-unused-expressions */ // For expression ? gl.enable() : gl.disable()

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 */
export function withDeviceAndGLParameters<T = unknown>(
  device: Device,
  parameters: Parameters,
  glParameters: GLParameters,
  func: (_?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions
  const webglDevice = device as WebGLDevice;
  webglDevice.pushState();
  try {
    setDeviceParameters(device, parameters);
    setGLParameters(webglDevice.gl, glParameters);
    return func(device);
  } finally {
    webglDevice.popState();
  }
}

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 * @deprecated use withDeviceParameters instead
 */
export function withGLParameters<T = unknown>(
  device: Device,
  parameters: GLParameters,
  func: (_?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions
  const webglDevice = device as WebGLDevice;
  webglDevice.pushState();
  try {
    setGLParameters(webglDevice.gl, parameters);
    return func(device);
  } finally {
    webglDevice.popState();
  }
}

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 */
export function withDeviceParameters<T = unknown>(
  device: Device,
  parameters: Parameters,
  func: (_?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions'
  const webglDevice = device as WebGLDevice;
  webglDevice.pushState();
  try {
    setDeviceParameters(device, parameters);
    return func(device);
  } finally {
    webglDevice.popState();
  }
}

/** Set WebGPU Style Parameters */
export function setDeviceParameters(device: Device, parameters: Parameters) {
  const webglDevice = device as WebGLDevice;
  const {gl} = webglDevice;

  // RASTERIZATION SETTINGS
  if (parameters.cullMode) {
    switch (parameters.cullMode) {
      case 'none':
        gl.disable(GL.CULL_FACE);
        break;
      case 'front':
        gl.enable(GL.CULL_FACE);
        gl.cullFace(GL.FRONT);
        break;
      case 'back':
        gl.enable(GL.CULL_FACE);
        gl.cullFace(GL.BACK);
        break;
    }
  }

  if (parameters.frontFace) {
    gl.frontFace(
      map('frontFace', parameters.frontFace, {
        ccw: GL.CCW,
        cw: GL.CW
      })
    );
  }

  if (parameters.unclippedDepth) {
    if (device.features.has('depth-clip-control')) {
      // EXT_depth_clamp
      gl.enable(GL.DEPTH_CLAMP_EXT);
    }
  }

  if (parameters.depthBias !== undefined) {
    gl.enable(GL.POLYGON_OFFSET_FILL);
    gl.polygonOffset(parameters.depthBias, parameters.depthBiasSlopeScale || 0);
  }

  // depthBiasSlopeScale: {
  //   // Handled by depthBias
  // },

  // WEBGL EXTENSIONS

  if (parameters.provokingVertex) {
    if (device.features.has('provoking-vertex-webgl')) {
      const extensions = webglDevice.getExtension('WEBGL_provoking_vertex');
      const ext = extensions.WEBGL_provoking_vertex;

      const vertex = map<ProvokingVertex, GLProvokingVertex>(
        'provokingVertex',
        parameters.provokingVertex,
        {
          first: GL.FIRST_VERTEX_CONVENTION_WEBGL,
          last: GL.LAST_VERTEX_CONVENTION_WEBGL
        }
      );
      ext?.provokingVertexWEBGL(vertex);
    }
  }

  if (parameters.polygonMode || parameters.polygonOffsetLine) {
    if (device.features.has('polygon-mode-webgl')) {
      if (parameters.polygonMode) {
        const extensions = webglDevice.getExtension('WEBGL_polygon_mode');
        const ext = extensions.WEBGL_polygon_mode;
        const mode = map<PolygonMode, GLPolygonMode>('polygonMode', parameters.polygonMode, {
          fill: GL.FILL_WEBGL,
          line: GL.LINE_WEBGL
        });
        ext?.polygonModeWEBGL(GL.FRONT, mode);
        ext?.polygonModeWEBGL(GL.BACK, mode);
      }

      if (parameters.polygonOffsetLine) {
        gl.enable(GL.POLYGON_OFFSET_LINE_WEBGL);
      }
    }
  }

  if (device.features.has('shader-clip-cull-distance-webgl')) {
    if (parameters.clipDistance0) {
      gl.enable(GL.CLIP_DISTANCE0_WEBGL);
    }
    if (parameters.clipDistance1) {
      gl.enable(GL.CLIP_DISTANCE1_WEBGL);
    }
    if (parameters.clipDistance2) {
      gl.enable(GL.CLIP_DISTANCE2_WEBGL);
    }
    if (parameters.clipDistance3) {
      gl.enable(GL.CLIP_DISTANCE3_WEBGL);
    }
    if (parameters.clipDistance4) {
      gl.enable(GL.CLIP_DISTANCE4_WEBGL);
    }
    if (parameters.clipDistance5) {
      gl.enable(GL.CLIP_DISTANCE5_WEBGL);
    }
    if (parameters.clipDistance6) {
      gl.enable(GL.CLIP_DISTANCE6_WEBGL);
    }
    if (parameters.clipDistance7) {
      gl.enable(GL.CLIP_DISTANCE7_WEBGL);
    }
  }

  // DEPTH STENCIL

  if (parameters.depthWriteEnabled !== undefined) {
    gl.depthMask(mapBoolean('depthWriteEnabled', parameters.depthWriteEnabled));
  }

  if (parameters.depthCompare) {
    parameters.depthCompare !== 'always' ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST);
    gl.depthFunc(convertCompareFunction('depthCompare', parameters.depthCompare));
  }

  if (parameters.stencilWriteMask) {
    const mask = parameters.stencilWriteMask;
    gl.stencilMaskSeparate(GL.FRONT, mask);
    gl.stencilMaskSeparate(GL.BACK, mask);
  }

  if (parameters.stencilReadMask) {
    // stencilReadMask is handle inside stencil***Compare.
    log.warn('stencilReadMask not supported under WebGL');
  }

  if (parameters.stencilCompare) {
    const mask = parameters.stencilReadMask || 0xffffffff;
    const glValue = convertCompareFunction('depthCompare', parameters.stencilCompare);
    // TODO - ensure back doesn't overwrite
    parameters.stencilCompare !== 'always'
      ? gl.enable(GL.STENCIL_TEST)
      : gl.disable(GL.STENCIL_TEST);
    gl.stencilFuncSeparate(GL.FRONT, glValue, 0, mask);
    gl.stencilFuncSeparate(GL.BACK, glValue, 0, mask);
  }

  if (
    parameters.stencilPassOperation &&
    parameters.stencilFailOperation &&
    parameters.stencilDepthFailOperation
  ) {
    const dppass = convertStencilOperation('stencilPassOperation', parameters.stencilPassOperation);
    const sfail = convertStencilOperation('stencilFailOperation', parameters.stencilFailOperation);
    const dpfail = convertStencilOperation(
      'stencilDepthFailOperation',
      parameters.stencilDepthFailOperation
    );
    gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
    gl.stencilOpSeparate(GL.BACK, sfail, dpfail, dppass);
  }

  // stencilDepthFailOperation() {
  //   // handled by stencilPassOperation
  // },

  // stencilFailOperation() {
  //   // handled by stencilPassOperation
  // },

  // COLOR STATE
  switch (parameters.blend) {
    case true:
      gl.enable(GL.BLEND);
      break;
    case false:
      gl.disable(GL.BLEND);
      break;
    default:
    // leave WebGL blend state unchanged if `parameters.blend` is not set
  }

  if (parameters.blendColorOperation || parameters.blendAlphaOperation) {
    const colorEquation = convertBlendOperationToEquation(
      'blendColorOperation',
      parameters.blendColorOperation || 'add'
    );
    const alphaEquation = convertBlendOperationToEquation(
      'blendAlphaOperation',
      parameters.blendAlphaOperation || 'add'
    );
    gl.blendEquationSeparate(colorEquation, alphaEquation);

    const colorSrcFactor = convertBlendFactorToFunction(
      'blendColorSrcFactor',
      parameters.blendColorSrcFactor || 'one'
    );
    const colorDstFactor = convertBlendFactorToFunction(
      'blendColorDstFactor',
      parameters.blendColorDstFactor || 'zero'
    );
    const alphaSrcFactor = convertBlendFactorToFunction(
      'blendAlphaSrcFactor',
      parameters.blendAlphaSrcFactor || 'one'
    );
    const alphaDstFactor = convertBlendFactorToFunction(
      'blendAlphaDstFactor',
      parameters.blendAlphaDstFactor || 'zero'
    );
    gl.blendFuncSeparate(colorSrcFactor, colorDstFactor, alphaSrcFactor, alphaDstFactor);
  }
}

/*
      rasterizationState: {
        cullMode: "back",
      },

      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
      },

      colorStates: [
        {
          format: "bgra8unorm",
          // colorBlend.srcFactor = wgpu::BlendFactor::SrcAlpha;
          // colorBlend.dstFactor = wgpu::BlendFactor::OneMinusSrcAlpha;
          // alphaBlend.srcFactor = wgpu::BlendFactor::SrcAlpha;
          // alphaBlend.dstFactor = wgpu::BlendFactor::OneMinusSrcAlpha;
        },
      ],
    });
*/

export function convertCompareFunction(parameter: string, value: CompareFunction): GLFunction {
  return map<CompareFunction, GLFunction>(parameter, value, {
    never: GL.NEVER,
    less: GL.LESS,
    equal: GL.EQUAL,
    'less-equal': GL.LEQUAL,
    greater: GL.GREATER,
    'not-equal': GL.NOTEQUAL,
    'greater-equal': GL.GEQUAL,
    always: GL.ALWAYS
  });
}

export function convertToCompareFunction(parameter: string, value: GLFunction): CompareFunction {
  return map<GLFunction, CompareFunction>(parameter, value, {
    [GL.NEVER]: 'never',
    [GL.LESS]: 'less',
    [GL.EQUAL]: 'equal',
    [GL.LEQUAL]: 'less-equal',
    [GL.GREATER]: 'greater',
    [GL.NOTEQUAL]: 'not-equal',
    [GL.GEQUAL]: 'greater-equal',
    [GL.ALWAYS]: 'always'
  });
}

function convertStencilOperation(parameter: string, value: StencilOperation): GL {
  return map<StencilOperation, GLStencilOp>(parameter, value, {
    keep: GL.KEEP,
    zero: GL.ZERO,
    replace: GL.REPLACE,
    invert: GL.INVERT,
    'increment-clamp': GL.INCR,
    'decrement-clamp': GL.DECR,
    'increment-wrap': GL.INCR_WRAP,
    'decrement-wrap': GL.DECR_WRAP
  });
}

function convertBlendOperationToEquation(
  parameter: string,
  value: BlendOperation
): GLBlendEquation {
  return map<BlendOperation, GLBlendEquation>(parameter, value, {
    add: GL.FUNC_ADD,
    subtract: GL.FUNC_SUBTRACT,
    'reverse-subtract': GL.FUNC_REVERSE_SUBTRACT,
    min: GL.MIN,
    max: GL.MAX
  });
}

function convertBlendFactorToFunction(parameter: string, value: BlendFactor): GLBlendFunction {
  return map<BlendFactor, GLBlendFunction>(parameter, value, {
    one: GL.ONE,
    zero: GL.ZERO,
    'src-color': GL.SRC_COLOR,
    'one-minus-src-color': GL.ONE_MINUS_SRC_COLOR,
    'dst-color': GL.DST_COLOR,
    'one-minus-dst-color': GL.ONE_MINUS_DST_COLOR,
    'src-alpha': GL.SRC_ALPHA,
    'one-minus-src-alpha': GL.ONE_MINUS_SRC_ALPHA,
    'dst-alpha': GL.DST_ALPHA,
    'one-minus-dst-alpha': GL.ONE_MINUS_DST_ALPHA,
    'src-alpha-saturated': GL.SRC_ALPHA_SATURATE,
    'constant-color': GL.CONSTANT_COLOR,
    'one-minus-constant-color': GL.ONE_MINUS_CONSTANT_COLOR,
    'constant-alpha': GL.CONSTANT_ALPHA,
    'one-minus-constant-alpha': GL.ONE_MINUS_CONSTANT_ALPHA
  });
}

function message(parameter: string, value: any): string {
  return `Illegal parameter ${value} for ${parameter}`;
}

function map<K extends string | number, V>(parameter: string, value: K, valueMap: Record<K, V>): V {
  if (!(value in valueMap)) {
    throw new Error(message(parameter, value));
  }
  return valueMap[value];
}

function mapBoolean(parameter: string, value: boolean): boolean {
  return value;
}

/** Returns true if given object is empty, false otherwise. */
function isObjectEmpty(obj: object): boolean {
  let isEmpty = true;
  // @ts-ignore key is unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const key in obj) {
    isEmpty = false;
    break;
  }
  return isEmpty;
}
