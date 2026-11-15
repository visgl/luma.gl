// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import type {prepareCornellAtlas} from '../lightmap-baking/cornell-scene';
import {estimateBakeTextureBytes, planBakeTiles} from '../lightmap-baking/bake-tiles';
import {IndirectLightmap} from '../lightmap-baking/indirect-lightmap';
import {makeBakingScene, type BakingScene} from '../lightmap-baking/scenes';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {
  LightmapBaker,
  createLightmapAtlas,
  type LightmapAtlas,
  ShadowMapRenderer,
  createPBRShadowModel,
  createPBRLightmapModel,
  createPBRMaterial,
  createPBRModel,
  sampleLightmapEnvironment,
  readLightmapData,
  createLightmapFromData,
  type LightmapBakeResult,
  type LightmapData
} from '@luma.gl/engine/lighting';

const SAMPLE_COUNT = 192;
type BakeLight =
  | {
      type: 'point';
      position: [number, number, number];
      attenuation: [number, number, number];
      color: [number, number, number];
    }
  | {type: 'directional'; direction: [number, number, number]; color: [number, number, number]};

/** Fixed room geometry with authored, disjoint atlas charts. */
function makeRoom(atlasHeight: number): Geometry {
  const positions: number[] = [],
    normals: number[] = [],
    coordinates: number[] = [],
    colors: number[] = [];
  function quad(corners: number[][], normal: number[], color: number[]) {
    const chart = positions.length / 18;
    const column = chart % 8,
      row = Math.floor(chart / 8);
    const padding = 2 / atlasHeight;
    const minimum = [column / 8 + padding / 2, row / 4 + padding];
    const maximum = [(column + 1) / 8 - padding / 2, (row + 1) / 4 - padding];
    const textureCoordinates = [
      [minimum[0], minimum[1]],
      [maximum[0], minimum[1]],
      [maximum[0], maximum[1]],
      [minimum[0], maximum[1]]
    ];
    for (const index of [0, 1, 2, 0, 2, 3]) {
      positions.push(...corners[index]);
      normals.push(...normal);
      coordinates.push(...textureCoordinates[index]);
      colors.push(...color, 1);
    }
  }
  quad(
    [
      [-3, 0, 2],
      [3, 0, 2],
      [3, 0, -2],
      [-3, 0, -2]
    ],
    [0, 1, 0],
    [0.7, 0.7, 0.7]
  );
  quad(
    [
      [-3, 0, -2],
      [3, 0, -2],
      [3, 3, -2],
      [-3, 3, -2]
    ],
    [0, 0, 1],
    [0.75, 0.75, 0.75]
  );
  quad(
    [
      [-3, 0, 2],
      [-3, 0, -2],
      [-3, 3, -2],
      [-3, 3, 2]
    ],
    [1, 0, 0],
    [0.75, 0.75, 0.75]
  );
  quad(
    [
      [3, 0, -2],
      [3, 0, 2],
      [3, 3, 2],
      [3, 3, -2]
    ],
    [-1, 0, 0],
    [0.75, 0.75, 0.75]
  );
  // Closed, 20 cm thick divider sections overlap the floor and back wall at their joints.
  function appendDivider(minimumDepth: number, maximumDepth: number, minimumHeight: number) {
    const left = -0.1,
      right = 0.1,
      top = 3;
    const color = [0.75, 0.75, 0.75];
    quad(
      [
        [right, minimumHeight, minimumDepth],
        [right, top, minimumDepth],
        [right, top, maximumDepth],
        [right, minimumHeight, maximumDepth]
      ],
      [1, 0, 0],
      color
    );
    quad(
      [
        [left, minimumHeight, maximumDepth],
        [left, top, maximumDepth],
        [left, top, minimumDepth],
        [left, minimumHeight, minimumDepth]
      ],
      [-1, 0, 0],
      color
    );
    quad(
      [
        [left, minimumHeight, maximumDepth],
        [right, minimumHeight, maximumDepth],
        [right, top, maximumDepth],
        [left, top, maximumDepth]
      ],
      [0, 0, 1],
      color
    );
    quad(
      [
        [right, minimumHeight, minimumDepth],
        [left, minimumHeight, minimumDepth],
        [left, top, minimumDepth],
        [right, top, minimumDepth]
      ],
      [0, 0, -1],
      color
    );
    quad(
      [
        [left, top, maximumDepth],
        [right, top, maximumDepth],
        [right, top, minimumDepth],
        [left, top, minimumDepth]
      ],
      [0, 1, 0],
      color
    );
    quad(
      [
        [left, minimumHeight, minimumDepth],
        [right, minimumHeight, minimumDepth],
        [right, minimumHeight, maximumDepth],
        [left, minimumHeight, maximumDepth]
      ],
      [0, -1, 0],
      color
    );
  }
  appendDivider(-2.02, -0.6, -0.02);
  appendDivider(0.6, 2, -0.02);
  appendDivider(-0.6, 0.6, 2);
  function box(center: number, height: number, color: number[]) {
    const left = center - 0.45,
      right = center + 0.45,
      front = 0.75,
      back = -0.15;
    quad(
      [
        [left, 0, front],
        [right, 0, front],
        [right, height, front],
        [left, height, front]
      ],
      [0, 0, 1],
      color
    );
    quad(
      [
        [right, 0, front],
        [right, 0, back],
        [right, height, back],
        [right, height, front]
      ],
      [1, 0, 0],
      color
    );
    quad(
      [
        [right, 0, back],
        [left, 0, back],
        [left, height, back],
        [right, height, back]
      ],
      [0, 0, -1],
      color
    );
    quad(
      [
        [left, 0, back],
        [left, 0, front],
        [left, height, front],
        [left, height, back]
      ],
      [-1, 0, 0],
      color
    );
    quad(
      [
        [left, height, front],
        [right, height, front],
        [right, height, back],
        [left, height, back]
      ],
      [0, 1, 0],
      color
    );
  }
  box(-1.5, 1.1, [0.85, 0.25, 0.08]);
  box(1.5, 0.7, [0.08, 0.3, 0.85]);
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array(positions)},
      NORMAL: {size: 3, value: new Float32Array(normals)},
      TEXCOORD_1: {size: 2, value: new Float32Array(coordinates)},
      COLOR_0: {size: 4, value: new Float32Array(colors)}
    }
  });
}

export class LightmapPreview {
  readonly baker: LightmapBaker;
  private readonly indirect: IndirectLightmap | null;
  private readonly white: Texture;
  private readonly bakeMaterial;
  private material;
  private readonly bakeModels;
  private readonly chartTexture: Texture;
  private readonly model;
  private readonly shadows: ShadowMapRenderer;
  private readonly casters = new Map<object, ReturnType<typeof createPBRShadowModel>>();
  private readonly geometry: Geometry;
  readonly atlas: LightmapAtlas | null;
  private result: LightmapBakeResult | null = null;
  private readonly environment = {
    width: 4,
    height: 2,
    data: new Float32Array([
      0.25, 0.3, 0.4, 0.25, 0.3, 0.4, 0.25, 0.3, 0.4, 0.25, 0.3, 0.4, 0.025, 0.025, 0.025, 0.025,
      0.025, 0.025, 0.025, 0.025, 0.025, 0.025, 0.025, 0.025
    ])
  };
  private lightIntensity = 1;
  private readonly sampleLimit: number;
  private stale = false;
  private loaded = false;
  get cancelled(): boolean {
    return this.destroyed;
  }
  readonly width: number;
  readonly height: number;
  readonly estimatedTextureBytes: number;
  private readonly tiles;
  private tileIndex = 0;
  private samplePending = false;
  private bakeError: string | null = null;
  private assembled: Texture | null;
  private destroyed = false;
  static isSupported(device: Device): boolean {
    const output = device.getTextureFormatCapabilities('rgba16float');
    return Boolean(
      output.render && output.filter && device.getTextureFormatCapabilities('rgba32float').render
    );
  }
  static estimateTextureBytes(
    width: number,
    height: number,
    resolution: 'full' | 'preview',
    cornell: boolean,
    indirect: boolean
  ): number {
    const tiled = cornell && width === 4096;
    return estimateBakeTextureBytes(
      width * height,
      tiled ? 1042 ** 2 : width * height,
      (cornell ? 2048 : resolution === 'full' ? width : 256) ** 2 * 3 +
        512 ** 2 +
        (resolution === 'full' ? width : 128) ** 2 * (cornell ? 6 : 12),
      indirect,
      tiled
    );
  }
  constructor(
    private readonly device: Device,
    resolution: 'full' | 'preview' = 'full',
    atlasMode: 'authored' | 'generated' = 'authored',
    scene: BakingScene = 'rooms',
    private readonly cornell?: ReturnType<typeof prepareCornellAtlas>,
    sampleLimit = SAMPLE_COUNT
  ) {
    this.sampleLimit = sampleLimit;
    const width =
      cornell?.atlas.width ??
      (resolution === 'full' ? (atlasMode === 'generated' ? 2048 : 1024) : 256);
    const height = cornell?.atlas.height ?? width / 2;
    this.width = width;
    this.height = height;
    this.tiles =
      cornell && width === 4096
        ? planBakeTiles(width, height, 1024, cornell.atlas.padding + 1)
        : null;
    const scratch = this.tiles?.[0].scratch ?? {x: 0, y: 0, width, height};
    this.estimatedTextureBytes = LightmapPreview.estimateTextureBytes(
      width,
      height,
      resolution,
      Boolean(cornell),
      atlasMode === 'generated' && device.type === 'webgpu'
    );
    const chartSize = width / 8;
    const source =
      cornell?.geometry ?? (scene === 'rooms' ? makeRoom(height) : makeBakingScene(scene));
    this.atlas =
      cornell?.atlas ??
      (atlasMode === 'generated'
        ? createLightmapAtlas([{id: 'room', geometry: source}], {
            width,
            height,
            texelsPerUnit: width / 64,
            padding: 2
          })
        : null);
    this.geometry = cornell?.geometry ?? this.atlas?.meshes[0].geometry ?? source;
    this.baker = new LightmapBaker(device, {width: scratch.width, height: scratch.height});
    this.assembled = this.tiles ? this.createAssembledTexture() : null;
    this.indirect =
      this.atlas && device.type === 'webgpu'
        ? new IndirectLightmap(
            device,
            this.geometry,
            cornell ? {...this.atlas, charts: cornell.drawCharts} : this.atlas,
            this.tiles ? scratch : undefined
          )
        : null;
    this.white = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([255, 255, 255, 255])
    });
    this.bakeMaterial = createPBRMaterial(device);
    this.material = createPBRMaterial(device, {
      bindings: {pbr_lightmapSampler: this.white},
      uniforms: {metallicRoughnessValues: [0, 1], lightmapUVSet: 1}
    });
    const chartCount = this.geometry.vertexCount / 6;
    const charts =
      cornell?.drawCharts ??
      this.atlas?.charts ??
      Array.from({length: chartCount}, (_, chartIndex) => ({
        id: chartIndex + 1,
        firstVertex: chartIndex * 6,
        vertexCount: 6
      }));
    this.bakeModels = charts.map(chart => {
      const model = createPBRLightmapModel(device, {
        geometry: this.geometry,
        material: this.bakeMaterial,
        receiveShadows: true,
        firstVertex: chart.firstVertex,
        vertexCount: chart.vertexCount
      });
      model.shaderInputs.setProps({lightmapBake: {chartId: chart.id}});
      return model;
    });
    const chartOwners =
      this.atlas?.chartOwners ??
      Float32Array.from({length: width * height}, (_, index) => {
        const column = Math.floor((index % width) / chartSize);
        const row = Math.floor(Math.floor(index / width) / chartSize);
        const chartIndex = row * 8 + column;
        return chartIndex < chartCount ? chartIndex + 1 : 0;
      });
    this.chartTexture = device.createTexture({
      width: scratch.width,
      height: scratch.height,
      format: 'r32float',
      data: this.tiles ? undefined : chartOwners
    });
    this.model = createPBRModel(device, {
      geometry: this.geometry,
      material: this.material,
      receiveShadows: true,
      defines: {USE_LIGHTS: true},
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
    });
    this.shadows = new ShadowMapRenderer(device, {
      quality: 'low',
      directionalMapSize: cornell ? 2048 : resolution === 'full' ? width : 256,
      spotLightCapacity: 0,
      pointLightCapacity: cornell ? 1 : 2,
      pointMapSize: resolution === 'full' ? width : 128
    });
  }
  private createAssembledTexture(): Texture {
    return this.device.createTexture({
      width: this.width,
      height: this.height,
      format: 'rgba16float',
      usage: Texture.COPY_DST | Texture.COPY_SRC | Texture.SAMPLE,
      sampler: {minFilter: 'linear', magFilter: 'linear'}
    });
  }

  private prepareTile(): void {
    const scratch = this.tiles?.[this.tileIndex]?.scratch;
    if (!scratch) return;
    const owners = new Float32Array(scratch.width * scratch.height);
    const atlas = this.atlas!;
    for (let row = 0; row < scratch.height; row++) {
      const offset = (scratch.y + row) * atlas.width + scratch.x;
      owners.set(atlas.chartOwners.subarray(offset, offset + scratch.width), row * scratch.width);
    }
    this.chartTexture.writeData(owners);
    this.indirect?.setRegion(scratch);
    for (const model of this.bakeModels) {
      model.shaderInputs.setProps({
        lightmapBake: {
          uvTransform: [
            this.width / scratch.width,
            0,
            0,
            0,
            this.height / scratch.height,
            0,
            -scratch.x / scratch.width,
            -scratch.y / scratch.height,
            1
          ]
        }
      });
    }
  }
  cancel(): void {
    this.destroy();
  }
  reset(): void {
    if (this.destroyed) return;
    this.tileIndex = 0;
    this.bakeError = null;
    if (this.assembled) {
      this.assembled.destroy();
      this.assembled = this.createAssembledTexture();
    }
    this.baker.reset();
    this.loaded = false;
    this.result?.destroy();
    this.result = null;
    this.stale = false;
  }
  changeLight(): void {
    this.lightIntensity = this.lightIntensity === 1 ? 2 : 1;
    this.stale = this.tileIndex > 0 || this.baker.sampleCount > 0 || Boolean(this.result);
  }
  get complete(): boolean {
    return (
      !this.stale &&
      (this.loaded ||
        (this.tiles
          ? this.tileIndex === this.tiles.length
          : this.baker.sampleCount === this.sampleLimit))
    );
  }
  async exportData(): Promise<LightmapData> {
    if (
      this.destroyed ||
      this.stale ||
      (this.tiles ? !this.complete : !this.result && !this.baker.sampleCount)
    )
      throw new Error('Bake the current lighting before exporting.');
    const source =
      this.result?.textures.lightmapTexture ??
      this.assembled ??
      this.baker.textures.lightmapTexture;
    // Keep an independent snapshot alive if reset, import or disposal happens during readback.
    const snapshot = this.device.createTexture({
      width: source.width,
      height: source.height,
      format: source.format,
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    try {
      this.device.commandEncoder.copyTextureToTexture({
        sourceTexture: source,
        destinationTexture: snapshot,
        width: source.width,
        height: source.height
      });
      return await readLightmapData(snapshot);
    } finally {
      snapshot.destroy();
    }
  }
  loadData(data: LightmapData): void {
    if (this.destroyed) return;
    const result = createLightmapFromData(this.device, data);
    this.result?.destroy();
    this.result = result;
    this.loaded = true;
    this.baker.reset();
    this.stale = false;
  }
  render(
    framebuffer: Framebuffer,
    mode: 'live' | 'baking' | 'baked',
    _time: number,
    eye: Readonly<NumberArray3> = [5, 4, 6]
  ): void {
    if (this.destroyed) return;
    const view = new Matrix4().lookAt({eye, center: [0, 1, 0]});
    const projection = new Matrix4().perspective({
      fovy: Math.PI / 4,
      aspect: framebuffer.width / framebuffer.height,
      near: 0.1,
      far: 40
    });
    // Soften near-light falloff in the generated scenes to suppress indirect fireflies.
    // Keep Cornell's falloff for compatibility with its saved bake.
    const attenuation: [number, number, number] =
      this.atlas && !this.cornell ? [0.25, 0, 1] : [0, 0, 1];
    const primary: BakeLight = {
      type: 'point',
      position: this.cornell ? [0, 4.5, 0] : [-1.5, 2.4, -0.6],
      attenuation,
      color: this.cornell
        ? [40 * this.lightIntensity, 40 * this.lightIntensity, 40 * this.lightIntensity]
        : [5 * this.lightIntensity, 2 * this.lightIntensity, 0.5 * this.lightIntensity]
    };
    const secondary: BakeLight = {
      type: 'point',
      position: [1.5, 2.4, -0.6],
      attenuation,
      color: this.cornell ? [0, 0, 0] : [0.5, 2, 5]
    };
    const recordShadows = (lights: BakeLight[]) =>
      this.shadows.render({
        camera: {
          viewMatrix: new Matrix4().lookAt({eye: [5, 4, 6], center: [0, 1, 0]}),
          projectionMatrix: new Matrix4().ortho({
            left: -5,
            right: 5,
            bottom: -5,
            top: 5,
            near: 0.1,
            far: 30
          }),
          near: 0.1,
          far: 30
        },
        directionalLights: lights.flatMap(light =>
          light.type === 'directional'
            ? [
                {
                  direction: [-light.direction[0], -light.direction[1], -light.direction[2]] as [
                    number,
                    number,
                    number
                  ],
                  shadowDistance: 20,
                  normalBias: 0.002,
                  depthBias: 0,
                  depthBiasSlopeScale: 0.5,
                  sourceAngularRadius: 0
                }
              ]
            : []
        ),
        pointLights: lights.flatMap(light =>
          light.type === 'point' && light.color.some(component => component > 0)
            ? [
                {
                  position: light.position,
                  range: 12,
                  normalBias: 0.002,
                  depthBias: 0,
                  depthBiasSlopeScale: 0.5,
                  sourceRadius: 0
                }
              ]
            : []
        ),
        prepareShadowCasters: target => {
          let caster = this.casters.get(target.framebuffer);
          if (!caster) {
            caster = createPBRShadowModel(this.device, {
              geometry: this.geometry,
              material: this.bakeMaterial
            });
            this.casters.set(target.framebuffer, caster);
          }
          caster.setParameters(target.rasterParameters);
          caster.shaderInputs.setProps({
            pbrProjection: {modelViewProjectionMatrix: target.viewProjectionMatrix}
          });
        },
        drawShadowCasters: target => this.casters.get(target.framebuffer)!.draw(target.renderPass)
      });
    if (
      !this.stale &&
      !this.samplePending &&
      !this.bakeError &&
      !this.complete &&
      this.baker.sampleCount < this.sampleLimit &&
      (mode === 'baking' || (mode === 'baked' && !this.result && this.baker.sampleCount === 0))
    ) {
      this.result?.destroy();
      this.result = null;
      this.loaded = false;
      const sampleIndex = this.baker.sampleCount;
      if (!sampleIndex) this.prepareTile();
      const environment = sampleLightmapEnvironment(
        this.environment,
        Math.floor(sampleIndex / 3),
        this.sampleLimit / 3
      );
      const light =
        sampleIndex % 3 === 0 ? primary : sampleIndex % 3 === 1 ? secondary : environment.light;
      this.baker.update({
        chartTexture: this.chartTexture,
        dilationSteps: this.atlas?.padding ?? 2,
        prepareSample: () => {
          this.indirect?.update([primary, secondary], sampleIndex);
          const shadow = recordShadows([light]);
          for (const model of this.bakeModels)
            model.shaderInputs.setProps({
              shadow,
              pbrShadow: {viewMatrix: new Matrix4().lookAt({eye: [5, 4, 6], center: [0, 1, 0]})},
              lighting: {
                useByteColors: false,
                lights: [
                  {...light, color: [3 * light.color[0], 3 * light.color[1], 3 * light.color[2]]}
                ]
              }
            });
        },
        drawSample: ({renderPass}) => {
          for (const model of this.bakeModels) model.draw(renderPass);
          this.indirect?.draw(renderPass);
        }
      });
      const tile = this.tiles?.[this.tileIndex];
      if (tile && this.baker.sampleCount === this.sampleLimit) {
        this.device.commandEncoder.copyTextureToTexture({
          sourceTexture: this.baker.textures.lightmapTexture,
          destinationTexture: this.assembled!,
          origin: [tile.core.x - tile.scratch.x, tile.core.y - tile.scratch.y, 0],
          destinationOrigin: [tile.core.x, tile.core.y, 0],
          width: tile.core.width,
          height: tile.core.height
        });
        this.tileIndex++;
        if (this.tileIndex < this.tiles!.length) this.baker.reset();
      }
      if (this.tiles) {
        this.device.submit();
        const fence = this.device.createFence();
        this.samplePending = true;
        void fence.signaled
          .catch(error => {
            this.bakeError = String(error);
          })
          .finally(() => {
            fence.destroy();
            this.samplePending = false;
          });
      }
    }
    const snapshot = this.baker.sampleCount > 0 && mode === 'baked' && !this.result && !this.tiles;
    if (snapshot) this.result = this.baker.createResult();
    const lightmap =
      mode === 'live'
        ? this.white
        : (this.result?.textures.lightmapTexture ??
          this.assembled ??
          this.baker.textures.lightmapTexture);
    if (this.material.getResourceBindings().pbr_lightmapSampler !== lightmap) {
      const previous = this.material;
      this.material = previous.clone({bindings: {pbr_lightmapSampler: lightmap}});
      this.model.setMaterial(this.material);
      previous.destroy();
    }
    this.material.setProps({pbrMaterial: {lightmapMapEnabled: mode !== 'live'}});
    const nativeProjection = new Matrix4(projection);
    if (this.device.type === 'webgpu')
      nativeProjection.multiplyLeft(
        new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1])
      );
    this.model.shaderInputs.setProps({
      shadow: recordShadows(
        mode === 'live' ? (this.cornell ? [primary] : [primary, secondary]) : []
      ),
      pbrShadow: {
        enabled: mode === 'live',
        viewMatrix: new Matrix4().lookAt({eye: [5, 4, 6], center: [0, 1, 0]})
      },
      pbrProjection: {modelViewProjectionMatrix: nativeProjection.multiplyRight(view), camera: eye},
      lighting: {
        useByteColors: false,
        lights:
          mode === 'live'
            ? [primary, secondary, {type: 'ambient', color: [0.1, 0.1, 0.1]}]
            : [{type: 'ambient', color: [0, 0, 0]}]
      },
      pbrScene: {toneMapMode: 2, outputEncoding: 1}
    });
    const pass = this.device.beginRenderPass({
      framebuffer,
      clearColor: [0.04, 0.04, 0.04, 1],
      clearDepth: 1
    });
    pass.setParameters({viewport: [0, 0, framebuffer.width, framebuffer.height]});
    this.model.draw(pass);
    pass.end();
    for (const label of document.querySelectorAll('[data-bake-samples]'))
      label.textContent =
        this.bakeError ??
        (this.stale
          ? 'Lighting changed — reset to rebake'
          : this.tiles && !this.loaded
            ? `Tiles: ${this.tileIndex}/${this.tiles.length} · Samples: ${this.baker.sampleCount}/${this.sampleLimit}`
            : this.result && !this.baker.sampleCount
              ? 'Loaded bake'
              : `Samples: ${this.baker.sampleCount}/${this.sampleLimit}`);
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.model.destroy();
    for (const model of this.bakeModels) model.destroy();
    this.chartTexture.destroy();
    for (const caster of this.casters.values()) caster.destroy();
    this.shadows.destroy();
    this.material.destroy();
    this.bakeMaterial.destroy();
    this.result?.destroy();
    this.indirect?.destroy();
    this.baker.destroy();
    this.assembled?.destroy();
    this.white.destroy();
  }
}
