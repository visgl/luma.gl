// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  SlangResourceBinding,
  SlangStorageTextureFormat,
  SlangTranspileResult,
  SlangTypeLayout,
  SlangWGSLProgramResult
} from './types';

/** Accept a compute stage, a unified WGSL program, or separately compiled render stages. */
export type SlangCompiledShader =
  | SlangTranspileResult
  | SlangWGSLProgramResult
  | readonly SlangTranspileResult[];
type SlangAttributeType = 'f32' | 'i32' | 'u32' | `vec${2 | 3 | 4}<${'f32' | 'i32' | 'u32'}>`;
type SlangBindingLocation = {name: string; group: number; location: number; visibility: number};
/** Structurally compatible with luma's ShaderLayout, without importing core. */
export type SlangShaderLayout = {
  attributes: {name: string; location: number; type: SlangAttributeType}[];
  bindings: (SlangBindingLocation &
    (
      | {type: 'uniform' | 'storage' | 'read-only-storage'; minBindingSize: number}
      | {
          type: 'texture';
          viewDimension: '2d' | '2d-array' | 'cube' | '3d';
          sampleType: 'float' | 'unfilterable-float' | 'sint' | 'uint' | 'depth';
        }
      | {type: 'sampler'; samplerType: 'filtering' | 'non-filtering' | 'comparison'}
      | {
          type: 'storage';
          viewDimension: '2d' | '2d-array' | 'cube' | '3d';
          format: SlangStorageTextureFormat;
          access: 'write-only' | 'read-write';
        }
    ))[];
};
export type SlangShaderLayoutOptions = {
  /** Actual texture formats and sampler state are application-owned. */
  textureSampleTypes?: Record<string, 'float' | 'unfilterable-float'>;
  samplerTypes?: Record<string, 'filtering' | 'non-filtering'>;
};
export type SlangUniformBufferLayout = {name: string; byteLength: number; layout: SlangTypeLayout};
export type SlangShaderRequirements = {
  compute: boolean;
  storageBuffers: boolean;
  /** Request these optional WebGPU device features before creating the pipeline. */
  deviceFeatures: 'texture-formats-tier2'[];
  /** Active source bindings whose storage access is unavailable on WebGPU. */
  unsupportedStorageTextures: string[];
  /** Check navigator.gpu.wgslLanguageFeatures before compiling the WGSL module. */
  wgslLanguageFeatures: 'readonly_and_readwrite_storage_textures'[];
  /** Includes declared storage textures, even when unused by the selected pipeline. */
  storageTextures: {
    name: string;
    format: SlangStorageTextureFormat;
    access: 'write' | 'read_write';
  }[];
  glslVersion?: '300 es' | '450';
};

function getStages(shader: SlangCompiledShader): readonly SlangTranspileResult[] {
  if (Array.isArray(shader)) return shader;
  const compiled = shader as SlangTranspileResult | SlangWGSLProgramResult;
  return 'entryPoints' in compiled
    ? Object.values(compiled.entryPoints).map(entry => ({
        ...entry,
        code: compiled.code,
        sourceMap: compiled.sourceMap,
        target: compiled.target
      }))
    : [compiled];
}
function getBindings(shader: SlangCompiledShader): SlangResourceBinding[] {
  const stages = getStages(shader);
  const bindings = new Map<string, SlangResourceBinding>();
  for (const stage of stages) {
    if (stage.target !== stages[0].target || stage.glslVersion !== stages[0].glslVersion)
      throw new Error('Incompatible shader targets');
    for (const binding of stage.reflection.bindings) {
      const key = `${binding.group}:${binding.binding}`;
      const previous = bindings.get(key);
      if (previous && (!previous.visibility || !binding.visibility)) {
        if (binding.visibility) bindings.set(key, {...binding});
      } else if (previous) {
        // Separately compiled sources must describe the same resource in each shared slot.
        if (
          JSON.stringify({...previous, visibility: 0}) !==
          JSON.stringify({...binding, visibility: 0})
        )
          throw new Error('Incompatible shared resource binding');
        previous.visibility |= binding.visibility;
      } else {
        bindings.set(key, {...binding});
      }
    }
  }
  return [...bindings.values()];
}
function getBindingName(binding: SlangResourceBinding): string {
  return binding.blockName ?? binding.shaderName;
}

/** Build pipeline metadata from active resources; applications still create and own resources. */
export function getSlangShaderLayout(
  shader: SlangCompiledShader,
  options: SlangShaderLayoutOptions = {}
): SlangShaderLayout {
  const stages = getStages(shader);
  if (
    new Set(stages.map(stage => stage.stage)).size !== stages.length ||
    (stages.length > 1 && stages.some(stage => stage.stage === 'compute'))
  )
    throw new Error('Select one entry point per pipeline stage');
  const layout: SlangShaderLayout = {attributes: [], bindings: []};
  for (const stage of stages) {
    if (stage.stage !== 'vertex') continue;
    for (const input of stage.reflection.inputs) {
      if (input.location === undefined || input.builtin) continue;
      const match = /^(float|int|uint)([2-4])?$/.exec(input.type)!;
      const scalar = {float: 'f32', int: 'i32', uint: 'u32'}[match[1]];
      const type = (match[2] ? `vec${match[2]}<${scalar}>` : scalar) as SlangAttributeType;
      layout.attributes.push({name: input.shaderName, location: input.location, type});
    }
  }
  for (const binding of getBindings(shader)) {
    if (!binding.visibility) continue;
    const location = {
      name: getBindingName(binding),
      group: binding.group,
      location: binding.binding,
      visibility: binding.visibility
    };
    if (stages[0].target === 'glsl' && binding.group !== 0)
      throw new Error('GLSL layouts require binding group zero');
    if (binding.kind === 'uniform') {
      // Plain GLSL uniforms remain application-managed through setUniforms.
      if (binding.layout)
        layout.bindings.push({...location, type: 'uniform', minBindingSize: binding.layout.size});
    } else if (binding.kind === 'storage') {
      layout.bindings.push({
        ...location,
        type: binding.access === 'read' ? 'read-only-storage' : 'storage',
        minBindingSize: binding.elementStride!
      });
    } else if (binding.kind === 'sampler') {
      layout.bindings.push({
        ...location,
        type: 'sampler',
        samplerType:
          binding.samplerType === 'comparison'
            ? 'comparison'
            : (options.samplerTypes?.[binding.name] ?? 'filtering')
      });
    } else if (binding.texture?.format) {
      layout.bindings.push({
        ...location,
        type: 'storage',
        viewDimension: binding.texture.dimension,
        format: binding.texture.format,
        access: binding.access === 'write' ? 'write-only' : 'read-write'
      });
    } else {
      layout.bindings.push({
        ...location,
        type: 'texture',
        viewDimension: binding.texture!.dimension,
        sampleType:
          binding.texture!.sampleType === 'float'
            ? (options.textureSampleTypes?.[binding.name] ?? 'float')
            : binding.texture!.sampleType
      });
    }
  }
  return layout;
}

/** Translate Slang source resource names to the generated names accepted by luma bindings. */
export function getSlangBindingNames(shader: SlangCompiledShader): Record<string, string> {
  return Object.fromEntries(
    getBindings(shader)
      .filter(binding => binding.visibility)
      .map(binding => [binding.name, getBindingName(binding)])
  );
}

/** Use byteLength to allocate a buffer and layout with packSlangUniforms to upload nested values. */
export function getSlangUniformBufferLayouts(
  shader: SlangCompiledShader
): Record<string, SlangUniformBufferLayout> {
  return Object.fromEntries(
    getBindings(shader)
      .filter(binding => binding.visibility && binding.kind === 'uniform' && binding.layout)
      .map(binding => [
        binding.name,
        {name: getBindingName(binding), byteLength: binding.layout!.size, layout: binding.layout!}
      ])
  );
}

/** Report compiler-known requirements; device limits and concrete sampled formats remain application-owned. */
export function getSlangShaderRequirements(shader: SlangCompiledShader): SlangShaderRequirements {
  const stages = getStages(shader);
  const bindings = getBindings(shader);
  const storageTextures = [
    ...new Map(
      stages
        .flatMap(stage => stage.reflection.bindings)
        .filter(binding => binding.texture?.format)
        .map(
          binding =>
            [
              `${binding.name}:${binding.texture!.format}:${binding.texture!.access}`,
              binding
            ] as const
        )
    ).values()
  ].map(binding => ({
    name: binding.name,
    format: binding.texture!.format!,
    access: binding.texture!.access!
  }));
  const readWriteTextures =
    stages[0]?.target === 'wgsl'
      ? bindings.filter(binding => binding.visibility && binding.texture?.access === 'read_write')
      : [];
  return {
    deviceFeatures: readWriteTextures.some(
      binding =>
        binding.texture!.format !== 'rgba8snorm' && !binding.texture!.format!.startsWith('r32')
    )
      ? ['texture-formats-tier2']
      : [],
    unsupportedStorageTextures: readWriteTextures
      .filter(binding => binding.texture!.format === 'rgba8snorm')
      .map(binding => binding.name),
    compute: stages.some(stage => stage.stage === 'compute'),
    storageBuffers: bindings.some(
      binding => binding.kind === 'storage' && binding.visibility !== 0
    ),
    wgslLanguageFeatures:
      stages[0]?.target === 'wgsl' &&
      storageTextures.some(texture => texture.access === 'read_write')
        ? ['readonly_and_readwrite_storage_textures']
        : [],
    storageTextures,
    ...(stages[0]?.glslVersion ? {glslVersion: stages[0].glslVersion} : {})
  };
}
