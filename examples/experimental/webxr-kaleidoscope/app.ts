// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Framebuffer, NumberArray, Texture, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Geometry, Model, OrbitControls} from '@luma.gl/engine';
import {
  WebXRAnimationFrameProvider,
  WebXRCameraTexture,
  WebXRDOMOverlayManager,
  WebXRHandTrackingManager,
  WebXRHitTestManager,
  WebXRManager,
  getWebXRHandPinch,
  getWebXRInputRay,
  getWebXRInputRayPlaneIntersection,
  type WebXRFrameState,
  type WebXRHandTrackingState,
  type WebXRHitTestState,
  type WebXRInputState
} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';

export const title = 'WebXR: Immersive Prism Portal';
export const description =
  'Explore a stereoscopic prism tunnel with native WebGPU projection layers and WebGL2 camera fallback.';

export type ImmersiveXRSessionMode = 'immersive-ar' | 'immersive-vr';

const PORTAL_RING_COUNT = 12;
const SHARDS_PER_RING = 34;
const RIBBON_COUNT = 5;
const RIBBON_SEGMENT_COUNT = 34;
const PARTICLE_COUNT = 220;
const PORTAL_DEPTH = 10.4;
const CAMERA_TARGET: [number, number, number] = [0, 0, -2.6];
const AR_DEPTH_SENSING: XRDepthStateInit = {
  usagePreference: ['gpu-optimized', 'cpu-optimized'],
  dataFormatPreference: ['luminance-alpha', 'float32', 'unsigned-short'],
  depthTypeRequest: ['smooth', 'raw']
};

type AppUniforms = {
  modelViewProjectionMatrix: NumberArray;
  time: number;
  cameraMix: number;
};

const app: {uniformTypes: Record<keyof AppUniforms, VariableShaderType>} = {
  uniformTypes: {
    modelViewProjectionMatrix: 'mat4x4<f32>',
    time: 'f32',
    cameraMix: 'f32'
  }
};

const WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  time: f32,
  cameraMix: f32,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var cameraTexture: texture_2d<f32>;
@group(0) @binding(auto) var cameraTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) shardData: vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) localPosition: vec3<f32>,
  @location(2) energy: f32,
  @location(3) depthFactor: f32,
  @location(4) shardKind: f32,
};

fn rotatePoint(point: vec2<f32>, angle: f32) -> vec2<f32> {
  let sine = sin(angle);
  let cosine = cos(angle);
  return vec2<f32>(
    point.x * cosine - point.y * sine,
    point.x * sine + point.y * cosine
  );
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var position = inputs.positions;
  let depthFactor = inputs.shardData.x;
  let orbitPhase = inputs.shardData.y;
  let shardKind = inputs.shardData.w;
  let orbitDirection = select(-1.0, 1.0, fract(depthFactor * 7.0) > 0.5);
  let orbitAngle = app.time * (0.10 + depthFactor * 0.17) * orbitDirection;
  position = vec3<f32>(rotatePoint(position.xy, orbitAngle), position.z);
  position.z += sin(app.time * 1.65 + orbitPhase * 6.28318) * (0.045 + shardKind * 0.055);
  let radialBreathing = 1.0 + sin(app.time * 1.15 + depthFactor * 7.2) * 0.025;
  position = vec3<f32>(position.xy * radialBreathing, position.z);

  outputs.Position = app.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  outputs.uv = inputs.texCoords;
  outputs.localPosition = position;
  outputs.energy = inputs.shardData.z *
    (0.75 + 0.25 * sin(app.time * 2.1 + orbitPhase * 8.0 - depthFactor * 9.0));
  outputs.depthFactor = depthFactor;
  outputs.shardKind = shardKind;
  return outputs;
}

fn kaleidoscopeUv(uv: vec2<f32>) -> vec2<f32> {
  let centered = uv * 2.0 - vec2<f32>(1.0);
  let radius = length(centered);
  let segment = 6.2831853 / 9.0;
  var angle = atan2(centered.y, centered.x);
  angle = abs((angle + segment * 0.5) - segment * floor((angle + segment * 0.5) / segment));
  angle = abs(angle - segment * 0.5);
  return vec2<f32>(cos(angle), sin(angle)) * radius * 0.5 + vec2<f32>(0.5);
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let edgeDistance = min(min(inputs.uv.x, 1.0 - inputs.uv.x),
                         min(inputs.uv.y, 1.0 - inputs.uv.y));
  let edgeGlow = 1.0 - smoothstep(0.025, 0.22, edgeDistance);
  let coreGlow = pow(max(0.0, 1.0 - length(inputs.uv - vec2<f32>(0.5)) * 1.75), 3.2);
  let prismPhase = inputs.depthFactor * 8.5 + inputs.localPosition.x * 0.6 + app.time * 0.42;
  let cyan = vec3<f32>(0.03, 0.86, 1.18);
  let violet = vec3<f32>(0.66, 0.13, 1.18);
  let coral = vec3<f32>(1.0, 0.29, 0.44);
  let spectralColor = mix(mix(cyan, violet, 0.5 + 0.5 * sin(prismPhase)),
                          coral, (0.5 + 0.5 * sin(prismPhase * 0.63 + 2.1)) * 0.28);
  let distanceFade = mix(1.0, 0.36, inputs.depthFactor);
  let shimmer = 0.73 + 0.27 * sin(app.time * 3.4 + inputs.localPosition.z * 1.9);
  var color = spectralColor * (0.35 + edgeGlow * 1.05 + coreGlow * 0.6) *
              inputs.energy * distanceFade * shimmer;

  let cameraUv = kaleidoscopeUv(vec2<f32>(inputs.uv.x, 1.0 - inputs.uv.y));
  let cameraColor = textureSample(cameraTexture, cameraTextureSampler, cameraUv).rgb;
  color = mix(color, cameraColor * (0.72 + edgeGlow * 0.4) + spectralColor * edgeGlow * 0.55,
              app.cameraMix * (1.0 - inputs.depthFactor * 0.7));
  let alpha = clamp((0.38 + edgeGlow * 0.5 + coreGlow * 0.45) *
                    (0.75 + inputs.shardKind * 0.12), 0.0, 0.98);
  return vec4<f32>(color, alpha);
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec2 texCoords;
in vec4 shardData;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

out vec2 vUV;
out vec3 vLocalPosition;
out float vEnergy;
out float vDepthFactor;
out float vShardKind;

vec2 rotatePoint(vec2 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec2(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
}

void main(void) {
  vec3 position = positions;
  float depthFactor = shardData.x;
  float orbitPhase = shardData.y;
  float orbitDirection = fract(depthFactor * 7.0) > 0.5 ? 1.0 : -1.0;
  float orbitAngle = app.time * (0.10 + depthFactor * 0.17) * orbitDirection;
  position.xy = rotatePoint(position.xy, orbitAngle);
  position.z += sin(app.time * 1.65 + orbitPhase * 6.28318) * (0.045 + shardData.w * 0.055);
  position.xy *= 1.0 + sin(app.time * 1.15 + depthFactor * 7.2) * 0.025;

  gl_Position = app.modelViewProjectionMatrix * vec4(position, 1.0);
  vUV = texCoords;
  vLocalPosition = position;
  vEnergy = shardData.z *
    (0.75 + 0.25 * sin(app.time * 2.1 + orbitPhase * 8.0 - depthFactor * 9.0));
  vDepthFactor = depthFactor;
  vShardKind = shardData.w;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D cameraTexture;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

in vec2 vUV;
in vec3 vLocalPosition;
in float vEnergy;
in float vDepthFactor;
in float vShardKind;

out vec4 fragColor;

const float TAU = 6.283185307179586;

vec2 kaleidoscopeUv(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float segment = TAU / 9.0;
  angle = abs(mod(angle + segment * 0.5, segment) - segment * 0.5);
  return vec2(cos(angle), sin(angle)) * radius * 0.5 + 0.5;
}

void main(void) {
  float edgeDistance = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));
  float edgeGlow = 1.0 - smoothstep(0.025, 0.22, edgeDistance);
  float coreGlow = pow(max(0.0, 1.0 - length(vUV - vec2(0.5)) * 1.75), 3.2);
  float prismPhase = vDepthFactor * 8.5 + vLocalPosition.x * 0.6 + app.time * 0.42;
  vec3 cyan = vec3(0.03, 0.86, 1.18);
  vec3 violet = vec3(0.66, 0.13, 1.18);
  vec3 coral = vec3(1.0, 0.29, 0.44);
  vec3 spectralColor = mix(mix(cyan, violet, 0.5 + 0.5 * sin(prismPhase)),
    coral, (0.5 + 0.5 * sin(prismPhase * 0.63 + 2.1)) * 0.28);
  float distanceFade = mix(1.0, 0.36, vDepthFactor);
  float shimmer = 0.73 + 0.27 * sin(app.time * 3.4 + vLocalPosition.z * 1.9);
  vec3 color = spectralColor * (0.35 + edgeGlow * 1.05 + coreGlow * 0.6) *
    vEnergy * distanceFade * shimmer;

  vec2 cameraUv = kaleidoscopeUv(vec2(vUV.x, 1.0 - vUV.y));
  vec3 cameraColor = texture(cameraTexture, cameraUv).rgb;
  color = mix(color,
    cameraColor * (0.72 + edgeGlow * 0.4) + spectralColor * edgeGlow * 0.55,
    app.cameraMix * (1.0 - vDepthFactor * 0.7));
  float alpha = clamp((0.38 + edgeGlow * 0.5 + coreGlow * 0.45) *
    (0.75 + vShardKind * 0.12), 0.0, 0.98);
  fragColor = vec4(color, alpha);
}
`;

const CONTROLLER_RAY_WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  time: f32,
  cameraMix: f32,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) rayDepth: f32,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * vec4<f32>(inputs.positions, 1.0);
  outputs.rayDepth = clamp(-inputs.positions.z / 3.2, 0.0, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let idleColor = vec3<f32>(0.05, 0.92, 1.0);
  let activeColor = vec3<f32>(1.0, 0.36, 0.18);
  let color = mix(idleColor, activeColor, app.cameraMix);
  let alpha = mix(0.86, 0.28, inputs.rayDepth);
  return vec4<f32>(color * (1.15 - inputs.rayDepth * 0.38), alpha);
}
`;

const CONTROLLER_RAY_VS_GLSL = /* glsl */ `\
#version 300 es

in vec3 positions;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

out float vRayDepth;

void main(void) {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  vRayDepth = clamp(-positions.z / 3.2, 0.0, 1.0);
}
`;

const CONTROLLER_RAY_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

in float vRayDepth;
out vec4 fragColor;

void main(void) {
  vec3 idleColor = vec3(0.05, 0.92, 1.0);
  vec3 activeColor = vec3(1.0, 0.36, 0.18);
  vec3 color = mix(idleColor, activeColor, app.cameraMix);
  float alpha = mix(0.86, 0.28, vRayDepth);
  fragColor = vec4(color * (1.15 - vRayDepth * 0.38), alpha);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static current: AppAnimationLoopTemplate | null = null;
  private static readonly currentListeners = new Set<() => void>();

  static subscribeToCurrent(listener: () => void): () => void {
    AppAnimationLoopTemplate.currentListeners.add(listener);
    return () => {
      AppAnimationLoopTemplate.currentListeners.delete(listener);
    };
  }

  private static setCurrent(current: AppAnimationLoopTemplate | null): void {
    AppAnimationLoopTemplate.current = current;
    for (const listener of AppAnimationLoopTemplate.currentListeners) {
      listener();
    }
  }

  static info = `\
  <p>
  Fly through a stereoscopic field of animated prism shards. WebGPU renders directly into
  native WebXR projection layers when supported. WebGL2 remains available on older XR
  browsers and can fold raw AR camera imagery into the portal when access is granted.
  Desktop testing works with the
  <a href="https://chromewebstore.google.com/detail/codex/hehggadaopoacecdllhhajmbjkdcmajg?pli=1" target="_blank" rel="noreferrer">Immersive Web Emulator Chrome extension</a>.
  </p>
  `;

  readonly device: Device;
  readonly animationLoop: AnimationProps['animationLoop'];
  readonly uniformStore: UniformStore<{app: AppUniforms}>;
  readonly fallbackTexture: Texture;
  readonly model: Model;
  readonly controllerRayModel: Model;
  readonly controllerReticleModel: Model;
  readonly handJointModel: Model;
  readonly webXRManager: WebXRManager;
  readonly webXRDOMOverlayManager = new WebXRDOMOverlayManager();
  readonly webXRHandTrackingManager = new WebXRHandTrackingManager();
  readonly webXRHitTestManager = new WebXRHitTestManager();
  readonly modelMatrix = new Matrix4();
  readonly modelViewProjectionMatrix = new Matrix4();
  readonly controllerRayMatrix = new Matrix4();
  readonly controllerReticleMatrix = new Matrix4();
  readonly handJointMatrix = new Matrix4();
  readonly xrSceneOffset: [number, number, number] = [0, 0, 0];
  readonly viewMatrix = new Matrix4().lookAt({
    eye: [0.32, 0.24, 4.4],
    center: CAMERA_TARGET
  });
  readonly xrViewMatrix = new Matrix4();

  cameraTexture: WebXRCameraTexture | null = null;
  orbitControls: OrbitControls | null = null;
  xrSession: XRSession | null = null;
  xrSessionMode: ImmersiveXRSessionMode | null = null;
  private _isFinalized = false;
  private _floorHitByInputSource = new Map<XRInputSource, [number, number, number]>();
  private _xrSessionEndListener = () => this._clearXRSession();
  private _xrSelectEndListener = (event: Event) =>
    this.teleportToInputSource((event as XRInputSourceEvent).inputSource);
  private _xrSqueezeEndListener = () => void this.exitXR();
  private _keyDownListener = (event: KeyboardEvent) => {
    if (!this.xrSession) {
      return;
    }
    if (event.key === 'Escape' || event.key.toLowerCase() === 'q') {
      void this.exitXR();
    }
  };

  constructor({animationLoop, device}: AnimationProps) {
    super();
    this.animationLoop = animationLoop;
    this.device = device;
    this.uniformStore = new UniformStore(device, {app});
    this.fallbackTexture = device.createTexture({
      data: new Uint8Array([6, 12, 42, 255]),
      width: 1,
      height: 1,
      format: 'rgba8unorm'
    });
    this.webXRManager = new WebXRManager(device);
    this.model = new Model(device, {
      id: 'immersive-prism-portal',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry: makeSpatialPortalGeometry(),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app'),
        cameraTexture: this.fallbackTexture
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.controllerRayModel = new Model(device, {
      id: 'immersive-prism-controller-rays',
      source: CONTROLLER_RAY_WGSL_SHADER,
      vs: CONTROLLER_RAY_VS_GLSL,
      fs: CONTROLLER_RAY_FS_GLSL,
      geometry: makeControllerRayGeometry(),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app')
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.controllerReticleModel = new Model(device, {
      id: 'immersive-prism-controller-reticles',
      source: CONTROLLER_RAY_WGSL_SHADER,
      vs: CONTROLLER_RAY_VS_GLSL,
      fs: CONTROLLER_RAY_FS_GLSL,
      geometry: makeControllerReticleGeometry(),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app')
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.handJointModel = new Model(device, {
      id: 'immersive-prism-hand-joints',
      source: CONTROLLER_RAY_WGSL_SHADER,
      vs: CONTROLLER_RAY_VS_GLSL,
      fs: CONTROLLER_RAY_FS_GLSL,
      geometry: makeHandJointGeometry(),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app')
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.initializePreviewControls();

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyDownListener);
    }
    AppAnimationLoopTemplate.setCurrent(this);
  }

  onFinalize(): void {
    this._isFinalized = true;
    if (AppAnimationLoopTemplate.current === this) {
      AppAnimationLoopTemplate.setCurrent(null);
    }
    void this.exitAR();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._keyDownListener);
    }
    this.orbitControls?.destroy();
    this.controllerReticleModel.destroy();
    this.handJointModel.destroy();
    this.controllerRayModel.destroy();
    this.model.destroy();
    this.fallbackTexture.destroy();
    this.uniformStore.destroy();
    this.webXRDOMOverlayManager.destroy();
    this.webXRHandTrackingManager.destroy();
    this.webXRHitTestManager.destroy();
    this.webXRManager.destroy();
  }

  onRender({animationFrame, aspect, device, time: elapsedTimeMilliseconds}: AnimationProps): void {
    const time = elapsedTimeMilliseconds * 0.001;
    const xrFrame = animationFrame as XRFrame | null;
    const frameState = xrFrame && this.xrSession ? this.webXRManager.getFrameState(xrFrame) : null;
    const inputState = xrFrame && this.xrSession ? this.webXRManager.getInputState(xrFrame) : null;
    const handState =
      xrFrame && this.xrSession
        ? this.webXRHandTrackingManager.getHandsState(
            xrFrame,
            (inputState || []).map(input => input.inputSource)
          )
        : null;
    const hitTestState =
      xrFrame && this.xrSession ? this.webXRHitTestManager.getHitTestState(xrFrame) : null;

    if (frameState) {
      this.renderXRFrame(time, frameState, inputState || [], handState || [], hitTestState);
      return;
    }

    if (this.orbitControls) {
      this.orbitControls.update(elapsedTimeMilliseconds);
      this.viewMatrix.lookAt({eye: this.orbitControls.getEyePosition(), center: CAMERA_TARGET});
    }
    this.renderPreviewFrame(device, aspect, time);
  }

  async enterAR(): Promise<void> {
    await this.enterXR('immersive-ar');
  }

  async enterVR(): Promise<void> {
    await this.enterXR('immersive-vr');
  }

  async enterXR(sessionMode: ImmersiveXRSessionMode): Promise<void> {
    if (this.xrSession) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.xr) {
      throw new Error('WebXR is not supported in this browser');
    }
    if (
      this.device.type === 'webgpu' &&
      (!('xrCompatible' in this.device.props) ||
        !this.device.props.xrCompatible ||
        !('XRGPUBinding' in globalThis))
    ) {
      throw new Error(
        'Native WebGPU WebXR is unavailable. Switch to WebGL2 for immersive fallback.'
      );
    }

    const session = await navigator.xr.requestSession(
      sessionMode,
      getXRSessionInit(sessionMode, this.device.type, getDOMOverlayRoot())
    );

    try {
      await this.webXRManager.setSession(session, {
        referenceSpaceType: 'local',
        ...(this.device.type === 'webgl'
          ? {layerInit: {alpha: sessionMode === 'immersive-ar'}}
          : {})
      });
      this.webXRHandTrackingManager.setSession(session, this.webXRManager.referenceSpace);
      if (sessionMode === 'immersive-ar') {
        await this.webXRHitTestManager
          .setSession(session, this.webXRManager.referenceSpace, {entityTypes: ['plane', 'point']})
          .catch(() => this.webXRHitTestManager.clearSession());
      }
      this.cameraTexture =
        sessionMode === 'immersive-ar' && this.device.type === 'webgl'
          ? this.createCameraTexture(session)
          : null;
      this.webXRDOMOverlayManager.setSession(session, {root: getDOMOverlayRoot()});
      this.xrSession = session;
      this.xrSessionMode = sessionMode;
      session.addEventListener('end', this._xrSessionEndListener);
      session.addEventListener('selectend', this._xrSelectEndListener);
      session.addEventListener('squeezeend', this._xrSqueezeEndListener);
      this.animationLoop.setProps({
        animationFrameProvider: new WebXRAnimationFrameProvider(session)
      });
    } catch (error) {
      await session.end().catch(() => {});
      throw error;
    }
  }

  async exitAR(): Promise<void> {
    await this.exitXR();
  }

  async exitXR(): Promise<void> {
    const session = this.xrSession;
    if (session) {
      await session.end().catch(() => {});
    }
    this._clearXRSession();
  }

  private renderPreviewFrame(device: Device, aspect: number, time: number): void {
    this.updateModelMatrix(time, false);
    this.modelViewProjectionMatrix
      .perspective({fovy: Math.PI / 3.05, aspect, near: 0.08, far: 36})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);
    this.preparePortal({cameraMix: 0, texture: this.fallbackTexture, time});
    const renderPass = device.beginRenderPass({
      clearColor: [0.006, 0.008, 0.028, 1],
      clearDepth: 1
    });
    this.drawPortal(renderPass);
    renderPass.end();
  }

  private renderXRFrame(
    time: number,
    frameState: WebXRFrameState,
    inputState: readonly WebXRInputState[],
    handState: readonly WebXRHandTrackingState[],
    hitTestState: WebXRHitTestState | null
  ): void {
    this.updateModelMatrix(time, true, hitTestState);
    const clearColor: [number, number, number, number] =
      this.xrSessionMode === 'immersive-ar' ? [0, 0, 0, 0] : [0.006, 0.008, 0.028, 1];
    const renderedFramebuffers = new Set<Framebuffer>();
    this._floorHitByInputSource.clear();

    for (const view of frameState.views) {
      this.modelViewProjectionMatrix
        .copy(view.projectionMatrix)
        .multiplyRight(this.xrViewMatrix.copy(view.viewMatrix))
        .multiplyRight(this.modelMatrix);
      const cameraTexture = view.camera ? this.cameraTexture : null;
      cameraTexture?.setView(view.xrView);
      const framebuffer = view.framebuffer ?? frameState.framebuffer;
      const clearView = !renderedFramebuffers.has(framebuffer);
      renderedFramebuffers.add(framebuffer);
      this.preparePortal({
        cameraMix: cameraTexture ? 1 : 0,
        texture: cameraTexture || this.fallbackTexture,
        time
      });
      const renderPass = this.device.beginRenderPass({
        framebuffer,
        clearColor: clearView ? clearColor : false,
        clearDepth: clearView ? 1 : false,
        clearStencil: false
      });
      renderPass.setParameters({viewport: view.viewport});
      this.drawPortal(renderPass);
      this.drawControllerTargets(renderPass, view, inputState, time);
      this.drawHandJoints(renderPass, view, handState, time);
      renderPass.end();
    }
  }

  private preparePortal(options: {
    cameraMix: number;
    texture: Texture | WebXRCameraTexture;
    time: number;
  }): void {
    this.uniformStore.setUniforms(
      {
        app: {
          modelViewProjectionMatrix: this.modelViewProjectionMatrix,
          time: options.time,
          cameraMix: options.cameraMix
        }
      },
      this.device.commandEncoder
    );
    this.model.shaderInputs.setProps({bindings: {cameraTexture: options.texture}});
    this.model.predraw(this.device.commandEncoder);
  }

  private drawPortal(renderPass: ReturnType<Device['beginRenderPass']>): void {
    this.model.draw(renderPass);
  }

  private drawControllerTargets(
    renderPass: ReturnType<Device['beginRenderPass']>,
    view: WebXRFrameState['views'][number],
    inputState: readonly WebXRInputState[],
    time: number
  ): void {
    for (const input of inputState) {
      const inputRay = getWebXRInputRay(input);
      if (input.targetRayMode !== 'tracked-pointer' || !inputRay) {
        continue;
      }

      this.modelViewProjectionMatrix
        .copy(view.projectionMatrix)
        .multiplyRight(this.xrViewMatrix.copy(view.viewMatrix))
        .multiplyRight(this.controllerRayMatrix.copy(inputRay.matrix));
      this.uniformStore.setUniforms(
        {
          app: {
            modelViewProjectionMatrix: this.modelViewProjectionMatrix,
            time,
            cameraMix: input.selectActive ? 1 : 0
          }
        },
        this.device.commandEncoder
      );
      this.controllerRayModel.predraw(this.device.commandEncoder);
      this.controllerRayModel.draw(renderPass);

      const floorHit = getWebXRInputRayPlaneIntersection(inputRay, {maxDistance: 8});
      if (floorHit) {
        this._floorHitByInputSource.set(input.inputSource, floorHit.point);
        this.controllerReticleMatrix.identity().translate(floorHit.point);
        this.modelViewProjectionMatrix
          .copy(view.projectionMatrix)
          .multiplyRight(this.xrViewMatrix.copy(view.viewMatrix))
          .multiplyRight(this.controllerReticleMatrix);
        this.uniformStore.setUniforms(
          {
            app: {
              modelViewProjectionMatrix: this.modelViewProjectionMatrix,
              time,
              cameraMix: input.selectActive ? 1 : 0
            }
          },
          this.device.commandEncoder
        );
        this.controllerReticleModel.predraw(this.device.commandEncoder);
        this.controllerReticleModel.draw(renderPass);
      }
    }
  }

  private drawHandJoints(
    renderPass: ReturnType<Device['beginRenderPass']>,
    view: WebXRFrameState['views'][number],
    handState: readonly WebXRHandTrackingState[],
    time: number
  ): void {
    for (const hand of handState) {
      const pinchState = getWebXRHandPinch(hand);
      const handColorMix = pinchState?.pinchActive ? 1 : hand.handedness === 'right' ? 0.45 : 0;

      for (const joint of hand.joints) {
        if (!joint.matrix) {
          continue;
        }

        const jointScale = Math.max(joint.radius ?? 0.008, 0.006) * 1.8;
        this.handJointMatrix.copy(joint.matrix).scale([jointScale, jointScale, jointScale]);
        this.modelViewProjectionMatrix
          .copy(view.projectionMatrix)
          .multiplyRight(this.xrViewMatrix.copy(view.viewMatrix))
          .multiplyRight(this.handJointMatrix);
        this.uniformStore.setUniforms(
          {
            app: {
              modelViewProjectionMatrix: this.modelViewProjectionMatrix,
              time,
              cameraMix: handColorMix
            }
          },
          this.device.commandEncoder
        );
        this.handJointModel.predraw(this.device.commandEncoder);
        this.handJointModel.draw(renderPass);
      }
    }
  }

  private updateModelMatrix(
    time: number,
    isXR: boolean,
    hitTestState: WebXRHitTestState | null = null
  ): void {
    this.modelMatrix.identity();
    if (isXR) {
      if (this.xrSessionMode === 'immersive-ar' && hitTestState?.hits[0]) {
        this.modelMatrix.copy(hitTestState.hits[0].matrix).scale([0.54, 0.54, 0.54]);
        return;
      }

      this.modelMatrix
        .translate(this.xrSceneOffset)
        .translate([0, 0.12, -2.15])
        .scale([0.88, 0.88, 0.88])
        .rotateZ(Math.sin(time * 0.2) * 0.055)
        .rotateX(Math.sin(time * 0.38) * 0.045);
    } else {
      this.modelMatrix
        .rotateZ(Math.sin(time * 0.24) * 0.12)
        .rotateX(Math.sin(time * 0.31) * 0.055)
        .rotateY(Math.cos(time * 0.26) * 0.075);
    }
  }

  private teleportToInputSource(inputSource: XRInputSource | undefined): void {
    const floorHit = inputSource && this._floorHitByInputSource.get(inputSource);
    if (!floorHit) {
      return;
    }

    this.xrSceneOffset[0] -= floorHit[0];
    this.xrSceneOffset[2] -= floorHit[2];
    this._floorHitByInputSource.clear();
  }

  private createCameraTexture(session: XRSession): WebXRCameraTexture | null {
    if (this.device.type !== 'webgl' || typeof XRWebGLBinding === 'undefined') {
      return null;
    }

    try {
      const webGLDevice = this.device as Device & {gl: WebGL2RenderingContext};
      const XRWebGLBindingConstructor = XRWebGLBinding as unknown as new (
        session: XRSession,
        context: WebGL2RenderingContext
      ) => XRWebGLBinding;
      const xrWebGLBinding = new XRWebGLBindingConstructor(session, webGLDevice.gl);
      return new WebXRCameraTexture(this.device, xrWebGLBinding);
    } catch {
      return null;
    }
  }

  private initializePreviewControls(): void {
    const canvas = this.device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    this.orbitControls = new OrbitControls(canvas, {
      target: CAMERA_TARGET,
      distance: 7.1,
      yaw: 0.055,
      pitch: 0.035,
      minDistance: 3.8,
      maxDistance: 11,
      minPitch: -0.35,
      maxPitch: 0.35,
      rotateSpeed: 0.003
    });
  }

  private _clearXRSession(): void {
    const session = this.xrSession;
    session?.removeEventListener('end', this._xrSessionEndListener);
    session?.removeEventListener('selectend', this._xrSelectEndListener);
    session?.removeEventListener('squeezeend', this._xrSqueezeEndListener);
    this.xrSession = null;
    this.xrSessionMode = null;
    this.xrSceneOffset[0] = 0;
    this.xrSceneOffset[1] = 0;
    this.xrSceneOffset[2] = 0;
    this._floorHitByInputSource.clear();
    this.cameraTexture?.destroy();
    this.cameraTexture = null;
    this.webXRDOMOverlayManager.clearSession();
    this.webXRHandTrackingManager.clearSession();
    this.webXRHitTestManager.clearSession();
    this.webXRManager.clearSession();
    if (!this._isFinalized) {
      this.animationLoop.setProps({animationFrameProvider: undefined});
    }
  }
}

function getXRSessionInit(
  sessionMode: ImmersiveXRSessionMode,
  deviceType: string,
  domOverlayRoot: Element | null = null
): XRSessionInit {
  const domOverlayFeatures = domOverlayRoot ? ['dom-overlay'] : [];
  const domOverlayInit = domOverlayRoot ? {domOverlay: {root: domOverlayRoot}} : {};

  if (deviceType === 'webgpu') {
    return {
      requiredFeatures: ['webgpu'],
      optionalFeatures:
        sessionMode === 'immersive-ar'
          ? [
              'anchors',
              'depth-sensing',
              ...domOverlayFeatures,
              'hand-tracking',
              'hit-test',
              'local-floor'
            ]
          : [...domOverlayFeatures, 'hand-tracking', 'local-floor'],
      ...(sessionMode === 'immersive-ar' ? {depthSensing: AR_DEPTH_SENSING} : {}),
      ...domOverlayInit
    };
  }

  return sessionMode === 'immersive-ar'
    ? {
        optionalFeatures: [
          'anchors',
          'camera-access',
          'depth-sensing',
          ...domOverlayFeatures,
          'hand-tracking',
          'hit-test',
          'local-floor'
        ],
        depthSensing: AR_DEPTH_SENSING,
        ...domOverlayInit
      }
    : {
        optionalFeatures: [...domOverlayFeatures, 'hand-tracking', 'local-floor'],
        ...domOverlayInit
      };
}

function getDOMOverlayRoot(): Element | null {
  return typeof document !== 'undefined' ? document.getElementById('webxr-dom-overlay') : null;
}

function makeSpatialPortalGeometry(): Geometry {
  const positions: number[] = [];
  const texCoords: number[] = [];
  const shardAttributes: number[] = [];

  appendPortalRings(positions, texCoords, shardAttributes);
  appendHelicalRibbons(positions, texCoords, shardAttributes);
  appendFloatingPrisms(positions, texCoords, shardAttributes);

  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      positions: {size: 3, value: new Float32Array(positions)},
      texCoords: {size: 2, value: new Float32Array(texCoords)},
      shardData: {size: 4, value: new Float32Array(shardAttributes)}
    }
  });
}

function makeControllerRayGeometry(): Geometry {
  return new Geometry({
    topology: 'line-list',
    attributes: {
      positions: {
        size: 3,
        value: new Float32Array([0, 0, 0, 0, 0, -3.2])
      }
    }
  });
}

function makeControllerReticleGeometry(): Geometry {
  const positions: number[] = [];
  const segmentCount = 32;
  const radius = 0.12;

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
    const startAngle = (segmentIndex / segmentCount) * Math.PI * 2;
    const endAngle = ((segmentIndex + 1) / segmentCount) * Math.PI * 2;
    positions.push(
      Math.cos(startAngle) * radius,
      0,
      Math.sin(startAngle) * radius,
      Math.cos(endAngle) * radius,
      0,
      Math.sin(endAngle) * radius
    );
  }

  return new Geometry({
    topology: 'line-list',
    attributes: {
      positions: {
        size: 3,
        value: new Float32Array(positions)
      }
    }
  });
}

function makeHandJointGeometry(): Geometry {
  return new Geometry({
    topology: 'line-list',
    attributes: {
      positions: {
        size: 3,
        value: new Float32Array([-1, 0, 0, 1, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, -1, 0, 0, 1])
      }
    }
  });
}

function appendPortalRings(
  positions: number[],
  texCoords: number[],
  shardAttributes: number[]
): void {
  for (let ringIndex = 0; ringIndex < PORTAL_RING_COUNT; ringIndex++) {
    const depthFactor = ringIndex / (PORTAL_RING_COUNT - 1);
    const depth = -depthFactor * PORTAL_DEPTH;
    const innerRadius = 1.02 + Math.sin(ringIndex * 0.73) * 0.14 + depthFactor * 0.23;
    const outerRadius = innerRadius + 0.11 + (ringIndex % 3) * 0.045;

    for (let shardIndex = 0; shardIndex < SHARDS_PER_RING; shardIndex++) {
      const orbitPhase = shardIndex / SHARDS_PER_RING;
      const centerAngle = orbitPhase * Math.PI * 2 + ringIndex * 0.14;
      const halfAngle = (Math.PI / SHARDS_PER_RING) * (0.57 + (shardIndex % 3) * 0.1);
      const innerLeft = makePolarPoint(innerRadius, centerAngle - halfAngle, depth);
      const innerRight = makePolarPoint(innerRadius, centerAngle + halfAngle, depth);
      const outerRight = makePolarPoint(outerRadius, centerAngle + halfAngle * 0.72, depth - 0.055);
      const outerLeft = makePolarPoint(outerRadius, centerAngle - halfAngle * 0.72, depth - 0.055);
      appendQuad(positions, texCoords, shardAttributes, {
        corners: [innerLeft, innerRight, outerRight, outerLeft],
        depthFactor,
        orbitPhase,
        energy: 0.68 + ((shardIndex + ringIndex) % 5) * 0.075,
        kind: 0
      });
    }
  }
}

function appendHelicalRibbons(
  positions: number[],
  texCoords: number[],
  shardAttributes: number[]
): void {
  for (let ribbonIndex = 0; ribbonIndex < RIBBON_COUNT; ribbonIndex++) {
    const ribbonPhase = (ribbonIndex / RIBBON_COUNT) * Math.PI * 2;

    for (let segmentIndex = 0; segmentIndex < RIBBON_SEGMENT_COUNT; segmentIndex++) {
      const depthFactor = segmentIndex / RIBBON_SEGMENT_COUNT;
      const nextDepthFactor = (segmentIndex + 0.76) / RIBBON_SEGMENT_COUNT;
      const startAngle = ribbonPhase + depthFactor * Math.PI * 3.4;
      const endAngle = ribbonPhase + nextDepthFactor * Math.PI * 3.4;
      const ribbonRadius = 1.78 + Math.sin(depthFactor * Math.PI * 4 + ribbonPhase) * 0.13;
      const ribbonWidth = 0.035;
      appendQuad(positions, texCoords, shardAttributes, {
        corners: [
          makePolarPoint(ribbonRadius - ribbonWidth, startAngle, -depthFactor * PORTAL_DEPTH),
          makePolarPoint(ribbonRadius + ribbonWidth, startAngle, -depthFactor * PORTAL_DEPTH),
          makePolarPoint(ribbonRadius + ribbonWidth, endAngle, -nextDepthFactor * PORTAL_DEPTH),
          makePolarPoint(ribbonRadius - ribbonWidth, endAngle, -nextDepthFactor * PORTAL_DEPTH)
        ],
        depthFactor,
        orbitPhase: ribbonIndex / RIBBON_COUNT,
        energy: 0.72,
        kind: 1
      });
    }
  }
}

function appendFloatingPrisms(
  positions: number[],
  texCoords: number[],
  shardAttributes: number[]
): void {
  for (let particleIndex = 0; particleIndex < PARTICLE_COUNT; particleIndex++) {
    const depthFactor = makeDeterministicNoise(particleIndex * 3 + 1);
    const orbitPhase = makeDeterministicNoise(particleIndex * 3 + 2);
    const radius = 0.22 + makeDeterministicNoise(particleIndex * 3 + 3) * 2.12;
    const angle = orbitPhase * Math.PI * 2;
    const centerX = Math.cos(angle) * radius;
    const centerY = Math.sin(angle) * radius;
    const depth = -depthFactor * PORTAL_DEPTH;
    const halfSize = 0.013 + makeDeterministicNoise(particleIndex * 7 + 5) * 0.047;
    appendQuad(positions, texCoords, shardAttributes, {
      corners: [
        [centerX - halfSize, centerY, depth],
        [centerX, centerY - halfSize * 1.75, depth + halfSize],
        [centerX + halfSize, centerY, depth],
        [centerX, centerY + halfSize * 1.75, depth - halfSize]
      ],
      depthFactor,
      orbitPhase,
      energy: 0.9 + makeDeterministicNoise(particleIndex * 11 + 9) * 0.45,
      kind: 2
    });
  }
}

function makeDeterministicNoise(index: number): number {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function makePolarPoint(radius: number, angle: number, depth: number): [number, number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius, depth];
}

function appendQuad(
  positions: number[],
  texCoords: number[],
  shardAttributes: number[],
  options: {
    corners: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
      [number, number, number]
    ];
    depthFactor: number;
    orbitPhase: number;
    energy: number;
    kind: number;
  }
): void {
  const [bottomLeft, bottomRight, topRight, topLeft] = options.corners;
  const shardData: [number, number, number, number] = [
    options.depthFactor,
    options.orbitPhase,
    options.energy,
    options.kind
  ];
  appendVertex(positions, texCoords, shardAttributes, bottomLeft, [0, 0], shardData);
  appendVertex(positions, texCoords, shardAttributes, bottomRight, [1, 0], shardData);
  appendVertex(positions, texCoords, shardAttributes, topRight, [1, 1], shardData);
  appendVertex(positions, texCoords, shardAttributes, bottomLeft, [0, 0], shardData);
  appendVertex(positions, texCoords, shardAttributes, topRight, [1, 1], shardData);
  appendVertex(positions, texCoords, shardAttributes, topLeft, [0, 1], shardData);
}

function appendVertex(
  positions: number[],
  texCoords: number[],
  shardAttributes: number[],
  position: [number, number, number],
  texCoord: [number, number],
  shardData: [number, number, number, number]
): void {
  positions.push(...position);
  texCoords.push(...texCoord);
  shardAttributes.push(...shardData);
}
