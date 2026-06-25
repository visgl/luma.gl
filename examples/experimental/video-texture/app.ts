// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CylinderGeometry, Model, VideoTexture} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

export const title = 'Video Texture';
export const description = 'Wraps a live video texture around a rotating cylinder.';

type AppUniforms = {
  modelMatrix: NumberArray;
  modelViewProjectionMatrix: NumberArray;
  time: number;
  videoFlipX: number;
};

type LiveVideoSource = {
  video: HTMLVideoElement;
  drawFrame: (time: number) => void;
  destroy: () => void;
};

const app: {uniformTypes: Record<keyof AppUniforms, VariableShaderType>} = {
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    modelViewProjectionMatrix: 'mat4x4<f32>',
    time: 'f32',
    videoFlipX: 'f32'
  }
};

const source = /* wgsl */ `\
struct AppUniforms {
  modelMatrix: mat4x4<f32>,
  modelViewProjectionMatrix: mat4x4<f32>,
  time: f32,
  videoFlipX: f32,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;
@group(0) @binding(auto) var videoTexture : texture_external;
@group(0) @binding(auto) var videoTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) uv : vec2<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * vec4<f32>(inputs.positions, 1.0);
  outputs.normal = normalize((app.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.uv = inputs.texCoords;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let videoUv = vec2<f32>(
    mix(inputs.uv.x, 1.0 - inputs.uv.x, app.videoFlipX),
    1.0 - inputs.uv.y
  );
  let videoColor = textureSampleBaseClampToEdge(
    videoTexture,
    videoTextureSampler,
    videoUv
  ).rgb;
  let rim = pow(1.0 - abs(dot(normalize(inputs.normal), vec3<f32>(0.0, 0.0, 1.0))), 2.5);
  let scan = 0.88 + 0.12 * sin(inputs.uv.y * 90.0 - app.time * 5.0);
  let beaconColor = videoColor * scan + vec3<f32>(0.1, 0.55, 1.0) * rim;
  return vec4<f32>(beaconColor, 1.0);
}
`;

const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 modelViewProjectionMatrix;
  float time;
  float videoFlipX;
} app;

out vec3 vNormal;
out vec2 vUV;

void main(void) {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  vNormal = normalize(vec3(app.modelMatrix * vec4(normals, 0.0)));
  vUV = texCoords;
}
`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D videoTexture;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 modelViewProjectionMatrix;
  float time;
  float videoFlipX;
} app;

in vec3 vNormal;
in vec2 vUV;

out vec4 fragColor;

void main(void) {
  vec2 videoUv = vec2(mix(vUV.x, 1.0 - vUV.x, app.videoFlipX), 1.0 - vUV.y);
  vec3 videoColor = texture(videoTexture, videoUv).rgb;
  float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.5);
  float scan = 0.88 + 0.12 * sin(vUV.y * 90.0 - app.time * 5.0);
  vec3 beaconColor = videoColor * scan + vec3(0.1, 0.55, 1.0) * rim;
  fragColor = vec4(beaconColor, 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static current: AppAnimationLoopTemplate | null = null;

  static info = `\
	<p>
	Wraps a live <code>VideoTexture</code> around a rotating <code>CylinderGeometry</code>.
	WebGL samples the copied <code>sampler2D</code> path; WebGPU samples the native
	<code>texture_external</code> path when the browser supports it.
	</p>
`;

  readonly modelMatrix = new Matrix4();
  readonly modelViewProjectionMatrix = new Matrix4();
  readonly viewMatrix = new Matrix4().lookAt({eye: [0, 0.1, 4.4], center: [0, 0, 0]});
  readonly uniformStore: UniformStore<{app: AppUniforms}>;
  videoSource: LiveVideoSource;
  readonly videoTexture: VideoTexture;
  readonly model: Model;
  private _isFinalized = false;
  private _videoFlipX = 0;

  constructor({device}: AnimationProps) {
    super();
    AppAnimationLoopTemplate.current = this;
    this.uniformStore = new UniformStore(device, {app});
    this.videoSource = createProceduralVideoSource();
    this.videoTexture = new VideoTexture(device, {
      source: this.videoSource.video,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear'
      }
    });
    this.model = new Model(device, {
      id: 'video-texture-beacon',
      source,
      vs,
      fs,
      geometry: new CylinderGeometry({
        radius: 1.25,
        height: 2.7,
        nradial: 96,
        nvertical: 32
      }),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app'),
        videoTexture: this.videoTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize(): void {
    this._isFinalized = true;
    if (AppAnimationLoopTemplate.current === this) {
      AppAnimationLoopTemplate.current = null;
    }
    this.model.destroy();
    this.videoTexture.destroy();
    this.videoSource.destroy();
    this.uniformStore.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps): void {
    const time = tick * 0.001;
    this.videoSource.drawFrame(time);
    this.modelMatrix
      .identity()
      .rotateX(-0.12 + Math.sin(time * 0.9) * 0.08)
      .rotateY(time * 1.45)
      .rotateZ(Math.sin(time * 0.65) * 0.06);
    this.modelViewProjectionMatrix
      .perspective({fovy: Math.PI / 3.4, aspect})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);
    this.uniformStore.setUniforms({
      app: {
        modelMatrix: this.modelMatrix,
        modelViewProjectionMatrix: this.modelViewProjectionMatrix,
        time,
        videoFlipX: this._videoFlipX
      }
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0.015, 0.02, 0.05, 1],
      clearDepth: 1
    });
    this.model.draw(renderPass);
    renderPass.end();
  }

  async useCamera(): Promise<void> {
    const cameraVideoSource = await createCameraVideoSource();
    if (this._isFinalized) {
      cameraVideoSource.destroy();
      return;
    }

    const previousVideoSource = this.videoSource;
    this.videoSource = cameraVideoSource;
    this.videoTexture.setSource(cameraVideoSource.video);
    this._videoFlipX = 1;
    previousVideoSource.destroy();
  }
}

function createProceduralVideoSource(): LiveVideoSource {
  if (typeof document === 'undefined') {
    throw new Error('Video texture example requires a browser document');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 432;
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) {
    throw new Error('Could not create video source canvas');
  }

  const video = createVideoElement();

  drawProceduralVideoFrame(context, canvas, 0);
  const stream = canvas.captureStream(0);
  video.srcObject = stream;
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
  track?.requestFrame?.();
  void video.play().catch(() => {});

  return {
    video,
    drawFrame: time => {
      drawProceduralVideoFrame(context, canvas, time);
      track?.requestFrame?.();
    },
    destroy: () => {
      video.pause();
      video.srcObject = null;
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
  };
}

async function createCameraVideoSource(): Promise<LiveVideoSource> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera capture is not supported in this browser');
  }

  const video = createVideoElement();
  const stream = await navigator.mediaDevices.getUserMedia({video: true});
  video.srcObject = stream;

  try {
    await startPlayingAndWaitForVideo(video);
  } catch (error) {
    destroyVideoStream(video, stream);
    throw error;
  }

  return {
    video,
    drawFrame: () => {},
    destroy: () => destroyVideoStream(video, stream)
  };
}

function createVideoElement(): HTMLVideoElement {
  if (typeof document === 'undefined') {
    throw new Error('Video texture example requires a browser document');
  }

  const video = document.createElement('video');
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  return video;
}

function startPlayingAndWaitForVideo(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const videoWithFrameCallback = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    let frameCallbackHandle: number | null = null;
    let animationFrameHandle: number | null = null;

    const cleanup = () => {
      video.removeEventListener('error', rejectVideoError);
      if (frameCallbackHandle !== null) {
        videoWithFrameCallback.cancelVideoFrameCallback?.(frameCallbackHandle);
      }
      if (animationFrameHandle !== null) {
        cancelAnimationFrame(animationFrameHandle);
      }
    };
    const resolveVideo = () => {
      cleanup();
      resolve();
    };
    const rejectVideo = (error: unknown) => {
      cleanup();
      reject(error instanceof Error ? error : new Error('Could not start camera video'));
    };
    const rejectVideoError = () => rejectVideo(new Error('Could not load camera video'));
    const watchCurrentTime = () => {
      if (video.readyState >= 2 && video.currentTime > 0) {
        resolveVideo();
      } else {
        animationFrameHandle = requestAnimationFrame(watchCurrentTime);
      }
    };

    video.addEventListener('error', rejectVideoError, {once: true});
    if (videoWithFrameCallback.requestVideoFrameCallback) {
      frameCallbackHandle = videoWithFrameCallback.requestVideoFrameCallback(resolveVideo);
    } else {
      watchCurrentTime();
    }
    void video.play().catch(rejectVideo);
  });
}

function destroyVideoStream(video: HTMLVideoElement, stream: MediaStream): void {
  video.pause();
  video.srcObject = null;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function drawProceduralVideoFrame(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number
): void {
  const {width, height} = canvas;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3.2);
  context.globalCompositeOperation = 'source-over';
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, pulse > 0.5 ? '#071944' : '#091129');
  gradient.addColorStop(0.45, pulse > 0.5 ? '#107e9a' : '#104b74');
  gradient.addColorStop(1, pulse > 0.5 ? '#ff3e9b' : '#f02d8b');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'screen';
  for (let lineIndex = 0; lineIndex < 18; lineIndex++) {
    const y = (lineIndex + 0.5) * (height / 18);
    context.beginPath();
    for (let x = 0; x <= width; x += 12) {
      const shiftedX = x + time * 260;
      const wave =
        Math.sin(shiftedX * 0.022 + lineIndex * 0.55) * 22 +
        Math.cos(shiftedX * 0.009 - lineIndex * 0.32) * 13;
      if (x === 0) {
        context.moveTo(x, y + wave);
      } else {
        context.lineTo(x, y + wave);
      }
    }
    context.lineWidth = lineIndex % 3 === 0 ? 5 : 2;
    context.strokeStyle =
      lineIndex % 3 === 0 ? 'rgba(132, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.22)';
    context.stroke();
  }

  const bandX = ((time * 430) % (width + 180)) - 180;
  const bandGradient = context.createLinearGradient(bandX, 0, bandX + 180, 0);
  bandGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  bandGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
  bandGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = bandGradient;
  context.fillRect(bandX, 0, 180, height);

  const orbX = width * (0.5 + 0.34 * Math.cos(time * 2.4));
  const orbY = height * (0.42 + 0.24 * Math.sin(time * 3.1));
  const orbGradient = context.createRadialGradient(orbX, orbY, 0, orbX, orbY, 140);
  orbGradient.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
  orbGradient.addColorStop(0.25, 'rgba(85, 247, 255, 0.62)');
  orbGradient.addColorStop(1, 'rgba(85, 247, 255, 0)');
  context.fillStyle = orbGradient;
  context.fillRect(orbX - 140, orbY - 140, 280, 280);
}
