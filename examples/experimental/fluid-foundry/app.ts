// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type CommandEncoder,
  type Device,
  type Framebuffer,
  type Sampler,
  Texture
} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  Computation,
  Model,
  ShaderInputs,
  ShaderPassRenderer,
  type AnimationProps
} from '@luma.gl/engine';
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import {MLSMPMFluidSimulation, type MLSMPMParticle} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';

const PARTICLE_COUNT = 12_288;
const GRID_SIZE: readonly [number, number] = [96, 64];
const DENSITY_MAP_SIZE = 640;
const MAXIMUM_FRAME_DELTA_SECONDS = 1 / 60;
const NOZZLE_WORKGROUP_SIZE = 64;
const NOZZLE_CYCLE_SECONDS = 7.6;
const NOZZLE_CHARGE_SECONDS = 0.65;
const NOZZLE_BURST_SECONDS = 0.9;
const NOZZLE_COOLDOWN_SECONDS = 0.55;
const NOZZLE_FIRST_CHARGE_SECONDS = [3.1, 6.7] as const;

/** Optional lower-cost overrides used by focused WebGPU tests. */
export type FluidFoundryExampleProps = Pick<AnimationProps, 'device' | 'width' | 'height'> & {
  particleCount?: number;
  gridSize?: readonly [number, number];
  densityMapSize?: number;
};

type DensityTarget = {
  texture: Texture;
  framebuffer: Framebuffer;
};

type SceneTarget = {
  width: number;
  height: number;
  texture: Texture;
  framebuffer: Framebuffer;
};

type FluidFoundrySceneUniforms = {
  time: number;
  aspect: number;
  densityScale: number;
  interaction: number;
  nozzleActivity: [number, number];
};

const fluidFoundrySceneUniforms: ShaderModule<FluidFoundrySceneUniforms> = {
  name: 'fluidFoundryScene',
  uniformTypes: {
    time: 'f32',
    aspect: 'f32',
    densityScale: 'f32',
    interaction: 'f32',
    nozzleActivity: 'vec2<f32>'
  }
};

export type FoundryNozzleCycleState = {
  activity: number;
  emissionProgress: number;
  firing: boolean;
  cycleIndex: number;
};

const NOZZLE_EMITTER_SHADER = /* wgsl */ `\
struct MLSMPMParticleState {
  position: vec2f,
  velocity: vec2f,
  affineColumn0: vec2f,
  affineColumn1: vec2f,
  deformationPadding: vec4f,
};

struct FoundryNozzleEmitterUniforms {
  particleRange: vec4f,
  nozzle: vec4f,
};

@group(0) @binding(0) var<storage, read_write> particles: array<MLSMPMParticleState>;
@group(0) @binding(1) var<uniform> uniforms: FoundryNozzleEmitterUniforms;

fn random01(value: u32) -> f32 {
  var state = value * 747796405u + 2891336453u;
  state = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  state = (state >> 22u) ^ state;
  return f32(state) / 4294967296.0;
}

@compute @workgroup_size(${NOZZLE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let emittedParticleIndex = globalInvocationId.x;
  let emitCount = u32(uniforms.particleRange.y);
  if (emittedParticleIndex >= emitCount) {
    return;
  }

  let particleIndex = u32(uniforms.particleRange.x) + emittedParticleIndex;
  let sequenceIndex = u32(uniforms.particleRange.z) + emittedParticleIndex;
  let nozzleIndex = u32(uniforms.particleRange.w);
  let randomX = random01(sequenceIndex * 2u + nozzleIndex * 104729u);
  let randomY = random01(sequenceIndex * 2u + 1u + nozzleIndex * 130363u);
  let centerX = uniforms.nozzle.x;
  let streamHalfWidth = uniforms.nozzle.y;
  let downwardSpeed = uniforms.nozzle.z;
  let lateralSpeed = uniforms.nozzle.w;

  var particle: MLSMPMParticleState;
  particle.position = vec2f(
    centerX + (randomX * 2.0 - 1.0) * streamHalfWidth,
    0.955 - randomY * 0.028
  );
  particle.velocity = vec2f(
    lateralSpeed * (0.55 + randomY * 0.45) + (randomX - 0.5) * 0.035,
    -downwardSpeed * (0.9 + randomY * 0.2)
  );
  particle.affineColumn0 = vec2f(0.0);
  particle.affineColumn1 = vec2f(0.0);
  particle.deformationPadding = vec4f(1.0, 0.0, 0.0, 0.0);
  particles[particleIndex] = particle;
}
`;

const PARTICLE_SPLAT_SHADER = /* wgsl */ `\
struct MLSMPMParticleState {
  position: vec2f,
  velocity: vec2f,
  affineColumn0: vec2f,
  affineColumn1: vec2f,
  deformationPadding: vec4f,
};

@group(0) @binding(0) var<storage, read> particles: array<MLSMPMParticleState>;

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) localPosition: vec2f,
  @location(1) velocityMagnitude: f32,
  @location(2) deformation: f32,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  let corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
    vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0)
  );
  let particle = particles[instanceIndex];
  let corner = corners[vertexIndex];
  let speed = length(particle.velocity);
  let radius = 0.0112;
  let clipPosition = particle.position * 2.0 - vec2f(1.0) + corner * radius * 2.0;
  var output: FragmentInputs;
  output.position = vec4f(clipPosition, 0.0, 1.0);
  output.localPosition = corner;
  output.velocityMagnitude = speed;
  output.deformation = particle.deformationPadding.x;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let radiusSquared = dot(inputs.localPosition, inputs.localPosition);
  if (radiusSquared > 1.0) {
    discard;
  }
  let density = exp(-radiusSquared * 3.1);
  let energeticDensity = density * (0.25 + min(inputs.velocityMagnitude, 2.0) * 0.45);
  return vec4f(density, energeticDensity, density * inputs.deformation, density);
}
`;

const COMPOSITE_SHADER = /* wgsl */ `\
struct FluidFoundrySceneUniforms {
  time: f32,
  aspect: f32,
  densityScale: f32,
  interaction: f32,
  nozzleActivity: vec2f,
};
@group(0) @binding(auto) var<uniform> fluidFoundryScene: FluidFoundrySceneUniforms;
@group(0) @binding(0) var fluidDensityTexture: texture_2d<f32>;
@group(0) @binding(1) var fluidDensitySampler: sampler;

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> FragmentInputs {
  let positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  let position = positions[vertexIndex];
  var output: FragmentInputs;
  output.position = vec4f(position, 0.0, 1.0);
  output.uv = position * 0.5 + vec2f(0.5);
  return output;
}

fn roundedBoxDistance(position: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let offset = abs(position) - halfSize + vec2f(radius);
  return length(max(offset, vec2f(0.0))) + min(max(offset.x, offset.y), 0.0) - radius;
}

fn getBrickColor(uv: vec2f) -> vec3f {
  let brickScale = vec2f(9.0, 13.0);
  let brickCoordinate = uv * brickScale;
  let row = floor(brickCoordinate.y);
  let staggered = vec2f(brickCoordinate.x + 0.5 * (row - 2.0 * floor(row * 0.5)), brickCoordinate.y);
  let cell = fract(staggered);
  let edge = min(min(cell.x, 1.0 - cell.x), min(cell.y, 1.0 - cell.y));
  let mortar = 1.0 - smoothstep(0.035, 0.075, edge);
  let variation = 0.72 + 0.16 * sin(dot(floor(staggered), vec2f(12.9898, 78.233)));
  let brick = vec3f(0.075, 0.055, 0.052) * variation;
  return mix(brick, vec3f(0.018, 0.022, 0.03), mortar);
}

fn sampleFluid(uv: vec2f) -> vec4f {
  return textureSampleLevel(fluidDensityTexture, fluidDensitySampler, uv, 0.0);
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let uv = inputs.uv;
  let centered = uv * 2.0 - vec2f(1.0);
  let vignette = 1.0 - smoothstep(0.45, 1.42, length(centered));
  var color = getBrickColor(uv) * (0.45 + vignette * 0.7);

  let furnaceDistance = roundedBoxDistance(centered - vec2f(0.0, 0.08), vec2f(0.36, 0.5), 0.06);
  let furnaceGlow = exp(-max(furnaceDistance, 0.0) * 9.0);
  color += vec3f(0.12, 0.038, 0.012) * furnaceGlow;

  let primaryNozzleDistance = roundedBoxDistance(
    centered - vec2f(-0.14, 0.84), vec2f(0.04, 0.22), 0.012
  );
  let secondaryNozzleDistance = roundedBoxDistance(
    centered - vec2f(0.13, 0.84), vec2f(0.032, 0.22), 0.01
  );
  let primaryNozzleBody = 1.0 - smoothstep(-0.004, 0.004, primaryNozzleDistance);
  let secondaryNozzleBody = 1.0 - smoothstep(-0.004, 0.004, secondaryNozzleDistance);
  let primaryNozzleEdge = 1.0 - smoothstep(0.004, 0.014, abs(primaryNozzleDistance));
  let secondaryNozzleEdge = 1.0 - smoothstep(0.004, 0.014, abs(secondaryNozzleDistance));
  color = mix(color, vec3f(0.16, 0.21, 0.24), max(primaryNozzleBody, secondaryNozzleBody));
  color += vec3f(0.2, 0.5, 0.66) * (primaryNozzleEdge + secondaryNozzleEdge) * 0.26;
  color += vec3f(0.42, 1.15, 2.6) *
    (primaryNozzleEdge * fluidFoundryScene.nozzleActivity.x +
      secondaryNozzleEdge * fluidFoundryScene.nozzleActivity.y);
  let primaryLip = 1.0 - smoothstep(
    -0.002, 0.006,
    roundedBoxDistance(centered - vec2f(-0.14, 0.62), vec2f(0.052, 0.018), 0.007)
  );
  let secondaryLip = 1.0 - smoothstep(
    -0.002, 0.006,
    roundedBoxDistance(centered - vec2f(0.13, 0.62), vec2f(0.043, 0.018), 0.007)
  );
  color += vec3f(0.16, 0.36, 0.46) * max(primaryLip, secondaryLip) * 0.65;
  color += vec3f(0.5, 1.35, 3.2) *
    (primaryLip * fluidFoundryScene.nozzleActivity.x +
      secondaryLip * fluidFoundryScene.nozzleActivity.y);

  let vesselPosition = vec2f(centered.x * fluidFoundryScene.aspect / 0.82, centered.y / 0.88);
  let vesselDistance = roundedBoxDistance(vesselPosition, vec2f(0.66, 0.86), 0.08);
  let vesselInterior = 1.0 - smoothstep(-0.006, 0.012, vesselDistance);
  let vesselFrame = 1.0 - smoothstep(0.018, 0.044, abs(vesselDistance));
  let fluidUv = vec2f(vesselPosition.x / 1.32 + 0.5, 0.5 - vesselPosition.y / 1.72);
  let fluidInside = select(0.0, 1.0, all(fluidUv >= vec2f(0.0)) && all(fluidUv <= vec2f(1.0)));
  var surface = 0.0;
  if (vesselInterior * fluidInside > 0.0) {
    let densityData = sampleFluid(clamp(fluidUv, vec2f(0.0), vec2f(1.0)));
    let density = densityData.x * fluidFoundryScene.densityScale;
    surface = (1.0 - exp(-density * 0.22)) * vesselInterior;

    let textureSize = vec2f(textureDimensions(fluidDensityTexture));
    let texel = vec2f(1.0) / textureSize;
    let densityLeft = sampleFluid(clamp(fluidUv - vec2f(texel.x, 0.0), vec2f(0.0), vec2f(1.0))).x;
    let densityRight = sampleFluid(clamp(fluidUv + vec2f(texel.x, 0.0), vec2f(0.0), vec2f(1.0))).x;
    let densityDown = sampleFluid(clamp(fluidUv - vec2f(0.0, texel.y), vec2f(0.0), vec2f(1.0))).x;
    let densityUp = sampleFluid(clamp(fluidUv + vec2f(0.0, texel.y), vec2f(0.0), vec2f(1.0))).x;
    let normal = normalize(vec3f(
      (densityLeft - densityRight) * 0.42,
      (densityDown - densityUp) * 0.42,
      0.16
    ));
    let lightDirection = normalize(vec3f(-0.42, 0.7, 0.58));
    let halfDirection = normalize(lightDirection + vec3f(0.0, 0.0, 1.0));
    let diffuse = max(dot(normal, lightDirection), 0.0);
    let specular = pow(max(dot(normal, halfDirection), 0.0), 34.0);
    let edge = pow(1.0 - max(normal.z, 0.0), 2.4);
    let speed = densityData.y / max(densityData.x, 0.0001);
    let deformation = densityData.z / max(densityData.x, 0.0001);
    let coldMetal = vec3f(0.018, 0.16, 0.25);
    let hotMetal = vec3f(0.22, 0.92, 1.55);
    let induction = 0.5 + 0.5 * sin(
      fluidFoundryScene.time * 2.4 + fluidUv.y * 15.0 + fluidUv.x * 4.0
    );
    let metalColor = mix(coldMetal, hotMetal, clamp(speed * 0.55 + induction * 0.22, 0.0, 1.0));
    let fluidColor = metalColor * (0.16 + diffuse * 0.78) +
      vec3f(2.8, 2.1, 1.15) * specular +
      vec3f(0.18, 0.85, 2.5) * edge * (0.4 + fluidFoundryScene.interaction * 0.45) +
      vec3f(0.35, 0.08, 0.025) * max(1.0 - deformation, 0.0);
    color = mix(color, fluidColor, surface);
  }

  let glassEdge = vesselFrame * (0.3 + surface * 0.7);
  color += vec3f(0.15, 0.44, 0.78) * glassEdge;
  let clampBand = 1.0 - smoothstep(0.025, 0.055, abs(abs(vesselPosition.x) - 0.78));
  color += vec3f(0.12, 0.08, 0.045) * clampBand * smoothstep(0.72, 0.98, abs(vesselPosition.y));
  let floorGlow = exp(-abs(centered.y + 0.92) * 28.0) * exp(-abs(centered.x) * 1.8);
  color += vec3f(0.22, 0.055, 0.012) * floorGlow;
  color *= 0.42 + vignette * 0.72;
  return vec4f(max(color, vec3f(0.0)), 1.0);
}
`;

const INFO_HTML = `
<style>
  .fluid-foundry-info { font: 13px/1.45 system-ui, sans-serif; }
  .fluid-foundry-info p { margin: 0; color: inherit; opacity: .82; }
  .fluid-foundry-info strong { color: #a9ecff; }
  .fluid-foundry-badges { display: flex; gap: 7px; margin-top: 12px; flex-wrap: wrap; }
  .fluid-foundry-badge { padding: 4px 7px; border: 1px solid rgb(98 211 255 / 25%); border-radius: 99px; color: #dff8ff; background: rgb(17 97 126 / 18%); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
</style>
<section class="fluid-foundry-info">
  <p><strong>12,288 particles</strong> exchange mass and momentum through a WebGPU MLS-MPM grid, then become a shaded HDR liquid surface without CPU readback. Watch the pressure-charged recirculation spouts, click repeatedly to build a surge, drag to steer, or press <strong>R</strong> to reset.</p>
  <div class="fluid-foundry-badges"><span class="fluid-foundry-badge">WebGPU compute</span><span class="fluid-foundry-badge">Cyclic spouts</span><span class="fluid-foundry-badge">HDR liquid metal</span></div>
</section>`;

/** WebGPU MLS-MPM simulation staged as an interactive HDR liquid-metal press. */
export default class FluidFoundryAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  readonly device: Device;
  readonly simulation: MLSMPMFluidSimulation;
  readonly nozzleEmitterComputation: Computation;
  readonly nozzleEmitterUniformBuffer: Buffer;
  readonly densityModel: Model;
  readonly compositeModel: Model;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly densityTarget: DensityTarget;
  readonly densitySampler: Sampler;
  readonly particleCount: number;
  readonly gridSize: readonly [number, number];
  readonly densityMapSize: number;
  readonly densityScale: number;
  sceneTarget: SceneTarget;

  private canvas: HTMLCanvasElement | null = null;
  private previousTimeMilliseconds: number | null = null;
  private pointerPosition: [number, number] = [0.5, 0.48];
  private pointerActive = false;
  private interactionEnergy = 0;
  private simulationAgeSeconds = 0;
  private resetRequested = false;
  private readonly nozzleParticleStartIndices: readonly [number, number];
  private readonly nozzleParticleCapacities: readonly [number, number];
  private nozzleEmissionCursors: [number, number] = [0, 0];
  private nozzleCycleIndices: [number, number] = [-1, -1];
  private emittedNozzleParticleCount = 0;

  constructor({
    device,
    width,
    height,
    particleCount = PARTICLE_COUNT,
    gridSize = GRID_SIZE,
    densityMapSize = DENSITY_MAP_SIZE
  }: FluidFoundryExampleProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Fluid Foundry requires WebGPU.');
    }
    this.device = device;
    this.particleCount = particleCount;
    this.gridSize = gridSize;
    this.densityMapSize = densityMapSize;
    this.densityScale = PARTICLE_COUNT / particleCount;
    const recycledParticleCount = Math.max(1, Math.floor(particleCount * 0.18));
    const primaryNozzleParticleCount = Math.ceil(recycledParticleCount * 0.6);
    const secondaryNozzleParticleCount = recycledParticleCount - primaryNozzleParticleCount;
    this.nozzleParticleStartIndices = [
      particleCount - recycledParticleCount,
      particleCount - secondaryNozzleParticleCount
    ];
    this.nozzleParticleCapacities = [primaryNozzleParticleCount, secondaryNozzleParticleCount];
    this.simulation = new MLSMPMFluidSimulation(device, {
      id: 'fluid-foundry-simulation',
      gridSize,
      particleCount,
      initialParticles: makeFoundryPourParticles(particleCount),
      boundaryCells: 2,
      restDensity: 4,
      stiffness: 5.5,
      velocityDamping: 0.055,
      maxVelocity: 2.8
    });
    this.nozzleEmitterUniformBuffer = device.createBuffer({
      id: 'fluid-foundry-nozzle-emitter-uniforms',
      byteLength: 8 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.nozzleEmitterComputation = new Computation(device, {
      id: 'fluid-foundry-nozzle-emitter',
      source: NOZZLE_EMITTER_SHADER,
      shaderLayout: {
        bindings: [
          {name: 'particles', type: 'storage', group: 0, location: 0},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      }
    });
    this.densityTarget = createDensityTarget(device, densityMapSize);
    this.sceneTarget = createSceneTarget(device, width, height);
    this.densityModel = new Model(device, {
      id: 'fluid-foundry-particle-density',
      source: PARTICLE_SPLAT_SHADER,
      vertexCount: 6,
      instanceCount: particleCount,
      bindings: {particles: this.simulation.particleBuffer},
      colorAttachmentFormats: ['rgba16float'],
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one'
      }
    });
    this.densitySampler = device.createSampler({
      id: 'fluid-foundry-density-sampler',
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    });
    this.compositeModel = new Model(device, {
      id: 'fluid-foundry-composite',
      source: COMPOSITE_SHADER,
      vertexCount: 3,
      shaderInputs: new ShaderInputs({fluidFoundryScene: fluidFoundrySceneUniforms}),
      bindings: {
        fluidDensityTexture: this.densityTarget.texture,
        fluidDensitySampler: this.densitySampler
      },
      colorAttachmentFormats: ['rgba16float']
    });
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({colorFormat: 'rgba16float', resolutionScale: 0.68}),
        toneMapping
      ],
      colorFormat: 'rgba16float'
    });
  }

  /** Exposes the floating-point beauty target for focused WebGPU readback tests. */
  get sceneColorTexture(): Texture {
    return this.sceneTarget.texture;
  }

  /** Number of particles physically recirculated through the automatic nozzles. */
  get nozzleEmissionCount(): number {
    return this.emittedNozzleParticleCount;
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.cursor = 'crosshair';
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerUp);
      canvas.addEventListener('pointerleave', this.handlePointerUp);
      globalThis.addEventListener('keydown', this.handleKeyDown);
    }
  }

  onRender({device, width, height, aspect, time}: AnimationProps): void {
    if (width !== this.sceneTarget.width || height !== this.sceneTarget.height) {
      this.sceneTarget.framebuffer.destroy();
      this.sceneTarget.texture.destroy();
      this.sceneTarget = createSceneTarget(device, width, height);
      this.postprocessingRenderer.resize([width, height]);
    }

    const deltaTime =
      this.previousTimeMilliseconds === null
        ? 1 / 60
        : Math.min(
            Math.max((time - this.previousTimeMilliseconds) / 1000, 1 / 240),
            MAXIMUM_FRAME_DELTA_SECONDS
          );
    this.previousTimeMilliseconds = time;
    if (this.resetRequested) {
      this.simulation.reset(device.commandEncoder);
      this.interactionEnergy = 0;
      this.simulationAgeSeconds = 0;
      this.nozzleEmissionCursors = [0, 0];
      this.nozzleCycleIndices = [-1, -1];
      this.emittedNozzleParticleCount = 0;
      this.resetRequested = false;
    }
    this.simulationAgeSeconds += deltaTime;

    const primaryNozzleState = getFoundryNozzleCycleState(this.simulationAgeSeconds, 0);
    const secondaryNozzleState = getFoundryNozzleCycleState(this.simulationAgeSeconds, 1);
    this.emitNozzleParticles(device.commandEncoder, 0, primaryNozzleState);
    this.emitNozzleParticles(device.commandEncoder, 1, secondaryNozzleState);

    const minimumInteractionEnergy = this.pointerActive ? 0.08 : 0;
    const interactionDecayPerSecond = this.pointerActive ? 0.18 : 0.4;
    this.interactionEnergy = Math.max(
      minimumInteractionEnergy,
      this.interactionEnergy - interactionDecayPerSecond * deltaTime
    );

    const timeSeconds = time / 1000;
    const proceduralForcePosition: [number, number] = [
      0.5 + Math.sin(timeSeconds * 0.74) * 0.2,
      0.08 + (0.5 + Math.cos(timeSeconds * 0.57) * 0.5) * 0.05
    ];
    const interactionActive = this.interactionEnergy > 0.01;
    const automaticForceBlend = Math.min(Math.max((this.simulationAgeSeconds - 1.15) / 0.75, 0), 1);
    const forcePosition = interactionActive ? this.pointerPosition : proceduralForcePosition;
    const forceVector: [number, number] = interactionActive
      ? [
          Math.cos(timeSeconds * 3.2) * (2 + this.interactionEnergy * 8),
          3 + this.interactionEnergy * this.interactionEnergy * 31
        ]
      : [
          Math.cos(timeSeconds * 1.18) * 4.5 * automaticForceBlend,
          (Math.sin(timeSeconds * 0.93) * 1.5 + 4) * automaticForceBlend
        ];
    this.simulation.encode(device.commandEncoder, {
      deltaTime,
      gravity: [0, -2.2],
      force:
        interactionActive || automaticForceBlend > 0
          ? {
              position: forcePosition,
              radius: interactionActive ? 0.16 + this.interactionEnergy * 0.13 : 0.24,
              vector: forceVector
            }
          : undefined
    });

    this.densityModel.setBindings({particles: this.simulation.particleBuffer});
    this.densityModel.predraw(device.commandEncoder);
    const densityPass = device.beginRenderPass({
      id: 'fluid-foundry-density-pass',
      framebuffer: this.densityTarget.framebuffer,
      clearColor: [0, 0, 0, 0]
    });
    this.densityModel.draw(densityPass);
    densityPass.end();

    this.compositeModel.shaderInputs.setProps({
      fluidFoundryScene: {
        time: timeSeconds,
        aspect,
        densityScale: this.densityScale,
        interaction: this.interactionEnergy,
        nozzleActivity: [primaryNozzleState.activity, secondaryNozzleState.activity]
      }
    });
    this.compositeModel.predraw(device.commandEncoder);
    const scenePass = device.beginRenderPass({
      id: 'fluid-foundry-scene-pass',
      framebuffer: this.sceneTarget.framebuffer,
      clearColor: [0.002, 0.003, 0.006, 1]
    });
    this.compositeModel.draw(scenePass);
    scenePass.end();

    this.postprocessingRenderer.renderToScreen({
      sourceTexture: this.sceneTarget.texture,
      uniforms: {
        bloomExtract: {threshold: 0.56},
        bloomBlur: {radius: 11},
        bloomComposite: {intensity: 0.92},
        toneMapping: {
          exposure: 0.96,
          maximumLuminance: device.preferredColorFormat === 'rgba16float' ? 3.8 : 1
        }
      }
    });
  }

  onFinalize(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
      this.canvas.style.cursor = '';
      this.canvas.style.touchAction = '';
    }
    globalThis.removeEventListener('keydown', this.handleKeyDown);
    this.postprocessingRenderer.destroy();
    this.compositeModel.destroy();
    this.densityModel.destroy();
    this.nozzleEmitterComputation.destroy();
    this.nozzleEmitterUniformBuffer.destroy();
    this.densitySampler.destroy();
    this.sceneTarget.framebuffer.destroy();
    this.sceneTarget.texture.destroy();
    this.densityTarget.framebuffer.destroy();
    this.densityTarget.texture.destroy();
    this.simulation.destroy();
  }

  private emitNozzleParticles(
    commandEncoder: CommandEncoder,
    nozzleIndex: 0 | 1,
    state: FoundryNozzleCycleState
  ): void {
    const capacity = this.nozzleParticleCapacities[nozzleIndex];
    if (capacity === 0 || state.cycleIndex < 0) {
      return;
    }
    if (this.nozzleCycleIndices[nozzleIndex] !== state.cycleIndex) {
      this.nozzleCycleIndices[nozzleIndex] = state.cycleIndex;
      this.nozzleEmissionCursors[nozzleIndex] = 0;
    }

    const emissionCursor = this.nozzleEmissionCursors[nozzleIndex];
    const targetEmissionCount = Math.min(capacity, Math.floor(capacity * state.emissionProgress));
    const emitCount = targetEmissionCount - emissionCursor;
    if (emitCount <= 0) {
      return;
    }

    const startIndex = this.nozzleParticleStartIndices[nozzleIndex] + emissionCursor;
    const sequenceIndex = state.cycleIndex * capacity + emissionCursor;
    const nozzle =
      nozzleIndex === 0
        ? ([0.35, 0.017, 1.2, -0.1] as const)
        : ([0.7, 0.0125, 1.05, 0.08] as const);
    const uniformData = new Float32Array([
      startIndex,
      emitCount,
      sequenceIndex,
      nozzleIndex,
      nozzle[0],
      nozzle[1],
      nozzle[2],
      nozzle[3]
    ]);
    this.device.writeBufferViaCommandEncoder(
      commandEncoder,
      this.nozzleEmitterUniformBuffer,
      uniformData
    );
    this.nozzleEmitterComputation.setBindings({
      particles: this.simulation.particleBuffer,
      uniforms: this.nozzleEmitterUniformBuffer
    });
    this.nozzleEmitterComputation.predraw(commandEncoder);
    const computePass = commandEncoder.beginComputePass({
      id: `fluid-foundry-nozzle-${nozzleIndex}-burst`
    });
    this.nozzleEmitterComputation.dispatch(
      computePass,
      Math.ceil(emitCount / NOZZLE_WORKGROUP_SIZE)
    );
    computePass.end();
    this.nozzleEmissionCursors[nozzleIndex] = targetEmissionCount;
    this.emittedNozzleParticleCount += emitCount;
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.canvas) {
      return;
    }
    const bounds = this.canvas.getBoundingClientRect();
    const screenPosition = [
      (event.clientX - bounds.left) / Math.max(bounds.width, 1),
      1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1)
    ];
    const aspect = bounds.width / Math.max(bounds.height, 1);
    const centeredPosition = [screenPosition[0] * 2 - 1, screenPosition[1] * 2 - 1];
    this.pointerPosition = [
      Math.min(Math.max((centeredPosition[0] * aspect) / 0.82 / 1.32 + 0.5, 0.05), 0.95),
      Math.min(Math.max(0.5 - centeredPosition[1] / 0.88 / 1.72, 0.05), 0.95)
    ];
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerActive = true;
    this.interactionEnergy = Math.min(this.interactionEnergy + 0.34, 1);
    this.handlePointerMove(event);
    this.canvas?.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.pointerActive = false;
    if (this.canvas?.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() === 'r') {
      this.resetRequested = true;
    }
  };
}

/** Returns the deterministic charge, burst, and cooldown state for one foundry nozzle. */
export function getFoundryNozzleCycleState(
  simulationAgeSeconds: number,
  nozzleIndex: 0 | 1
): FoundryNozzleCycleState {
  const elapsedSeconds = simulationAgeSeconds - NOZZLE_FIRST_CHARGE_SECONDS[nozzleIndex];
  if (elapsedSeconds < 0) {
    return {activity: 0, emissionProgress: 0, firing: false, cycleIndex: -1};
  }

  const cycleIndex = Math.floor(elapsedSeconds / NOZZLE_CYCLE_SECONDS);
  const cycleSeconds = elapsedSeconds - cycleIndex * NOZZLE_CYCLE_SECONDS;
  if (cycleSeconds < NOZZLE_CHARGE_SECONDS) {
    const chargeProgress = smoothStep(cycleSeconds / NOZZLE_CHARGE_SECONDS);
    return {activity: chargeProgress, emissionProgress: 0, firing: false, cycleIndex};
  }

  const burstSeconds = cycleSeconds - NOZZLE_CHARGE_SECONDS;
  if (burstSeconds < NOZZLE_BURST_SECONDS) {
    const emissionProgress = burstSeconds / NOZZLE_BURST_SECONDS;
    return {
      activity: 1 + Math.sin(emissionProgress * Math.PI) * 0.55,
      emissionProgress,
      firing: true,
      cycleIndex
    };
  }

  const cooldownSeconds = burstSeconds - NOZZLE_BURST_SECONDS;
  const cooldownProgress = Math.min(cooldownSeconds / NOZZLE_COOLDOWN_SECONDS, 1);
  return {
    activity: (1 - smoothStep(cooldownProgress)) * 0.82,
    emissionProgress: 1,
    firing: false,
    cycleIndex
  };
}

function smoothStep(value: number): number {
  const clampedValue = Math.min(Math.max(value, 0), 1);
  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function makeFoundryPourParticles(particleCount: number): MLSMPMParticle[] {
  const particles: MLSMPMParticle[] = [];
  let randomState = 0x6d2b79f5;
  const poolParticleCount = Math.floor(particleCount * 0.7);
  const fallingParticleCount = particleCount - poolParticleCount;
  const primaryPourParticleCount = Math.ceil(fallingParticleCount * 0.7);
  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    const randomA = randomState / 0x1_0000_0000;
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    const randomB = randomState / 0x1_0000_0000;
    if (particleIndex < poolParticleCount) {
      const xPosition = 0.1 + randomA * 0.8;
      const centeredX = (xPosition - 0.5) / 0.4;
      const surfaceHeight =
        0.12 + Math.max(1 - centeredX * centeredX, 0) * 0.025 + Math.sin(xPosition * 31) * 0.004;
      particles.push({
        position: [xPosition, 0.04 + randomB * (surfaceHeight - 0.04)],
        velocity: [(randomA - 0.5) * 0.035, 0]
      });
      continue;
    }

    const fallingParticleIndex = particleIndex - poolParticleCount;
    const primaryPour = fallingParticleIndex < primaryPourParticleCount;
    const streamProgress = randomA;
    const centerX = primaryPour
      ? 0.35 + Math.sin(streamProgress * Math.PI * 1.7) * 0.018
      : 0.7 - Math.sin(streamProgress * Math.PI * 1.25) * 0.012;
    const streamWidth = primaryPour
      ? 0.018 + streamProgress * 0.012
      : 0.012 + streamProgress * 0.009;
    particles.push({
      position: [
        centerX + (randomB * 2 - 1) * streamWidth,
        primaryPour ? 0.965 - streamProgress * 0.56 : 0.965 - streamProgress * 0.3
      ],
      velocity: [
        (primaryPour ? -0.12 : 0.1) * streamProgress * streamProgress + (randomB - 0.5) * 0.018,
        primaryPour ? -1.05 - streamProgress * 0.18 : -0.88 - streamProgress * 0.14
      ]
    });
  }
  return particles;
}

function createDensityTarget(device: Device, densityMapSize: number): DensityTarget {
  const texture = device.createTexture({
    id: 'fluid-foundry-density',
    width: densityMapSize,
    height: densityMapSize,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE | Texture.COPY_SRC
  });
  return {
    texture,
    framebuffer: device.createFramebuffer({
      id: 'fluid-foundry-density-framebuffer',
      width: densityMapSize,
      height: densityMapSize,
      colorAttachments: [texture]
    })
  };
}

function createSceneTarget(device: Device, width: number, height: number): SceneTarget {
  const targetWidth = Math.max(Math.round(width), 1);
  const targetHeight = Math.max(Math.round(height), 1);
  const texture = device.createTexture({
    id: 'fluid-foundry-scene-color',
    width: targetWidth,
    height: targetHeight,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE | Texture.COPY_SRC
  });
  return {
    width: targetWidth,
    height: targetHeight,
    texture,
    framebuffer: device.createFramebuffer({
      id: 'fluid-foundry-scene-framebuffer',
      width: targetWidth,
      height: targetHeight,
      colorAttachments: [texture]
    })
  };
}
