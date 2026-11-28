// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Texture, type TextureFormatColor} from '@luma.gl/core';
import {
  GPURenderInputs,
  GPURenderOperation,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode,
  type GPURenderCommandNode,
  type GPURenderOperationResources,
  gpuGraph,
  type GPUGraph,
  type GPUGraphTextureDescriptor,
  type GPUOperation,
  type GPUOperationContract,
  type GPUOperationLowering,
  type GPUOperationLoweringContext,
  type GraphTextureView
} from '@luma.gl/graph/gpu-core';
import {
  initializeShaderModule,
  type CompositeShaderPass,
  type ShaderPassRenderTarget
} from '@luma.gl/shaders';
import {taa, taaResolve} from '../passes/screen-space/temporal-antialiasing';
import type {TemporalFrame} from '../passes/screen-space/temporal-frame';
import type {TemporalGraphHistory} from './temporal-graph-history';
import {copyPass} from '../passes/screen-space/copy-pass';
import {
  resolveEffect,
  resolveEffectEntries,
  type EffectEntries
} from '../../passes/effect-renderer';
import {
  calculateTextureScale,
  FullscreenComputePass,
  planFullscreenPasses,
  SubPassRenderer,
  type PlannedFullscreenPass
} from '../../passes/shader-pass-renderer';

/** Overrides for one named effect occurrence. */
type EffectOccurrence<TextureBinding> = {
  /** Shader binding names mapped to logical names or caller-owned textures. */
  bindings?: Readonly<Record<string, TextureBinding>>;
  /** Values keyed by shader module name. */
  uniforms?: Readonly<Record<string, Record<string, unknown>>>;
};

/** Typed effect entries with graph bindings and uniforms for each occurrence. */
export type GPUEffectEntries<Options extends readonly unknown[], TextureBinding = string> = {
  readonly [Index in keyof Options]:
    | Exclude<EffectEntries<Options>[Index], {effect: unknown}>
    | (Extract<EffectEntries<Options>[Index], {effect: unknown}> &
        EffectOccurrence<TextureBinding>);
};

/** Executable form of a single effect occurrence. */
type PlannedEffectOccurrence<TextureBinding> = EffectOccurrence<TextureBinding> & {
  definition: CompositeShaderPass;
};

/** Resolves the same construction options and occurrence overrides for both graph entry points. */
function planEffectOccurrences<Options extends readonly unknown[], TextureBinding>(
  entries: GPUEffectEntries<Options, TextureBinding>
): PlannedEffectOccurrence<TextureBinding>[] {
  return resolveEffectEntries<Options>(entries).map((definition, index) => {
    const entry = entries[index];
    return 'effect' in entry
      ? {definition, bindings: {...entry.bindings}, uniforms: {...entry.uniforms}}
      : {definition};
  });
}

/** An effect stack with named graph inputs and an operation-produced color result. */
export type GPUEffectOperationProps<Options extends readonly unknown[]> = {
  id?: string;
  input: string;
  output: string;
  outputDescriptor: GPUGraphTextureDescriptor<TextureFormatColor>;
  effects: GPUEffectEntries<Options>;
  /** Shader binding names mapped to logical graph texture names. */
  bindings?: Readonly<Record<string, string>>;
  /** Uniforms keyed by shader module name. */
  uniforms?: Readonly<Record<string, Record<string, unknown>>>;
  /** Enable the renderer's WebGPU orientation convention. */
  flipY?: boolean;
};

/** Lowers an ordered, stateless effect stack into the graph's render and compute nodes. */
export class GPUEffectOperation<Options extends readonly unknown[] = readonly unknown[]>
  implements GPUOperation
{
  readonly type = 'effects';
  readonly id: string;
  /** @internal Shared, resolved effect definitions. */
  readonly effects: readonly PlannedEffectOccurrence<string>[];
  /** @internal Logical shader texture bindings. */
  readonly bindings: Readonly<Record<string, string>>;
  /** @internal Single-sample output used by the operation contract. */
  readonly outputDescriptor: GPUGraphTextureDescriptor<TextureFormatColor>;

  constructor(readonly props: GPUEffectOperationProps<Options>) {
    this.id = props.id ?? props.output + '-effects';
    this.effects = planEffectOccurrences<Options, string>(props.effects);
    this.bindings = Object.freeze({...props.bindings});
    const {outputDescriptor} = props;
    assert(
      outputDescriptor.extent &&
        (outputDescriptor.dimension ?? '2d') === '2d' &&
        (outputDescriptor.mipLevels ?? 1) === 1 &&
        (outputDescriptor.samples ?? 1) === 1
    );
    this.outputDescriptor = gpuGraph.texture({
      ...outputDescriptor,
      dimension: '2d',
      mipLevels: 1,
      samples: 1
    });
  }

  /** The named values consumed and produced by this operation. */
  get contract(): GPUOperationContract {
    return {
      values: [
        ...Array.from(
          new Set([
            this.props.input,
            ...Object.values(this.bindings),
            ...this.effects.flatMap(entry => Object.values(entry.bindings ?? {}))
          ]),
          value => ({
            value,
            access: 'read' as const,
            textureUsage: 'sampled' as const
          })
        ),
        {value: this.props.output, access: 'write', textureUsage: 'render-attachment'}
      ],
      outputs: {[this.props.output]: this.outputDescriptor}
    } satisfies GPUOperationContract;
  }
}

/** Appends an effect stack and returns its logical color result. */
export function appendEffects<Options extends readonly unknown[]>(
  graph: GPUGraph,
  props: GPUEffectOperationProps<Options>
): string {
  if (!props.effects.length) return props.input;
  graph.add(new GPUEffectOperation(props));
  return props.output;
}

/** Compiler lowering for engine effects. Install it in GPUGraph compile options. */
export const effectOperationLowering = {
  type: 'effects',
  lower: lowerEffectOperation
} satisfies GPUOperationLowering<void, GPUEffectOperation>;

type Target = {view: GraphTextureView; sampler?: ShaderPassRenderTarget['sampler']};

function lowerEffectOperation(
  operation: GPUEffectOperation,
  context: GPUOperationLoweringContext
): void {
  const {graph} = context;
  const {props} = operation;
  const nodes = buildEffectNodes(graph, {
    ...props,
    id: graph.getUniqueResourceId(operation.id),
    effects: operation.effects,
    source: context.resolveTextureView<TextureFormatColor>(props.input),
    output: context.resolveTextureView<TextureFormatColor>(props.output),
    resolveTexture: name => context.resolveTextureView(name),
    bindings: operation.bindings,
    allowCompute: true
  });
  for (const node of nodes) {
    if (node.type === 'compute') graph.addComputePass(node);
    else graph.addRenderPass(node);
  }
}

/** Borrowed textures for a portable SimpleGraph effect stack. */
export type EffectRenderOperationProps<Options extends readonly unknown[]> = Pick<
  GPUEffectOperationProps<Options>,
  'uniforms' | 'flipY'
> & {
  /** Effect entries with caller-owned textures as per-occurrence bindings. */
  effects: GPUEffectEntries<Options, Texture>;
  /** Operation and resource namespace. */
  id: string;
  /** The borrowed input color and destination textures. */
  input: Texture;
  output: Texture;
  /** Other borrowed textures keyed by shader binding. */
  bindings?: Readonly<Record<string, Texture>>;
};

/** Builds a portable render operation using the fragment implementations of the effects. */
export function createEffectRenderOperation<Options extends readonly unknown[]>(
  props: EffectRenderOperationProps<Options>
): GPURenderOperation<void> {
  const {id, input, output, bindings, uniforms, flipY} = props;
  const effects = planEffectOccurrences<Options, Texture>(props.effects);
  return new GPURenderOperation({
    id,
    createNodes: graph => {
      const borrowed = new Map<Texture, GraphTextureView>();
      const importTexture = (texture: Texture, name: string) => {
        let view = borrowed.get(texture);
        if (view) return view;
        view = graph.createTextureView(
          graph.importTexture(
            {
              id: id + '/borrowed-' + borrowed.size + '-' + name,
              format: texture.format,
              width: texture.width,
              height: texture.height,
              depth: texture.depth,
              dimension: texture.dimension,
              mipLevels: texture.mipLevels,
              samples: texture.props.samples,
              usage: texture.props.usage
            },
            texture
          )
        );
        borrowed.set(texture, view);
        return view;
      };
      return buildEffectNodes(graph, {
        id,
        source: importTexture(input, 'source') as GraphTextureView<TextureFormatColor>,
        output: importTexture(output, 'output') as GraphTextureView<TextureFormatColor>,
        resolveTexture: (texture, name) => importTexture(texture, 'binding-' + name),
        bindings: {...bindings},
        effects,
        uniforms,
        flipY
      }).filter(node => node.type === 'render');
    }
  });
}

/** Command graph inputs and retained targets for same-resolution TAA. */
export type GraphTAAProps = {
  /** Scope for the generated render passes. */
  id: string;
  /** Single-sample color input and output at the render resolution. */
  input: GraphTextureView<TextureFormatColor>;
  output: GraphTextureView<TextureFormatColor>;
  /** Hardware depth from the same render view. */
  depth: GraphTextureView;
  /** Motion XY in unjittered top-left UV units, current minus previous. */
  velocity: GraphTextureView;
  /** Resolved color and packed hardware depth from prior frames. */
  colorHistory: TemporalGraphHistory<TextureFormatColor>;
  depthHistory: TemporalGraphHistory<'rgba16float'>;
  /** Optional tuning overrides for the reused TAA shader. */
  historyWeight?: number;
  depthThreshold?: number;
};

/**
 * Adds the shared velocity TAA effect to a WebGPU command graph. Supply frame jitter on each
 * encoding and set resetHistory for the first frame and whenever the history is invalidated.
 */
export function addGraphTAA<Frame extends TemporalFrame>(
  graph: GPUCommandGraph<Frame>,
  props: GraphTAAProps
): void {
  assert(graph.device.type === 'webgpu');
  const {id, input, output, depth, velocity, colorHistory, depthHistory} = props;
  for (const view of [
    input,
    output,
    depth,
    velocity,
    colorHistory.previous,
    colorHistory.current,
    depthHistory.previous,
    depthHistory.current
  ]) {
    assert(
      view.width === input.width &&
        view.height === input.height &&
        view.dimension === '2d' &&
        view.texture.samples === 1
    );
  }
  assert(
    colorHistory.previous.format === output.format && colorHistory.current.format === output.format
  );
  const nodes = buildEffectNodes<GraphTextureView, Frame>(graph, {
    id: graph.getUniqueResourceId(id),
    source: input,
    output,
    resolveTexture: view => view,
    bindings: {depthTexture: depth, velocityTexture: velocity},
    effects: [{definition: resolveEffect(taa)}],
    history: {taaHistoryColor: colorHistory, taaHistoryDepth: depthHistory},
    uniforms: {
      taaResolve: {
        depthThreshold: props.depthThreshold ?? taaResolve.propTypes.depthThreshold.value
      }
    },
    getFrameUniforms: ({currentJitter, previousJitter, resetHistory}) => ({
      taaResolve: {
        currentJitter,
        previousJitter,
        historyWeight: resetHistory
          ? 0
          : (props.historyWeight ?? taaResolve.propTypes.historyWeight.value)
      }
    })
  });
  for (const node of nodes) {
    if (node.type === 'render') graph.addRenderPass(node);
    else graph.addComputePass(node);
  }
}

/** Creates the same concrete render commands for either graph entry point. */
function buildEffectNodes<TextureBinding, Frame = void>(
  graph: GPURenderOperationResources<Frame>,
  props: {
    id: string;
    source: GraphTextureView<TextureFormatColor>;
    output: GraphTextureView<TextureFormatColor>;
    resolveTexture: (value: TextureBinding, bindingName: string) => GraphTextureView;
    bindings: Readonly<Record<string, TextureBinding>>;
    effects: readonly PlannedEffectOccurrence<TextureBinding>[];
    uniforms?: Readonly<Record<string, Record<string, unknown>>>;
    flipY?: boolean;
    allowCompute?: boolean;
    history?: Readonly<Record<string, TemporalGraphHistory>>;
    getFrameUniforms?: (frame: Frame) => Readonly<Record<string, Record<string, unknown>>>;
  }
): (GPURenderCommandNode<Frame> | GPUCommandGraphComputeNode<Frame>)[] {
  const source: Target = {view: props.source};
  const output: Target = {view: props.output};
  const colorFormat = props.output.format;
  const flipY = props.flipY ?? graph.device.type === 'webgpu';
  assert(source.view.dimension === '2d' && source.view.texture.samples === 1);
  const nodes: (GPURenderCommandNode<Frame> | GPUCommandGraphComputeNode<Frame>)[] = [];
  let index = 0;
  const nextId = (name: string) => props.id + '/' + index++ + '-' + name;
  const resolveBindings = (bindings: Readonly<Record<string, TextureBinding>> = {}) =>
    Object.fromEntries(
      Object.entries(bindings).map(([name, value]) => [
        name,
        {view: props.resolveTexture(value, name)}
      ])
    );
  const sharedBindings = resolveBindings(props.bindings);
  const plans = props.effects.map(({definition: effect, bindings, uniforms}) => ({
    effect,
    bindings: {...sharedBindings, ...resolveBindings(bindings)},
    uniforms,
    ...planFullscreenPasses(graph.device, effect, {
      allowCompute: props.allowCompute === true,
      colorFormat
    })
  }));
  const copy = {
    ownerName: props.id,
    shaderPass: copyPass,
    subPass: copyPass.passes[0]
  };
  let previous = source;
  // WebGPU uses the same seed draw and coordinate convention as EffectRenderer.
  // WebGL can use the input directly when its orientation, size and format already match.
  if (
    plans.length &&
    (graph.device.type === 'webgpu' ||
      flipY ||
      source.view.width !== output.view.width ||
      source.view.height !== output.view.height ||
      source.view.format !== output.view.format)
  ) {
    previous = createTarget('source');
    emitRender(copy, {sourceTexture: source}, previous, flipY);
  }

  for (const [
    planIndex,
    {effect, bindings: effectBindings, uniforms, compute, passes}
  ] of plans.entries()) {
    const targets: Record<string, Target> = Object.create(null);
    const written = new Set<GraphTextureView>();
    for (const [name, spec] of Object.entries(effect.renderTargets ?? {})) {
      if (name === 'original' || name === 'previous') {
        throw new Error(effect.name + ': reserved target ' + name);
      }
      if (spec.lifetime === 'history') {
        const history = props.history?.[name];
        if (!history) throw new Error(effect.name + ': missing history roles for ' + name);
        targets[name] = {view: history.current, sampler: spec.sampler};
      } else if (spec.aliasFor) {
        const target = targets[spec.aliasFor];
        const width = targetSize(output.view.width, spec.scale?.[0]);
        const height = targetSize(output.view.height, spec.scale?.[1]);
        assert(
          target &&
            target.view.width === width &&
            target.view.height === height &&
            target.view.format === (spec.format ?? colorFormat) &&
            (!spec.storage || target.view.texture.usage & Texture.STORAGE)
        );
        targets[name] = target;
      } else {
        targets[name] = createTarget(name, spec);
      }
    }
    const resolve = (name: string) => {
      if (name === 'original') return source;
      if (name === 'previous') return previous;
      const target = targets[name];
      if (target && !written.has(target.view)) {
        const history = props.history?.[name];
        if (history) return {view: history.previous, sampler: target.sampler};
      }
      if (!target || !written.has(target.view)) {
        throw new Error(effect.name + ': unavailable input ' + name);
      }
      return target;
    };

    if (compute) {
      const input = resolve(compute.input);
      const outputs = Object.entries(compute.outputs);
      const dispatchTarget = targets[outputs[0][1]].view;
      const shader = [...(effect.initialPasses?.fragment ?? []), ...effect.steps].find(
        step => step.shaderPass.name === compute.uniformModule
      )?.shaderPass;
      if (shader) initializeShaderModule(shader);
      nodes.push({
        type: 'compute',
        id: nextId(compute.name),
        resources: [
          {texture: input.view, usage: 'sampled'},
          ...outputs.map(([, name]) => ({
            texture: targets[name].view,
            usage: 'storage-write' as const
          }))
        ],
        compile: ({device}) => {
          const executable = new FullscreenComputePass(
            device,
            compute,
            Object.fromEntries(outputs.map(([, name]) => [name, targets[name].view.format]))
          );
          return {
            prepare: encoding =>
              executable.prepare(
                encoding.commandEncoder,
                encoding.getTextureView(input.view),
                Object.fromEntries(
                  outputs.map(([binding, name]) => [
                    binding,
                    encoding.getTextureView(targets[name].view)
                  ])
                ),
                {
                  ...shader?.defaultUniforms,
                  ...shader?.uniforms,
                  ...compute.uniforms,
                  ...props.uniforms?.[compute.uniformModule],
                  ...uniforms?.[compute.uniformModule]
                }
              ),
            encode: ({computePass}) =>
              executable.dispatch(computePass, dispatchTarget.width, dispatchTarget.height),
            destroy: () => executable.destroy()
          };
        }
      });
      for (const [, name] of outputs) written.add(targets[name].view);
    }
    for (const [passIndex, pass] of passes.entries()) {
      const name = pass.output ?? 'previous';
      const last = planIndex === plans.length - 1 && passIndex === passes.length - 1;
      const bindings: Record<string, Target> = {sourceTexture: previous};
      for (const [binding, target] of Object.entries(effectBindings)) {
        if (
          binding === 'sourceTexture' ||
          pass.shaderPass.bindingLayout?.some(entry => entry.name === binding)
        ) {
          bindings[binding] = target;
        }
      }
      for (const [binding, value] of Object.entries(pass.inputs ?? {sourceTexture: 'previous'})) {
        if (value) bindings[binding] = resolve(value);
      }
      const outputIsSampled = Object.values(bindings).some(
        binding => binding.view.texture === output.view.texture
      );
      const destination =
        name === 'previous'
          ? last && !outputIsSampled
            ? output
            : createTarget('previous')
          : targets[name];
      if (!destination) throw new Error(effect.name + ': unknown output ' + name);
      emitRender(pass, bindings, destination, flipY, uniforms?.[pass.shaderPass.name]);
      written.add(destination.view);
      if (name === 'previous') previous = destination;
    }
  }
  if (previous.view !== output.view) {
    // A final copy preserves the stored orientation, independent of effect coordinates.
    emitRender(copy, {sourceTexture: previous}, output, graph.device.type === 'webgpu');
  }
  return nodes;

  function createTarget(name: string, spec: ShaderPassRenderTarget = {}): Target {
    const format = spec.format ?? colorFormat;
    const view = graph.createTextureView(
      graph.createTransientTexture({
        id: nextId(name),
        width: targetSize(output.view.width, spec.scale?.[0]),
        height: targetSize(output.view.height, spec.scale?.[1]),
        format,
        usage:
          Texture.SAMPLE |
          Texture.RENDER |
          (spec.storage && graph.device.getTextureFormatCapabilities(format).store
            ? Texture.STORAGE
            : 0)
      })
    );
    return {view, sampler: spec.sampler};
  }

  function emitRender(
    pass: PlannedFullscreenPass,
    bindings: Record<string, Target>,
    destination: Target,
    flip: boolean,
    uniforms?: Readonly<Record<string, unknown>>
  ) {
    const inputs = new GPURenderInputs({
      textures: Object.fromEntries(
        Object.entries(bindings).map(([name, target]) => [name, {source: target.view}])
      )
    });
    nodes.push({
      type: 'render',
      id: nextId(pass.shaderPass.name),
      inputs,
      attachments: {colorAttachments: [destination.view]},
      compile: ({device}) => {
        const executable = new SubPassRenderer(device, pass.shaderPass, pass.subPass, flip);
        const samplers = Object.fromEntries(
          Object.entries(bindings)
            .filter(([, target]) => target.sampler)
            .map(([name, target]) => [name, device.createSampler(target.sampler!)])
        );
        return {
          prepare: encoding => {
            const textures = inputs.resolveBindings(
              executable.model.pipeline.shaderLayout,
              encoding
            );
            const resolvedSamplers = Object.fromEntries(
              Object.entries(bindings).map(([name, target]) => [
                name + 'Sampler',
                samplers[name] ?? encoding.getTexture(target.view).sampler
              ])
            );
            const sourceView = bindings['sourceTexture'].view;
            executable.prepare({
              commandEncoder: encoding.commandEncoder,
              bindings: {...textures, ...resolvedSamplers},
              textureScale: calculateTextureScale(sourceView, destination.view),
              uniforms: {
                ...pass.uniforms,
                ...props.uniforms?.[pass.shaderPass.name],
                ...uniforms,
                ...props.getFrameUniforms?.(encoding.parameters)[pass.shaderPass.name]
              }
            });
          },
          encode: ({renderPass}) => executable.draw(renderPass),
          destroy: () => {
            executable.destroy();
            for (const sampler of Object.values(samplers)) sampler.destroy();
          }
        };
      }
    });
  }
}

function targetSize(size: number, scale = 1): number {
  return Math.max(1, Math.round(size * scale));
}
