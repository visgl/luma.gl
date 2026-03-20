// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type RenderPass, type RenderPipelineParameters} from '@luma.gl/core';
import {Matrix4, type NumericArray} from '@math.gl/core';
import type {
  DirectionalLight,
  Light,
  PointLight,
  ShaderModule,
  SpotLight
} from '@luma.gl/shadertools';
import {Model, type ModelProps} from '../model/model';
import {ShaderInputs} from '../shader-inputs';
import type {Geometry} from '../geometry/geometry';

const DEFAULT_POINT_LIGHT_RADIUS_FACTOR = 0.02;
const DEFAULT_SPOT_LIGHT_LENGTH_FACTOR = 0.12;
const DEFAULT_DIRECTIONAL_LIGHT_LENGTH_FACTOR = 0.15;
const DEFAULT_DIRECTIONAL_LIGHT_RADIUS_FACTOR = 0.2;
const DEFAULT_DIRECTION_FALLBACK: [number, number, number] = [0, 1, 0];
const DEFAULT_LIGHT_COLOR: [number, number, number] = [255, 255, 255];
const DEFAULT_MARKER_SCALE = 1;
const DIRECTIONAL_ANCHOR_DISTANCE_FACTOR = 0.35;
const LIGHT_COLOR_FACTOR = 255;
const MIN_SCENE_SCALE = 1;
const SPOTLIGHT_OUTER_CONE_EPSILON = 0.01;

export type LightModelBounds = [[number, number, number], [number, number, number]];

export type BaseLightModelProps = Omit<
  ModelProps,
  'geometry' | 'modules' | 'shaderInputs' | 'source' | 'vs' | 'fs' | 'instanceCount'
> & {
  lights: ReadonlyArray<Light>;
  viewMatrix: NumericArray;
  projectionMatrix: NumericArray;
  bounds?: LightModelBounds;
  markerScale?: number;
};

export type PointLightModelProps = BaseLightModelProps & {
  pointLightRadius?: number;
};

export type SpotLightModelProps = BaseLightModelProps & {
  spotLightLength?: number;
};

export type DirectionalLightModelProps = BaseLightModelProps & {
  directionalLightLength?: number;
};

type LightMarkerUniforms = {
  viewProjectionMatrix: Matrix4;
};

export type LightMarkerInstanceData = {
  instanceCount: number;
  instancePositions: Float32Array;
  instanceDirections: Float32Array;
  instanceScales: Float32Array;
  instanceColors: Float32Array;
};

type ManagedInstanceBuffers = Record<
  'instancePosition' | 'instanceDirection' | 'instanceScale' | 'instanceColor',
  Buffer
>;

type LightMarkerAnchorMode = 'centered' | 'apex';

type LightMarkerModelOptions<PropsT extends BaseLightModelProps> = {
  anchorMode: LightMarkerAnchorMode;
  buildInstanceData: (props: PropsT) => LightMarkerInstanceData;
  geometry: Geometry;
  idPrefix: string;
  sizePropNames: Array<keyof PropsT>;
};

const LIGHT_MARKER_PARAMETERS: RenderPipelineParameters = {
  depthCompare: 'less-equal',
  depthWriteEnabled: false,
  cullMode: 'none'
};

const INSTANCE_BUFFER_LAYOUT = [
  {name: 'instancePosition', format: 'float32x3', stepMode: 'instance'},
  {name: 'instanceDirection', format: 'float32x3', stepMode: 'instance'},
  {name: 'instanceScale', format: 'float32x3', stepMode: 'instance'},
  {name: 'instanceColor', format: 'float32x4', stepMode: 'instance'}
] as const;

const lightMarker = {
  name: 'lightMarker',
  props: {} as LightMarkerUniforms,
  uniforms: {} as LightMarkerUniforms,
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>'
  }
} as const satisfies ShaderModule<LightMarkerUniforms, LightMarkerUniforms>;

const CENTERED_LOCAL_POSITION_WGSL = 'inputs.positions * inputs.instanceScale';
const APEX_LOCAL_POSITION_WGSL =
  'vec3<f32>(inputs.positions.x * inputs.instanceScale.x, (inputs.positions.y - 0.5) * inputs.instanceScale.y, inputs.positions.z * inputs.instanceScale.z)';
const CENTERED_LOCAL_POSITION_GLSL = 'positions * instanceScale';
const APEX_LOCAL_POSITION_GLSL =
  'vec3(positions.x * instanceScale.x, (positions.y - 0.5) * instanceScale.y, positions.z * instanceScale.z)';

export abstract class BaseLightModel<PropsT extends BaseLightModelProps> extends Model {
  protected lightModelProps: PropsT;
  protected _instanceData: LightMarkerInstanceData;
  protected _managedBuffers: ManagedInstanceBuffers;

  private readonly buildInstanceData: (props: PropsT) => LightMarkerInstanceData;
  private readonly sizePropNames: Array<keyof PropsT>;

  constructor(device: Device, props: PropsT, options: LightMarkerModelOptions<PropsT>) {
    const instanceData = options.buildInstanceData(props);
    const managedBuffers = createManagedInstanceBuffers(
      device,
      props.id || options.idPrefix,
      instanceData
    );
    const shaderInputs = new ShaderInputs<{
      lightMarker: typeof lightMarker.props;
    }>({lightMarker});
    shaderInputs.setProps({
      lightMarker: {viewProjectionMatrix: createViewProjectionMatrix(props)}
    });

    const {source, vs, fs} = getLightMarkerShaders(options.anchorMode);
    const modelProps: ModelProps = props;

    super(device, {
      ...modelProps,
      id: props.id || options.idPrefix,
      source,
      vs,
      fs,
      geometry: options.geometry,
      shaderInputs,
      bufferLayout: [...INSTANCE_BUFFER_LAYOUT],
      attributes: managedBuffers,
      instanceCount: instanceData.instanceCount,
      parameters: mergeLightMarkerParameters(props.parameters)
    });

    this.lightModelProps = props;
    this._instanceData = instanceData;
    this._managedBuffers = managedBuffers;
    this.buildInstanceData = options.buildInstanceData;
    this.sizePropNames = options.sizePropNames;
  }

  override destroy(): void {
    super.destroy();
    destroyManagedInstanceBuffers(this._managedBuffers);
    this._managedBuffers = {} as ManagedInstanceBuffers;
  }

  override draw(renderPass: RenderPass): boolean {
    if (this.instanceCount === 0) {
      return true;
    }
    return super.draw(renderPass);
  }

  setProps(props: Partial<PropsT>): void {
    this.lightModelProps = {...this.lightModelProps, ...props};

    if (props.parameters) {
      this.setParameters(mergeLightMarkerParameters(this.lightModelProps.parameters));
    }

    if ('viewMatrix' in props || 'projectionMatrix' in props) {
      this.shaderInputs.setProps({
        lightMarker: {viewProjectionMatrix: createViewProjectionMatrix(this.lightModelProps)}
      });
      this.setNeedsRedraw('lightMarker camera');
    }

    if (shouldRebuildInstanceData(props, this.sizePropNames)) {
      this.rebuildInstanceData();
    }
  }

  private rebuildInstanceData(): void {
    const nextInstanceData = this.buildInstanceData(this.lightModelProps);
    const nextManagedBuffers = createManagedInstanceBuffers(this.device, this.id, nextInstanceData);

    this.setAttributes(nextManagedBuffers);
    this.setInstanceCount(nextInstanceData.instanceCount);

    destroyManagedInstanceBuffers(this._managedBuffers);
    this._managedBuffers = nextManagedBuffers;
    this._instanceData = nextInstanceData;
  }
}

export function buildPointLightInstanceData(props: PointLightModelProps): LightMarkerInstanceData {
  const pointLights = getPointLights(props.lights);
  const context = getLightMarkerContext(props);
  const pointLightRadius =
    props.pointLightRadius ??
    DEFAULT_POINT_LIGHT_RADIUS_FACTOR * context.sceneScale * context.markerScale;

  return createLightMarkerInstanceData(
    pointLights.length,
    (light, _index) => ({
      color: getDisplayColor(light),
      direction: DEFAULT_DIRECTION_FALLBACK,
      position: light.position,
      scale: [pointLightRadius, pointLightRadius, pointLightRadius]
    }),
    pointLights
  );
}

export function buildSpotLightInstanceData(props: SpotLightModelProps): LightMarkerInstanceData {
  const spotLights = getSpotLights(props.lights);
  const context = getLightMarkerContext(props);
  const spotLightLength =
    props.spotLightLength ??
    DEFAULT_SPOT_LIGHT_LENGTH_FACTOR * context.sceneScale * context.markerScale;

  return createLightMarkerInstanceData(
    spotLights.length,
    (light, _index) => {
      const outerConeAngle = clamp(
        light.outerConeAngle ?? Math.PI / 4,
        0,
        Math.PI / 2 - SPOTLIGHT_OUTER_CONE_EPSILON
      );
      const radius = Math.tan(outerConeAngle) * spotLightLength;

      return {
        color: getDisplayColor(light),
        direction: normalizeDirection(light.direction),
        position: light.position,
        scale: [radius, spotLightLength, radius]
      };
    },
    spotLights
  );
}

export function buildDirectionalLightInstanceData(
  props: DirectionalLightModelProps
): LightMarkerInstanceData {
  const directionalLights = getDirectionalLights(props.lights);
  const context = getLightMarkerContext(props);
  const directionalLightLength =
    props.directionalLightLength ??
    DEFAULT_DIRECTIONAL_LIGHT_LENGTH_FACTOR * context.sceneScale * context.markerScale;
  const directionalLightRadius = directionalLightLength * DEFAULT_DIRECTIONAL_LIGHT_RADIUS_FACTOR;

  return createLightMarkerInstanceData(
    directionalLights.length,
    (light, _index) => {
      const direction = normalizeDirection(light.direction);
      const position = [
        context.sceneCenter[0] -
          direction[0] * context.sceneScale * DIRECTIONAL_ANCHOR_DISTANCE_FACTOR,
        context.sceneCenter[1] -
          direction[1] * context.sceneScale * DIRECTIONAL_ANCHOR_DISTANCE_FACTOR,
        context.sceneCenter[2] -
          direction[2] * context.sceneScale * DIRECTIONAL_ANCHOR_DISTANCE_FACTOR
      ] as [number, number, number];

      return {
        color: getDisplayColor(light),
        direction,
        position,
        scale: [directionalLightRadius, directionalLightLength, directionalLightRadius]
      };
    },
    directionalLights
  );
}

export function getPointLights(lights: ReadonlyArray<Light>): PointLight[] {
  return lights.filter((light): light is PointLight => light.type === 'point');
}

export function getSpotLights(lights: ReadonlyArray<Light>): SpotLight[] {
  return lights.filter((light): light is SpotLight => light.type === 'spot');
}

export function getDirectionalLights(lights: ReadonlyArray<Light>): DirectionalLight[] {
  return lights.filter((light): light is DirectionalLight => light.type === 'directional');
}

export function getLightMarkerContext(props: BaseLightModelProps): {
  bounds: LightModelBounds;
  markerScale: number;
  sceneCenter: [number, number, number];
  sceneScale: number;
} {
  const bounds = getSceneBounds(props.lights, props.bounds);
  const sceneCenter = [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
    (bounds[0][2] + bounds[1][2]) / 2
  ] as [number, number, number];
  const sceneScale = Math.max(
    Math.hypot(
      bounds[1][0] - bounds[0][0],
      bounds[1][1] - bounds[0][1],
      bounds[1][2] - bounds[0][2]
    ),
    MIN_SCENE_SCALE
  );

  return {
    bounds,
    markerScale: Math.max(props.markerScale ?? DEFAULT_MARKER_SCALE, 0),
    sceneCenter,
    sceneScale
  };
}

export function getDisplayColor(light: {
  color?: Readonly<[number, number, number]>;
  intensity?: number;
}): [number, number, number, number] {
  const color = light.color || DEFAULT_LIGHT_COLOR;
  const intensity = Math.max(light.intensity ?? 1, 0);
  const brightness = clamp(0.35 + 0.3 * Math.log10(intensity + 1), 0.35, 1);

  return [
    clamp(color[0] / LIGHT_COLOR_FACTOR, 0, 1) * brightness,
    clamp(color[1] / LIGHT_COLOR_FACTOR, 0, 1) * brightness,
    clamp(color[2] / LIGHT_COLOR_FACTOR, 0, 1) * brightness,
    1
  ];
}

export function normalizeDirection(
  direction?: Readonly<[number, number, number]>
): [number, number, number] {
  const [x, y, z] = direction || DEFAULT_DIRECTION_FALLBACK;
  const length = Math.hypot(x, y, z);
  if (length === 0) {
    return [...DEFAULT_DIRECTION_FALLBACK];
  }
  return [x / length, y / length, z / length];
}

function createLightMarkerInstanceData<TLight>(
  instanceCount: number,
  getInstance: (
    light: TLight,
    index: number
  ) => {
    color: [number, number, number, number];
    direction: [number, number, number];
    position: Readonly<NumericArray>;
    scale: [number, number, number];
  },
  lights: TLight[] = []
): LightMarkerInstanceData {
  const instancePositions = new Float32Array(instanceCount * 3);
  const instanceDirections = new Float32Array(instanceCount * 3);
  const instanceScales = new Float32Array(instanceCount * 3);
  const instanceColors = new Float32Array(instanceCount * 4);

  for (const [index, light] of lights.entries()) {
    const instance = getInstance(light, index);
    instancePositions.set(instance.position, index * 3);
    instanceDirections.set(instance.direction, index * 3);
    instanceScales.set(instance.scale, index * 3);
    instanceColors.set(instance.color, index * 4);
  }

  return {
    instanceCount,
    instancePositions,
    instanceDirections,
    instanceScales,
    instanceColors
  };
}

function getSceneBounds(lights: ReadonlyArray<Light>, bounds?: LightModelBounds): LightModelBounds {
  if (bounds) {
    return cloneBounds(bounds);
  }

  const positions = [
    ...getPointLights(lights).map(light => light.position),
    ...getSpotLights(lights).map(light => light.position)
  ];

  if (positions.length === 0) {
    return [
      [-0.5, -0.5, -0.5],
      [0.5, 0.5, 0.5]
    ];
  }

  const minBounds: [number, number, number] = [...positions[0]] as [number, number, number];
  const maxBounds: [number, number, number] = [...positions[0]] as [number, number, number];

  for (const position of positions.slice(1)) {
    minBounds[0] = Math.min(minBounds[0], position[0]);
    minBounds[1] = Math.min(minBounds[1], position[1]);
    minBounds[2] = Math.min(minBounds[2], position[2]);

    maxBounds[0] = Math.max(maxBounds[0], position[0]);
    maxBounds[1] = Math.max(maxBounds[1], position[1]);
    maxBounds[2] = Math.max(maxBounds[2], position[2]);
  }

  return [minBounds, maxBounds];
}

function cloneBounds(bounds: LightModelBounds): LightModelBounds {
  return [[...bounds[0]] as [number, number, number], [...bounds[1]] as [number, number, number]];
}

function createManagedInstanceBuffers(
  device: Device,
  idPrefix: string,
  instanceData: LightMarkerInstanceData
): ManagedInstanceBuffers {
  return {
    instancePosition: device.createBuffer({
      id: `${idPrefix}-instance-position`,
      data: getBufferDataOrPlaceholder(instanceData.instancePositions, 3)
    }),
    instanceDirection: device.createBuffer({
      id: `${idPrefix}-instance-direction`,
      data: getBufferDataOrPlaceholder(instanceData.instanceDirections, 3)
    }),
    instanceScale: device.createBuffer({
      id: `${idPrefix}-instance-scale`,
      data: getBufferDataOrPlaceholder(instanceData.instanceScales, 3)
    }),
    instanceColor: device.createBuffer({
      id: `${idPrefix}-instance-color`,
      data: getBufferDataOrPlaceholder(instanceData.instanceColors, 4)
    })
  };
}

function getBufferDataOrPlaceholder(data: Float32Array, size: number): Float32Array {
  return data.length > 0 ? data : new Float32Array(size);
}

function destroyManagedInstanceBuffers(managedBuffers: Partial<ManagedInstanceBuffers>): void {
  for (const buffer of Object.values(managedBuffers)) {
    buffer?.destroy();
  }
}

function createViewProjectionMatrix(
  props: Pick<BaseLightModelProps, 'projectionMatrix' | 'viewMatrix'>
): Matrix4 {
  return new Matrix4(props.projectionMatrix).multiplyRight(props.viewMatrix);
}

function shouldRebuildInstanceData<PropsT extends BaseLightModelProps>(
  props: Partial<PropsT>,
  sizePropNames: Array<keyof PropsT>
): boolean {
  if ('lights' in props || 'bounds' in props || 'markerScale' in props) {
    return true;
  }
  return sizePropNames.some(sizePropName => sizePropName in props);
}

function mergeLightMarkerParameters(
  parameters?: RenderPipelineParameters
): RenderPipelineParameters {
  return {
    ...LIGHT_MARKER_PARAMETERS,
    ...(parameters || {})
  };
}

function getLightMarkerShaders(anchorMode: LightMarkerAnchorMode): {
  fs: string;
  source: string;
  vs: string;
} {
  const localPositionWGSL =
    anchorMode === 'apex' ? APEX_LOCAL_POSITION_WGSL : CENTERED_LOCAL_POSITION_WGSL;
  const localPositionGLSL =
    anchorMode === 'apex' ? APEX_LOCAL_POSITION_GLSL : CENTERED_LOCAL_POSITION_GLSL;

  return {
    source: `\
struct lightMarkerUniforms {
  viewProjectionMatrix: mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> lightMarker : lightMarkerUniforms;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) instancePosition : vec3<f32>,
  @location(2) instanceDirection : vec3<f32>,
  @location(3) instanceScale : vec3<f32>,
  @location(4) instanceColor : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn lightMarker_rotate(localPosition: vec3<f32>, direction: vec3<f32>) -> vec3<f32> {
  let forward = normalize(direction);
  var helperAxis = vec3<f32>(0.0, 1.0, 0.0);
  if (abs(forward.y) > 0.999) {
    helperAxis = vec3<f32>(1.0, 0.0, 0.0);
  }

  let tangent = normalize(cross(helperAxis, forward));
  let bitangent = cross(forward, tangent);
  return tangent * localPosition.x + forward * localPosition.y + bitangent * localPosition.z;
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let localPosition = ${localPositionWGSL};
  let worldPosition = inputs.instancePosition + lightMarker_rotate(localPosition, inputs.instanceDirection);
  outputs.Position = lightMarker.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  outputs.color = inputs.instanceColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`,
    vs: `\
#version 300 es

in vec3 positions;
in vec3 instancePosition;
in vec3 instanceDirection;
in vec3 instanceScale;
in vec4 instanceColor;

uniform lightMarkerUniforms {
  mat4 viewProjectionMatrix;
} lightMarker;

out vec4 vColor;

vec3 lightMarker_rotate(vec3 localPosition, vec3 direction) {
  vec3 forward = normalize(direction);
  vec3 helperAxis = abs(forward.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(helperAxis, forward));
  vec3 bitangent = cross(forward, tangent);
  return tangent * localPosition.x + forward * localPosition.y + bitangent * localPosition.z;
}

void main(void) {
  vec3 localPosition = ${localPositionGLSL};
  vec3 worldPosition = instancePosition + lightMarker_rotate(localPosition, instanceDirection);
  gl_Position = lightMarker.viewProjectionMatrix * vec4(worldPosition, 1.0);
  vColor = instanceColor;
}
`,
    fs: `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = vColor;
}
`
  };
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}
