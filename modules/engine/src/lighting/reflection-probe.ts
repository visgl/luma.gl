// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  Buffer,
  type Device,
  type Framebuffer,
  Texture,
  type TextureView
} from '@luma.gl/core';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {PBR_ENVIRONMENT_FRAGMENT_WGSL, pbrEnvironmentFilter} from '@luma.gl/shaders';
import {ClipSpace} from '../models/clip-space';
import {ShaderInputs} from '../shader-inputs';

const FACES: {direction: NumberArray3; up: NumberArray3}[] = [
  {direction: [1, 0, 0], up: [0, -1, 0]},
  {direction: [-1, 0, 0], up: [0, -1, 0]},
  {direction: [0, 1, 0], up: [0, 0, 1]},
  {direction: [0, -1, 0], up: [0, 0, -1]},
  {direction: [0, 0, 1], up: [0, -1, 0]},
  {direction: [0, 0, -1], up: [0, -1, 0]}
];

export type ReflectionProbeView = {
  face: number;
  framebuffer: Framebuffer;
  /** Face rotation. The renderer subtracts the GPU origin before applying this matrix. */
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  /** One vec4f containing the capture origin; borrowed until the next update cycle. */
  origin: Buffer;
  /** Snapshot of all source poses, shared across the six capture faces. */
  matrices: Buffer;
};

export type ReflectionProbeUpdate = {
  /** Producer buffer with COPY_SRC usage and a column-major float32 matrix at matrixIndex. */
  matrices: Buffer;
  matrixIndex: number;
  /** Last completed frame's measured CPU-to-GPU-completion work, in milliseconds. */
  frameMilliseconds?: number;
  /** When false, finish any current refresh and retain it until the scene changes. */
  refresh?: boolean;
  /** World-space directions from the probe toward the views that sample it. */
  viewDirections?: readonly Readonly<NumberArray3>[];
  draw: (view: ReflectionProbeView) => void;
};

export type ReflectionProbeProps = {
  size?: number;
  sampleCount?: number;
  frameBudgetMilliseconds?: number;
  maximumFacesPerFrame?: number;
  /** Capture and publish in the same frame, with the budget controlling filtering quality. */
  refreshMode?: 'incremental' | 'same-frame';
  /** Number of specular mips, including the sharp capture. Defaults to four, up to the texture limit. */
  mipLevels?: number;
};

/** WebGPU capture and specular filtering with a complete, double-buffered publication. */
export class ReflectionProbe {
  private readonly device: Device;
  private readonly origin: Buffer;
  private matrixSnapshot?: Buffer;
  private readonly capture: Texture;
  private readonly depth: Texture;
  private readonly targets: [Texture, Texture];
  private readonly views: TextureView[] = [];
  private readonly framebuffers: Framebuffer[] = [];
  private readonly captureTargets: Framebuffer[] = [];
  private readonly filterTargets: Framebuffer[][][] = [];
  private readonly filter: ClipSpace;
  private readonly size: number;
  private readonly sampleCount: number;
  private activeSampleCount: number;
  private readonly budget: number;
  private readonly maximumFaces: number;
  private readonly sameFrame: boolean;
  private readonly projectionMatrix = new Matrix4([
    1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
  ]).multiplyRight(new Matrix4().perspective({fovy: Math.PI / 2, aspect: 1, near: 0.05, far: 100}));
  private readonly pendingFaces = new Set<number>();
  private captureCount = 0;
  private filteredCount = 0;
  private front: number | undefined;
  private back = 0;
  private credit = 0;
  private pausedFrames = 0;
  private destroyed = false;

  constructor(device: Device, props: ReflectionProbeProps = {}) {
    assert(device.type === 'webgpu');
    this.device = device;
    this.size = props.size ?? 32;
    this.sampleCount = props.sampleCount ?? 16;
    this.activeSampleCount = this.sampleCount;
    this.budget = props.frameBudgetMilliseconds ?? 1000 / 60;
    this.maximumFaces = props.maximumFacesPerFrame ?? 2;
    this.sameFrame = props.refreshMode === 'same-frame';
    assert(
      Number.isInteger(this.size) &&
        this.size > 0 &&
        this.size <= device.limits.maxTextureDimension2D
    );
    assert(Number.isInteger(this.sampleCount) && this.sampleCount > 0 && this.sampleCount <= 1024);
    assert(Number.isFinite(this.budget) && this.budget > 0);
    assert(Number.isInteger(this.maximumFaces) && this.maximumFaces > 0 && this.maximumFaces <= 6);
    const capabilities = device.getTextureFormatCapabilities('rgba16float');
    assert(capabilities.render && capabilities.filter);
    const requestedMipLevels = props.mipLevels ?? 4;
    assert(Number.isSafeInteger(requestedMipLevels) && requestedMipLevels > 0);
    const mipLevels = Math.min(requestedMipLevels, device.getMipLevelCount(this.size, this.size));
    this.origin = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_DST});
    this.capture = this.createCube('reflection-capture', 1);
    this.targets = [
      this.createCube('reflection-filter-a', mipLevels),
      this.createCube('reflection-filter-b', mipLevels)
    ];
    this.depth = device.createTexture({
      width: this.size,
      height: this.size,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    for (let face = 0; face < FACES.length; face++)
      this.captureTargets.push(this.createTarget(this.capture, face, 0, this.depth));
    for (const texture of this.targets) {
      this.filterTargets.push(
        FACES.map((_, face) =>
          Array.from({length: mipLevels - 1}, (_, mip) => this.createTarget(texture, face, mip + 1))
        )
      );
    }
    this.filter = new ClipSpace(device, {
      id: 'reflection-probe-filter',
      source: PBR_ENVIRONMENT_FRAGMENT_WGSL,
      defines: {PBR_ENVIRONMENT_CUBE_SOURCE: true},
      modules: [pbrEnvironmentFilter],
      shaderInputs: new ShaderInputs({pbrEnvironmentFilter}),
      colorAttachmentFormats: ['rgba16float'],
      parameters: {depthWriteEnabled: false}
    });
  }

  get texture(): Texture | undefined {
    return this.front === undefined ? undefined : this.targets[this.front];
  }

  /**
   * Record capture and filtering before the main draw. A budget estimate controls work or quality.
   * Returns the number of face work units recorded. Submit the frame before calling again.
   */
  update(options: ReflectionProbeUpdate): number {
    assert(!this.destroyed);
    assert(options.matrices.device === this.device && options.matrices.usage & Buffer.COPY_SRC);
    assert(
      Number.isSafeInteger(options.matrixIndex) &&
        options.matrixIndex >= 0 &&
        (options.matrixIndex + 1) * 64 <= options.matrices.byteLength
    );
    if (options.refresh === false && this.front !== undefined && this.captureCount === 0) return 0;
    const snapshotChanged = this.matrixSnapshot?.byteLength !== options.matrices.byteLength;
    if (snapshotChanged) {
      this.matrixSnapshot?.destroy();
      this.matrixSnapshot = this.device.createBuffer({
        byteLength: options.matrices.byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
      this.captureCount = 0;
      this.filteredCount = 0;
      this.pendingFaces.clear();
    }
    const measured = options.frameMilliseconds;
    const headroom =
      measured !== undefined && Number.isFinite(measured)
        ? Math.max(0, Math.min(this.budget, this.budget - measured))
        : this.budget / 4;
    let available: number;
    if (this.sameFrame) {
      // Keep the probe in step with the scene. Recover quality only with spare
      // headroom so the sample count stays stable near the frame budget.
      if (measured !== undefined && Number.isFinite(measured)) {
        if (measured > this.budget) {
          this.activeSampleCount = Math.max(
            Math.min(4, this.sampleCount),
            Math.floor(this.activeSampleCount / 2)
          );
        } else if (headroom >= this.budget / 4) {
          this.activeSampleCount = Math.min(this.sampleCount, this.activeSampleCount + 1);
        }
      }
      available = FACES.length * 2;
    } else {
      this.credit = Math.min(this.maximumFaces, this.credit + headroom);
      available = Math.floor(this.credit);
      if (available === 0 && ++this.pausedFrames >= 3) available = 1;
      if (available === 0) return 0;
      this.credit = Math.max(0, this.credit - available);
    }
    this.pausedFrames = 0;

    if (this.captureCount === 0 && this.filteredCount === 0) {
      this.device.commandEncoder.copyBufferToBuffer({
        sourceBuffer: options.matrices,
        destinationBuffer: this.matrixSnapshot!,
        size: options.matrices.byteLength
      });
      this.device.commandEncoder.copyBufferToBuffer({
        sourceBuffer: this.matrixSnapshot!,
        sourceOffset: options.matrixIndex * 64 + 48,
        destinationBuffer: this.origin,
        size: 16
      });
      for (let face = 0; face < FACES.length; face++) this.pendingFaces.add(face);
    }
    let used = 0;
    while (used < available && this.captureCount < FACES.length) {
      const face = this.nextFace(options.viewDirections ?? []);
      const {direction, up} = FACES[face];
      options.draw({
        face,
        framebuffer: this.captureTargets[face],
        viewMatrix: new Matrix4().lookAt({eye: [0, 0, 0], center: direction, up}),
        projectionMatrix: this.projectionMatrix,
        matrices: this.matrixSnapshot!,
        origin: this.origin
      });
      this.pendingFaces.delete(face);
      this.captureCount++;
      used++;
    }
    while (used < available && this.filteredCount < FACES.length) {
      this.filterFace(this.filteredCount);
      this.filteredCount++;
      used++;
    }
    if (this.filteredCount === FACES.length) {
      this.front = this.back;
      this.back = 1 - this.back;
      this.captureCount = 0;
      this.filteredCount = 0;
    }
    return used;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.filter.destroy();
    for (const framebuffer of this.framebuffers) framebuffer.destroy();
    for (const view of this.views) view.destroy();
    for (const target of this.targets) target.destroy();
    this.capture.destroy();
    this.depth.destroy();
    this.origin.destroy();
    this.matrixSnapshot?.destroy();
  }

  private nextFace(directions: readonly Readonly<NumberArray3>[]): number {
    let bestFace = -1;
    let bestScore = -Infinity;
    for (const face of this.pendingFaces) {
      const normal = FACES[face].direction;
      const score = directions.length
        ? Math.max(
            ...directions.map(direction => {
              const length = Math.hypot(...direction);
              return length > 0
                ? (normal[0] * direction[0] + normal[1] * direction[1] + normal[2] * direction[2]) /
                    length
                : 0;
            })
          )
        : 0;
      if (score > bestScore) {
        bestScore = score;
        bestFace = face;
      }
    }
    return bestFace;
  }

  private createCube(id: string, mipLevels: number): Texture {
    return this.device.createTexture({
      id,
      dimension: 'cube',
      width: this.size,
      height: this.size,
      depth: 6,
      format: 'rgba16float',
      mipLevels,
      usage: Texture.RENDER | Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST,
      sampler: {minFilter: 'linear', magFilter: 'linear', mipmapFilter: 'linear'}
    });
  }

  private createTarget(
    texture: Texture,
    face: number,
    mip: number,
    depth: Texture | null = null
  ): Framebuffer {
    const view = texture.createView({
      dimension: '2d',
      baseArrayLayer: face,
      arrayLayerCount: 1,
      baseMipLevel: mip,
      mipLevelCount: 1
    });
    this.views.push(view);
    const size = Math.max(1, this.size >> mip);
    const framebuffer = this.device.createFramebuffer({
      width: size,
      height: size,
      colorAttachments: [view],
      depthStencilAttachment: depth
    });
    this.framebuffers.push(framebuffer);
    return framebuffer;
  }

  private filterFace(face: number): void {
    const targets = this.filterTargets[this.back][face];
    this.device.commandEncoder.copyTextureToTexture({
      sourceTexture: this.capture,
      destinationTexture: this.targets[this.back],
      origin: [0, 0, face],
      destinationOrigin: [0, 0, face],
      width: this.size,
      height: this.size,
      depthOrArrayLayers: 1
    });
    for (const [index, framebuffer] of targets.entries()) {
      const mip = index + 1;
      this.filter.shaderInputs.setProps({
        pbrEnvironmentFilter: {
          face,
          roughness: mip / targets.length,
          mode: 0,
          sampleCount: this.activeSampleCount,
          sourceEncoding: 0,
          pbrEnvironmentSource: this.capture
        }
      });
      this.filter.predraw(this.device.commandEncoder);
      const pass = this.device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 1],
        clearDepth: false
      });
      try {
        this.filter.draw(pass);
      } finally {
        pass.end();
      }
    }
  }
}
