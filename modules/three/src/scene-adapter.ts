// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, RenderPass, RenderPipelineParameters} from '@luma.gl/core';
import {
  HalfFloatType,
  NoToneMapping,
  RenderTarget,
  SRGBColorSpace,
  type Camera,
  DirectionalLight,
  PointLight,
  SpotLight,
  type LightShadow,
  type NodeBuilder,
  Vector4,
  NodeMaterial,
  type Object3D,
  type Scene
} from 'three/webgpu';
import {
  Fn,
  If,
  Discard,
  renderOutput,
  uniform,
  vec4,
  mix,
  max,
  context as createContext
} from 'three/tsl';
import {LumaRenderer} from './luma-renderer';
import {LumaBackend} from './luma-backend';

/** Null omits a disabled object; zero RGBA draws an unselectable depth occluder. */
export type ThreePickingColor = readonly [number, number, number, number];
export type ThreePickingColorAccessor = (object: Object3D) => ThreePickingColor | null;

// Three r185 normally converts color in a separate framebuffer/output pass.
// Caller-pass rendering instead uses its upstream TSL renderOutput node inline.
class SceneRenderer extends LumaRenderer {
  _getFrameBufferTarget(): null {
    return null;
  }
}

/** PBR/TSL scene integration; borrow source scene and device, own backend resources. */
export class ThreeSceneAdapter {
  readonly renderer: LumaRenderer;
  readonly device: Device;
  private readonly backend: LumaBackend;
  private readonly preparationTarget = new RenderTarget(16, 16, {type: HalfFloatType});
  private preparedScene?: Scene;
  private disposed = false;
  private readonly pickingContext = createContext();
  private readonly pickingColor = uniform(new Vector4());
  private readonly highlightingContext = createContext();
  private readonly highlightColor = uniform(new Vector4());
  private readonly getHighlightedOutput = (output: ReturnType<typeof vec4>, builder: NodeBuilder) =>
    Fn(() => {
      const color = renderOutput(output, NoToneMapping, SRGBColorSpace);
      // Match deck: composite byte-space highlight color over the final display color.
      const alpha = this.highlightColor.a.add(color.a.mul(this.highlightColor.a.oneMinus()));
      const ratio = this.highlightColor.a.div(max(alpha, 0.00001));
      // Three converts premultiplied materials back to premultiplied display-space RGB.
      // Tint straight RGB, then restore the representation expected by the blend pipeline.
      const sourceColor = builder.material?.premultipliedAlpha
        ? color.rgb.div(max(color.a, 0.00001))
        : color.rgb;
      const tintedColor = mix(sourceColor, this.highlightColor.rgb, ratio);
      const result = vec4(
        builder.material?.premultipliedAlpha ? tintedColor.mul(alpha) : tintedColor,
        alpha
      );
      // Zero-alpha surfaces and unselected materials keep their original color/depth behavior.
      return output.a
        .greaterThan(0)
        .and(this.highlightColor.a.greaterThan(0))
        .select(result, color);
    })();
  private readonly getPickingOutput = (output: ReturnType<typeof vec4>) =>
    Fn(() => {
      // Standard material alpha testing ran upstream; discard fully transparent coverage too.
      If(output.a.lessThanEqual(0), () => Discard());
      return this.pickingColor;
    })();

  constructor({device}: {device: Device}) {
    if (device.type !== 'webgpu') throw new Error('ThreeSceneAdapter requires WebGPU');
    this.device = device;
    this.renderer = new SceneRenderer({device});
    this.backend = this.renderer.backend as LumaBackend;
    this.pickingColor.onObjectUpdate(() => this.pickingColor.value);
    this.highlightColor.onObjectUpdate(() => this.highlightColor.value);
    const rendererContext = this.renderer.contextNode.value as Record<string, unknown>;
    rendererContext['getOutput'] = (output: ReturnType<typeof vec4>) =>
      this.renderer.getRenderTarget() === null
        ? renderOutput(output, NoToneMapping, SRGBColorSpace)
        : output;
  }
  async init(): Promise<void> {
    await this.renderer.init();
  }

  /** Before the caller opens its pass: upload textures, generate PMREM/shadow maps. */
  prepare(scene: Scene, camera: Camera): void {
    if (this.disposed || !this.renderer.initialized)
      throw new Error('Initialize ThreeSceneAdapter before preparing');
    const target = this.renderer.getRenderTarget();
    try {
      this.renderer.setRenderTarget(this.preparationTarget);
      this.renderer.render(scene, camera);
      this.preparedScene = scene;
    } finally {
      this.renderer.setRenderTarget(target);
    }
  }

  /** Draw the prepared scene with existing lights/materials into the caller's pass. */
  draw(scene: Scene, camera: Camera, pass: RenderPass): void {
    this.renderScene(scene, camera, pass);
  }

  /** Composite display-space RGBA highlights without changing source materials. */
  drawHighlighted(
    scene: Scene,
    camera: Camera,
    pass: RenderPass,
    getColor: ThreePickingColorAccessor
  ): void {
    this.renderScene(scene, camera, pass, undefined, undefined, getColor);
  }

  /** Draw exact ID colors through the same vertex/material coverage as the visible scene. */
  drawPicking(
    scene: Scene,
    camera: Camera,
    pass: RenderPass,
    getColor: ThreePickingColorAccessor,
    parameters?: RenderPipelineParameters
  ): void {
    this.renderScene(scene, camera, pass, getColor, parameters);
  }

  private renderScene(
    scene: Scene,
    camera: Camera,
    pass: RenderPass,
    getColor?: ThreePickingColorAccessor,
    parameters?: RenderPipelineParameters,
    getHighlightColor?: ThreePickingColorAccessor
  ): void {
    if (this.disposed || this.preparedScene !== scene)
      throw new Error('Prepare the scene before drawing in a caller pass');
    const shadows: {shadow: LightShadow; autoUpdate: boolean; needsUpdate: boolean}[] = [];
    scene.traverse(object => {
      if (
        object instanceof DirectionalLight ||
        object instanceof SpotLight ||
        object instanceof PointLight
      ) {
        const shadow = object.shadow;
        shadows.push({shadow, autoUpdate: shadow.autoUpdate, needsUpdate: shadow.needsUpdate});
        shadow.autoUpdate = false;
        shadow.needsUpdate = false;
      }
    });
    const renderObject = this.renderer.getRenderObjectFunction();
    const contextNode = this.renderer.contextNode;
    const colorContext = getColor ? this.pickingContext : this.highlightingContext;
    if (getColor || getHighlightColor) {
      colorContext.value = {
        ...(contextNode.value as Record<string, unknown>),
        getOutput: getColor ? this.getPickingOutput : this.getHighlightedOutput
      };
      this.renderer.contextNode = colorContext;
      this.renderer.setRenderObjectFunction((...parameters) => {
        const [object, , , , material] = parameters;
        const color = getColor ? getColor(object) : getHighlightColor?.(object);
        if (getColor && !color) return;
        if (material instanceof NodeMaterial && material.fragmentNode)
          throw new Error(
            'Three scene picking and highlighting do not support custom fragmentNode materials'
          );
        if (getColor) this.pickingColor.value.fromArray(color!);
        else this.highlightColor.value.fromArray(color || [0, 0, 0, 0]);
        // Isolate output variants without cloning materials.
        parameters[8] = `three-${getColor ? 'picking' : 'highlighting'}:${parameters[8] || ''}`;
        // IDs need one double-sided coverage pass, not transparent back/front shading passes.
        // Three's two-pass back-side cache uses a shared pass ID; avoid recreating it on hover.
        const forceSinglePass = material.forceSinglePass;
        if (getColor) material.forceSinglePass = true;
        try {
          if (renderObject) renderObject.call(this.renderer, ...parameters);
          else this.renderer.renderObject(...parameters);
        } finally {
          material.forceSinglePass = forceSinglePass;
        }
      });
    }
    try {
      this.backend.withRenderPass(
        pass,
        () => this.renderer.render(scene, camera),
        getColor ? {blend: false, depthWriteEnabled: true, ...parameters} : undefined
      );
    } finally {
      this.renderer.contextNode = contextNode;
      getColor = undefined;
      getHighlightColor = undefined;
      this.renderer.setRenderObjectFunction(renderObject);
      for (const {shadow, autoUpdate, needsUpdate} of shadows) {
        shadow.autoUpdate = autoUpdate;
        shadow.needsUpdate = needsUpdate;
      }
    }
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.preparationTarget.dispose();
    this.renderer.dispose();
  }
}
