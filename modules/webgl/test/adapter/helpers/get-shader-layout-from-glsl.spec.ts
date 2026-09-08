// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';

import {log} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';
import {getShaderLayoutFromGLSL} from '@luma.gl/webgl';

type ReflectedUniform = {
  name: string;
  type: number;
  size?: number;
  byteOffset: number;
  byteStride?: number;
};

type ReflectionOptions = {
  activeBlockCount?: number;
  activeUniformInfo?: WebGLActiveInfo | null;
  /** Per-uniform driver results. Overrides `activeUniformInfo`, `uniformIndices` and `uniformTypes`. */
  activeUniforms?: ReflectedUniform[];
  blockIndexByName?: Record<string, number>;
  blockName?: string | null;
  nullBlockParameter?: number;
  uniformBlockIndex?: number;
  uniformIndices?: number[] | null;
  uniformTypes?: number[] | null;
};

function makeReflectionContext(options: ReflectionOptions = {}): {
  gl: WebGL2RenderingContext;
  getActiveUniforms: ReturnType<typeof vi.fn>;
} {
  const activeBlockCount = options.activeBlockCount ?? 1;
  const blockName = options.blockName === undefined ? 'rawUniforms' : options.blockName;
  const activeUniforms = options.activeUniforms;
  const firstUniformIndex = 4;
  const uniformIndices = activeUniforms
    ? activeUniforms.map((_uniform, index) => firstUniformIndex + index)
    : options.uniformIndices === undefined
      ? [firstUniformIndex]
      : options.uniformIndices;
  const uniformTypes = activeUniforms
    ? activeUniforms.map(uniform => uniform.type)
    : options.uniformTypes === undefined
      ? [GL.FLOAT]
      : options.uniformTypes;
  const activeUniformInfo =
    options.activeUniformInfo === undefined
      ? ({name: 'raw.value', size: 1, type: GL.FLOAT} as WebGLActiveInfo)
      : options.activeUniformInfo;
  const uniformBlockIndex = options.uniformBlockIndex ?? 0;

  const getActiveUniforms = vi.fn(
    (_program: WebGLProgram, _uniformIndices: number[], parameter: number) => {
      switch (parameter) {
        case GL.UNIFORM_TYPE:
          return uniformTypes;
        case GL.UNIFORM_SIZE:
          return activeUniforms
            ? activeUniforms.map(uniform => uniform.size ?? 1)
            : uniformTypes && uniformTypes.map(() => 1);
        case GL.UNIFORM_BLOCK_INDEX:
          return uniformTypes && uniformTypes.map(() => uniformBlockIndex);
        case GL.UNIFORM_OFFSET:
          return activeUniforms
            ? activeUniforms.map(uniform => uniform.byteOffset)
            : uniformTypes && uniformTypes.map((_value, index) => index * 16);
        case GL.UNIFORM_ARRAY_STRIDE:
          return activeUniforms
            ? activeUniforms.map(uniform => uniform.byteStride ?? 0)
            : uniformTypes && uniformTypes.map(() => 0);
        default:
          throw new Error(`Unexpected active uniform parameter ${parameter}`);
      }
    }
  );

  const gl = {
    ACTIVE_ATTRIBUTES: GL.ACTIVE_ATTRIBUTES,
    getProgramParameter: (_program: WebGLProgram, parameter: number) => {
      switch (parameter) {
        case GL.ACTIVE_ATTRIBUTES:
        case GL.ACTIVE_UNIFORMS:
        case GL.TRANSFORM_FEEDBACK_VARYINGS:
          return 0;
        case GL.ACTIVE_UNIFORM_BLOCKS:
          return activeBlockCount;
        default:
          throw new Error(`Unexpected program parameter ${parameter}`);
      }
    },
    getUniformBlockIndex: (_program: WebGLProgram, name: string) =>
      options.blockIndexByName?.[name] ?? GL.INVALID_INDEX,
    getActiveUniformBlockName: () => blockName,
    getActiveUniformBlockParameter: (
      _program: WebGLProgram,
      _blockIndex: number,
      parameter: number
    ) => {
      if (parameter === options.nullBlockParameter) {
        return null;
      }
      switch (parameter) {
        case GL.UNIFORM_BLOCK_BINDING:
          return 3;
        case GL.UNIFORM_BLOCK_DATA_SIZE:
          return 16;
        case GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER:
          return true;
        case GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER:
          return false;
        case GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS:
          return uniformIndices?.length ?? 1;
        case GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES:
          return uniformIndices;
        default:
          throw new Error(`Unexpected block parameter ${parameter}`);
      }
    },
    getActiveUniforms,
    getActiveUniform: (_program: WebGLProgram, uniformIndex: number) => {
      if (!activeUniforms) {
        return activeUniformInfo;
      }
      const uniform = activeUniforms[uniformIndex - firstUniformIndex];
      return uniform && {name: uniform.name, size: uniform.size ?? 1, type: uniform.type};
    }
  } as unknown as WebGL2RenderingContext;

  return {gl, getActiveUniforms};
}

const program = {} as WebGLProgram;

it('getShaderLayoutFromGLSL uses module std140 metadata when getActiveUniforms returns null', () => {
  const {gl, getActiveUniforms} = makeReflectionContext({
    blockIndexByName: {moduleUniforms: 0},
    uniformTypes: null
  });

  const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
    uniformBlockLayouts: [
      {
        name: 'moduleUniforms',
        uniformTypes: {
          scalar: 'f32',
          vector: 'vec3<f32>',
          matrix: 'mat4x4<f32>'
        }
      }
    ]
  });

  expect(
    getActiveUniforms,
    'driver reflection was attempted only as validation'
  ).toHaveBeenCalled();
  expect(shaderLayout.bindings).toEqual([
    {
      type: 'uniform',
      name: 'moduleUniforms',
      group: 0,
      location: 0,
      visibility: 0,
      minBindingSize: 96,
      uniforms: [
        {name: 'scalar', format: 'f32', byteOffset: 0, byteStride: 0, arrayLength: 1},
        {name: 'vector', format: 'vec3<f32>', byteOffset: 16, byteStride: 0, arrayLength: 1},
        {
          name: 'matrix',
          format: 'mat4x4<f32>',
          byteOffset: 32,
          byteStride: 0,
          arrayLength: 1
        }
      ]
    }
  ]);
});

it('getShaderLayoutFromGLSL rejects cross-block active uniform indices for raw GLSL', () => {
  const {gl} = makeReflectionContext({uniformBlockIndex: 1});

  expect(() => getShaderLayoutFromGLSL(gl, program)).toThrow(
    /uniform block "rawUniforms".*belongs to block 1, expected 0/
  );
});

it('getShaderLayoutFromGLSL falls back before indexing an empty reflected uniform array', () => {
  const {gl} = makeReflectionContext({
    blockIndexByName: {moduleUniforms: 0},
    uniformTypes: []
  });

  const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
    uniformBlockLayouts: [{name: 'moduleUniforms', uniformTypes: {value: 'f32'}}]
  });

  expect(shaderLayout.bindings[0]).toMatchObject({
    name: 'moduleUniforms',
    minBindingSize: 16,
    uniforms: [{name: 'value', format: 'f32', byteOffset: 0}]
  });
});

it('getShaderLayoutFromGLSL keeps module metadata when driver indices name another block', () => {
  const {gl} = makeReflectionContext({
    blockIndexByName: {layerUniforms: 0},
    uniformBlockIndex: 1,
    activeUniformInfo: {name: 'arcUniforms.width', size: 1, type: GL.FLOAT}
  });

  const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
    uniformBlockLayouts: [
      {name: 'layerUniforms', uniformTypes: {opacity: 'f32', coordinateSystem: 'i32'}}
    ]
  });

  expect(shaderLayout.bindings[0]).toMatchObject({
    name: 'layerUniforms',
    minBindingSize: 16,
    uniforms: [
      {name: 'opacity', format: 'f32', byteOffset: 0},
      {name: 'coordinateSystem', format: 'i32', byteOffset: 4}
    ]
  });
});

it('getShaderLayoutFromGLSL omits module blocks optimized out by the linker', () => {
  const {gl, getActiveUniforms} = makeReflectionContext({activeBlockCount: 0});

  const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
    uniformBlockLayouts: [{name: 'unusedUniforms', uniformTypes: {value: 'f32'}}]
  });

  expect(shaderLayout.bindings).toEqual([]);
  expect(getActiveUniforms).not.toHaveBeenCalled();
});

it('getShaderLayoutFromGLSL preserves normal reflection for raw GLSL blocks', () => {
  const {gl} = makeReflectionContext();

  const shaderLayout = getShaderLayoutFromGLSL(gl, program);

  expect(shaderLayout.bindings).toEqual([
    {
      type: 'uniform',
      name: 'rawUniforms',
      group: 0,
      location: 3,
      visibility: 1,
      minBindingSize: 16,
      uniforms: [{name: 'raw.value', format: 'f32', byteOffset: 0, byteStride: 0, arrayLength: 1}]
    }
  ]);
});

it('getShaderLayoutFromGLSL reports null raw GLSL reflection with block context', () => {
  const {gl} = makeReflectionContext({uniformTypes: null});

  expect(() => getShaderLayoutFromGLSL(gl, program)).toThrow(
    /uniform block "rawUniforms".*UNIFORM_TYPE returned null/
  );
});

it('getShaderLayoutFromGLSL validates nullable uniform block parameters', () => {
  const {gl} = makeReflectionContext({
    nullBlockParameter: GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES
  });

  expect(() => getShaderLayoutFromGLSL(gl, program)).toThrow(
    /uniform block "rawUniforms".*UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES returned null/
  );
});

it('getShaderLayoutFromGLSL reflects GLSL bool members as i32 for raw GLSL blocks', () => {
  const {gl} = makeReflectionContext({
    activeUniforms: [
      {name: 'raw.flag', type: GL.BOOL, byteOffset: 0},
      {name: 'raw.flags', type: GL.BOOL_VEC2, byteOffset: 8}
    ]
  });

  const shaderLayout = getShaderLayoutFromGLSL(gl, program);

  expect(shaderLayout.bindings[0]).toMatchObject({
    name: 'rawUniforms',
    uniforms: [
      {name: 'raw.flag', format: 'i32', byteOffset: 0, byteStride: 0, arrayLength: 1},
      {name: 'raw.flags', format: 'vec2<i32>', byteOffset: 8, byteStride: 0, arrayLength: 1}
    ]
  });
});

it('getShaderLayoutFromGLSL validates GLSL bool members declared as i32 in module metadata', () => {
  const {gl} = makeReflectionContext({
    blockIndexByName: {materialUniforms: 0},
    activeUniforms: [
      {name: 'material.unlit', type: GL.BOOL, byteOffset: 0},
      {name: 'material.ambient', type: GL.FLOAT, byteOffset: 4}
    ]
  });
  const logOnce = vi.spyOn(log, 'once').mockImplementation(() => () => {});

  try {
    const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
      uniformBlockLayouts: [
        {name: 'materialUniforms', uniformTypes: {unlit: 'i32', ambient: 'f32'}}
      ]
    });

    expect(logOnce, 'no reflection fallback warning').not.toHaveBeenCalled();
    expect(shaderLayout.bindings[0]).toMatchObject({
      name: 'materialUniforms',
      minBindingSize: 16,
      uniforms: [
        {name: 'unlit', format: 'i32', byteOffset: 0},
        {name: 'ambient', format: 'f32', byteOffset: 4}
      ]
    });
  } finally {
    logOnce.mockRestore();
  }
});

it('getShaderLayoutFromGLSL expands struct arrays per element to match WebGL reflection', () => {
  const {gl} = makeReflectionContext({
    blockIndexByName: {lightingUniforms: 0},
    activeUniforms: [
      {name: 'lighting.lightCount', type: GL.INT, byteOffset: 0},
      {name: 'lighting.lights[0].color', type: GL.FLOAT_VEC3, byteOffset: 16},
      {name: 'lighting.lights[0].intensity', type: GL.FLOAT, byteOffset: 28},
      {name: 'lighting.lights[1].color', type: GL.FLOAT_VEC3, byteOffset: 32},
      {name: 'lighting.lights[1].intensity', type: GL.FLOAT, byteOffset: 44}
    ]
  });
  const logOnce = vi.spyOn(log, 'once').mockImplementation(() => () => {});

  try {
    const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
      uniformBlockLayouts: [
        {
          name: 'lightingUniforms',
          uniformTypes: {
            lightCount: 'i32',
            lights: [{color: 'vec3<f32>', intensity: 'f32'}, 2]
          }
        }
      ]
    });

    expect(logOnce, 'no reflection fallback warning').not.toHaveBeenCalled();
    expect(shaderLayout.bindings[0]).toEqual({
      type: 'uniform',
      name: 'lightingUniforms',
      group: 0,
      location: 0,
      visibility: 0,
      minBindingSize: 48,
      uniforms: [
        {name: 'lightCount', format: 'i32', byteOffset: 0, byteStride: 0, arrayLength: 1},
        {
          name: 'lights[0].color',
          format: 'vec3<f32>',
          byteOffset: 16,
          byteStride: 0,
          arrayLength: 1
        },
        {name: 'lights[0].intensity', format: 'f32', byteOffset: 28, byteStride: 0, arrayLength: 1},
        {
          name: 'lights[1].color',
          format: 'vec3<f32>',
          byteOffset: 32,
          byteStride: 0,
          arrayLength: 1
        },
        {name: 'lights[1].intensity', format: 'f32', byteOffset: 44, byteStride: 0, arrayLength: 1}
      ]
    });
  } finally {
    logOnce.mockRestore();
  }
});

it('getShaderLayoutFromGLSL warns and keeps module metadata when reflected offsets diverge', () => {
  const {gl} = makeReflectionContext({
    blockIndexByName: {materialUniforms: 0},
    activeUniforms: [
      {name: 'material.unlit', type: GL.BOOL, byteOffset: 0},
      {name: 'material.ambient', type: GL.FLOAT, byteOffset: 16}
    ]
  });
  const logOnce = vi.spyOn(log, 'once').mockImplementation(() => () => {});

  try {
    const shaderLayout = getShaderLayoutFromGLSL(gl, program, {
      uniformBlockLayouts: [
        {name: 'materialUniforms', uniformTypes: {unlit: 'i32', ambient: 'f32'}}
      ]
    });

    expect(logOnce).toHaveBeenCalledWith(
      0,
      expect.stringMatching(
        /reflected layout for "material.ambient" does not match supplied std140 metadata/
      )
    );
    expect(shaderLayout.bindings[0]).toMatchObject({
      name: 'materialUniforms',
      uniforms: [
        {name: 'unlit', byteOffset: 0},
        {name: 'ambient', byteOffset: 4}
      ]
    });
  } finally {
    logOnce.mockRestore();
  }
});
