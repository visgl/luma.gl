// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  IcoSphereGeometry,
  Model,
  OrbitControls,
  ShaderInputs,
  ShaderPassRenderer,
  TruncatedConeGeometry,
  type AnimationProps
} from '@luma.gl/engine';
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import {
  spectralCaustics,
  SpectralCausticsRenderer,
  type SpectralCausticsProps
} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 80;
const CRYSTAL_CENTER: NumberArray3 = [0, 3.55, 0];
const CRYSTAL_SCALE: NumberArray3 = [1.45, 2.05, 1.45];
const LIGHT_POSITION: NumberArray3 = [0, 10.5, -4];
const RECEIVER_ORIGIN: NumberArray3 = [0, 0, 0];
const RECEIVER_TANGENT: NumberArray3 = [1, 0, 0];
const RECEIVER_BITANGENT: NumberArray3 = [0, 0, 1];
const RECEIVER_NORMAL: NumberArray3 = [0, 1, 0];
const RECEIVER_WIDTH = 20;
const RECEIVER_HEIGHT = 28;
const CAMERA_TARGET: NumberArray3 = [0, 2.15, -0.85];
const CAMERA_MINIMUM_YAW = -0.38;
const CAMERA_MAXIMUM_YAW = 0.38;
const CAMERA_MINIMUM_PITCH = 0.06;
const CAMERA_MAXIMUM_PITCH = 0.42;
const CAMERA_MINIMUM_DISTANCE = 10.5;
const CAMERA_MAXIMUM_DISTANCE = 18;
const CAMERA_CINEMATIC_YAW_CENTER = (CAMERA_MINIMUM_YAW + CAMERA_MAXIMUM_YAW) * 0.5;
const CAMERA_CINEMATIC_YAW_AMPLITUDE = (CAMERA_MAXIMUM_YAW - CAMERA_MINIMUM_YAW) * 0.5;
const CAMERA_CINEMATIC_PHASE_SPEED = 0.3;

type SceneUniforms = {
  viewProjectionMatrix: Matrix4;
  cameraPosition: NumberArray3;
  lightPosition: NumberArray3;
  time: number;
};

type CrystalUniforms = {
  rotationMatrix: Matrix4;
  center: NumberArray3;
  scale: NumberArray3;
};

type CaptureUniforms = {
  lightViewProjectionMatrix: Matrix4;
};

type ArchitectureBuffers = {
  positions: Buffer;
  scales: Buffer;
  baseColors: Buffer;
  emissiveColors: Buffer;
};

type SceneTarget = {
  width: number;
  height: number;
  colorTexture: Texture;
  depthTexture: Texture;
  framebuffer: Framebuffer;
};

/** Optional low-resolution overrides used by WebGPU smoke tests. */
export type SpectralCausticsExampleProps = AnimationProps & {
  captureSize?: number;
  mapSize?: number;
};

const sceneUniforms: ShaderModule<SceneUniforms> = {
  name: 'prismCathedralScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    lightPosition: 'vec3<f32>',
    time: 'f32'
  }
};

const crystalUniforms: ShaderModule<CrystalUniforms> = {
  name: 'prismCathedralCrystal',
  uniformTypes: {
    rotationMatrix: 'mat4x4<f32>',
    center: 'vec3<f32>',
    scale: 'vec3<f32>'
  }
};

const captureUniforms: ShaderModule<CaptureUniforms> = {
  name: 'prismCathedralCapture',
  uniformTypes: {lightViewProjectionMatrix: 'mat4x4<f32>'}
};

const ARCHITECTURE_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceScales: vec3f,
  @location(4) instanceBaseColors: vec3f,
  @location(5) instanceEmissiveColors: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) baseColor: vec3f,
  @location(3) emissiveColor: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions;
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize(inputs.normals / max(inputs.instanceScales, vec3f(0.0001)));
  output.baseColor = inputs.instanceBaseColors;
  output.emissiveColor = inputs.instanceEmissiveColors;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let lightOffset = prismCathedralScene.lightPosition - inputs.worldPosition;
  let lightDistance = length(lightOffset);
  let lightDirection = lightOffset / max(lightDistance, 0.0001);
  let direct = max(dot(normal, lightDirection), 0.0) * 3.2 / (1.0 + lightDistance * 0.18);
  let upwardFill = max(normal.y, 0.0) * 0.045;
  let edge = pow(1.0 - abs(dot(normalize(prismCathedralScene.cameraPosition - inputs.worldPosition), normal)), 3.0);
  let stone = inputs.baseColor * (0.035 + upwardFill + direct);
  let coldEdge = vec3f(0.04, 0.09, 0.18) * edge;
  return vec4f(stone + coldEdge + inputs.emissiveColor, 1.0);
}
`;

const RECEIVER_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * vec3f(10.0, 0.12, 14.0) + vec3f(0.0, -0.12, 0.0);
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize(inputs.normals / vec3f(10.0, 0.12, 14.0));
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let groutX = 1.0 - smoothstep(0.018, 0.055, abs(fract(inputs.worldPosition.x * 0.5 + 0.5) - 0.5));
  let groutZ = 1.0 - smoothstep(0.018, 0.055, abs(fract(inputs.worldPosition.z * 0.5 + 0.5) - 0.5));
  let tileLine = max(groutX, groutZ);
  let stone = mix(vec3f(0.013, 0.018, 0.03), vec3f(0.032, 0.038, 0.055), tileLine * 0.45);
  let caustic = spectralCaustics_getLinearSRGB(inputs.worldPosition);
  let grazing = pow(1.0 - max(dot(normalize(prismCathedralScene.cameraPosition - inputs.worldPosition), normal), 0.0), 4.0);
  let horizon = vec3f(0.018, 0.026, 0.05) * grazing;
  return vec4f(stone + horizon + caustic * 1.1, 1.0);
}
`;

const CRYSTAL_CAPTURE_SHADER = /* wgsl */ `\
struct PrismCathedralCrystalUniforms {
  rotationMatrix: mat4x4f,
  center: vec3f,
  scale: vec3f,
};
struct PrismCathedralCaptureUniforms {
  lightViewProjectionMatrix: mat4x4f,
};
@group(0) @binding(auto) var<uniform> prismCathedralCrystal: PrismCathedralCrystalUniforms;
@group(0) @binding(auto) var<uniform> prismCathedralCapture: PrismCathedralCaptureUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldNormal: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rotatedPosition = (prismCathedralCrystal.rotationMatrix * vec4f(inputs.positions * prismCathedralCrystal.scale, 0.0)).xyz;
  let worldPosition = rotatedPosition + prismCathedralCrystal.center;
  let localNormal = inputs.normals / max(prismCathedralCrystal.scale, vec3f(0.0001));
  var output: FragmentInputs;
  output.position = prismCathedralCapture.lightViewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldNormal = normalize((prismCathedralCrystal.rotationMatrix * vec4f(localNormal, 0.0)).xyz);
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  return vec4f(normalize(inputs.worldNormal) * 0.5 + 0.5, 1.0);
}
`;

const CRYSTAL_BEAUTY_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
struct PrismCathedralCrystalUniforms {
  rotationMatrix: mat4x4f,
  center: vec3f,
  scale: vec3f,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;
@group(0) @binding(auto) var<uniform> prismCathedralCrystal: PrismCathedralCrystalUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) localPosition: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rotatedPosition = (prismCathedralCrystal.rotationMatrix * vec4f(inputs.positions * prismCathedralCrystal.scale, 0.0)).xyz;
  let worldPosition = rotatedPosition + prismCathedralCrystal.center;
  let localNormal = inputs.normals / max(prismCathedralCrystal.scale, vec3f(0.0001));
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize((prismCathedralCrystal.rotationMatrix * vec4f(localNormal, 0.0)).xyz);
  output.localPosition = inputs.positions;
  return output;
}

fn spectralFacetColor(value: f32) -> vec3f {
  let red = smoothstep(0.38, 0.72, value) * (1.0 - smoothstep(0.82, 1.0, value));
  let green = smoothstep(0.14, 0.48, value) * (1.0 - smoothstep(0.68, 0.93, value));
  let blue = (1.0 - smoothstep(0.42, 0.75, value)) + smoothstep(0.86, 1.0, value) * 0.3;
  return vec3f(red, green, blue);
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let viewDirection = normalize(prismCathedralScene.cameraPosition - inputs.worldPosition);
  let lightDirection = normalize(prismCathedralScene.lightPosition - inputs.worldPosition);
  let fresnel = pow(1.0 - abs(dot(viewDirection, normal)), 3.0);
  let reflectedLight = reflect(-lightDirection, normal);
  let glint = pow(max(dot(reflectedLight, viewDirection), 0.0), 42.0);
  let facetPhase = fract(dot(abs(normal), vec3f(0.19, 0.37, 0.53)) + prismCathedralScene.time * 0.018);
  let spectrum = spectralFacetColor(facetPhase);
  let core = vec3f(0.008, 0.025, 0.055);
  let rim = mix(vec3f(0.08, 0.46, 1.2), spectrum * 2.7, 0.58) * (0.15 + fresnel * 1.85);
  let highlight = vec3f(8.5, 6.2, 3.8) * glint;
  let internalFlash = spectrum * pow(max(1.0 - length(inputs.localPosition) * 0.68, 0.0), 4.0) * 0.55;
  return vec4f(core + rim + highlight + internalFlash, 0.78);
}
`;

const LIGHT_BEAM_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
};
struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) beamHeight: f32,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let beamCosine = 0.8668;
  let beamSine = 0.4987;
  let rotatedPosition = vec3f(
    inputs.positions.x,
    inputs.positions.y * beamCosine + inputs.positions.z * beamSine,
    -inputs.positions.y * beamSine + inputs.positions.z * beamCosine
  );
  let worldPosition = rotatedPosition + vec3f(0.0, 7.025, -2.0);
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.beamHeight = inputs.positions.y / 8.02 + 0.5;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normalizedHeight = clamp(inputs.beamHeight, 0.0, 1.0);
  let pulse = 0.82 + sin(prismCathedralScene.time * 0.7) * 0.08;
  let color = mix(vec3f(0.045, 0.08, 0.16), vec3f(0.35, 0.24, 0.09), normalizedHeight);
  return vec4f(color * pulse, 0.055 + normalizedHeight * 0.035);
}
`;

const INFO_HTML = `
<style>
  .prism-cathedral-info { font: 13px/1.45 system-ui, sans-serif; }
  .prism-cathedral-info p { margin: 0; color: inherit; opacity: .82; }
  .prism-cathedral-info .prism-cathedral-controls { margin-top: 9px; color: #d8e8ff; }
  .prism-cathedral-info strong { color: #fff3c4; font-weight: 600; }
  .prism-cathedral-badges { display: flex; gap: 7px; margin-top: 12px; flex-wrap: wrap; }
  .prism-cathedral-badge { padding: 4px 7px; border: 1px solid rgb(120 186 255 / 24%); border-radius: 99px; color: #dcecff; background: rgb(30 72 120 / 18%); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
</style>
<section class="prism-cathedral-info">
  <p>A rotating convex crystal is captured from the light, then <strong>six CIE/D65 wavelength bands</strong> refract through its real front and back surfaces into an HDR XYZ caustic map.</p>
  <p class="prism-cathedral-controls"><strong>Drag</strong> to orbit · <strong>Wheel</strong> to zoom · <strong>Space</strong> for cinematic orbit · <strong>R</strong> to reset</p>
  <div class="prism-cathedral-badges"><span class="prism-cathedral-badge">WebGPU compute</span><span class="prism-cathedral-badge">Geometry traced</span><span class="prism-cathedral-badge">HDR bloom</span></div>
</section>`;

class ArchitectureModel {
  readonly model: Model;
  readonly buffers: ArchitectureBuffers;

  constructor(device: Device) {
    const instances = makeArchitectureInstances();
    this.buffers = {
      positions: device.createBuffer(instances.positions),
      scales: device.createBuffer(instances.scales),
      baseColors: device.createBuffer(instances.baseColors),
      emissiveColors: device.createBuffer(instances.emissiveColors)
    };
    this.model = new Model(device, {
      id: 'prism-cathedral-architecture',
      source: ARCHITECTURE_SHADER,
      geometry: new CubeGeometry({indices: true}),
      instanceCount: instances.instanceCount,
      shaderInputs: new ShaderInputs({prismCathedralScene: sceneUniforms}),
      bufferLayout: [
        {name: 'instancePositions', format: 'float32x3'},
        {name: 'instanceScales', format: 'float32x3'},
        {name: 'instanceBaseColors', format: 'float32x3'},
        {name: 'instanceEmissiveColors', format: 'float32x3'}
      ],
      attributes: {
        instancePositions: this.buffers.positions,
        instanceScales: this.buffers.scales,
        instanceBaseColors: this.buffers.baseColors,
        instanceEmissiveColors: this.buffers.emissiveColors
      },
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {cullMode: 'back', depthWriteEnabled: true, depthCompare: 'less-equal'}
    });
  }

  setSceneUniforms(uniforms: SceneUniforms): void {
    this.model.shaderInputs.setProps({prismCathedralScene: uniforms});
  }

  destroy(): void {
    this.model.destroy();
    for (const buffer of Object.values(this.buffers)) {
      buffer.destroy();
    }
  }
}

/** Geometry-derived spectral light transport staged as an HDR cathedral installation. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  readonly device: Device;
  readonly spectralRenderer: SpectralCausticsRenderer;
  readonly captureModel: Model;
  readonly crystalModel: Model;
  readonly receiverModel: Model;
  readonly architecture: ArchitectureModel;
  readonly lightBeamModel: Model;
  readonly postprocessingRenderer: ShaderPassRenderer;
  orbitControls: OrbitControls | null = null;
  sceneTarget: SceneTarget;

  private cinematicCamera = true;
  private cinematicYawPhase = Math.asin(
    (0.11 - CAMERA_CINEMATIC_YAW_CENTER) / CAMERA_CINEMATIC_YAW_AMPLITUDE
  );
  private previousCameraTimeMilliseconds: number | null = null;

  constructor({
    device,
    width,
    height,
    captureSize = 192,
    mapSize = 512
  }: SpectralCausticsExampleProps) {
    super();
    this.device = device;
    this.spectralRenderer = new SpectralCausticsRenderer(device, {
      id: 'prism-cathedral-spectral-caustics',
      captureSize,
      mapSize,
      splatRadius: 8.5
    });
    const crystalGeometry = new IcoSphereGeometry({radius: 1, iterations: 1});
    this.captureModel = new Model(device, {
      id: 'prism-cathedral-crystal-capture',
      source: CRYSTAL_CAPTURE_SHADER,
      geometry: crystalGeometry,
      shaderInputs: new ShaderInputs({
        prismCathedralCrystal: crystalUniforms,
        prismCathedralCapture: captureUniforms
      }),
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth32float'
    });
    this.crystalModel = new Model(device, {
      id: 'prism-cathedral-crystal-beauty',
      source: CRYSTAL_BEAUTY_SHADER,
      geometry: crystalGeometry,
      shaderInputs: new ShaderInputs({
        prismCathedralScene: sceneUniforms,
        prismCathedralCrystal: crystalUniforms
      }),
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        cullMode: 'back',
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.receiverModel = new Model(device, {
      id: 'prism-cathedral-receiver',
      source: RECEIVER_SHADER,
      geometry: new CubeGeometry({indices: true}),
      shaderInputs: new ShaderInputs({prismCathedralScene: sceneUniforms, spectralCaustics}),
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {cullMode: 'back', depthWriteEnabled: true, depthCompare: 'less-equal'}
    });
    this.architecture = new ArchitectureModel(device);
    this.lightBeamModel = new Model(device, {
      id: 'prism-cathedral-light-beam',
      source: LIGHT_BEAM_SHADER,
      geometry: new TruncatedConeGeometry({
        height: 8.02,
        bottomRadius: 1.7,
        topRadius: 0.18,
        nradial: 32,
        nvertical: 1
      }),
      shaderInputs: new ShaderInputs({prismCathedralScene: sceneUniforms}),
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        cullMode: 'none',
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one'
      }
    });
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({colorFormat: 'rgba16float', resolutionScale: 0.72}),
        toneMapping
      ],
      colorFormat: 'rgba16float'
    });
    this.sceneTarget = createSceneTarget(device, width, height);
  }

  /** Exposes the floating-point beauty target for focused WebGPU readback tests. */
  get sceneColorTexture(): Texture {
    return this.sceneTarget.colorTexture;
  }

  /** Exposes the additive CIE XYZ map without weakening its renderer ownership. */
  get spectralCausticMap(): Texture {
    return this.spectralRenderer.causticMap;
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        target: CAMERA_TARGET,
        distance: 15.8,
        yaw: 0.11,
        pitch: 0.15,
        minDistance: CAMERA_MINIMUM_DISTANCE,
        maxDistance: CAMERA_MAXIMUM_DISTANCE,
        minPitch: CAMERA_MINIMUM_PITCH,
        maxPitch: CAMERA_MAXIMUM_PITCH,
        rotateSpeed: 0.005,
        zoomSpeed: 0.0012,
        autoRotate: false,
        onInteractionStart: this.handleManualNavigation
      });
      globalThis.addEventListener('keydown', this.handleCameraKeyDown);
    }
  }

  onFinalize(): void {
    globalThis.removeEventListener('keydown', this.handleCameraKeyDown);
    this.orbitControls?.destroy();
    this.spectralRenderer.destroy();
    this.captureModel.destroy();
    this.crystalModel.destroy();
    this.receiverModel.destroy();
    this.architecture.destroy();
    this.lightBeamModel.destroy();
    this.postprocessingRenderer.destroy();
    destroySceneTarget(this.sceneTarget);
  }

  onRender({device, width, height, aspect, time: timeMilliseconds}: AnimationProps): void {
    if (width !== this.sceneTarget.width || height !== this.sceneTarget.height) {
      destroySceneTarget(this.sceneTarget);
      this.sceneTarget = createSceneTarget(device, width, height);
      this.postprocessingRenderer.resize([width, height]);
    }

    const timeSeconds = timeMilliseconds / 1000;
    const crystalRotation = new Matrix4()
      .rotateY(timeSeconds * 0.34)
      .rotateZ(Math.sin(timeSeconds * 0.52) * 0.16)
      .rotateX(-0.16 + Math.cos(timeSeconds * 0.38) * 0.08);
    const crystalProps: CrystalUniforms = {
      rotationMatrix: crystalRotation,
      center: CRYSTAL_CENTER,
      scale: CRYSTAL_SCALE
    };
    const lightViewMatrix = new Matrix4().lookAt({
      eye: LIGHT_POSITION,
      center: CRYSTAL_CENTER,
      up: [0, 0, -1]
    });
    const lightProjectionMatrix = makeWebGPUOrthographicProjection(2.6, 0.1, 20);
    const lightViewProjectionMatrix = new Matrix4(lightProjectionMatrix).multiplyRight(
      lightViewMatrix
    );
    const inverseLightViewProjectionMatrix = new Matrix4(lightViewProjectionMatrix).invert();

    this.captureModel.shaderInputs.setProps({
      prismCathedralCrystal: crystalProps,
      prismCathedralCapture: {lightViewProjectionMatrix}
    });
    const spectralProps = this.spectralRenderer.encode(device.commandEncoder, {
      lightViewProjectionMatrix,
      inverseLightViewProjectionMatrix,
      receiverOrigin: RECEIVER_ORIGIN,
      receiverTangent: RECEIVER_TANGENT,
      receiverBitangent: RECEIVER_BITANGENT,
      receiverNormal: RECEIVER_NORMAL,
      receiverWidth: RECEIVER_WIDTH,
      receiverHeight: RECEIVER_HEIGHT,
      refractiveIndex: 1.52,
      dispersion: 0.055,
      absorption: [0.025, 0.012, 0.018],
      intensity: 4.8,
      prepareRefractor: ({commandEncoder, captureParameters}) => {
        this.captureModel.setParameters(captureParameters);
        this.captureModel.predraw(commandEncoder);
      },
      drawRefractor: ({renderPass}) => this.captureModel.draw(renderPass)
    });

    this.updateCamera(timeMilliseconds);
    const cameraPosition: NumberArray3 = this.orbitControls?.getEyePosition() || [1.75, 4.45, 14];
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: CAMERA_TARGET,
      up: [0, 1, 0]
    });
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(47),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const sceneProps: SceneUniforms = {
      viewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix),
      cameraPosition,
      lightPosition: LIGHT_POSITION,
      time: timeSeconds
    };
    this.setSceneUniforms(sceneProps, crystalProps, spectralProps);
    this.prepareSceneModels(device);

    const renderPass = device.beginRenderPass({
      id: 'prism-cathedral-scene-pass',
      framebuffer: this.sceneTarget.framebuffer,
      clearColor: [0.0015, 0.003, 0.009, 1],
      clearDepth: 1
    });
    this.receiverModel.draw(renderPass);
    this.architecture.model.draw(renderPass);
    this.lightBeamModel.draw(renderPass);
    this.crystalModel.draw(renderPass);
    renderPass.end();

    this.postprocessingRenderer.renderToScreen({
      sourceTexture: this.sceneTarget.colorTexture,
      uniforms: {
        bloomExtract: {threshold: 0.62},
        bloomBlur: {radius: 9},
        bloomComposite: {intensity: 1.02},
        toneMapping: {
          exposure: 0.94,
          maximumLuminance: device.preferredColorFormat === 'rgba16float' ? 3.6 : 1
        }
      }
    });
  }

  private setSceneUniforms(
    sceneProps: SceneUniforms,
    crystalProps: CrystalUniforms,
    spectralProps: SpectralCausticsProps
  ): void {
    this.architecture.setSceneUniforms(sceneProps);
    this.receiverModel.shaderInputs.setProps({
      prismCathedralScene: sceneProps,
      spectralCaustics: spectralProps
    });
    this.lightBeamModel.shaderInputs.setProps({prismCathedralScene: sceneProps});
    this.crystalModel.shaderInputs.setProps({
      prismCathedralScene: sceneProps,
      prismCathedralCrystal: crystalProps
    });
  }

  private prepareSceneModels(device: Device): void {
    this.receiverModel.predraw(device.commandEncoder);
    this.architecture.model.predraw(device.commandEncoder);
    this.lightBeamModel.predraw(device.commandEncoder);
    this.crystalModel.predraw(device.commandEncoder);
  }

  private updateCamera(timeMilliseconds: number): void {
    const orbitControls = this.orbitControls;
    if (!orbitControls) {
      return;
    }
    orbitControls.update(timeMilliseconds);
    const deltaSeconds =
      this.previousCameraTimeMilliseconds === null
        ? 0
        : Math.min(Math.max(timeMilliseconds - this.previousCameraTimeMilliseconds, 0) / 1000, 0.1);
    this.previousCameraTimeMilliseconds = timeMilliseconds;
    if (this.cinematicCamera) {
      this.cinematicYawPhase += deltaSeconds * CAMERA_CINEMATIC_PHASE_SPEED;
      orbitControls.yaw =
        CAMERA_CINEMATIC_YAW_CENTER +
        Math.sin(this.cinematicYawPhase) * CAMERA_CINEMATIC_YAW_AMPLITUDE;
    }
    orbitControls.yaw = clampNumber(orbitControls.yaw, CAMERA_MINIMUM_YAW, CAMERA_MAXIMUM_YAW);
    orbitControls.pitch = clampNumber(
      orbitControls.pitch,
      CAMERA_MINIMUM_PITCH,
      CAMERA_MAXIMUM_PITCH
    );
    orbitControls.distance = clampNumber(
      orbitControls.distance,
      CAMERA_MINIMUM_DISTANCE,
      CAMERA_MAXIMUM_DISTANCE
    );
  }

  private synchronizeCinematicPhase(): void {
    const orbitControls = this.orbitControls;
    if (!orbitControls) {
      return;
    }
    const normalizedYaw = clampNumber(
      (orbitControls.yaw - CAMERA_CINEMATIC_YAW_CENTER) / CAMERA_CINEMATIC_YAW_AMPLITUDE,
      -1,
      1
    );
    const ascendingPhase = Math.asin(normalizedYaw);
    this.cinematicYawPhase =
      Math.cos(this.cinematicYawPhase) >= 0 ? ascendingPhase : Math.PI - ascendingPhase;
  }

  private readonly handleManualNavigation = (): void => {
    this.cinematicCamera = false;
  };

  private readonly handleCameraKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault();
      this.cinematicCamera = !this.cinematicCamera;
      if (this.cinematicCamera) {
        this.synchronizeCinematicPhase();
      }
    } else if (event.key.toLowerCase() === 'r') {
      this.orbitControls?.reset();
      this.cinematicYawPhase = Math.asin(
        (0.11 - CAMERA_CINEMATIC_YAW_CENTER) / CAMERA_CINEMATIC_YAW_AMPLITUDE
      );
    }
  };
}

function makeArchitectureInstances(): {
  positions: Float32Array;
  scales: Float32Array;
  baseColors: Float32Array;
  emissiveColors: Float32Array;
  instanceCount: number;
} {
  const positions: number[] = [];
  const scales: number[] = [];
  const baseColors: number[] = [];
  const emissiveColors: number[] = [];
  const addArchitectureInstance = (
    position: NumberArray3,
    scale: NumberArray3,
    baseColor: NumberArray3,
    emissiveColor: NumberArray3 = [0, 0, 0]
  ) => {
    positions.push(...position);
    scales.push(...scale);
    baseColors.push(...baseColor);
    emissiveColors.push(...emissiveColor);
  };

  const darkStone: NumberArray3 = [0.12, 0.15, 0.22];
  const blueStone: NumberArray3 = [0.08, 0.12, 0.2];
  for (const zPosition of [-10, -5, 0, 5, 10]) {
    addArchitectureInstance([-6.7, 4.5, zPosition], [0.58, 4.5, 0.58], darkStone);
    addArchitectureInstance([6.7, 4.5, zPosition], [0.58, 4.5, 0.58], darkStone);
    addArchitectureInstance(
      [0, 9.25, zPosition],
      [6.8, 0.16, 0.22],
      blueStone,
      [0.015, 0.035, 0.075]
    );
  }
  addArchitectureInstance([0, 4.6, -13.6], [7.6, 4.6, 0.35], darkStone);
  addArchitectureInstance([-8.8, 5.1, 0], [0.18, 5.1, 14], blueStone);
  addArchitectureInstance([8.8, 5.1, 0], [0.18, 5.1, 14], blueStone);
  addArchitectureInstance([0, 10.25, -4], [2.15, 0.1, 2.15], [0.7, 0.57, 0.34], [11, 7.4, 3.8]);
  addArchitectureInstance([0, 9.75, -4], [0.12, 0.5, 0.12], [0.35, 0.29, 0.2], [1.4, 0.85, 0.32]);
  for (const side of [-1, 1]) {
    for (const zPosition of [-8, -3, 3, 8]) {
      addStoneSarcophagus(addArchitectureInstance, side * 4.1, zPosition, side);
      addArchitectureInstance(
        [side * 5.75, 1.4, zPosition],
        [0.12, 1.4, 0.12],
        [0.18, 0.18, 0.16],
        [0.36, 0.18, 0.06]
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    baseColors: new Float32Array(baseColors),
    emissiveColors: new Float32Array(emissiveColors),
    instanceCount: positions.length / 3
  };
}

type ArchitectureInstanceAdder = (
  position: NumberArray3,
  scale: NumberArray3,
  baseColor: NumberArray3,
  emissiveColor?: NumberArray3
) => void;

function addStoneSarcophagus(
  addArchitectureInstance: ArchitectureInstanceAdder,
  xPosition: number,
  zPosition: number,
  side: number
): void {
  const plinthStone: NumberArray3 = [0.1, 0.105, 0.135];
  const coffinStone: NumberArray3 = [0.16, 0.145, 0.17];
  const lidStone: NumberArray3 = [0.22, 0.19, 0.2];
  const effigyStone: NumberArray3 = [0.27, 0.225, 0.18];
  const gold: NumberArray3 = [0.62, 0.4, 0.12];
  const goldEmission: NumberArray3 = [0.24, 0.105, 0.018];

  // A broad two-step plinth gives the tomb enough weight to read against the tiled floor.
  addArchitectureInstance([xPosition, 0.12, zPosition], [0.88, 0.12, 1.8], plinthStone);
  addArchitectureInstance([xPosition, 0.31, zPosition], [0.78, 0.08, 1.68], coffinStone);

  // Overlapping head and foot sections narrow toward the aisle, forming a stepped stone taper.
  addArchitectureInstance([xPosition, 0.56, zPosition - 0.48], [0.67, 0.22, 1.05], coffinStone);
  addArchitectureInstance([xPosition, 0.56, zPosition + 0.74], [0.54, 0.22, 0.68], coffinStone);
  addArchitectureInstance([xPosition, 0.83, zPosition - 0.45], [0.7, 0.08, 1.08], lidStone);
  addArchitectureInstance([xPosition, 0.82, zPosition + 0.76], [0.57, 0.08, 0.66], lidStone);

  // Thin warm inlay follows the lid centerline and shoulder band without becoming another lamp.
  addArchitectureInstance(
    [xPosition, 0.93, zPosition + 0.08],
    [0.025, 0.025, 1.3],
    gold,
    goldEmission
  );
  addArchitectureInstance(
    [xPosition, 0.93, zPosition - 0.72],
    [0.52, 0.026, 0.035],
    gold,
    goldEmission
  );

  // A reclining effigy is assembled from a head, torso, folded hands, and separated legs.
  addArchitectureInstance([xPosition, 1.09, zPosition - 1.03], [0.19, 0.16, 0.2], effigyStone);
  addArchitectureInstance([xPosition, 1.02, zPosition - 0.42], [0.29, 0.1, 0.48], effigyStone);
  addArchitectureInstance(
    [xPosition, 1.13, zPosition - 0.46],
    [0.24, 0.055, 0.075],
    gold,
    goldEmission
  );
  addArchitectureInstance(
    [xPosition + side * 0.13, 0.99, zPosition + 0.55],
    [0.105, 0.075, 0.58],
    effigyStone
  );
  addArchitectureInstance(
    [xPosition - side * 0.13, 0.99, zPosition + 0.55],
    [0.105, 0.075, 0.58],
    effigyStone
  );
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/** Converts math.gl's OpenGL-style orthographic depth range to WebGPU's zero-to-one range. */
function makeWebGPUOrthographicProjection(
  halfExtent: number,
  nearPlane: number,
  farPlane: number
): Matrix4 {
  const openGLProjection = new Matrix4().ortho({
    left: -halfExtent,
    right: halfExtent,
    bottom: -halfExtent,
    top: halfExtent,
    near: nearPlane,
    far: farPlane
  });
  const depthRangeConversion = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
  return depthRangeConversion.multiplyRight(openGLProjection);
}

function createSceneTarget(device: Device, width: number, height: number): SceneTarget {
  const targetWidth = Math.max(Math.round(width), 1);
  const targetHeight = Math.max(Math.round(height), 1);
  const colorTexture = device.createTexture({
    id: 'prism-cathedral-scene-color',
    width: targetWidth,
    height: targetHeight,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE | Texture.COPY_SRC
  });
  const depthTexture = device.createTexture({
    id: 'prism-cathedral-scene-depth',
    width: targetWidth,
    height: targetHeight,
    format: 'depth24plus',
    usage: Texture.RENDER
  });
  const framebuffer = device.createFramebuffer({
    id: 'prism-cathedral-scene-framebuffer',
    width: targetWidth,
    height: targetHeight,
    colorAttachments: [colorTexture],
    depthStencilAttachment: depthTexture
  });
  return {width: targetWidth, height: targetHeight, colorTexture, depthTexture, framebuffer};
}

function destroySceneTarget(target: SceneTarget): void {
  target.framebuffer.destroy();
  target.depthTexture.destroy();
  target.colorTexture.destroy();
}
