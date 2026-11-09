// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {
  LightmapBaker,
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
function makeRoom(): Geometry {
  const positions: number[] = [],
    normals: number[] = [],
    coordinates: number[] = [],
    colors: number[] = [];
  function quad(corners: number[][], normal: number[], color: number[]) {
    const chart = positions.length / 18;
    const column = chart % 8,
      row = Math.floor(chart / 8);
    const padding = 2 / 128;
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
  // Two-sided partition with a 1.2-wide, 2-high doorway.
  for (const [minimumDepth, maximumDepth, minimumHeight] of [
    [-2, -0.6, 0],
    [0.6, 2, 0],
    [-0.6, 0.6, 2]
  ]) {
    const corners = [
      [0, minimumHeight, minimumDepth],
      [0, minimumHeight, maximumDepth],
      [0, 3, maximumDepth],
      [0, 3, minimumDepth]
    ];
    quad([...corners].reverse(), [1, 0, 0], [0.75, 0.75, 0.75]);
    quad(corners, [-1, 0, 0], [0.75, 0.75, 0.75]);
  }
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
  private readonly white: Texture;
  private readonly bakeMaterial;
  private material;
  private readonly bakeModel;
  private readonly model;
  private readonly shadows: ShadowMapRenderer;
  private readonly casters = new Map<object, ReturnType<typeof createPBRShadowModel>>();
  private readonly geometry = makeRoom();
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
  private stale = false;
  private destroyed = false;
  constructor(private readonly device: Device) {
    this.baker = new LightmapBaker(device, {width: 256, height: 128});
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
    this.bakeModel = createPBRLightmapModel(device, {
      geometry: this.geometry,
      material: this.bakeMaterial,
      receiveShadows: true
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
      directionalMapSize: 256,
      spotLightCapacity: 0,
      pointLightCapacity: 2,
      pointMapSize: 128
    });
  }
  reset(): void {
    this.baker.reset();
    this.result?.destroy();
    this.result = null;
    this.stale = false;
  }
  changeLight(): void {
    this.lightIntensity = this.lightIntensity === 1 ? 2 : 1;
    this.stale = this.baker.sampleCount > 0 || Boolean(this.result);
  }
  async exportData(): Promise<LightmapData> {
    if (this.destroyed || this.stale || (!this.result && !this.baker.sampleCount))
      throw new Error('Bake the current lighting before exporting.');
    const source = this.result?.textures.lightmapTexture ?? this.baker.textures.lightmapTexture;
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
    this.baker.reset();
    this.stale = false;
  }
  render(
    framebuffer: Framebuffer,
    mode: 'live' | 'baking' | 'baked',
    _time: number,
    eye: Readonly<NumberArray3> = [5, 4, 6]
  ): void {
    const view = new Matrix4().lookAt({eye, center: [0, 1, 0]});
    const projection = new Matrix4().perspective({
      fovy: Math.PI / 4,
      aspect: framebuffer.width / framebuffer.height,
      near: 0.1,
      far: 40
    });
    const primary: BakeLight = {
      type: 'point',
      position: [-1.5, 2.4, -0.6],
      attenuation: [0, 0, 1],
      color: [5 * this.lightIntensity, 2 * this.lightIntensity, 0.5 * this.lightIntensity]
    };
    const secondary: BakeLight = {
      type: 'point',
      position: [1.5, 2.4, -0.6],
      attenuation: [0, 0, 1],
      color: [0.5, 2, 5]
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
                  normalBias: 0.01,
                  sourceAngularRadius: 0
                }
              ]
            : []
        ),
        pointLights: lights.flatMap(light =>
          light.type === 'point'
            ? [{position: light.position, range: 12, normalBias: 0.01, sourceRadius: 0}]
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
      this.baker.sampleCount < SAMPLE_COUNT &&
      (mode === 'baking' || (mode === 'baked' && !this.result && this.baker.sampleCount === 0))
    ) {
      this.result?.destroy();
      this.result = null;
      const sampleIndex = this.baker.sampleCount;
      const environment = sampleLightmapEnvironment(
        this.environment,
        Math.floor(sampleIndex / 3),
        SAMPLE_COUNT / 3
      );
      const light =
        sampleIndex % 3 === 0 ? primary : sampleIndex % 3 === 1 ? secondary : environment.light;
      this.baker.update({
        prepareSample: () =>
          this.bakeModel.shaderInputs.setProps({
            shadow: recordShadows([light]),
            pbrShadow: {viewMatrix: new Matrix4().lookAt({eye: [5, 4, 6], center: [0, 1, 0]})},
            lighting: {
              useByteColors: false,
              lights: [
                {...light, color: [3 * light.color[0], 3 * light.color[1], 3 * light.color[2]]}
              ]
            }
          }),
        drawSample: ({renderPass}) => this.bakeModel.draw(renderPass)
      });
    }
    const snapshot = mode === 'baked' && !this.result;
    if (snapshot) this.result = this.baker.createResult();
    const lightmap =
      mode === 'live'
        ? this.white
        : mode === 'baked' && !snapshot
          ? this.result!.textures.lightmapTexture
          : this.baker.textures.lightmapTexture;
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
      shadow: recordShadows(mode === 'live' ? [primary, secondary] : []),
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
      label.textContent = this.stale
        ? 'Lighting changed — reset to rebake'
        : this.result && !this.baker.sampleCount
          ? 'Loaded bake'
          : `Samples: ${this.baker.sampleCount}/${SAMPLE_COUNT}`;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.model.destroy();
    this.bakeModel.destroy();
    for (const caster of this.casters.values()) caster.destroy();
    this.shadows.destroy();
    this.material.destroy();
    this.bakeMaterial.destroy();
    this.result?.destroy();
    this.baker.destroy();
    this.white.destroy();
  }
}
