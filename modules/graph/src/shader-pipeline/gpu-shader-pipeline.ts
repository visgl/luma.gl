// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  Buffer,
  Texture,
  type Binding,
  type SamplerProps,
  type TextureFormatColor
} from '@luma.gl/core';
import {ClipSpace, Computation} from '@luma.gl/engine';
import {
  getFragmentShaderForRenderPass,
  textureTransform,
  type ShaderPass,
  type CompositeShaderPass,
  type CompositeShaderPassStep,
  type CompositeShaderPassComputeOptimization,
  type ShaderPassRenderTarget
} from '@luma.gl/shadertools';
import type {GPUOperation} from '../gpu-core/gpu-operation';
import type {GPUProgramTexture, GPUProgramTextureView} from '../gpu-core/gpu-program-value';
import type {GPUProgramCompiler} from '../gpu-core/gpu-program-compiler';
import type {GPUOperationLoweringContext} from '../gpu-core/gpu-program-lowering';
import type {
  GraphTextureView,
  GPUCommandGraphRenderNode,
  GPUCommandGraphEncodeContext
} from '../gpu-core/gpu-command-graph-types';

export type GPUShaderPipelineProps<Parameters = void> = {
  id: string;
  shaderPasses: readonly (ShaderPass | CompositeShaderPass)[];
  input: GPUProgramTexture<TextureFormatColor> | GPUProgramTextureView<TextureFormatColor>;
  output: GPUProgramTexture<TextureFormatColor> | GPUProgramTextureView<TextureFormatColor>;
  /** Additional sampled textures, declared so the graph can infer their dependencies. */
  bindings?: Readonly<
    Record<
      string,
      GPUProgramTexture<TextureFormatColor> | GPUProgramTextureView<TextureFormatColor>
    >
  >;
  /** Defaults shared by every encoding, indexed by shader module name. */
  uniforms?: Record<string, Record<string, unknown>>;
  /** Per-encoding overrides, indexed by shader module name. */
  getUniforms?: (parameters: Parameters) => Record<string, Record<string, unknown>>;
  flipY?: boolean;
};

/** A shader-pass chain lowered to individually scheduled render and compute nodes. */
export class GPUShaderPipeline<Parameters = void> implements GPUOperation {
  readonly type = 'shader-pipeline';
  readonly id: string;
  constructor(readonly props: GPUShaderPipelineProps<Parameters>) {
    this.id = props.id;
  }
}

/** Installs the optional shader-pipeline lowering without coupling gpu-core to engine effects. */
export function registerShaderPipelineOperations<Parameters>(
  compiler: GPUProgramCompiler<Parameters>
): void {
  let loweringIndex = 0;
  compiler.lowerings.register<GPUShaderPipeline<Parameters>>(
    'shader-pipeline',
    (operation, context) => lowerShaderPipeline(operation, context, loweringIndex++)
  );
}

type Target = {view: GraphTextureView; sampler?: SamplerProps};
const COPY_PASS: ShaderPass = {
  name: 'graphPipelineCopy',
  source:
    'fn graphPipelineCopy_filterColor_ext(color: vec4f, size: vec2f, uv: vec2f) -> vec4f { return color; }',
  fs: 'vec4 graphPipelineCopy_filterColor_ext(vec4 color, vec2 size, vec2 uv) { return color; }',
  passes: [{filter: true}]
};

function lowerShaderPipeline<Parameters>(
  operation: GPUShaderPipeline<Parameters>,
  context: GPUOperationLoweringContext<Parameters>,
  loweringIndex: number
): void {
  const {graph} = context;
  const {props} = operation;
  let uniformContext: GPUCommandGraphEncodeContext<Parameters> | undefined;
  let uniformSnapshot: Record<string, Record<string, unknown>> = {};
  const getRuntimeUniforms = (encoding: GPUCommandGraphEncodeContext<Parameters>) => {
    if (uniformContext !== encoding) {
      uniformSnapshot = props.getUniforms?.(encoding.parameters) || {};
      uniformContext = encoding;
    }
    return uniformSnapshot;
  };
  const input = context.resolveTextureView(props.input);
  const output = context.resolveTextureView(props.output);
  // Shader passes sample single-sample 2D inputs and render to one single-sample mip/layer.
  assert(input.dimension === '2d' && input.texture.samples === 1);
  assert(output.dimension === '2d' && output.texture.samples === 1 && output.mipLevelCount === 1);

  const original: Target = {view: input};
  const externalBindings = Object.fromEntries(
    Object.entries(props.bindings || {}).map(([name, texture]) => [
      name,
      {view: context.resolveTextureView(texture)}
    ])
  );
  let sequence = 0;
  const nextId = (label: string) => `${operation.id}/${loweringIndex}/${sequence++}-${label}`;
  const makeTarget = (name: string, spec: ShaderPassRenderTarget = {}): Target => {
    const view = graph.createTextureView(
      graph.createTransientTexture({
        id: nextId(name),
        width: Math.max(1, Math.round(output.width * (spec.scale?.[0] ?? 1))),
        height: Math.max(1, Math.round(output.height * (spec.scale?.[1] ?? 1))),
        format: spec.format || output.format,
        usage:
          Texture.SAMPLE |
          Texture.RENDER |
          (spec.storage &&
          graph.device.getTextureFormatCapabilities(spec.format || output.format).store
            ? Texture.STORAGE
            : 0)
      })
    );
    return {view, sampler: spec.sampler};
  };
  let previous = makeTarget('source');
  emitRender(
    COPY_PASS,
    {filter: true},
    {sourceTexture: original},
    previous,
    {},
    props.flipY ?? true
  );

  for (const definition of props.shaderPasses) {
    const targets: Record<string, Target> = {};
    const writtenTargets = new Set<GraphTextureView>();
    const specs = 'steps' in definition ? definition.renderTargets || {} : {};
    for (const [name, spec] of Object.entries(specs)) {
      if (name === 'original' || name === 'previous')
        throw new Error(`${operation.id}: reserved target "${name}"`);
      if (spec.lifetime === 'history')
        throw new Error(`${operation.id}: history targets require frame lifecycle support`);
      if (spec.aliasFor) {
        const target = targets[spec.aliasFor];
        const earlier = specs[spec.aliasFor];
        if (
          !target ||
          target.view.width !== Math.max(1, Math.round(output.width * (spec.scale?.[0] ?? 1))) ||
          target.view.height !== Math.max(1, Math.round(output.height * (spec.scale?.[1] ?? 1))) ||
          target.view.format !== (spec.format || output.format) ||
          (spec.storage && !earlier.storage) ||
          JSON.stringify(spec.sampler || {}) !== JSON.stringify(earlier.sampler || {})
        ) {
          throw new Error(
            `${operation.id}: alias "${name}" must match an earlier transient target`
          );
        }
        targets[name] = target;
      } else targets[name] = makeTarget(name, spec);
    }
    const resolve = (name: string): Target => {
      const target =
        name === 'original' ? original : name === 'previous' ? previous : targets[name];
      if (!target) throw new Error(`${operation.id}: unknown texture source "${name}"`);
      if (name !== 'original' && name !== 'previous' && !writtenTargets.has(target.view)) {
        throw new Error(`${operation.id}: target "${name}" is read before it is written`);
      }
      return target;
    };
    const optimization = 'steps' in definition ? definition.compute : undefined;
    // Existing compute kernels address texels directly; flipped fragment sampling needs the fallback.
    const useCompute =
      optimization && (props.flipY ?? true) && supportsCompute(optimization, targets);
    if (useCompute) {
      emitCompute(optimization, resolve(optimization.input), targets);
      for (const name of Object.values(optimization.outputs))
        writtenTargets.add(targets[name].view);
    }
    const steps: CompositeShaderPassStep[] =
      'steps' in definition ? definition.steps : [{shaderPass: definition}];
    for (const step of steps) {
      if (useCompute && optimization.replacedPasses.includes(step.shaderPass.name)) continue;
      const subpasses = step.shaderPass.passes || [];
      for (const [index, subpass] of subpasses.entries()) {
        const routing = (index === 0 ? step.inputs : undefined) ??
          subpass.inputs ?? {sourceTexture: 'previous'};
        const outputName =
          (index === subpasses.length - 1 ? step.output : undefined) ??
          subpass.output ??
          'previous';
        const destination =
          outputName === 'previous' ? makeTarget('previous') : targets[outputName];
        if (!destination) throw new Error(`${operation.id}: unknown output "${outputName}"`);
        const bindings: Record<string, Target> = {sourceTexture: previous, ...externalBindings};
        for (const [name, source] of Object.entries(routing))
          if (source) bindings[name] = resolve(source);
        emitRender(
          step.shaderPass,
          subpass,
          bindings,
          destination,
          {...step.uniforms, ...subpass.uniforms},
          props.flipY ?? true
        );
        writtenTargets.add(destination.view);
        if (outputName === 'previous') previous = destination;
      }
    }
  }
  emitRender(COPY_PASS, {filter: true}, {sourceTexture: previous}, {view: output}, {}, true);
  context.recordDecision({
    operationId: operation.id,
    operationType: operation.type,
    lowering: 'webgpu-shader-pipeline',
    reason: 'shader passes contribute tracked render and compute nodes to the containing graph'
  });

  function emitRender(
    shaderPass: ShaderPass,
    subpass: NonNullable<ShaderPass['passes']>[number],
    inputs: Record<string, Target>,
    destination: Target,
    uniforms: Record<string, unknown>,
    flipY: boolean
  ): void {
    if (Object.values(inputs).some(target => target.view.texture === destination.view.texture))
      throw new Error(`${operation.id}: a pass cannot sample its output attachment`);
    const id = nextId(shaderPass.name);
    const node: GPUCommandGraphRenderNode<Parameters> = {
      id,
      type: 'render',
      resources: Object.values(inputs).map(target => ({
        texture: target.view,
        usage: 'sampled' as const
      })),
      attachments: {colorAttachments: [destination.view]},
      compile: ({device}) => {
        const action =
          subpass.action || (subpass.filter ? 'filter' : subpass.sampler ? 'sample' : 'filter');
        const source = getFragmentShaderForRenderPass({
          shaderPass,
          action,
          shadingLanguage: device.info.shadingLanguage
        });
        const model = new ClipSpace(device, {
          id,
          source,
          fs: source,
          modules: [textureTransform, shaderPass],
          parameters: {depthWriteEnabled: false}
        });
        const samplers = Object.fromEntries(
          Object.entries(inputs)
            .filter(([, target]) => target.sampler)
            .map(([name, target]) => [`${name}Sampler`, device.createSampler(target.sampler || {})])
        );
        return {
          prepare: encoding => {
            const sourceView = inputs['sourceTexture'].view;
            const sourceAspect = sourceView.width / sourceView.height;
            const outputAspect = destination.view.width / destination.view.height;
            const scale =
              outputAspect > sourceAspect
                ? [1, outputAspect / sourceAspect]
                : [sourceAspect / outputAspect, 1];
            model.shaderInputs.setProps({textureTransform: {scale, flipY: flipY ? 1 : 0}});
            model.shaderInputs.setProps({
              [shaderPass.name]: {
                ...shaderPass.uniforms,
                ...props.uniforms?.[shaderPass.name],
                ...uniforms,
                ...getRuntimeUniforms(encoding)[shaderPass.name]
              }
            });
            model.setBindings({
              ...Object.fromEntries(
                Object.entries(inputs).flatMap(([name, target]) => [
                  [name, encoding.getTextureView(target.view)],
                  [
                    `${name}Sampler`,
                    samplers[`${name}Sampler`] || encoding.getTexture(target.view).sampler
                  ]
                ])
              ),
              ...samplers
            });
            model.predraw(encoding.commandEncoder);
          },
          getRenderPassProps: () => ({id, clearColor: [0, 0, 0, 1], clearDepth: false}),
          encode: ({renderPass}) => {
            model.draw(renderPass);
          },
          destroy: () => {
            model.destroy();
            for (const sampler of Object.values(samplers)) sampler.destroy();
          }
        };
      }
    };
    graph.addRenderPass(node);
  }

  function supportsCompute(
    optimization: CompositeShaderPassComputeOptimization,
    targets: Record<string, Target>
  ): boolean {
    const limits = graph.device.limits;
    const names = Object.values(optimization.outputs);
    return (
      names.length > 0 &&
      names.length <= limits.maxStorageTexturesPerShaderStage &&
      optimization.workgroupSize[0] <= limits.maxComputeWorkgroupSizeX &&
      optimization.workgroupSize[1] <= limits.maxComputeWorkgroupSizeY &&
      optimization.workgroupSize[0] * optimization.workgroupSize[1] <=
        limits.maxComputeInvocationsPerWorkgroup &&
      names.every(name => targets[name] && targets[name].view.texture.usage & Texture.STORAGE)
    );
  }

  function emitCompute(
    optimization: CompositeShaderPassComputeOptimization,
    source: Target,
    targets: Record<string, Target>
  ): void {
    const entries = Object.entries(optimization.outputs);
    if (entries.some(([, name]) => targets[name].view.texture === source.view.texture))
      throw new Error(`${operation.id}: compute input aliases an output`);
    graph.addComputePass({
      id: nextId(optimization.name),
      resources: [
        {texture: source.view, usage: 'sampled'},
        ...entries.map(([, name]) => ({
          texture: targets[name].view,
          usage: 'storage-write' as const
        }))
      ],
      compile: ({device}) => {
        const parameterBuffer = device.createBuffer({
          byteLength: Math.max(Math.ceil(optimization.uniformNames.length / 4) * 16, 16),
          usage: Buffer.UNIFORM | Buffer.COPY_DST
        });
        let computation: Computation;
        try {
          computation = new Computation(device, {
            id: optimization.name,
            source: optimization.source,
            shaderLayout: {
              bindings: [
                {name: optimization.uniformBinding, type: 'uniform', group: 0, location: 0},
                {
                  name: 'sourceTexture',
                  type: 'texture',
                  group: 0,
                  location: 1,
                  sampleType: 'unfilterable-float'
                },
                ...entries.map(([name, target], index) => ({
                  name,
                  type: 'storage' as const,
                  group: 0,
                  location: index + 2,
                  access: 'write-only' as const,
                  format: targets[target].view.format
                }))
              ]
            }
          });
        } catch (error) {
          parameterBuffer.destroy();
          throw error;
        }
        const dispatchWidth = Math.max(...entries.map(([, name]) => targets[name].view.width));
        const dispatchHeight = Math.max(...entries.map(([, name]) => targets[name].view.height));
        return {
          prepare: encoding => {
            const values = {
              ...props.uniforms?.[optimization.uniformModule],
              ...optimization.uniforms,
              ...getRuntimeUniforms(encoding)[optimization.uniformModule]
            };
            const data = new Float32Array(parameterBuffer.byteLength / 4);
            optimization.uniformNames.forEach((name, index) => {
              data[index] = typeof values[name] === 'number' ? values[name] : 0;
            });
            device.writeBufferViaCommandEncoder(encoding.commandEncoder, parameterBuffer, data);
            const bindings: Record<string, Binding> = {
              [optimization.uniformBinding]: parameterBuffer,
              sourceTexture: encoding.getTextureView(source.view)
            };
            for (const [name, target] of entries)
              bindings[name] = encoding.getTextureView(targets[target].view);
            computation.setBindings(bindings);
            computation.predraw(encoding.commandEncoder);
          },
          encode: ({computePass}) => {
            computation.dispatch(
              computePass,
              Math.ceil(dispatchWidth / optimization.workgroupSize[0]),
              Math.ceil(dispatchHeight / optimization.workgroupSize[1]),
              1
            );
          },
          destroy: () => {
            computation.destroy();
            parameterBuffer.destroy();
          }
        };
      }
    });
  }
}
