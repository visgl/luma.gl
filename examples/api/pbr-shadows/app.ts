// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  SphereGeometry,
  PlaneGeometry,
  OrbitControls,
  type AnimationProps,
  type Model,
  type Geometry
} from '@luma.gl/engine';
import {
  createPBRModel,
  createPBRShadowModel,
  createPBRMaterial,
  createPBRMaterialFactory,
  ShadowMapRenderer,
  type PBRMaterial,
  type ShadowRenderView,
  type ShadowShaderProps
} from '@luma.gl/engine/lighting';
import type {Light} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml
} from '../../example-panels';
import {makeShadowPanel, makeShadowSettingsSchema} from './app-ui';

type Surface = {
  geometry: Geometry;
  material: PBRMaterial;
  model: Model;
  matrix: Matrix4;
  castsShadow: boolean;
};

export default class PBRShadowExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  readonly device: Device;
  readonly shadows: ShadowMapRenderer;
  readonly surfaces: Surface[] = [];
  readonly settings: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  private readonly casters = new Map<string, Model[]>();
  private controls: OrbitControls | null = null;
  private lightType: 'spot' | 'directional' | 'point' = 'spot';
  private receiveShadows = true;
  private animate = true;
  private normalBias = 0.025;
  private angle = 0;
  private previousTime = 0;
  private readonly resetCamera = () => {
    this.controls?.setProps({target: [0, 0.5, 0]});
    this.controls?.reset();
  };

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.shadows = new ShadowMapRenderer(device, {
      quality: 'balanced',
      directionalMapSize: 1024,
      spotMapSize: 1024,
      pointMapSize: 512
    });
    const factory = createPBRMaterialFactory(device);
    const objects: {
      geometry: Geometry;
      color: [number, number, number, number];
      matrix: Matrix4;
      metalness: number;
      castsShadow: boolean;
    }[] = [
      {
        geometry: new PlaneGeometry({type: 'x,z', flipCull: true, xlen: 14, zlen: 14}),
        color: [0.42, 0.48, 0.55, 1],
        matrix: new Matrix4(),
        metalness: 0,
        castsShadow: false
      },
      {
        geometry: new SphereGeometry({nlat: 32, nlong: 48}),
        color: [0.8, 0.25, 0.07, 1],
        matrix: new Matrix4().translate([-1.4, 1.15, 0]).scale([0.95, 0.95, 0.95]),
        metalness: 0.2,
        castsShadow: true
      },
      {
        geometry: new CubeGeometry(),
        color: [0.06, 0.3, 0.58, 1],
        matrix: new Matrix4().translate([1.4, 1.4, 0]).scale([0.8, 0.8, 0.8]),
        metalness: 0.1,
        castsShadow: true
      }
    ];
    for (const object of objects) {
      const material = createPBRMaterial(device, {
        factory,
        uniforms: {baseColorFactor: object.color, metallicRoughnessValues: [object.metalness, 0.55]}
      });
      const model = createPBRModel(device, {
        geometry: object.geometry,
        material,
        receiveShadows: true,
        defines: {USE_LIGHTS: true},
        parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'}
      });
      this.surfaces.push({
        geometry: object.geometry,
        material,
        model,
        matrix: object.matrix,
        castsShadow: object.castsShadow
      });
    }
    this.settings = new ExampleSettingsPanelManager({
      id: 'pbr-shadows-settings',
      schema: makeShadowSettingsSchema(),
      settings: {
        lightType: this.lightType,
        quality: 'balanced',
        receiveShadows: this.receiveShadows,
        animate: this.animate,
        normalBias: this.normalBias
      },
      onSettingsChange: values => {
        if (
          values.lightType === 'spot' ||
          values.lightType === 'directional' ||
          values.lightType === 'point'
        )
          this.lightType = values.lightType;
        if (typeof values.receiveShadows === 'boolean') this.receiveShadows = values.receiveShadows;
        if (typeof values.animate === 'boolean') this.animate = values.animate;
        if (typeof values.normalBias === 'number') this.normalBias = values.normalBias;
        if (
          values.quality === 'low' ||
          values.quality === 'balanced' ||
          values.quality === 'cinematic'
        )
          this.shadows.setProps({quality: values.quality});
      }
    });
    this.panels = new ExamplePanelManager({
      panel: makeShadowPanel(this.settings, device.type, this.resetCamera)
    });
    this.panels.mount();
  }

  async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement)
      this.controls = new OrbitControls(canvas, {
        target: [0, 0.5, 0],
        distance: 12,
        yaw: 0.55,
        pitch: 0.45,
        minDistance: 5,
        maxDistance: 25,
        enableRotate: true,
        enablePan: true
      });
  }

  onRender({device, aspect, time}: AnimationProps) {
    this.controls?.update(time);
    if (this.animate)
      this.angle += Math.min(0.05, Math.max(0, (time - this.previousTime) / 1000)) * 0.5;
    this.previousTime = time;
    this.surfaces[2].matrix = new Matrix4()
      .translate([1.4, 1.5 + 0.25 * Math.sin(this.angle), 0])
      .rotateY(this.angle)
      .rotateX(0.25)
      .scale([0.8, 0.8, 0.8]);
    const camera = this.controls?.getEyePosition() ?? [6, 6, 10];
    const view = new Matrix4().lookAt({
      eye: camera,
      center: this.controls?.props.target ?? [0, 0.5, 0],
      up: this.controls?.getUpDirection() ?? [0, 1, 0]
    });
    const projection = new Matrix4().perspective({fovy: Math.PI / 4, aspect, near: 0.1, far: 40});
    const position: [number, number, number] = [3, 7, 4];
    const direction: [number, number, number] = [-3, -7, -4];
    const length = Math.hypot(...direction);
    const coneDirection: [number, number, number] = [
      direction[0] / length,
      direction[1] / length,
      direction[2] / length
    ];
    const shadowOptions = {normalBias: this.normalBias, strength: 1};
    const shadowProps: ShadowShaderProps = this.shadows.render({
      camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 40},
      directionalLights:
        this.lightType === 'directional'
          ? [{...shadowOptions, direction: [3, 7, 4], shadowDistance: 25, casterDistance: 25}]
          : [],
      spotLights:
        this.lightType === 'spot'
          ? [
              {
                ...shadowOptions,
                position,
                direction: coneDirection,
                range: 25,
                outerConeAngle: 0.7,
                sourceRadius: 0.12
              }
            ]
          : [],
      pointLights:
        this.lightType === 'point'
          ? [{...shadowOptions, position, range: 25, sourceRadius: 0.12}]
          : [],
      prepareShadowCasters: lightView => this.prepareCasters(lightView),
      drawShadowCasters: lightView => {
        for (const caster of this.casters.get(this.getViewKey(lightView))!)
          caster.draw(lightView.renderPass);
      }
    });
    const lights: Light[] = [{type: 'ambient', color: [0.12, 0.14, 0.18]}];
    if (this.lightType === 'directional')
      lights.push({
        type: 'directional',
        direction: coneDirection,
        color: [1, 0.92, 0.8],
        intensity: 2
      });
    else if (this.lightType === 'spot')
      lights.push({
        type: 'spot',
        position,
        direction: coneDirection,
        outerConeAngle: 0.7,
        innerConeAngle: 0.45,
        color: [1, 0.92, 0.8],
        intensity: 2.5,
        attenuation: [1, 0, 0]
      });
    else
      lights.push({
        type: 'point',
        position,
        color: [1, 0.92, 0.8],
        intensity: 2.5,
        attenuation: [1, 0, 0]
      });
    if (device.type === 'webgpu')
      projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    const pass = device.beginRenderPass({clearColor: [0.025, 0.035, 0.055, 1], clearDepth: 1});
    for (const surface of this.surfaces) {
      surface.model.shaderInputs.setProps({
        pbrProjection: {
          modelMatrix: surface.matrix,
          normalMatrix: new Matrix4(surface.matrix).invert().transpose(),
          modelViewProjectionMatrix: new Matrix4(projection)
            .multiplyRight(view)
            .multiplyRight(surface.matrix),
          camera
        },
        lighting: {lights, useByteColors: false},
        shadow: shadowProps,
        pbrShadow: {viewMatrix: view, enabled: this.receiveShadows},
        pbrScene: {toneMapMode: 2, outputEncoding: 1}
      });
      surface.model.draw(pass);
    }
    pass.end();
  }

  private getViewKey(
    view: Pick<ShadowRenderView, 'type' | 'lightIndex' | 'cascadeIndex' | 'pointFace'>
  ): string {
    return `${view.type}-${view.lightIndex}-${view.cascadeIndex ?? view.pointFace ?? 0}`;
  }

  private prepareCasters(view: Omit<ShadowRenderView, 'renderPass'>): void {
    const key = this.getViewKey(view);
    let models = this.casters.get(key);
    const surfaces = this.surfaces.filter(surface => surface.castsShadow);
    if (!models) {
      models = surfaces.map(surface =>
        createPBRShadowModel(this.device, {geometry: surface.geometry, material: surface.material})
      );
      this.casters.set(key, models);
    }
    models.forEach((model, index) => {
      const matrix = surfaces[index].matrix;
      model.shaderInputs.setProps({
        pbrProjection: {
          modelMatrix: matrix,
          normalMatrix: new Matrix4(matrix).invert().transpose(),
          modelViewProjectionMatrix: new Matrix4(view.viewProjectionMatrix).multiplyRight(matrix),
          camera: [0, 0, 0]
        }
      });
      model.setParameters(view.rasterParameters);
    });
  }

  onFinalize() {
    this.controls?.destroy();
    this.panels.finalize();
    this.settings.finalize();
    for (const models of this.casters.values()) for (const model of models) model.destroy();
    for (const surface of this.surfaces) {
      surface.model.destroy();
      surface.material.destroy();
    }
    this.shadows.destroy();
  }
}
