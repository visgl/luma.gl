import {CompareFunction, StencilOperation} from '@luma.gl/api';
import GL from '@luma.gl/constants';

export function convertCompareFunction(parameter, value: CompareFunction): number {
  return map(parameter, value, {
    'never': GL.NEVER,
    'less': GL.LESS,
    'equal': GL.EQUAL,
    'less-equal': GL.LEQUAL,
    'greater': GL.GREATER,
    'not-equal': GL.NOTEQUAL,
    'greater-equal': GL.GEQUAL,
    'always': GL.ALWAYS
  });
}

function convertStencilOperation(parameter, value: StencilOperation): number {
  return map(parameter, value, {
    'keep': GL.KEEP,
    'zero': GL.ZERO,
    'replace': GL.REPLACE,
    'invert': GL.INVERT,
    'increment-clamp': GL.INCR,
    'decrement-clamp': GL.DECR,
    'increment-wrap': GL.INCR_WRAP,
    'decrement-wrap': GL.DECR_WRAP
  });
}

function convertBlendOperationToEquation(parameter, value): number {
  return map(parameter, value, {
    'add': GL.FUNC_ADD,
    'sub': GL.FUNC_SUBTRACT,
    'reverse-subtract': GL.FUNC_REVERSE_SUBTRACT,
    // When using a WebGL 2 context, the following values are available additionally:
    'min': GL.MIN,
    'max': GL.MAX
  });
}

function message(parameter, value) {
  return `Illegal parameter ${value} for ${parameter}`;
}

function map(parameter, value, valueMap) {
  if (!(value in valueMap)) {
    throw new Error(message(parameter, value));
  }
  return valueMap(value);
}

function mapBoolean(parameter, value) {
  return value;
}

const WEBGPU_PARAMETER_TABLE = {
  // RASTERIZATION SETTINGS
  cullMode: (gl, value) => {
    switch (value) {
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
      default:
        throw new Error(message('cullMode', value));
      }
  },

  frontFace: (gl, value) => gl.frontFace(map('frontFace', value, {
    ccw: GL.CCW,
    cw: GL.CW
  })),

  depthBias: (gl, value, params) => {
    gl.PolygonOffset(value, params.depthBiasSlopeScale || 0);
  },

  depthBiasSlopeScale: (gl, value, params) => {
    // Handled by depthBias
  },

  // DEPTH STENCIL

  depthWriteEnabled: (gl, value) => {
    gl.depthMask(mapBoolean('depthWriteEnabled', value));
  },

  depthCompare: (gl, value) => {
    value !== 'always' ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST),
    gl.depthFunc(convertCompareFunction('depthCompare', value));
  },

  stencilWriteMask: (gl, value) => {
    const mask = value;
    gl.stencilMaskSeparate(GL.FRONT, mask);
    gl.stencilMaskSeparate(GL.BACK, mask);
  },

  stencilReadMask: (gl, value) => {
    // stencilReadMask is handle inside stencil***Compare.
    // console.warn('stencilReadMask not supported under WebGL');
  },

  stencilCompare: (gl, value, params) => {
    const mask = params.stencilReadMask || 0xffffffff;
    const glValue = convertCompareFunction('depthCompare', value);
    // TODO - ensure back doesn't overwrite
    value !== 'always' ? gl.enable(GL.STENCIL_TEST) : gl.disable(GL.STENCIL_TEST),
    gl.stencilFuncSeparate(GL.FRONT, glValue, 0, mask);
    gl.stencilFuncSeparate(GL.BACK, glValue, 0, mask);
  },

  stencilPassOperation: (gl, value, params) => {
    const dppass = convertStencilOperation('stencilPassOperation', value);
    const sfail = convertStencilOperation('stencilFailOperation', params.stencilFailOperation);
    const dpfail = convertStencilOperation('stencilDepthFailOperation', params.stencilDepthFailOperation);
    gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
    gl.stencilOpSeparate(GL.BACK, sfail, dpfail, dppass);
  },

  stencilDepthFailOperation() {
    // handled by stencilPassOperation
  },

  stencilFailOperation() {
    // handled by stencilPassOperation
  },

  // COLOR STATE

  blend: (gl, value) => {
    gl.enable(GL.BLEND);

    const blend = value;

    let colorEquation = (blend && blend.color && blend.color.operation) || 'add';
    let alphaEquation = (blend && blend.alpha && blend.alpha.operation) || 'add';
    gl.blendEquationSeparate(colorEquation, alphaEquation);

    let colorSrcFactor = (blend && blend.color && blend.color.srcFactor) || 'one';
    let colorDstFactor = (blend && blend.color && blend.color.dstFactor) || 'zero';
    let alphaSrcFactor = (blend && blend.alpha && blend.alpha.srcFactor) || 'one';
    let alphaDstFactor = (blend && blend.alpha && blend.alpha.dstFactor) || 'zero';
    gl.blendFuncSeparate(colorSrcFactor, colorDstFactor, alphaSrcFactor, alphaDstFactor);
  },

  blendColor: (gl, value) => gl.blendColor(...value),

  clearColor: (gl, value) => gl.clearColor(...value),
  clearDepth: (gl, value) => gl.clearDepth(value),
  clearStencil: (gl, value) => gl.clearStencil(value),

  colorMask: (gl, value) => gl.colorMask(...value),


  dither: (gl, value) => (value ? gl.enable(GL.DITHER) : gl.disable(GL.DITHER)),

  derivativeHint: (gl, value) => {
    // gl1: 'OES_standard_derivatives'
    gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value);
  },

  mipmapHint: (gl, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value),

  lineWidth: (gl, value) => gl.lineWidth(value),

  polygonOffsetFill: (gl, value) =>
    value ? gl.enable(GL.POLYGON_OFFSET_FILL) : gl.disable(GL.POLYGON_OFFSET_FILL),
  polygonOffset: (gl, value) => gl.polygonOffset(...value),

  sampleCoverage: (gl, value) => gl.sampleCoverage(...value),

  scissorTest: (gl, value) => (value ? gl.enable(GL.SCISSOR_TEST) : gl.disable(GL.SCISSOR_TEST)),
  scissor: (gl, value) => gl.scissor(...value),


  viewport: (gl, value) => gl.viewport(...value)
};

function getValue(glEnum, values, cache) {
  return values[glEnum] !== undefined ? values[glEnum] : cache[glEnum];
}

// COMPOSITE_WEBGL_PARAMETER_
export const GL_COMPOSITE_PARAMETER_SETTERS = {
  blendEquation: (gl, values, cache) =>
    gl.blendEquationSeparate(
      getValue(GL.BLEND_EQUATION_RGB, values, cache),
      getValue(GL.BLEND_EQUATION_ALPHA, values, cache)
    ),
  blendFunc: (gl, values, cache) =>
    gl.blendFuncSeparate(
      getValue(GL.BLEND_SRC_RGB, values, cache),
      getValue(GL.BLEND_DST_RGB, values, cache),
      getValue(GL.BLEND_SRC_ALPHA, values, cache),
      getValue(GL.BLEND_DST_ALPHA, values, cache)
    ),
  polygonOffset: (gl, values, cache) =>
    gl.polygonOffset(
      getValue(GL.POLYGON_OFFSET_FACTOR, values, cache),
      getValue(GL.POLYGON_OFFSET_UNITS, values, cache)
    ),
  sampleCoverage: (gl, values, cache) =>
    gl.sampleCoverage(
      getValue(GL.SAMPLE_COVERAGE_VALUE, values, cache),
      getValue(GL.SAMPLE_COVERAGE_INVERT, values, cache)
    ),
  stencilFuncFront: (gl, values, cache) =>
    gl.stencilFuncSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FUNC, values, cache),
      getValue(GL.STENCIL_REF, values, cache),
      getValue(GL.STENCIL_VALUE_MASK, values, cache)
    ),
  stencilFuncBack: (gl, values, cache) =>
    gl.stencilFuncSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FUNC, values, cache),
      getValue(GL.STENCIL_BACK_REF, values, cache),
      getValue(GL.STENCIL_BACK_VALUE_MASK, values, cache)
    ),
  stencilOpFront: (gl, values, cache) =>
    gl.stencilOpSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_PASS, values, cache)
    ),
  stencilOpBack: (gl, values, cache) =>
    gl.stencilOpSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_PASS, values, cache)
    )
};

// Setter functions intercepted for cache updates
export const GL_HOOKED_SETTERS = {
  // GENERIC SETTERS

  enable: (update, capability) =>
    update({
      [capability]: true
    }),
  disable: (update, capability) =>
    update({
      [capability]: false
    }),
  pixelStorei: (update, pname, value) =>
    update({
      [pname]: value
    }),
  hint: (update, pname, hint) =>
    update({
      [pname]: hint
    }),

  // SPECIFIC SETTERS

  bindFramebuffer: (update, target, framebuffer) => {
    switch (target) {
      case GL.FRAMEBUFFER:
        return update({
          [GL.DRAW_FRAMEBUFFER_BINDING]: framebuffer,
          [GL.READ_FRAMEBUFFER_BINDING]: framebuffer
        });
      case GL.DRAW_FRAMEBUFFER:
        return update({[GL.DRAW_FRAMEBUFFER_BINDING]: framebuffer});
      case GL.READ_FRAMEBUFFER:
        return update({[GL.READ_FRAMEBUFFER_BINDING]: framebuffer});
      default:
        return null;
    }
  },
  blendColor: (update, r, g, b, a) =>
    update({
      [GL.BLEND_COLOR]: new Float32Array([r, g, b, a])
    }),

  blendEquation: (update, mode) =>
    update({
      [GL.BLEND_EQUATION_RGB]: mode,
      [GL.BLEND_EQUATION_ALPHA]: mode
    }),

  blendEquationSeparate: (update, modeRGB, modeAlpha) =>
    update({
      [GL.BLEND_EQUATION_RGB]: modeRGB,
      [GL.BLEND_EQUATION_ALPHA]: modeAlpha
    }),

  blendFunc: (update, src, dst) =>
    update({
      [GL.BLEND_SRC_RGB]: src,
      [GL.BLEND_DST_RGB]: dst,
      [GL.BLEND_SRC_ALPHA]: src,
      [GL.BLEND_DST_ALPHA]: dst
    }),

  blendFuncSeparate: (update, srcRGB, dstRGB, srcAlpha, dstAlpha) =>
    update({
      [GL.BLEND_SRC_RGB]: srcRGB,
      [GL.BLEND_DST_RGB]: dstRGB,
      [GL.BLEND_SRC_ALPHA]: srcAlpha,
      [GL.BLEND_DST_ALPHA]: dstAlpha
    }),

  clearColor: (update, r, g, b, a) =>
    update({
      [GL.COLOR_CLEAR_VALUE]: new Float32Array([r, g, b, a])
    }),

  clearDepth: (update, depth) =>
    update({
      [GL.DEPTH_CLEAR_VALUE]: depth
    }),

  clearStencil: (update, s) =>
    update({
      [GL.STENCIL_CLEAR_VALUE]: s
    }),

  colorMask: (update, r, g, b, a) =>
    update({
      [GL.COLOR_WRITEMASK]: [r, g, b, a]
    }),

  depthFunc: (update, func) =>
    update({
      [GL.DEPTH_FUNC]: func
    }),

  depthRange: (update, zNear, zFar) =>
    update({
      [GL.DEPTH_RANGE]: new Float32Array([zNear, zFar])
    }),

  depthMask: (update, mask) =>
    update({
      [GL.DEPTH_WRITEMASK]: mask
    }),

  frontFace: (update, face) =>
    update({
      [GL.FRONT_FACE]: face
    }),

  lineWidth: (update, width) =>
    update({
      [GL.LINE_WIDTH]: width
    }),

  polygonOffset: (update, factor, units) =>
    update({
      [GL.POLYGON_OFFSET_FACTOR]: factor,
      [GL.POLYGON_OFFSET_UNITS]: units
    }),

  sampleCoverage: (update, value, invert) =>
    update({
      [GL.SAMPLE_COVERAGE_VALUE]: value,
      [GL.SAMPLE_COVERAGE_INVERT]: invert
    }),

  scissor: (update, x, y, width, height) =>
    update({
      [GL.SCISSOR_BOX]: new Int32Array([x, y, width, height])
    }),

  stencilMask: (update, mask) =>
    update({
      [GL.STENCIL_WRITEMASK]: mask,
      [GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilMaskSeparate: (update, face, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_WRITEMASK : GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilFunc: (update, func, ref, mask) =>
    update({
      [GL.STENCIL_FUNC]: func,
      [GL.STENCIL_REF]: ref,
      [GL.STENCIL_VALUE_MASK]: mask,
      [GL.STENCIL_BACK_FUNC]: func,
      [GL.STENCIL_BACK_REF]: ref,
      [GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilFuncSeparate: (update, face, func, ref, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FUNC : GL.STENCIL_BACK_FUNC]: func,
      [face === GL.FRONT ? GL.STENCIL_REF : GL.STENCIL_BACK_REF]: ref,
      [face === GL.FRONT ? GL.STENCIL_VALUE_MASK : GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilOp: (update, fail, zfail, zpass) =>
    update({
      [GL.STENCIL_FAIL]: fail,
      [GL.STENCIL_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_PASS_DEPTH_PASS]: zpass,
      [GL.STENCIL_BACK_FAIL]: fail,
      [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  stencilOpSeparate: (update, face, fail, zfail, zpass) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FAIL : GL.STENCIL_BACK_FAIL]: fail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_FAIL : GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_PASS : GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  viewport: (update, x, y, width, height) =>
    update({
      [GL.VIEWPORT]: [x, y, width, height]
    })
  };

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