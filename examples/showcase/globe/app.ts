// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  type AnimationProps,
  CubeGeometry,
  DynamicTexture,
  loadImageBitmap,
  type Material,
  MaterialFactory,
  Model,
  OrbitControls,
  ShaderInputs,
  SphereGeometry
} from '@luma.gl/engine';
import {
  floatColors,
  lighting,
  phongMaterial,
  type LightingProps,
  waterMaterial
} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import earthTextureUrl from './earth.jpg';
import earthWaterMaskUrl from './earth-specular.gif';
// NASA Tycho Star Map converted to local cube-map faces for offline example loading.
import tychoNegxUrl from './tycho-negx.jpg';
import tychoNegyUrl from './tycho-negy.jpg';
import tychoNegzUrl from './tycho-negz.jpg';
import tychoPosxUrl from './tycho-posx.jpg';
import tychoPosyUrl from './tycho-posy.jpg';
import tychoPoszUrl from './tycho-posz.jpg';

import {GLOBE_DESCRIPTION_HTML} from './app-ui';

import {
  GLOBE_SHADER_GLSL,
  globeScene,
  LAND_FRAGMENT_GLSL,
  LAND_SHADER_WGSL,
  SKYBOX_FRAGMENT_GLSL,
  SKYBOX_SHADER_GLSL,
  SKYBOX_SHADER_WGSL,
  skyboxScene,
  WATER_FRAGMENT_GLSL,
  WATER_SHADER_WGSL
} from './shaders';

type GlobeControls = {
  starBackgroundEnabled: boolean;
  hdrStarsEnabled: boolean;
  waterEnabled: boolean;
  landTextureEnabled: boolean;
  waveSpeed: number;
  normalStrength: number;
  fresnelPower: number;
  specularIntensity: number;
  oceanReflectionStrength: number;
  lightAzimuth: number;
  lightElevation: number;
};

type LandShaderInputs = {
  globeScene: typeof globeScene.props;
  lighting: typeof lighting.props;
  floatColors: typeof floatColors.props;
};
type OceanShaderInputs = {
  globeScene: typeof globeScene.props;
  lighting: typeof lighting.props;
};
type SkyboxShaderInputs = {
  skyboxScene: typeof skyboxScene.props;
};

const DEFAULT_CONTROLS: GlobeControls = {
  starBackgroundEnabled: true,
  hdrStarsEnabled: true,
  waterEnabled: true,
  landTextureEnabled: true,
  waveSpeed: 1.25,
  normalStrength: 0.52,
  fresnelPower: 6.2,
  specularIntensity: 1.8,
  oceanReflectionStrength: 0.2,
  lightAzimuth: -38,
  lightElevation: 34
};

const BASE_WAVE_A_SPEED = 0.85;
const BASE_WAVE_B_SPEED = -1.4;
const MAX_CAMERA_TILT = 1.15;
const MIN_CAMERA_DISTANCE = 1.05;
const MAX_CAMERA_DISTANCE = 9;
const EARTH_AXIAL_TILT = radians(23.44);
const EARTH_CELESTIAL_OFFSET = radians(-90);
const EARTH_ROTATION_RATE = 0.00008;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  backgroundModel: Model;
  landModel: Model;
  oceanModel: Model;
  landMaterial: Material<{phongMaterial: typeof phongMaterial.props}, {}>;
  oceanMaterial: Material<{waterMaterial: typeof waterMaterial.props}, {}>;
  backgroundShaderInputs: ShaderInputs<SkyboxShaderInputs>;
  landShaderInputs: ShaderInputs<LandShaderInputs>;
  oceanShaderInputs: ShaderInputs<OceanShaderInputs>;
  tychoSkyTexture: DynamicTexture;
  landTexture: DynamicTexture;
  waterMaskTexture: DynamicTexture;
  device: Device;
  controls: GlobeControls = {...DEFAULT_CONTROLS};
  readonly orbitControls: OrbitControls;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'globe-settings',
      schema: makeGlobeSettingsSchema(),
      settings: this.controls,
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.orbitControls = new OrbitControls(canvas, {
      yaw: 0.6,
      pitch: 0.28,
      distance: 2.9,
      minDistance: MIN_CAMERA_DISTANCE,
      maxDistance: MAX_CAMERA_DISTANCE,
      minPitch: -MAX_CAMERA_TILT,
      maxPitch: MAX_CAMERA_TILT,
      rotateSpeed: 0.01,
      zoomSpeed: 0.0015
    });

    this.tychoSkyTexture = new DynamicTexture(device, {
      dimension: 'cube',
      mipmaps: true,
      mipLevels: 'auto',
      data: (async () => ({
        '+X': await loadImageBitmap(tychoPosxUrl),
        '-X': await loadImageBitmap(tychoNegxUrl),
        '+Y': await loadImageBitmap(tychoPosyUrl),
        '-Y': await loadImageBitmap(tychoNegyUrl),
        '+Z': await loadImageBitmap(tychoPoszUrl),
        '-Z': await loadImageBitmap(tychoNegzUrl)
      }))(),
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    this.landTexture = new DynamicTexture(device, {
      data: loadImageBitmap(earthTextureUrl)
    });
    this.waterMaskTexture = new DynamicTexture(device, {
      data: loadImageBitmap(earthWaterMaskUrl)
    });

    const globeGeometry = new SphereGeometry({radius: 1, nlat: 48, nlong: 72});
    const oceanGeometry = new SphereGeometry({radius: 1.002, nlat: 48, nlong: 72});
    const landMaterialFactory = new MaterialFactory<
      {phongMaterial: typeof phongMaterial.props},
      {}
    >(device, {modules: [phongMaterial]});
    const oceanMaterialFactory = new MaterialFactory<
      {waterMaterial: typeof waterMaterial.props},
      {}
    >(device, {modules: [waterMaterial]});

    this.landMaterial = landMaterialFactory.createMaterial();
    this.landMaterial.setProps({
      phongMaterial: {
        ambient: 0.2,
        diffuse: 1,
        shininess: 18,
        specularColor: [28, 34, 40]
      }
    });

    this.oceanMaterial = oceanMaterialFactory.createMaterial();
    this.oceanMaterial.setProps({
      waterMaterial: {
        mapping: 'uv',
        baseColor: [10, 70, 128],
        fresnelColor: [232, 245, 252],
        opacity: 0.84,
        coordinateScale: [1, 6.8],
        coordinateOffset: [0, 0],
        normalStrength: this.controls.normalStrength,
        fresnelPower: this.controls.fresnelPower,
        specularIntensity: this.controls.specularIntensity,
        waveADirection: [0, -1],
        waveAFrequency: 3.8,
        waveAAmplitude: 0.024,
        waveBDirection: [0, -1],
        waveBFrequency: 11.8,
        waveBAmplitude: 0.012
      }
    });

    this.landShaderInputs = new ShaderInputs<LandShaderInputs>({
      globeScene,
      lighting,
      floatColors
    });
    this.landShaderInputs.setProps({
      floatColors: {
        useByteColors: true
      }
    });
    this.oceanShaderInputs = new ShaderInputs<OceanShaderInputs>({
      globeScene,
      lighting
    });
    this.backgroundShaderInputs = new ShaderInputs<SkyboxShaderInputs>({
      skyboxScene
    });

    this.backgroundModel = new Model(device, {
      id: 'globe-background',
      source: SKYBOX_SHADER_WGSL,
      vs: SKYBOX_SHADER_GLSL,
      fs: SKYBOX_FRAGMENT_GLSL,
      modules: [skyboxScene],
      shaderInputs: this.backgroundShaderInputs,
      geometry: new CubeGeometry({indices: true}),
      bindings: {
        cubeTexture: this.tychoSkyTexture
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        cullMode: 'front'
      }
    });

    this.landModel = new Model(device, {
      id: 'globe-land',
      source: LAND_SHADER_WGSL,
      vs: GLOBE_SHADER_GLSL,
      fs: LAND_FRAGMENT_GLSL,
      modules: [globeScene, lighting, phongMaterial],
      shaderInputs: this.landShaderInputs,
      material: this.landMaterial,
      geometry: globeGeometry,
      bindings: {
        landTexture: this.landTexture,
        landMaskTexture: this.waterMaskTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    this.oceanModel = new Model(device, {
      id: 'globe-ocean',
      source: WATER_SHADER_WGSL,
      vs: GLOBE_SHADER_GLSL,
      fs: WATER_FRAGMENT_GLSL,
      modules: [globeScene, lighting, waterMaterial],
      shaderInputs: this.oceanShaderInputs,
      material: this.oceanMaterial,
      geometry: oceanGeometry,
      bindings: {
        waterMaskTexture: this.waterMaskTexture
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha',
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
  }

  override onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.backgroundModel.destroy();
    this.landModel.destroy();
    this.oceanModel.destroy();
    this.tychoSkyTexture.destroy();
    this.landMaterial.destroy();
    this.oceanMaterial.destroy();
    this.landTexture.destroy();
    this.waterMaskTexture.destroy();
    this.orbitControls.destroy();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    this.orbitControls.update(time);
    const projectionMatrix = new Matrix4().perspective({
      fovy: Math.PI / 3.6,
      aspect,
      near: 0.1,
      far: 100
    });
    const cameraPosition = this.orbitControls.getEyePosition();
    const viewMatrix = new Matrix4().lookAt({eye: cameraPosition, center: [0, 0, 0]});
    const skyboxViewMatrix = new Matrix4(viewMatrix);
    skyboxViewMatrix[12] = 0;
    skyboxViewMatrix[13] = 0;
    skyboxViewMatrix[14] = 0;

    const renderPass = device.beginRenderPass({
      clearColor: this.getClearColor(),
      clearDepth: 1
    });

    if (this.controls.starBackgroundEnabled) {
      this.backgroundShaderInputs.setProps({
        skyboxScene: {
          modelMatrix: new Matrix4().scale([40, 40, 40]),
          viewMatrix: skyboxViewMatrix,
          projectionMatrix,
          hdrStarsEnabled: this.controls.hdrStarsEnabled ? 1 : 0
        }
      });
      this.backgroundModel.draw(renderPass);
    }

    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const globeRotation = new Matrix4()
      .rotateZ(EARTH_AXIAL_TILT)
      .rotateY(EARTH_CELESTIAL_OFFSET + time * EARTH_ROTATION_RATE);
    const normalMatrix = new Matrix4(globeRotation).invert().transpose();
    const lightingProps = this.getLightingProps();

    this.landShaderInputs.setProps({
      globeScene: {
        viewProjectionMatrix,
        modelMatrix: globeRotation,
        normalMatrix,
        cameraPosition,
        showLandTexture: this.controls.landTextureEnabled ? 1 : 0,
        oceanReflectionStrength: this.controls.oceanReflectionStrength
      },
      lighting: lightingProps
    });

    this.oceanShaderInputs.setProps({
      globeScene: {
        viewProjectionMatrix,
        modelMatrix: globeRotation,
        normalMatrix,
        cameraPosition,
        showLandTexture: this.controls.landTextureEnabled ? 1 : 0,
        oceanReflectionStrength: this.controls.oceanReflectionStrength
      },
      lighting: lightingProps
    });

    this.oceanMaterial.setProps({
      waterMaterial: {
        time: time / 1000,
        normalStrength: this.controls.normalStrength,
        fresnelPower: this.controls.fresnelPower,
        specularIntensity: this.controls.specularIntensity,
        waveASpeed: BASE_WAVE_A_SPEED * this.controls.waveSpeed,
        waveBSpeed: BASE_WAVE_B_SPEED * this.controls.waveSpeed
      }
    });

    this.landModel.draw(renderPass);
    if (this.controls.waterEnabled) {
      this.oceanModel.draw(renderPass);
    }

    renderPass.end();
  }

  private getClearColor(): [number, number, number, number] {
    return [0.01, 0.03, 0.06, 1];
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'globe-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'globe-description',
          title: '',
          html: GLOBE_DESCRIPTION_HTML
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    for (const settingName of Object.keys(this.controls) as (keyof GlobeControls)[]) {
      const nextValue = getChangedSetting(changedSettings, settingName)?.nextValue;
      if (typeof nextValue === 'boolean' || typeof nextValue === 'number') {
        this.controls[settingName] = nextValue as GlobeControls[typeof settingName];
      }
    }
  };

  private getLightingProps(): LightingProps {
    const lightDirection = getDirectionalLightDirection(
      this.controls.lightAzimuth,
      this.controls.lightElevation
    );

    return {
      lights: [
        {type: 'ambient', color: [255, 255, 255], intensity: 0.26},
        {
          type: 'directional',
          color: [255, 250, 244],
          intensity: 1.3,
          direction: lightDirection
        },
        {
          type: 'directional',
          color: [152, 198, 255],
          intensity: 0.35,
          direction: normalizeDirection3([
            -lightDirection[0] * 0.6,
            -0.35,
            -lightDirection[2] * 0.6
          ])
        }
      ]
    };
  }
}

function makeGlobeSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'layers',
        name: 'Layers',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'starBackgroundEnabled',
            label: 'Sky Background',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'hdrStarsEnabled',
            label: 'HDR Stars',
            type: 'boolean',
            persist: 'none'
          },
          {name: 'waterEnabled', label: 'Water Overlay', type: 'boolean', persist: 'none'},
          {name: 'landTextureEnabled', label: 'Land Texture', type: 'boolean', persist: 'none'}
        ]
      },
      {
        id: 'water',
        name: 'Water',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'waveSpeed',
            label: 'Wave Speed',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 4,
            step: 0.01
          },
          {
            name: 'normalStrength',
            label: 'Normal Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.01
          },
          {
            name: 'fresnelPower',
            label: 'Fresnel Power',
            type: 'number',
            persist: 'none',
            min: 1,
            max: 12,
            step: 0.1
          },
          {
            name: 'specularIntensity',
            label: 'Base Specular',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
            step: 0.05
          },
          {
            name: 'oceanReflectionStrength',
            label: 'HDR Reflection Boost',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          }
        ]
      },
      {
        id: 'light',
        name: 'Light',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'lightAzimuth',
            label: 'Light Azimuth',
            type: 'number',
            persist: 'none',
            min: -180,
            max: 180,
            step: 1
          },
          {
            name: 'lightElevation',
            label: 'Light Elevation',
            type: 'number',
            persist: 'none',
            min: 5,
            max: 85,
            step: 1
          }
        ]
      }
    ]
  };
}

function getDirectionalLightDirection(
  azimuthDegrees: number,
  elevationDegrees: number
): [number, number, number] {
  const azimuth = radians(azimuthDegrees);
  const elevation = radians(elevationDegrees);
  const x = Math.cos(elevation) * Math.sin(azimuth);
  const y = Math.sin(elevation);
  const z = Math.cos(elevation) * Math.cos(azimuth);

  return [-x, -y, -z];
}

function normalizeDirection3(direction: [number, number, number]): [number, number, number] {
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  if (length === 0) {
    return [0, -1, 0];
  }

  return [direction[0] / length, direction[1] / length, direction[2] / length];
}
