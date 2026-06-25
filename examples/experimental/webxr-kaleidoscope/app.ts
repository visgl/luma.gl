// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, NumberArray, Texture, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Geometry, Model} from '@luma.gl/engine';
import {
  WebXRAnimationFrameProvider,
  WebXRCameraTexture,
  WebXRManager,
  type WebXRFrameState
} from '@luma.gl/experimental';
import type {WebGLDevice} from '@luma.gl/webgl';
import {Matrix4} from '@math.gl/core';

export const title = 'Passthrough Kaleidoscope';
export const description =
  'Folds WebXR camera frames or a procedural fallback through animated XR shards.';

export type ImmersiveXRSessionMode = 'immersive-ar' | 'immersive-vr';

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

const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec2 texCoords;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

out vec2 vUV;
out float vPulse;

void main(void) {
  vec3 position = positions;
  float angle = atan(position.y, position.x);
  float radius = length(position.xy);
  position.z += sin(angle * 7.0 - app.time * 2.4) * radius * 0.10;
  position.z += cos(radius * 13.0 + app.time * 3.1) * 0.045;
  gl_Position = app.modelViewProjectionMatrix * vec4(position, 1.0);
  vUV = texCoords;
  vPulse = 0.5 + 0.5 * sin(angle * 5.0 + radius * 9.0 - app.time * 2.8);
}
`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D cameraTexture;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
  float time;
  float cameraMix;
} app;

in vec2 vUV;
in float vPulse;

out vec4 fragColor;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

vec2 kaleidoscopeUv(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float segment = TAU / 8.0;
  angle = abs(mod(angle + segment * 0.5, segment) - segment * 0.5);
  return vec2(cos(angle), sin(angle)) * radius * 0.5 + 0.5;
}

vec3 proceduralColor(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float aurora = 0.5 + 0.5 * sin(angle * 9.0 - radius * 16.0 - app.time * 2.2);
  float flare = exp(-abs(radius - 0.54) * 18.0);
  return mix(vec3(0.02, 0.04, 0.14), vec3(0.05, 0.95, 0.88), aurora) +
    vec3(0.75, 0.12, 1.0) * flare;
}

void main(void) {
  vec2 cameraUv = kaleidoscopeUv(vec2(vUV.x, 1.0 - vUV.y));
  vec3 cameraColor = texture(cameraTexture, cameraUv).rgb;
  vec3 color = mix(proceduralColor(vUV), cameraColor, app.cameraMix);
  float shardEdge = smoothstep(0.0, 0.08, min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y)));
  float scan = 0.88 + 0.12 * sin(vUV.y * 100.0 - app.time * 7.0);
  color = color * scan + vec3(0.08, 0.82, 1.0) * (1.0 - shardEdge) + vec3(0.48, 0.05, 0.92) * vPulse * 0.22;
  fragColor = vec4(color, 0.92);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static current: AppAnimationLoopTemplate | null = null;

  static info = `\
  <p>
  Experimental v10 WebXR work in progress. Enter AR to fold raw camera frames into a ring
  of animated portal shards when the browser exposes them; enter VR to view the procedural
  fallback in an Immersive Web Emulator headset.
  </p>
  `;

  readonly device: WebGLDevice;
  readonly animationLoop: AnimationProps['animationLoop'];
  readonly uniformStore: UniformStore<{app: AppUniforms}>;
  readonly fallbackTexture: Texture;
  readonly model: Model;
  readonly webXRManager: WebXRManager;
  readonly modelMatrix = new Matrix4();
  readonly modelViewProjectionMatrix = new Matrix4();
  readonly viewMatrix = new Matrix4().lookAt({eye: [0, 0, 3.5], center: [0, 0, 0]});
  readonly xrViewMatrix = new Matrix4();

  cameraTexture: WebXRCameraTexture | null = null;
  xrSession: XRSession | null = null;
  xrSessionMode: ImmersiveXRSessionMode | null = null;
  private _isFinalized = false;
  private _xrSessionEndListener = () => this._clearXRSession();
  private _xrSelectEndListener = () => void this.exitXR();
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
    if (device.type !== 'webgl') {
      throw new Error('Passthrough Kaleidoscope requires WebGL2');
    }

    AppAnimationLoopTemplate.current = this;
    this.animationLoop = animationLoop;
    this.device = device as WebGLDevice;
    this.uniformStore = new UniformStore(device, {app});
    this.fallbackTexture = device.createTexture({
      data: new Uint8Array([6, 12, 42, 255]),
      width: 1,
      height: 1,
      format: 'rgba8unorm'
    });
    this.webXRManager = new WebXRManager(device);
    this.model = new Model(device, {
      id: 'passthrough-kaleidoscope',
      vs,
      fs,
      geometry: makePortalShardGeometry(),
      bindings: {
        appUniforms: this.uniformStore.getManagedUniformBuffer('app'),
        cameraTexture: this.fallbackTexture
      },
      parameters: {
        depthWriteEnabled: true,
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

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyDownListener);
    }
  }

  onFinalize(): void {
    this._isFinalized = true;
    if (AppAnimationLoopTemplate.current === this) {
      AppAnimationLoopTemplate.current = null;
    }
    void this.exitAR();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._keyDownListener);
    }
    this.model.destroy();
    this.fallbackTexture.destroy();
    this.uniformStore.destroy();
    this.webXRManager.destroy();
  }

  onRender({animationFrame, aspect, device, tick}: AnimationProps): void {
    const time = tick * 0.001;
    const xrFrame = animationFrame as XRFrame | null;
    const frameState = xrFrame && this.xrSession ? this.webXRManager.getFrameState(xrFrame) : null;

    if (frameState) {
      this.renderXRFrame(time, frameState);
      return;
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

    const session = await navigator.xr.requestSession(sessionMode, getXRSessionInit(sessionMode));

    try {
      await this.webXRManager.setSession(session, {
        referenceSpaceType: 'local',
        layerInit: {alpha: sessionMode === 'immersive-ar'}
      });
      this.cameraTexture =
        sessionMode === 'immersive-ar' ? this.createCameraTexture(session) : null;
      this.xrSession = session;
      this.xrSessionMode = sessionMode;
      session.addEventListener('end', this._xrSessionEndListener);
      session.addEventListener('selectend', this._xrSelectEndListener);
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
      .perspective({fovy: Math.PI / 3.1, aspect, near: 0.1, far: 20})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);
    this.drawPortal(device.beginRenderPass({clearColor: [0.004, 0.006, 0.025, 1], clearDepth: 1}), {
      cameraMix: 0,
      texture: this.fallbackTexture,
      time
    });
  }

  private renderXRFrame(time: number, frameState: WebXRFrameState): void {
    this.updateModelMatrix(time, true);
    const clearAlpha = this.xrSessionMode === 'immersive-ar' ? 0 : 1;

    for (const [viewIndex, view] of frameState.views.entries()) {
      this.modelViewProjectionMatrix
        .copy(view.projectionMatrix)
        .multiplyRight(this.xrViewMatrix.copy(view.viewMatrix))
        .multiplyRight(this.modelMatrix);
      const cameraTexture = view.camera ? this.cameraTexture : null;
      cameraTexture?.setView(view.xrView);
      const renderPass = this.device.beginRenderPass({
        framebuffer: frameState.framebuffer,
        parameters: {viewport: view.viewport},
        clearColor: viewIndex === 0 ? [0.004, 0.006, 0.025, clearAlpha] : false,
        clearDepth: viewIndex === 0 ? 1 : false,
        clearStencil: false
      });
      this.drawPortal(renderPass, {
        cameraMix: cameraTexture ? 1 : 0,
        texture: cameraTexture || this.fallbackTexture,
        time
      });
    }
  }

  private drawPortal(
    renderPass: ReturnType<Device['beginRenderPass']>,
    options: {cameraMix: number; texture: Texture | WebXRCameraTexture; time: number}
  ): void {
    this.uniformStore.setUniforms({
      app: {
        modelViewProjectionMatrix: this.modelViewProjectionMatrix,
        time: options.time,
        cameraMix: options.cameraMix
      }
    });
    this.model.shaderInputs.setProps({bindings: {cameraTexture: options.texture}});
    this.model.draw(renderPass);
    renderPass.end();
  }

  private updateModelMatrix(time: number, isXR: boolean): void {
    this.modelMatrix.identity();
    if (isXR) {
      this.modelMatrix
        .translate([0, 0, -2.2])
        .scale([0.82, 0.82, 0.82])
        .rotateZ(time * 0.22)
        .rotateX(Math.sin(time * 0.8) * 0.12);
    } else {
      this.modelMatrix
        .rotateZ(time * 0.22)
        .rotateX(Math.sin(time * 0.8) * 0.24)
        .rotateY(Math.cos(time * 0.55) * 0.18);
    }
  }

  private createCameraTexture(session: XRSession): WebXRCameraTexture | null {
    if (typeof XRWebGLBinding === 'undefined') {
      return null;
    }

    try {
      const XRWebGLBindingConstructor = XRWebGLBinding as unknown as new (
        session: XRSession,
        context: WebGL2RenderingContext
      ) => XRWebGLBinding;
      const xrWebGLBinding = new XRWebGLBindingConstructor(session, this.device.gl);
      return new WebXRCameraTexture(this.device, xrWebGLBinding);
    } catch {
      return null;
    }
  }

  private _clearXRSession(): void {
    const session = this.xrSession;
    session?.removeEventListener('end', this._xrSessionEndListener);
    session?.removeEventListener('selectend', this._xrSelectEndListener);
    this.xrSession = null;
    this.xrSessionMode = null;
    this.cameraTexture?.destroy();
    this.cameraTexture = null;
    this.webXRManager.clearSession();
    if (!this._isFinalized) {
      this.animationLoop.setProps({animationFrameProvider: undefined});
    }
  }
}

function getXRSessionInit(sessionMode: ImmersiveXRSessionMode): XRSessionInit {
  return sessionMode === 'immersive-ar'
    ? {optionalFeatures: ['camera-access', 'local-floor']}
    : {optionalFeatures: ['local-floor']};
}

function makePortalShardGeometry(): Geometry {
  const positions: number[] = [];
  const texCoords: number[] = [];
  const shardCount = 18;
  const innerRadius = 0.22;
  const outerRadius = 1.16;

  for (let shardIndex = 0; shardIndex < shardCount; shardIndex++) {
    const centerAngle = (shardIndex / shardCount) * Math.PI * 2;
    const halfAngle = (Math.PI / shardCount) * 0.72;
    const innerLeft = makePolarPoint(innerRadius, centerAngle - halfAngle);
    const innerRight = makePolarPoint(innerRadius, centerAngle + halfAngle);
    const outerLeft = makePolarPoint(outerRadius, centerAngle - halfAngle * 0.78);
    const outerRight = makePolarPoint(outerRadius, centerAngle + halfAngle * 0.78);
    appendQuad(positions, texCoords, innerLeft, innerRight, outerRight, outerLeft);
  }

  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      positions: {size: 3, value: new Float32Array(positions)},
      texCoords: {size: 2, value: new Float32Array(texCoords)}
    }
  });
}

function makePolarPoint(radius: number, angle: number): [number, number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
}

function appendQuad(
  positions: number[],
  texCoords: number[],
  bottomLeft: [number, number, number],
  bottomRight: [number, number, number],
  topRight: [number, number, number],
  topLeft: [number, number, number]
): void {
  appendVertex(positions, texCoords, bottomLeft, [0, 0]);
  appendVertex(positions, texCoords, bottomRight, [1, 0]);
  appendVertex(positions, texCoords, topRight, [1, 1]);
  appendVertex(positions, texCoords, bottomLeft, [0, 0]);
  appendVertex(positions, texCoords, topRight, [1, 1]);
  appendVertex(positions, texCoords, topLeft, [0, 1]);
}

function appendVertex(
  positions: number[],
  texCoords: number[],
  position: [number, number, number],
  texCoord: [number, number]
): void {
  positions.push(...position);
  texCoords.push(...texCoord);
}
