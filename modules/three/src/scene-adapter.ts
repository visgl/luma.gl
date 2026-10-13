// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
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
  type Node,
  type Scene
} from 'three/webgpu';
import {renderOutput} from 'three/tsl';
import {LumaRenderer} from './luma-renderer';
import {LumaBackend} from './luma-backend';

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

  constructor({device}: {device: Device}) {
    if (device.type !== 'webgpu') throw new Error('ThreeSceneAdapter requires WebGPU');
    this.device = device;
    this.renderer = new SceneRenderer({device});
    this.backend = this.renderer.backend as LumaBackend;
    const context = this.renderer.contextNode.value as Record<string, unknown>;
    context['getOutput'] = (output: Node) =>
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
    try {
      this.backend.withRenderPass(pass, () => this.renderer.render(scene, camera));
    } finally {
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
