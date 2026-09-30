// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {assert} from '@luma.gl/core';
import {
  FLOW_PARTICLE_FRAGMENT,
  FLOW_PARTICLE_VERTEX,
  FLOW_PARTICLE_WGSL
} from './flow-particle-shaders';

/** Hard allocation limit: two state textures use at most 32 MiB. */
export const MAX_FLOW_PARTICLES = 1048576;
/** Maximum simulated seconds per substep. A step executes at most eight substeps. */
export const FLOW_PARTICLE_TIME_STEP = 1 / 30;

/** A row-major vector grid. Row zero is the southern/lower edge, columns run west to east. */
export type FlowParticleField = {
  /** Borrowed rgba32float texture: (east velocity, north velocity, validity, unused).
   * Velocities are metres/second; validity >= 0.5 means data is present. All values must be finite.
   * Grid samples include the bounds' endpoints. At least two samples per axis are required.
   */
  texture: Texture;
  /** [west, south, east, north]. Metres for cartesian fields, degrees for lnglat fields.
   * For a dateline crossing, unwrap east above 180 (for example [170, -10, 190, 10]).
   */
  bounds: readonly [number, number, number, number];
  /** lnglat uses spherical east/north conversion at each particle's latitude, restricted to ±85°. */
  coordinates: 'cartesian' | 'lnglat';
};

export type FlowParticleSimulationProps = {
  id?: string;
  field: FlowParticleField;
  particleCount?: number;
  /** Maximum lifetime in simulated seconds. Defaults to 60. */
  lifetime?: number;
  /** Deterministic seed from 0 through 16777215. */
  seed?: number;
};

export type FlowParticleStepResult = {
  /** Borrowed rgba32float records (normalized X, normalized Y, age in seconds, generation).
   * Negative age means no valid spawn has been found. Particle IDs are stable row-major indices.
   */
  texture: Texture;
  /** Previous step's state, for drawing streaks. Suppress streaks when generations differ. */
  previousTexture: Texture;
  /** Simulated interval between the two state textures, retained while paused. */
  stateDeltaTime: number;
  advancedTime: number;
  droppedTime: number;
  substeps: number;
};

/** Whether float render targets required by the portable simulation are available. */
export function isFlowParticleSimulationSupported(device: Device): boolean {
  return (
    (device.type === 'webgl' || device.type === 'webgpu') &&
    device.isTextureFormatRenderable('rgba32float')
  );
}

/** Fixed-capacity GPU advection using midpoint integration and deterministic respawning.
 * Step submits one GPU pass; no particle data is read back. Velocity grids remain caller-owned.
 * The two state textures are reused: consume the returned state before the next step/reset.
 */
export class FlowParticleSimulation {
  readonly device: Device;
  readonly particleCount: number;
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly lifetime: number;
  readonly seed: number;
  private field: FlowParticleField;
  private readonly textures: Texture[] = [];
  private readonly framebuffers: Framebuffer[] = [];
  private readonly uniforms: Buffer;
  private readonly model: Model;
  private current = 0;
  private previous = 0;
  private stateDeltaTime = 0;
  private frame = 0;
  private destroyed = false;

  constructor(device: Device, props: FlowParticleSimulationProps) {
    this.device = device;
    this.particleCount = props.particleCount ?? 16384;
    this.lifetime = props.lifetime ?? 60;
    this.seed = props.seed ?? 1;
    // Counts, lifetimes and seeds must be finite and within the bounded simulation contract.
    assert(isFlowParticleSimulationSupported(device));
    assert(
      Number.isInteger(this.particleCount) &&
        this.particleCount > 0 &&
        this.particleCount <= MAX_FLOW_PARTICLES
    );
    assert(Number.isFinite(this.lifetime) && this.lifetime > 0);
    assert(Number.isInteger(this.seed) && this.seed >= 0 && this.seed <= 16777215);
    this.field = validateField(device, props.field);
    this.width = Math.min(1024, Math.ceil(Math.sqrt(this.particleCount)));
    this.height = Math.ceil(this.particleCount / this.width);
    this.byteLength = this.width * this.height * 16 * 2;
    const identifier = props.id ?? 'flow-particles';
    this.uniforms = device.createBuffer({
      id: `${identifier}-uniforms`,
      byteLength: 48,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    try {
      for (let index = 0; index < 2; index++) {
        const texture = device.createTexture({
          id: `${identifier}-state-${index}`,
          width: this.width,
          height: this.height,
          format: 'rgba32float',
          usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
          sampler: {minFilter: 'nearest', magFilter: 'nearest'}
        });
        this.textures.push(texture);
        this.framebuffers.push(
          device.createFramebuffer({
            id: `${identifier}-target-${index}`,
            width: this.width,
            height: this.height,
            colorAttachments: [texture]
          })
        );
      }
      this.model = new Model(device, {
        id: identifier,
        source: FLOW_PARTICLE_WGSL,
        vs: FLOW_PARTICLE_VERTEX,
        fs: FLOW_PARTICLE_FRAGMENT,
        topology: 'triangle-list',
        vertexCount: 3,
        shaderLayout: {
          attributes: [],
          bindings: [
            {name: 'flowUniforms', type: 'uniform', group: 0, location: 0},
            {
              name: 'particleTexture',
              type: 'texture',
              group: 0,
              location: 1,
              sampleType: 'unfilterable-float'
            },
            {
              name: 'velocityTexture',
              type: 'texture',
              group: 0,
              location: 2,
              sampleType: 'unfilterable-float'
            }
          ]
        },
        parameters: {blend: false},
        bindings: {
          flowUniforms: this.uniforms,
          particleTexture: this.textures[0],
          velocityTexture: this.field.texture
        }
      });
      this.reset();
    } catch (error) {
      this.uniforms.destroy();
      for (const framebuffer of this.framebuffers) framebuffer.destroy();
      for (const texture of this.textures) texture.destroy();
      throw error;
    }
  }

  /** Replaces a time-varying grid. Bounds/coordinate changes invalidate old particle positions. */
  setField(field: FlowParticleField): void {
    assert(!this.destroyed);
    const nextField = validateField(this.device, field);
    const changedDomain =
      nextField.coordinates !== this.field.coordinates ||
      nextField.bounds.some((value, index) => value !== this.field.bounds[index]);
    this.field = nextField;
    if (changedDomain) this.reset();
  }

  /** Resets reproducibly. Particles become visible when the next positive step finds valid data. */
  reset(): void {
    assert(!this.destroyed);
    const initialState = new Float32Array(this.width * this.height * 4);
    for (let index = 0; index < this.width * this.height; index++) initialState[index * 4 + 2] = -1;
    for (const texture of this.textures) texture.writeData(initialState);
    this.current = 0;
    this.previous = 0;
    this.stateDeltaTime = 0;
    this.frame = 0;
  }

  /** Advances in seconds, clamping long gaps to eight substeps rather than jumping across the field.
   * Passing zero pauses without changing state, generations, or texture references.
   */
  step(deltaTime: number): FlowParticleStepResult {
    assert(!this.destroyed);
    assert(Number.isFinite(deltaTime) && deltaTime >= 0);
    const advancedTime = Math.min(deltaTime, FLOW_PARTICLE_TIME_STEP * 8);
    const substeps = Math.ceil(advancedTime / FLOW_PARTICLE_TIME_STEP);
    const previousTexture = this.textures[this.current];
    if (substeps > 0) {
      this.uniforms.write(
        new Float32Array([
          this.field.bounds[0],
          this.field.bounds[1],
          this.field.bounds[2] - this.field.bounds[0],
          this.field.bounds[3] - this.field.bounds[1],
          this.particleCount,
          advancedTime / substeps,
          this.lifetime,
          substeps,
          this.width,
          this.frame,
          this.seed,
          this.field.coordinates === 'lnglat' ? 1 : 0
        ])
      );
      this.model.setBindings({
        particleTexture: previousTexture,
        velocityTexture: this.field.texture
      });
      const commandEncoder = this.device.createCommandEncoder();
      this.model.predraw(commandEncoder);
      const next = 1 - this.current;
      const renderPass = commandEncoder.beginRenderPass({
        framebuffer: this.framebuffers[next],
        clearColor: false,
        clearDepth: false
      });
      this.model.draw(renderPass);
      renderPass.end();
      this.device.submit(commandEncoder.finish());
      this.previous = this.current;
      this.current = next;
      this.stateDeltaTime = advancedTime;
      this.frame = (this.frame + 1) % 65536;
    }
    return {
      texture: this.textures[this.current],
      previousTexture: this.textures[this.previous],
      stateDeltaTime: this.stateDeltaTime,
      advancedTime,
      droppedTime: deltaTime - advancedTime,
      substeps
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.model.destroy();
    this.uniforms.destroy();
    for (const framebuffer of this.framebuffers) framebuffer.destroy();
    for (const texture of this.textures) texture.destroy();
  }
}

function validateField(device: Device, field: FlowParticleField): FlowParticleField {
  const [west, south, east, north] = field.bounds;
  // Field samples must be finite; a finite validity channel marks missing data.
  assert(
    field.texture.device === device &&
      !field.texture.destroyed &&
      field.texture.format === 'rgba32float'
  );
  assert(field.texture.width >= 2 && field.texture.height >= 2);
  assert(field.bounds.every(Number.isFinite) && east > west && north > south);
  assert(field.coordinates === 'cartesian' || field.coordinates === 'lnglat');
  assert(field.coordinates !== 'lnglat' || (south >= -85 && north <= 85 && east - west <= 360));
  return {...field, bounds: [...field.bounds]};
}
