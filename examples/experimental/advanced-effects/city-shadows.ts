// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {CubeGeometry, Model, ShaderInputs} from '@luma.gl/engine';
import type {
  DirectionalShadowLight,
  PointShadowFace,
  PointShadowLight,
  ShadowRenderView,
  SpotShadowLight
} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Matrix4, NumberArray3} from '@math.gl/core';

export const SUN_DIRECTION: NumberArray3 = normalize3([0.45, 0.82, 0.35]);

export type CityShadowLights = {
  directional: DirectionalShadowLight;
  spot: SpotShadowLight;
  point: PointShadowLight;
};

export type CityInstanceBuffers = {
  positions: Buffer;
  scales: Buffer;
  colors: Buffer;
  motion: Buffer;
};

type ShadowCasterUniforms = {
  viewProjectionMatrix: Matrix4;
  time: number;
};

const shadowCasterUniforms: ShaderModule<ShadowCasterUniforms> = {
  name: 'cityShadowCaster',
  uniformTypes: {viewProjectionMatrix: 'mat4x4<f32>', time: 'f32'}
};

const SHADOW_CASTER_SHADER = /* wgsl */ `\
struct CityShadowCasterUniforms {
  viewProjectionMatrix: mat4x4f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> cityShadowCaster: CityShadowCasterUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) instancePositions: vec3f,
  @location(2) instanceScales: vec3f,
  @location(3) instanceMotion: f32,
};

fn cityShadowCaster_motionOffset(position: vec3f, motion: f32, time: f32) -> vec3f {
  let phase = position.x * 0.37 + position.z * 0.19;
  return motion * vec3f(
    sin(time * 0.7 + phase) * 13.0,
    2.2 + sin(time * 1.8 + phase),
    cos(time * 0.7 + phase) * 13.0
  );
}

@vertex
fn vertexMain(inputs: VertexInputs) -> @builtin(position) vec4f {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions +
    cityShadowCaster_motionOffset(inputs.instancePositions, inputs.instanceMotion, cityShadowCaster.time);
  return cityShadowCaster.viewProjectionMatrix * vec4f(worldPosition, 1.0);
}

@fragment
fn fragmentMain() {}
`;

const POINT_FACES: PointShadowFace[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
const DIRECTIONAL_VIEW_COUNT = 4;
const SPOT_VIEW_OFFSET = DIRECTIONAL_VIEW_COUNT;
const POINT_VIEW_OFFSET = SPOT_VIEW_OFFSET + 1;
const CITY_SHADOW_VIEW_COUNT = POINT_VIEW_OFFSET + 6;

/** Separate depth-only models ensure every recorded light view retains independent uniforms. */
export class CityShadowCasterModels {
  readonly models: Model[];

  constructor(device: Device, buffers: CityInstanceBuffers, instanceCount: number) {
    this.models = Array.from({length: CITY_SHADOW_VIEW_COUNT}, (_, viewIndex) => {
      return new Model(device, {
        id: `visualization-city-shadow-caster-${viewIndex}`,
        source: SHADOW_CASTER_SHADER,
        geometry: new CubeGeometry({indices: true}),
        instanceCount,
        shaderInputs: new ShaderInputs({cityShadowCaster: shadowCasterUniforms}),
        bufferLayout: [
          {name: 'instancePositions', format: 'float32x3'},
          {name: 'instanceScales', format: 'float32x3'},
          {name: 'instanceMotion', format: 'float32'}
        ],
        attributes: {
          instancePositions: buffers.positions,
          instanceScales: buffers.scales,
          instanceMotion: buffers.motion
        },
        colorAttachmentFormats: [],
        depthStencilAttachmentFormat: 'depth32float',
        parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
      });
    });
  }

  draw(view: ShadowRenderView, time: number): void {
    const model = this.models[getShadowViewIndex(view)];
    model.shaderInputs.setProps({
      cityShadowCaster: {viewProjectionMatrix: view.viewProjectionMatrix as Matrix4, time}
    });
    model.setParameters(view.rasterParameters);
    model.draw(view.renderPass);
  }

  destroy(): void {
    for (const model of this.models) {
      model.destroy();
    }
  }
}

export function getCityShadowLights(time: number): CityShadowLights {
  const spotPosition: NumberArray3 = [Math.sin(time * 0.62) * 17, 15, Math.cos(time * 0.62) * 17];
  const spotTarget: NumberArray3 = [Math.sin(time * 0.31) * 4, 2.5, Math.cos(time * 0.31) * 4];
  const spotDirection = normalize3([
    spotTarget[0] - spotPosition[0],
    spotTarget[1] - spotPosition[1],
    spotTarget[2] - spotPosition[2]
  ]);
  return {
    directional: {
      direction: SUN_DIRECTION,
      shadowDistance: 145,
      casterDistance: 145,
      sourceAngularRadius: 0.006,
      cascadeSplitLambda: 0.58,
      cascadeBlendFraction: 0.12,
      farFadeFraction: 0.1,
      normalBias: 0.045,
      depthBias: 2,
      depthBiasSlopeScale: 2,
      strength: 1
    },
    spot: {
      position: spotPosition,
      direction: spotDirection,
      range: 52,
      outerConeAngle: 0.42,
      nearPlane: 0.2,
      sourceRadius: 0.35,
      normalBias: 0.03,
      depthBias: 2,
      depthBiasSlopeScale: 2,
      strength: 0.9
    },
    point: {
      position: [0, 4.8, 0],
      range: 24,
      nearPlane: 0.15,
      sourceRadius: 0.42,
      normalBias: 0.03,
      depthBias: 2,
      depthBiasSlopeScale: 2,
      strength: 0.88
    }
  };
}

function getShadowViewIndex(view: ShadowRenderView): number {
  if (view.type === 'directional') {
    return view.cascadeIndex || 0;
  }
  if (view.type === 'spot') {
    return SPOT_VIEW_OFFSET;
  }
  const faceIndex = POINT_FACES.indexOf(view.pointFace || '+X');
  return POINT_VIEW_OFFSET + Math.max(faceIndex, 0);
}

function normalize3(vector: NumberArray3): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}
