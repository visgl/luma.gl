// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  ShaderInputs,
  SphereGeometry
} from '@luma.gl/engine';
import {
  floatColors,
  lighting,
  phongMaterial,
  type ShaderModule,
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

const GLOBE_DESCRIPTION_HTML = `\
<p>Revives the classic Earth specular demo as a modern luma.gl v9 showcase with animated oceans and a starfield backdrop.</p>
<p>Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<p style="font-size: 11px;">Sky: NASA <a href="https://science.nasa.gov/3d-resources/tycho-star-map/">Tycho Star Map</a>.</p>
`;

const SKYBOX_SHADER_WGSL = /* wgsl */ `\
struct SkyboxSceneUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> skyboxScene : SkyboxSceneUniforms;
@group(0) @binding(auto) var cubeTexture : texture_cube<f32>;
@group(0) @binding(auto) var cubeTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) direction : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.position =
    skyboxScene.projectionMatrix *
    skyboxScene.viewMatrix *
    skyboxScene.modelMatrix *
    vec4<f32>(inputs.positions, 1.0);
  outputs.direction = inputs.positions;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let skyColor = textureSample(cubeTexture, cubeTextureSampler, normalize(inputs.direction)).rgb;
  return vec4<f32>(skyColor * 1.35, 1.0);
}
`;

const SKYBOX_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 positions;

out vec3 vDirection;

uniform skyboxSceneUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} skyboxScene;

void main(void) {
  gl_Position =
    skyboxScene.projectionMatrix *
    skyboxScene.viewMatrix *
    skyboxScene.modelMatrix *
    vec4(positions, 1.0);
  vDirection = positions;
}
`;

const SKYBOX_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vDirection;

uniform samplerCube cubeTexture;

out vec4 fragColor;

void main(void) {
  vec3 skyColor = texture(cubeTexture, normalize(vDirection)).rgb;
  fragColor = vec4(skyColor * 1.35, 1.0);
}
`;

const LAND_SHADER_WGSL = /* wgsl */ `\
struct GlobeSceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  showLandTexture: i32,
};

@group(0) @binding(auto) var<uniform> globeScene : GlobeSceneUniforms;
@group(0) @binding(auto) var landTexture: texture_2d<f32>;
@group(0) @binding(auto) var landTextureSampler: sampler;
@group(0) @binding(auto) var landMaskTexture: texture_2d<f32>;
@group(0) @binding(auto) var landMaskTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition : vec3<f32>,
  @location(2) fragNormal : vec3<f32>,
  @location(3) fragLocalNormal : vec3<f32>,
  @location(4) fragLocalPosition : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let worldPosition = globeScene.modelMatrix * vec4<f32>(inputs.positions, 1.0);

  outputs.position = globeScene.viewProjectionMatrix * worldPosition;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = worldPosition.xyz;
  outputs.fragNormal = normalize((globeScene.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.fragLocalNormal = normalize(inputs.normals);
  outputs.fragLocalPosition = inputs.positions;

  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let surfaceUV = vec2<f32>(inputs.fragUV.x, 1.0 - inputs.fragUV.y);
  let landSample = textureSample(landTexture, landTextureSampler, surfaceUV).rgb;
  let landMaskSample = textureSample(landMaskTexture, landMaskTextureSampler, surfaceUV).r;
  let landMask = smoothstep(0.4, 0.6, landMaskSample);
  let textureMix = select(0.0, 1.0, globeScene.showLandTexture != 0);
  var baseColor = mix(vec3<f32>(0.74, 0.72, 0.66), landSample, textureMix);
  let normalizedNormal = normalize(inputs.fragNormal);
  let polarNormal = normalize(inputs.fragLocalNormal);
  let latitudeMask = smoothstep(0.45, 0.72, abs(polarNormal.y));
  let southPolarMask = smoothstep(0.58, 0.82, -polarNormal.y);
  let landLuminance = dot(landSample, vec3<f32>(0.2126, 0.7152, 0.0722));
  let brightIceMask = latitudeMask * smoothstep(0.68, 0.9, landLuminance);
  let iceMask = textureMix * landMask * max(brightIceMask, southPolarMask);
  baseColor = mix(baseColor, vec3<f32>(0.95, 0.97, 1.0), iceMask);
  var litColor = lighting_getLightColor2(
    baseColor,
    globeScene.cameraPosition,
    inputs.fragPosition,
    normalizedNormal
  );
  var sunVisibility = 1.0;
  let viewDirection = normalize(globeScene.cameraPosition - inputs.fragPosition);
  let iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 6.0);
  var iceHighlight = vec3<f32>(0.0, 0.0, 0.0);

  if (lighting.directionalLightCount > 0) {
    let directionalLight = lighting_getDirectionalLight(0);
    let lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    let halfVector = normalize(lightDirection + viewDirection);
    let directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += directionalLight.color * directionalSpecular * 1.6;
  }

  if (lighting.pointLightCount > 0) {
    let pointLight = lighting_getPointLight(0);
    let lightDirection = normalize(pointLight.position - inputs.fragPosition);
    let halfVector = normalize(lightDirection + viewDirection);
    let directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += pointLight.color * directionalSpecular * 0.8;
  }

  litColor += vec3<f32>(0.9, 0.96, 1.0) * iceMask * (iceRim * 0.55) + iceHighlight * iceMask;
  litColor *= mix(0.22, 1.0, sunVisibility);
  return vec4<f32>(min(litColor, vec3<f32>(1.0, 1.0, 1.0)), 1.0);
}
`;

const WATER_SHADER_WGSL = /* wgsl */ `\
struct GlobeSceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  showLandTexture: i32,
};

@group(0) @binding(auto) var<uniform> globeScene : GlobeSceneUniforms;
@group(0) @binding(auto) var waterMaskTexture: texture_2d<f32>;
@group(0) @binding(auto) var waterMaskTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition : vec3<f32>,
  @location(2) fragNormal : vec3<f32>,
  @location(3) fragLocalNormal : vec3<f32>,
  @location(4) fragLocalPosition : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let worldPosition = globeScene.modelMatrix * vec4<f32>(inputs.positions, 1.0);

  outputs.position = globeScene.viewProjectionMatrix * worldPosition;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = worldPosition.xyz;
  outputs.fragNormal = normalize((globeScene.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.fragLocalNormal = normalize(inputs.normals);
  outputs.fragLocalPosition = inputs.positions;

  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let surfaceUV = vec2<f32>(inputs.fragUV.x, 1.0 - inputs.fragUV.y);
  let landMask = textureSample(waterMaskTexture, waterMaskTextureSampler, surfaceUV).r;
  let oceanMask = smoothstep(0.4, 0.6, 1.0 - landMask);
  let normalizedNormal = normalize(inputs.fragNormal);
  let polarNormal = normalize(inputs.fragLocalNormal);
  let polarIceMask = oceanMask * smoothstep(0.8, 0.92, abs(polarNormal.y));
  let openWaterMask = max(oceanMask - polarIceMask, 0.0);
  let waterColor = water_getColorMapped(
    globeScene.cameraPosition,
    inputs.fragPosition,
    inputs.fragLocalPosition,
    normalizedNormal,
    surfaceUV
  );
  var sunVisibility = 1.0;
  let viewDirection = normalize(globeScene.cameraPosition - inputs.fragPosition);
  let iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 5.0);
  var iceHighlight = vec3<f32>(0.0, 0.0, 0.0);

  if (lighting.directionalLightCount > 0) {
    let directionalLight = lighting_getDirectionalLight(0);
    let lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    let halfVector = normalize(lightDirection + viewDirection);
    let iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += directionalLight.color * iceSpecular * 1.55;
  }

  if (lighting.pointLightCount > 0) {
    let pointLight = lighting_getPointLight(0);
    let lightDirection = normalize(pointLight.position - inputs.fragPosition);
    let halfVector = normalize(lightDirection + viewDirection);
    let iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += pointLight.color * iceSpecular * 0.8;
  }

  let iceColor = vec3<f32>(0.95, 0.98, 1.0) + vec3<f32>(0.85, 0.92, 1.0) * iceRim * 0.28 + iceHighlight;
  let finalColor =
    (waterColor.rgb * openWaterMask + min(iceColor, vec3<f32>(1.0, 1.0, 1.0)) * polarIceMask) *
    mix(0.18, 1.0, sunVisibility);
  let finalAlpha = waterColor.a * openWaterMask + 0.96 * polarIceMask;
  return vec4<f32>(finalColor, finalAlpha);
}
`;

const GLOBE_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec2 vUV;
out vec3 vPosition;
out vec3 vNormal;
out vec3 vLocalNormal;
out vec3 vLocalPosition;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
} globeScene;

void main(void) {
  vec4 worldPosition = globeScene.modelMatrix * vec4(positions, 1.0);
  gl_Position = globeScene.viewProjectionMatrix * worldPosition;
  vUV = texCoords;
  vPosition = worldPosition.xyz;
  vNormal = normalize((globeScene.normalMatrix * vec4(normals, 0.0)).xyz);
  vLocalNormal = normalize(normals);
  vLocalPosition = positions;
}
`;

const LAND_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalNormal;

uniform sampler2D landTexture;
uniform sampler2D landMaskTexture;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
} globeScene;

out vec4 fragColor;

void main(void) {
  vec2 surfaceUV = vec2(vUV.x, 1.0 - vUV.y);
  vec3 landSample = texture(landTexture, surfaceUV).rgb;
  float landMaskSample = texture(landMaskTexture, surfaceUV).r;
  float landMask = smoothstep(0.4, 0.6, landMaskSample);
  float textureMix = globeScene.showLandTexture != 0 ? 1.0 : 0.0;
  vec3 baseColor = mix(vec3(0.74, 0.72, 0.66), landSample, textureMix);
  vec3 normalizedNormal = normalize(vNormal);
  vec3 polarNormal = normalize(vLocalNormal);
  float latitudeMask = smoothstep(0.45, 0.72, abs(polarNormal.y));
  float southPolarMask = smoothstep(0.58, 0.82, -polarNormal.y);
  float landLuminance = dot(landSample, vec3(0.2126, 0.7152, 0.0722));
  float brightIceMask = latitudeMask * smoothstep(0.68, 0.9, landLuminance);
  float iceMask = textureMix * landMask * max(brightIceMask, southPolarMask);
  baseColor = mix(baseColor, vec3(0.95, 0.97, 1.0), iceMask);
  vec3 litColor = lighting_getLightColor(baseColor, globeScene.cameraPosition, vPosition, normalizedNormal);
  float sunVisibility = 1.0;
  vec3 viewDirection = normalize(globeScene.cameraPosition - vPosition);
  float iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 6.0);
  vec3 iceHighlight = vec3(0.0);

  if (lighting.directionalLightCount > 0) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(0);
    vec3 lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += directionalLight.color * directionalSpecular * 1.6;
  }

  if (lighting.pointLightCount > 0) {
    PointLight pointLight = lighting_getPointLight(0);
    vec3 lightDirection = normalize(pointLight.position - vPosition);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += pointLight.color * directionalSpecular * 0.8;
  }

  litColor += vec3(0.9, 0.96, 1.0) * iceMask * (iceRim * 0.55) + iceHighlight * iceMask;
  litColor *= mix(0.22, 1.0, sunVisibility);
  fragColor = vec4(min(litColor, vec3(1.0)), 1.0);
}
`;

const WATER_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalNormal;
in vec3 vLocalPosition;

uniform sampler2D waterMaskTexture;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
} globeScene;

out vec4 fragColor;

void main(void) {
  vec2 surfaceUV = vec2(vUV.x, 1.0 - vUV.y);
  float landMask = texture(waterMaskTexture, surfaceUV).r;
  float oceanMask = smoothstep(0.4, 0.6, 1.0 - landMask);
  vec3 normalizedNormal = normalize(vNormal);
  vec3 polarNormal = normalize(vLocalNormal);
  float polarIceMask = oceanMask * smoothstep(0.8, 0.92, abs(polarNormal.y));
  float openWaterMask = max(oceanMask - polarIceMask, 0.0);
  vec4 waterColor = water_getColorMapped(
    globeScene.cameraPosition,
    vPosition,
    vLocalPosition,
    normalizedNormal,
    surfaceUV
  );
  float sunVisibility = 1.0;
  vec3 viewDirection = normalize(globeScene.cameraPosition - vPosition);
  float iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 5.0);
  vec3 iceHighlight = vec3(0.0);

  if (lighting.directionalLightCount > 0) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(0);
    vec3 lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += directionalLight.color * iceSpecular * 1.55;
  }

  if (lighting.pointLightCount > 0) {
    PointLight pointLight = lighting_getPointLight(0);
    vec3 lightDirection = normalize(pointLight.position - vPosition);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += pointLight.color * iceSpecular * 0.8;
  }

  vec3 iceColor =
    vec3(0.95, 0.98, 1.0) +
    vec3(0.85, 0.92, 1.0) * iceRim * 0.28 +
    iceHighlight;
  vec3 finalColor =
    waterColor.rgb * openWaterMask +
    min(iceColor, vec3(1.0)) * polarIceMask;
  finalColor *= mix(0.18, 1.0, sunVisibility);
  float finalAlpha = waterColor.a * openWaterMask + 0.96 * polarIceMask;
  fragColor = vec4(finalColor, finalAlpha);
}
`;

const globeScene: ShaderModule<GlobeSceneUniforms, GlobeSceneUniforms> = {
  name: 'globeScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    modelMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    showLandTexture: 'i32'
  }
};

const skyboxScene: ShaderModule<SkyboxSceneUniforms, SkyboxSceneUniforms> = {
  name: 'skyboxScene',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

type GlobeSceneUniforms = {
  viewProjectionMatrix: Matrix4;
  modelMatrix: Matrix4;
  normalMatrix: Matrix4;
  cameraPosition: [number, number, number];
  showLandTexture: number;
};

type SkyboxSceneUniforms = {
  modelMatrix: Matrix4;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
};

type GlobeControls = {
  starBackgroundEnabled: boolean;
  waterEnabled: boolean;
  landTextureEnabled: boolean;
  waveSpeed: number;
  normalStrength: number;
  fresnelPower: number;
  specularIntensity: number;
  lightAzimuth: number;
  lightElevation: number;
};

type CleanupCallback = () => void;
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
  waterEnabled: true,
  landTextureEnabled: true,
  waveSpeed: 1.25,
  normalStrength: 0.52,
  fresnelPower: 6.2,
  specularIntensity: 2.45,
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
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  cleanupCallbacks: CleanupCallback[] = [];
  cameraAngle = 0.6;
  cameraTilt = 0.28;
  cameraDistance = 2.9;

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
    canvas.style.cursor = 'grab';

    const mouseMoveHandler = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (!mouseEvent.buttons) {
        return;
      }

      this.cameraAngle -= mouseEvent.movementX * 0.01;
      this.cameraTilt = clampNumber(
        this.cameraTilt - mouseEvent.movementY * 0.01,
        -MAX_CAMERA_TILT,
        MAX_CAMERA_TILT
      );
      canvas.style.cursor = 'grabbing';
    };

    const mouseUpHandler = () => {
      canvas.style.cursor = 'grab';
    };

    const wheelHandler = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      wheelEvent.preventDefault();

      const zoomFactor = Math.exp(clampNumber(wheelEvent.deltaY, -240, 240) * 0.0015);
      this.cameraDistance = clampNumber(
        this.cameraDistance * zoomFactor,
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE
      );
    };

    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseleave', mouseUpHandler);
    canvas.addEventListener('wheel', wheelHandler, {passive: false});

    this.cleanupCallbacks.push(() => canvas.removeEventListener('mousemove', mouseMoveHandler));
    this.cleanupCallbacks.push(() => canvas.removeEventListener('mouseup', mouseUpHandler));
    this.cleanupCallbacks.push(() => canvas.removeEventListener('mouseleave', mouseUpHandler));
    this.cleanupCallbacks.push(() =>
      canvas.removeEventListener('wheel', wheelHandler as EventListener)
    );

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
    const oceanGeometry = new SphereGeometry({radius: 1.012, nlat: 48, nlong: 72});
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

    for (const cleanupCallback of this.cleanupCallbacks) {
      cleanupCallback();
    }
    this.cleanupCallbacks = [];
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    const projectionMatrix = new Matrix4().perspective({
      fovy: Math.PI / 3.6,
      aspect,
      near: 0.1,
      far: 100
    });
    const cameraPosition = this.getCameraPosition();
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
          projectionMatrix
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
        showLandTexture: this.controls.landTextureEnabled ? 1 : 0
      },
      lighting: lightingProps
    });

    this.oceanShaderInputs.setProps({
      globeScene: {
        viewProjectionMatrix,
        modelMatrix: globeRotation,
        normalMatrix,
        cameraPosition,
        showLandTexture: this.controls.landTextureEnabled ? 1 : 0
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

  private getCameraPosition(): [number, number, number] {
    const horizontalScale = Math.cos(this.cameraTilt);
    return [
      this.cameraDistance * horizontalScale * Math.sin(this.cameraAngle),
      this.cameraDistance * Math.sin(this.cameraTilt),
      this.cameraDistance * horizontalScale * Math.cos(this.cameraAngle)
    ];
  }

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
            label: 'Specular Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
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

function clampNumber(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}
