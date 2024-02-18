// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {
  Device,
  Parameters,
  CompareFunction,
  StencilOperation,
  log,
  isObjectEmpty,
  BlendOperation,
  BlendFactor
} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import type {GLBlendEquation, GLBlendFunction, GLParameters} from '@luma.gl/constants';
import {pushContextState, popContextState} from '../../context/state-tracker/track-context-state';
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
  func: (device?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions
  // @ts-expect-error
  pushContextState(device.gl);
  try {
    setDeviceParameters(device, parameters);
    setGLParameters(device, glParameters);
    return func(device);
  } finally {
    // @ts-expect-error
    popContextState(device.gl);
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
  func: (device?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions
  // @ts-expect-error
  pushContextState(device.gl);
  try {
    setGLParameters(device, parameters);
    return func(device);
  } finally {
    // @ts-expect-error
    popContextState(device.gl);
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
  func: (device?: Device) => T
): T {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(device);
  }

  // Wrap in a try-catch to ensure that parameters are restored on exceptions
  // @ts-expect-error
  pushContextState(device.gl);
  try {
    setDeviceParameters(device, parameters);
    return func(device);
  } finally {
    // @ts-expect-error
    popContextState(device.gl);
  }
}

/** Set WebGPU Style Parameters */
export function setDeviceParameters(device: Device, parameters: Parameters) {
  const webglDevice = WebGLDevice.attach(device);
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

  if (parameters.depthBias !== undefined) {
    gl.polygonOffset(parameters.depthBias, parameters.depthBiasSlopeScale || 0);
  }

  // depthBiasSlopeScale: {
  //   // Handled by depthBias
  // },

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

  if (parameters.blendColorOperation || parameters.blendAlphaOperation) {
    gl.enable(GL.BLEND);

    const colorEquation = convertBlendOperationToEquation('blendColorOperation', parameters.blendColorOperation || 'add');
    const alphaEquation = convertBlendOperationToEquation('blendAlphaOperation', parameters.blendAlphaOperation || 'add');
    gl.blendEquationSeparate(colorEquation, alphaEquation);

    const colorSrcFactor = convertBlendFactorToFunction('blendColorSrcFactor', parameters.blendColorSrcFactor || 'one');
    const colorDstFactor = convertBlendFactorToFunction('blendColorDstFactor', parameters.blendColorDstFactor || 'zero');
    const alphaSrcFactor = convertBlendFactorToFunction('blendAlphaSrcFactor', parameters.blendAlphaSrcFactor || 'one');
    const alphaDstFactor = convertBlendFactorToFunction('blendAlphaDstFactor', parameters.blendAlphaDstFactor || 'zero');
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

export function convertCompareFunction(parameter: string, value: CompareFunction): GL {
  return map(parameter, value, {
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

export function convertToCompareFunction(parameter: string, value: GL): CompareFunction {
  return map(parameter, value, {
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
  return map(parameter, value, {
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

function convertBlendOperationToEquation(parameter: string, value: BlendOperation): GLBlendEquation {
  return map(parameter, value, {
    'add': GL.FUNC_ADD,
    'subtract': GL.FUNC_SUBTRACT,
    'reverse-subtract': GL.FUNC_REVERSE_SUBTRACT,
    'min': GL.MIN,
    'max': GL.MAX
  } as Record<BlendOperation, GLBlendEquation>);
}

function convertBlendFactorToFunction(parameter: string, value: BlendFactor): GLBlendFunction {
  return map(parameter, value, {
    'one': GL.ONE,
    'zero': GL.ZERO,
    'src-color': GL.SRC_COLOR,
    'one-minus-src-color': GL.ONE_MINUS_SRC_COLOR,
    'dst-color': GL.DST_COLOR,
    'one-minus-dst-color': GL.ONE_MINUS_DST_COLOR,
    'src-alpha': GL.SRC_ALPHA,
    'one-minus-src-alpha': GL.ONE_MINUS_SRC_ALPHA,
    'dst-alpha': GL.DST_ALPHA,
    'one-minus-dst-alpha': GL.ONE_MINUS_DST_ALPHA,
  } as Record<BlendFactor, GLBlendFunction>);
}

function message(parameter: string, value: any): string {
  return `Illegal parameter ${value} for ${parameter}`;
}

function map(parameter: string, value: any, valueMap: Record<string, any>): any {
  if (!(value in valueMap)) {
    throw new Error(message(parameter, value));
  }
  return valueMap[value];
}

function mapBoolean(parameter: string, value: boolean): boolean {
  return value;
}
