// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/core/types';
import {Buffer, Framebuffer, Texture} from '@luma.gl/core';
import {persistence} from '@luma.gl/engine/effects';
import {DynamicTexture} from '@luma.gl/core/dynamic';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  SphereGeometry,
  GroupNode,
  makeRandomGenerator,
  loadImageBitmap,
  BackgroundTextureModel,
  EffectRenderer
} from '@luma.gl/engine';
import {Matrix4, Vector3, radians} from '@math.gl/core/matrix';
import {PERSISTENCE_INFO_HTML} from './app-ui';
import type {LightingProps} from '@luma.gl/shaders';
import {createPBRMesh, drawPBRScene} from '../../pbr-scene';

const random = makeRandomGenerator();
const OFFSCREEN_COLOR_FORMAT = 'rgba8unorm';

const CORE_COUNT = 64;
const ELECTRON_COUNT = 64;
const camera: [number, number, number] = [0, 0, 4];
const lighting: LightingProps = {
  useByteColors: false,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.15},
    {type: 'directional', color: [1, 1, 1], direction: [-1, -1, -2], intensity: 2}
  ]
};

/* eslint-disable max-statements */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = PERSISTENCE_INFO_HTML;

  /** Background texture used for final screen compositing */
  backgroundTexture: DynamicTexture;
  backgroundTextureModel: BackgroundTextureModel;
  readonly scene: GroupNode;
  readonly nucleus: GroupNode;
  readonly electronInstances: Buffer;
  readonly nucleonInstances: Buffer;
  readonly electronPosition: NumericArray[] = [];
  readonly electronRotation: Matrix4[] = [];
  readonly electronInstanceData = new Float32Array(ELECTRON_COUNT * 16);

  mainFramebuffer: Framebuffer;
  accumulatedTextureModel: BackgroundTextureModel;
  currentSceneTextureModel: BackgroundTextureModel;
  persistenceRenderer: EffectRenderer;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.backgroundTexture = new DynamicTexture(device, {data: loadImageBitmap('background.png')});
    this.backgroundTextureModel = new BackgroundTextureModel(device, {
      backgroundTexture: this.backgroundTexture
    });

    this.electronInstances = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: this.electronInstanceData.byteLength
    });
    const nucleonInstanceData = new Float32Array(CORE_COUNT * 16);
    this.nucleonInstances = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: nucleonInstanceData.byteLength
    });
    const geometry = new SphereGeometry({nlat: 20, nlong: 30});
    const electrons = createPBRMesh(
      device,
      geometry,
      {unlit: true, baseColorFactor: [0, 0.214, 1, 1]},
      {
        instances: {buffer: this.electronInstances, count: ELECTRON_COUNT},
        colorAttachmentFormat: OFFSCREEN_COLOR_FORMAT
      }
    );
    const nucleons = createPBRMesh(
      device,
      geometry,
      {baseColorFactor: [1, 0.065, 0.065, 1], metallicRoughnessValues: [0, 0.45]},
      {
        instances: {buffer: this.nucleonInstances, count: CORE_COUNT},
        colorAttachmentFormat: OFFSCREEN_COLOR_FORMAT
      }
    );
    this.nucleus = new GroupNode({children: [nucleons]});
    this.scene = new GroupNode({children: [electrons, this.nucleus]});

    this.mainFramebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: [
        createOffscreenColorAttachment(device, 'main-framebuffer-color', width, height)
      ],
      depthStencilAttachment: 'depth24plus'
    });

    this.accumulatedTextureModel = this.createCompositeTextureModel(
      device,
      this.mainFramebuffer.colorAttachments[0].texture
    );
    this.currentSceneTextureModel = this.createCompositeTextureModel(
      device,
      this.mainFramebuffer.colorAttachments[0].texture
    );
    this.persistenceRenderer = new EffectRenderer(device, {effects: [persistence]});

    const dt = 0.0125;

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      // Place electron cloud at random positions
      const pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);

      // Push them out a bit
      const distanceFromCenter = random() + 1.0;
      pos.normalize().scale(distanceFromCenter);
      const scale = 1.25;
      pos.scale(scale);
      this.electronPosition.push(pos);

      // Get a random vector and cross
      const randomVector = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      const axis = pos.clone().cross(randomVector).normalize();

      const theta = (4 / distanceFromCenter) * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      this.electronRotation.push(rot);
      this.electronInstanceData.set(new Matrix4().scale(0.06125), i * 16);
    }

    for (let index = 0; index < CORE_COUNT; index++) {
      const position = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5)
        .normalize()
        .scale(0.5);
      nucleonInstanceData.set(new Matrix4().translate(position).scale(0.25), index * 16);
    }
    this.nucleonInstances.write(nucleonInstanceData);
  }

  onFinalize(): void {
    this.backgroundTextureModel.destroy();
    this.backgroundTexture.destroy();
    this.scene.destroy();
    this.electronInstances.destroy();
    this.nucleonInstances.destroy();

    this.mainFramebuffer.destroy();
    this.accumulatedTextureModel.destroy();
    this.currentSceneTextureModel.destroy();
    this.persistenceRenderer.destroy();
  }

  onRender({device, tick, width, height, aspect}: AnimationProps) {
    if (!this.backgroundTexture.isReady) {
      return;
    }

    this.mainFramebuffer.resize({width, height});
    this.persistenceRenderer.resize([width, height]);

    const viewMatrix = new Matrix4().lookAt({eye: camera});
    const viewProjectionMatrix = new Matrix4()
      .perspective({fovy: radians(75), aspect})
      .multiplyRight(viewMatrix);

    for (let index = 0; index < ELECTRON_COUNT; index++) {
      const position = this.electronRotation[index].transformAsVector(this.electronPosition[index]);
      this.electronPosition[index] = position;
      this.electronInstanceData.set(position, index * 16 + 12);
    }
    this.electronInstances.write(this.electronInstanceData);
    this.nucleus.setMatrixComponents({rotation: [tick * 0.013, tick * 0.021, 0]});

    const mainRenderPass = device.beginRenderPass({
      framebuffer: this.mainFramebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      clearStencil: false
    });

    drawPBRScene(this.scene, mainRenderPass, viewProjectionMatrix, camera, lighting);
    mainRenderPass.end();

    const accumulatedTexture = this.persistenceRenderer.renderToTexture({
      sourceTexture: this.mainFramebuffer.colorAttachments[0].texture
    });
    if (!accumulatedTexture) {
      return;
    }

    // Stage all fullscreen texture bindings before opening the screen render pass so WebGPU
    // does not need to update bind groups while an encoder is locked to a render pass.
    this.backgroundTextureModel.predraw(device.commandEncoder);
    this.accumulatedTextureModel.setProps({backgroundTexture: accumulatedTexture});
    this.accumulatedTextureModel.predraw(device.commandEncoder);
    this.currentSceneTextureModel.setProps({
      backgroundTexture: this.mainFramebuffer.colorAttachments[0].texture
    });
    this.currentSceneTextureModel.predraw(device.commandEncoder);

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({
      framebuffer: device
        .getDefaultCanvasContext()
        .getCurrentFramebuffer({depthStencilFormat: false}),
      clearColor: [0, 0, 0, 0]
    });
    if (this.backgroundTexture.isReady) {
      this.backgroundTextureModel.draw(screenRenderPass);
    }
    this.accumulatedTextureModel.draw(screenRenderPass);
    this.currentSceneTextureModel.draw(screenRenderPass);
    screenRenderPass.end();
  }

  /** Creates the alpha-blended fullscreen model used for persistence and live-scene overlays. */
  createCompositeTextureModel(device: AnimationProps['device'], backgroundTexture: Texture) {
    return new BackgroundTextureModel(device, {
      backgroundTexture,
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }
}

function createOffscreenColorAttachment(
  device: AnimationProps['device'],
  id: string,
  width: number,
  height: number
) {
  if (device.type !== 'webgpu') {
    return OFFSCREEN_COLOR_FORMAT;
  }

  return device.createTexture({
    id,
    format: OFFSCREEN_COLOR_FORMAT,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'none'
    }
  });
}
