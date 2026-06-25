// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, CommandEncoder} from '@luma.gl/core';
import {Device, Framebuffer, RenderPass, Texture} from '@luma.gl/core';
import type {
  ShaderPass,
  ShaderPassInputSource,
  ShaderPassPipeline,
  ShaderPassRenderTarget
} from '@luma.gl/shadertools';
import {initializeShaderModule} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import type {TextureBindingSource} from '../dynamic-texture/texture-binding-source';
import {ClipSpace} from '../models/clip-space';
import {SwapFramebuffers} from '../compute/swap';
import {BackgroundTextureModel} from '../models/billboard-texture-model';

import {getFragmentShaderForRenderPass} from './get-fragment-shader';
import {textureTransform} from './texture-transform-module';

type ShaderPassLike = ShaderPass | ShaderPassPipeline;
type ShaderSubPass = NonNullable<ShaderPass['passes']>[0];

type EffectiveSubPass = {
  ownerName: string;
  shaderPass: ShaderPass;
  subPassRenderer: SubPassRenderer;
  inputs?: Partial<Record<string, ShaderPassInputSource<string>>>;
  output?: 'previous' | string;
  uniforms?: Record<string, unknown>;
};

type ManagedRenderTarget = {
  name: string;
  spec: ShaderPassRenderTarget;
  texture: Texture;
  framebuffer: Framebuffer;
  historyTexture?: Texture;
  historyFramebuffer?: Framebuffer;
  historyInitialized: boolean;
  writtenThisFrame: boolean;
};

const RESERVED_RENDER_TARGET_NAMES = new Set(['original', 'previous']);

/** Construction props for {@link ShaderPassRenderer}. */
export type ShaderPassRendererProps = {
  /** List of ShaderPasses or ShaderPassPipelines to apply to the sourceTexture */
  shaderPasses: ShaderPassLike[];
  /** Optional typed ShaderInputs object for setting uniforms */
  shaderInputs?: ShaderInputs;
};

/** Source texture accepted by {@link ShaderPassRenderer}. */
export type ShaderPassSourceTexture = DynamicTexture | Texture;
/** Binding accepted by shader pass inputs, including deferred texture binding sources. */
export type ShaderPassBinding = Binding | TextureBindingSource;

/** Per-frame inputs accepted by {@link ShaderPassRenderer}. */
export type ShaderPassRendererRenderOptions = {
  sourceTexture: ShaderPassSourceTexture;
  uniforms?: Record<string, Record<string, unknown>>;
  bindings?: Record<string, ShaderPassBinding>;
  /** Invalidates all persistent render targets before rendering this frame. */
  resetHistory?: boolean;
};

/**
 * Runs one or more shader passes against a source texture.
 *
 * The renderer owns:
 * - a shared ping-pong pair for the logical `previous` chain
 * - any named render targets declared by `ShaderPassPipeline`
 * - a fullscreen model used both to seed the chain and to present to the screen
 *
 * Per-draw `uniforms` and `bindings` passed to `renderToTexture()` or `renderToScreen()` are
 * merged on top of the renderer's `shaderInputs`, which lets callers reuse one renderer instance
 * while varying pass inputs frame to frame.
 */
export class ShaderPassRenderer {
  device: Device;
  shaderInputs: ShaderInputs;
  passRenderers: PassRenderer[];
  swapFramebuffers: SwapFramebuffers;
  textureModel: BackgroundTextureModel;

  constructor(device: Device, props: ShaderPassRendererProps) {
    this.device = device;

    const executableShaderPasses = getExecutableShaderPasses(props.shaderPasses);
    executableShaderPasses.map(shaderPass => initializeShaderModule(shaderPass));

    const modules = executableShaderPasses.reduce(
      (object, shaderPass) => ({...object, [shaderPass.name]: shaderPass}),
      {}
    );
    this.shaderInputs = props.shaderInputs || new ShaderInputs(modules);

    const size = device.getCanvasContext().getDrawingBufferSize();
    this.swapFramebuffers = new SwapFramebuffers(device, {
      colorAttachments: [device.preferredColorFormat],
      width: size[0],
      height: size[1]
    });

    this.textureModel = new BackgroundTextureModel(device, {
      backgroundTexture: this.swapFramebuffers.current.colorAttachments[0].texture,
      flipY: device.type === 'webgpu'
    });

    this.passRenderers = props.shaderPasses.map(
      shaderPass => new PassRenderer(device, shaderPass, this.shaderInputs)
    );
  }

  /** Destroys resources created by this ShaderPassRenderer */
  destroy() {
    for (const passRenderer of this.passRenderers) {
      passRenderer.destroy();
    }
    this.swapFramebuffers.destroy();
    this.textureModel.destroy();
  }

  resize(size?: [width: number, height: number]): void {
    size ||= this.device.getCanvasContext().getDrawingBufferSize();
    this.swapFramebuffers.resize({width: size[0], height: size[1]});
    for (const passRenderer of this.passRenderers) {
      passRenderer.resize(size);
    }
  }

  /** Invalidates persistent pipeline targets without destroying their allocations. */
  resetHistory(): void {
    for (const passRenderer of this.passRenderers) {
      passRenderer.resetHistory();
    }
  }

  renderToScreen(options: ShaderPassRendererRenderOptions): boolean {
    const outputTexture = this.renderToTexture(options);
    if (!outputTexture) {
      return false;
    }

    const framebuffer = this.device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: false});
    // Prepare fullscreen presentation bindings before opening the render pass so WebGPU
    // uploads stay on the parent command encoder rather than the active render pass encoder.
    this.textureModel.setProps({backgroundTexture: outputTexture});
    this.textureModel.predraw(this.device.commandEncoder);
    const renderPass = this.device.beginRenderPass({
      id: 'shader-pass-renderer-to-screen',
      framebuffer,
      clearDepth: false
    });
    this.textureModel.draw(renderPass);
    renderPass.end();
    return true;
  }

  /** Runs the shaderPasses in sequence on the sourceTexture and returns a texture with the results.
   * @returns null if the the sourceTexture has not yet been loaded
   */
  renderToTexture(options: ShaderPassRendererRenderOptions): Texture | null {
    const {sourceTexture} = options;
    if (sourceTexture instanceof DynamicTexture && !sourceTexture.isReady) {
      return null;
    }
    const originalTexture =
      sourceTexture instanceof DynamicTexture ? sourceTexture.texture : sourceTexture;

    if (this.passRenderers.length === 0) {
      return originalTexture;
    }

    if (options.resetHistory) {
      this.resetHistory();
    }

    // Seed the first shared framebuffer with the original source. This normalizes the starting
    // point for later passes so `previous` always refers to a drawing-buffer-sized texture.
    this.textureModel.setProps({backgroundTexture: originalTexture});
    // The seed draw updates fullscreen bind groups, so it must be prepared before the
    // render pass begins to avoid command-encoder locking errors on WebGPU.
    this.textureModel.predraw(this.device.commandEncoder);

    const sourceFramebuffer = this.swapFramebuffers.current;
    const seedRenderPass = this.device.beginRenderPass({
      id: 'shader-pass-renderer-seed-source',
      framebuffer: sourceFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: false
    });
    this.textureModel.draw(seedRenderPass);
    seedRenderPass.end();

    let previousFramebuffer: Framebuffer | null = sourceFramebuffer;
    let previousTexture: Texture = getFramebufferTexture(sourceFramebuffer);
    let frameSucceeded = false;
    try {
      for (const passRenderer of this.passRenderers) {
        passRenderer.initializeHistoryTargets(originalTexture, this.textureModel);
        for (const execution of passRenderer.subPassExecutions) {
          const outputName = execution.output || 'previous';
          const outputFramebuffer: Framebuffer =
            outputName === 'previous'
              ? getNextPreviousFramebuffer(this.swapFramebuffers, previousFramebuffer)
              : passRenderer.getOutputFramebuffer(outputName);
          const outputTexture = getFramebufferTexture(outputFramebuffer);
          // Pipeline routing resolves logical input names like `original`, `previous`, or a named
          // render target into concrete textures for this draw.
          const resolvedBindings = passRenderer.resolveBindings({
            execution,
            originalTexture,
            previousTexture,
            outputTexture,
            externalBindings: options.bindings || {}
          });
          // Runtime uniforms are layered last so callers can update a renderer-owned pass without
          // reconstructing it every frame.
          const resolvedUniforms = resolveExecutionUniforms(
            this.shaderInputs,
            execution,
            options.uniforms || {}
          );

          execution.subPassRenderer.prepare({
            commandEncoder: this.device.commandEncoder,
            bindings: resolvedBindings,
            textureScale: calculateTextureScale(
              (resolvedBindings['sourceTexture'] as Texture) || previousTexture,
              outputTexture
            ),
            uniforms: resolvedUniforms
          });
          const renderPass = this.device.beginRenderPass({
            id: 'shader-pass-renderer-run-pass',
            framebuffer: outputFramebuffer,
            clearColor: [0, 0, 0, 1],
            clearDepth: 1
          });
          execution.subPassRenderer.draw(renderPass);
          renderPass.end();

          if (outputName === 'previous') {
            previousTexture = outputTexture;
            previousFramebuffer = outputFramebuffer;
          } else {
            passRenderer.markTargetWritten(outputName);
          }
        }
      }
      frameSucceeded = true;
    } finally {
      for (const passRenderer of this.passRenderers) {
        passRenderer.finishFrame(frameSucceeded);
      }
    }

    return previousTexture;
  }
}

/** Renders one `ShaderPass` or `ShaderPassPipeline` entry in the chain. */
class PassRenderer {
  device: Device;
  shaderInputs: ShaderInputs;
  passDefinition: ShaderPassLike;
  renderTargets: Record<string, ManagedRenderTarget>;
  subPassExecutions: EffectiveSubPass[];

  constructor(device: Device, passDefinition: ShaderPassLike, shaderInputs: ShaderInputs) {
    this.device = device;
    this.shaderInputs = shaderInputs;
    this.passDefinition = passDefinition;

    if (isShaderPassPipeline(passDefinition)) {
      validateRenderTargetNames(passDefinition.name, passDefinition.renderTargets || {});
      this.renderTargets = createManagedRenderTargets(device, passDefinition.renderTargets || {});
      this.subPassExecutions = passDefinition.steps.flatMap(step =>
        this.createStepExecutions(passDefinition, step)
      );
      return;
    }

    validateShaderPassDoesNotOwnRenderTargets(passDefinition, passDefinition.name);
    this.renderTargets = {};
    this.subPassExecutions = this.createPassExecutions(passDefinition, {
      ownerName: passDefinition.name
    });
  }

  destroy() {
    for (const execution of this.subPassExecutions) {
      execution.subPassRenderer.destroy();
    }
    destroyManagedRenderTargets(this.renderTargets);
  }

  resize(size: [width: number, height: number]) {
    resizeManagedRenderTargets(this.device, this.renderTargets, size);
  }

  resetHistory(): void {
    for (const renderTarget of Object.values(this.renderTargets)) {
      renderTarget.historyInitialized = false;
      renderTarget.writtenThisFrame = false;
    }
  }

  initializeHistoryTargets(originalTexture: Texture, textureModel: BackgroundTextureModel): void {
    for (const renderTarget of Object.values(this.renderTargets)) {
      if (renderTarget.spec.lifetime !== 'history' || renderTarget.historyInitialized) {
        continue;
      }
      const historyFramebuffer = getHistoryFramebuffer(renderTarget);
      const initialize = renderTarget.spec.initialize || {
        clearColor: [0, 0, 0, 0] as [number, number, number, number]
      };
      if (initialize === 'original') {
        textureModel.setProps({backgroundTexture: originalTexture});
        textureModel.predraw(this.device.commandEncoder);
        const renderPass = this.device.beginRenderPass({
          id: `${renderTarget.name}-initialize-history`,
          framebuffer: historyFramebuffer,
          clearColor: [0, 0, 0, 0],
          clearDepth: false
        });
        textureModel.draw(renderPass);
        renderPass.end();
      } else {
        const renderPass = this.device.beginRenderPass({
          id: `${renderTarget.name}-clear-history`,
          framebuffer: historyFramebuffer,
          clearColor: initialize.clearColor,
          clearDepth: false
        });
        renderPass.end();
      }
      renderTarget.historyInitialized = true;
    }
  }

  getOutputFramebuffer(name: string): Framebuffer {
    return this.getRenderTarget(name).framebuffer;
  }

  markTargetWritten(name: string): void {
    this.getRenderTarget(name).writtenThisFrame = true;
  }

  finishFrame(succeeded: boolean): void {
    for (const renderTarget of Object.values(this.renderTargets)) {
      if (succeeded && renderTarget.spec.lifetime === 'history' && renderTarget.writtenThisFrame) {
        const historyTexture = getHistoryTexture(renderTarget);
        const historyFramebuffer = getHistoryFramebuffer(renderTarget);
        renderTarget.historyTexture = renderTarget.texture;
        renderTarget.historyFramebuffer = renderTarget.framebuffer;
        renderTarget.texture = historyTexture;
        renderTarget.framebuffer = historyFramebuffer;
        renderTarget.historyInitialized = true;
      }
      renderTarget.writtenThisFrame = false;
    }
  }

  getRenderTarget(name: string): ManagedRenderTarget {
    const renderTarget = this.renderTargets[name];
    if (!renderTarget) {
      throw new Error(`${this.getOwnerName()}: unknown render target "${name}"`);
    }
    return renderTarget;
  }

  resolveBindings(options: {
    execution: EffectiveSubPass;
    originalTexture: Texture;
    previousTexture: Texture;
    outputTexture: Texture;
    externalBindings: Record<string, ShaderPassBinding>;
  }): Record<string, ShaderPassBinding> {
    const {execution, originalTexture, previousTexture, outputTexture, externalBindings} = options;
    const inputMap = execution.inputs || {sourceTexture: 'previous'};
    const shaderInputBindings = this.shaderInputs.getModuleBindingValues(execution.shaderPass.name);
    const externalBindingsForPass = Object.fromEntries(
      Object.entries(externalBindings).filter(([name]) =>
        execution.shaderPass.bindingLayout?.some(binding => binding.name === name)
      )
    );
    // Shader-pass bindings stored in `shaderInputs` act as renderer-owned defaults. Per-draw
    // external bindings can override those defaults for frame-specific resources, while routed
    // logical inputs such as `sourceTexture` remain authoritative below.
    const resolvedBindings: Record<string, ShaderPassBinding> = {
      ...shaderInputBindings,
      ...externalBindingsForPass
    };
    const outputName = execution.output || 'previous';

    for (const [bindingName, inputSource] of Object.entries(inputMap)) {
      if (!inputSource) {
        continue;
      }
      const texture = this.resolveInputTexture(inputSource, originalTexture, previousTexture);
      const target = inputSource in this.renderTargets ? this.renderTargets[inputSource] : null;
      if (
        outputName !== 'previous' &&
        inputSource === outputName &&
        target?.spec.lifetime !== 'history'
      ) {
        throw new Error(
          `${execution.ownerName}: subpass cannot read and write render target "${outputName}" in the same draw`
        );
      }
      if (bindingName === 'sourceTexture' && texture === outputTexture) {
        throw new Error(
          `${execution.ownerName}: subpass cannot sample from the render target it is writing to`
        );
      }
      resolvedBindings[bindingName] = texture;
    }

    if (!('sourceTexture' in resolvedBindings)) {
      resolvedBindings['sourceTexture'] = previousTexture;
    }

    return resolvedBindings;
  }

  private createStepExecutions(
    pipeline: ShaderPassPipeline,
    step: ShaderPassPipeline['steps'][number]
  ): EffectiveSubPass[] {
    validateShaderPassDoesNotOwnRenderTargets(
      step.shaderPass,
      `${pipeline.name}/${step.shaderPass.name}`
    );

    return this.createPassExecutions(step.shaderPass, {
      ownerName: `${pipeline.name}/${step.shaderPass.name}`,
      firstInputs: step.inputs,
      lastOutput: step.output,
      uniformOverrides: step.uniforms
    });
  }

  private createPassExecutions(
    shaderPass: ShaderPass,
    options: {
      ownerName: string;
      firstInputs?: Partial<Record<string, ShaderPassInputSource<string>>>;
      lastOutput?: 'previous' | string;
      uniformOverrides?: Record<string, unknown>;
    }
  ): EffectiveSubPass[] {
    const subPasses = shaderPass.passes || [];
    return subPasses.map((subPass, index) => {
      const isFirstSubPass = index === 0;
      const isLastSubPass = index === subPasses.length - 1;
      const inputs =
        isFirstSubPass && options.firstInputs !== undefined ? options.firstInputs : subPass.inputs;
      const output =
        isLastSubPass && options.lastOutput !== undefined ? options.lastOutput : subPass.output;
      validateSubPassRouting(options.ownerName, inputs, output, this.renderTargets);

      return {
        ownerName: options.ownerName,
        shaderPass,
        subPassRenderer: new SubPassRenderer(this.device, shaderPass, subPass),
        inputs,
        output,
        uniforms: mergeUniforms(options.uniformOverrides, subPass.uniforms)
      };
    });
  }

  private resolveInputTexture(
    inputSource: string,
    originalTexture: Texture,
    previousTexture: Texture
  ): Texture {
    switch (inputSource) {
      case 'original':
        return originalTexture;
      case 'previous':
        return previousTexture;
      default: {
        const renderTarget = this.getRenderTarget(inputSource);
        if (renderTarget.spec.lifetime === 'history' && !renderTarget.writtenThisFrame) {
          return getHistoryTexture(renderTarget);
        }
        return renderTarget.texture;
      }
    }
  }

  private getOwnerName(): string {
    return this.passDefinition.name;
  }
}

/** Renders a single subpass of a `ShaderPass`. */
class SubPassRenderer {
  model: ClipSpace;
  shaderPass: ShaderPass;
  subPass: ShaderSubPass;

  constructor(device: Device, shaderPass: ShaderPass, subPass: ShaderSubPass) {
    this.shaderPass = shaderPass;
    this.subPass = subPass;
    const action =
      subPass.action || (subPass.filter && 'filter') || (subPass.sampler && 'sample') || 'filter';
    const fs = getFragmentShaderForRenderPass({
      shaderPass,
      action,
      shadingLanguage: device.info.shadingLanguage
    });

    this.model = new ClipSpace(device, {
      id: `${shaderPass.name}-subpass`,
      source: fs,
      fs,
      modules: [textureTransform, shaderPass],
      parameters: {
        depthWriteEnabled: false
      }
    });
  }

  destroy() {
    this.model.destroy();
  }

  prepare(options: {
    commandEncoder: CommandEncoder;
    bindings: Record<string, ShaderPassBinding>;
    textureScale: [number, number];
    uniforms?: Record<string, unknown>;
  }): void {
    const {commandEncoder, bindings, textureScale, uniforms} = options;

    this.model.shaderInputs.setProps({
      textureTransform: {scale: textureScale}
    });
    this.model.shaderInputs.setProps({
      [this.shaderPass.name]: this.shaderPass.uniforms || {}
    });
    this.model.shaderInputs.setProps({
      [this.shaderPass.name]: uniforms || {}
    });
    this.model.setBindings(bindings || {});
    this.model.predraw(commandEncoder);
  }

  draw(renderPass: RenderPass): void {
    this.model.draw(renderPass);
  }
}

function getExecutableShaderPasses(shaderPasses: ShaderPassLike[]): ShaderPass[] {
  return shaderPasses.flatMap(shaderPass =>
    isShaderPassPipeline(shaderPass) ? shaderPass.steps.map(step => step.shaderPass) : [shaderPass]
  );
}

function isShaderPassPipeline(shaderPass: ShaderPassLike): shaderPass is ShaderPassPipeline {
  return 'steps' in shaderPass;
}

function validateShaderPassDoesNotOwnRenderTargets(
  shaderPass: ShaderPass,
  ownerName: string
): void {
  const renderTargets = (shaderPass as ShaderPass & {renderTargets?: Record<string, unknown>})
    .renderTargets;
  if (renderTargets && Object.keys(renderTargets).length > 0) {
    throw new Error(
      `${ownerName}: ShaderPass.renderTargets is not supported; use ShaderPassPipeline.renderTargets instead`
    );
  }
}

function validateRenderTargetNames(
  ownerName: string,
  renderTargets: Record<string, ShaderPassRenderTarget>
): void {
  for (const name of Object.keys(renderTargets)) {
    if (RESERVED_RENDER_TARGET_NAMES.has(name)) {
      throw new Error(`${ownerName}: render target name "${name}" is reserved`);
    }
  }
}

function validateSubPassRouting(
  ownerName: string,
  inputs: Partial<Record<string, ShaderPassInputSource<string>>> | undefined,
  output: 'previous' | string | undefined,
  renderTargets: Record<string, ManagedRenderTarget>
): void {
  const inputMap = inputs || {sourceTexture: 'previous'};
  for (const inputSource of Object.values(inputMap)) {
    if (
      inputSource &&
      inputSource !== 'original' &&
      inputSource !== 'previous' &&
      !(inputSource in renderTargets)
    ) {
      throw new Error(`${ownerName}: unknown input source "${inputSource}"`);
    }
  }

  if (output && output !== 'previous' && !(output in renderTargets)) {
    throw new Error(`${ownerName}: unknown output target "${output}"`);
  }
}

function mergeUniforms(
  baseUniforms?: Record<string, unknown>,
  subPassUniforms?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!baseUniforms && !subPassUniforms) {
    return undefined;
  }

  return {
    ...(baseUniforms || {}),
    ...(subPassUniforms || {})
  };
}

/**
 * Resolves the effective uniform block for one execution.
 *
 * Merge order is:
 * 1. persisted renderer-level shader inputs
 * 2. uniforms baked into the pipeline or subpass definition
 * 3. per-draw runtime overrides
 */
function resolveExecutionUniforms(
  shaderInputs: ShaderInputs,
  execution: EffectiveSubPass,
  runtimeUniforms: Record<string, Record<string, unknown>>
): Record<string, unknown> | undefined {
  return mergeUniforms(
    mergeUniforms(
      shaderInputs.getUniformValues()[execution.shaderPass.name] as Record<string, unknown>,
      execution.uniforms
    ),
    runtimeUniforms[execution.shaderPass.name]
  );
}

function createManagedRenderTargets(
  device: Device,
  renderTargets: Record<string, ShaderPassRenderTarget>
): Record<string, ManagedRenderTarget> {
  const size = device.getCanvasContext().getDrawingBufferSize();
  return Object.entries(renderTargets).reduce(
    (managedRenderTargets, [name, spec]) => ({
      ...managedRenderTargets,
      [name]: createManagedRenderTarget(device, name, spec, size)
    }),
    {} as Record<string, ManagedRenderTarget>
  );
}

function destroyManagedRenderTargets(renderTargets: Record<string, ManagedRenderTarget>): void {
  for (const renderTarget of Object.values(renderTargets)) {
    renderTarget.framebuffer.destroy();
    renderTarget.texture.destroy();
    renderTarget.historyFramebuffer?.destroy();
    renderTarget.historyTexture?.destroy();
  }
}

function resizeManagedRenderTargets(
  device: Device,
  renderTargets: Record<string, ManagedRenderTarget>,
  size: [width: number, height: number]
): void {
  for (const renderTarget of Object.values(renderTargets)) {
    const targetSize = getRenderTargetSize(size, renderTarget.spec.scale);
    if (
      renderTarget.texture.width === targetSize[0] &&
      renderTarget.texture.height === targetSize[1]
    ) {
      continue;
    }

    renderTarget.framebuffer.destroy();
    renderTarget.texture.destroy();
    renderTarget.historyFramebuffer?.destroy();
    renderTarget.historyTexture?.destroy();
    const replacement = createManagedRenderTarget(
      device,
      renderTarget.name,
      renderTarget.spec,
      size
    );
    renderTarget.texture = replacement.texture;
    renderTarget.framebuffer = replacement.framebuffer;
    renderTarget.historyTexture = replacement.historyTexture;
    renderTarget.historyFramebuffer = replacement.historyFramebuffer;
    renderTarget.historyInitialized = false;
    renderTarget.writtenThisFrame = false;
  }
}

function createManagedRenderTarget(
  device: Device,
  name: string,
  spec: ShaderPassRenderTarget,
  size: [number, number]
): ManagedRenderTarget {
  const targetSize = getRenderTargetSize(size, spec.scale);
  const {texture, framebuffer} = createTargetResources(device, name, spec, targetSize);
  let historyTexture: Texture | undefined;
  let historyFramebuffer: Framebuffer | undefined;
  if (spec.lifetime === 'history') {
    const historyResources = createTargetResources(device, `${name}-history`, spec, targetSize);
    historyTexture = historyResources.texture;
    historyFramebuffer = historyResources.framebuffer;
  }

  return {
    name,
    spec,
    texture,
    framebuffer,
    historyTexture,
    historyFramebuffer,
    historyInitialized: false,
    writtenThisFrame: false
  };
}

function createTargetResources(
  device: Device,
  name: string,
  spec: ShaderPassRenderTarget,
  targetSize: [number, number]
): {texture: Texture; framebuffer: Framebuffer} {
  const texture = device.createTexture({
    id: `${name}-texture`,
    width: targetSize[0],
    height: targetSize[1],
    format: spec.format || device.preferredColorFormat,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST
  });
  const framebuffer = device.createFramebuffer({
    id: `${name}-framebuffer`,
    width: targetSize[0],
    height: targetSize[1],
    colorAttachments: [texture]
  });

  return {texture, framebuffer};
}

function getHistoryTexture(renderTarget: ManagedRenderTarget): Texture {
  if (!renderTarget.historyTexture) {
    throw new Error(`${renderTarget.name}: transient render target has no history texture`);
  }
  return renderTarget.historyTexture;
}

function getHistoryFramebuffer(renderTarget: ManagedRenderTarget): Framebuffer {
  if (!renderTarget.historyFramebuffer) {
    throw new Error(`${renderTarget.name}: transient render target has no history framebuffer`);
  }
  return renderTarget.historyFramebuffer;
}

function getRenderTargetSize(
  size: [width: number, height: number],
  scale: [number, number] = [1, 1]
): [width: number, height: number] {
  return [Math.max(1, Math.round(size[0] * scale[0])), Math.max(1, Math.round(size[1] * scale[1]))];
}

function getFramebufferTexture(framebuffer: Framebuffer): Texture {
  const texture = framebuffer.colorAttachments[0]?.texture;
  if (!texture) {
    throw new Error('ShaderPassRenderer: framebuffer is missing a color attachment texture');
  }
  return texture;
}

function getNextPreviousFramebuffer(
  swapFramebuffers: SwapFramebuffers,
  previousFramebuffer: Framebuffer | null
): Framebuffer {
  if (previousFramebuffer === swapFramebuffers.current) {
    return swapFramebuffers.next;
  }
  return swapFramebuffers.current;
}

function calculateTextureScale(
  sourceTexture: Texture,
  outputTexture: Texture
): [scaleX: number, scaleY: number] {
  const sourceAspect = sourceTexture.width / sourceTexture.height;
  const outputAspect = outputTexture.width / outputTexture.height;

  if (outputAspect > sourceAspect) {
    return [1, outputAspect / sourceAspect];
  }

  return [sourceAspect / outputAspect, 1];
}
