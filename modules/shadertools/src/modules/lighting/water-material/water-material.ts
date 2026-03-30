// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray2, NumberArray3, Vector2, Vector3} from '@math.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {WATER_FS, WATER_VS} from './water-shaders-glsl';
import {WATER_WGSL} from './water-shaders-wgsl';

export type WaterMaterialUniforms = {
  time?: number;
  baseColor?: Readonly<Vector3 | NumberArray3>;
  opacity?: number;
  fresnelColor?: Readonly<Vector3 | NumberArray3>;
  fresnelPower?: number;
  specularIntensity?: number;
  normalStrength?: number;
  mappingMode?: number;
  coordinateScale?: Readonly<Vector2 | NumberArray2>;
  coordinateOffset?: Readonly<Vector2 | NumberArray2>;
  waveADirection?: Readonly<Vector2 | NumberArray2>;
  waveASpeed?: number;
  waveAFrequency?: number;
  waveAAmplitude?: number;
  waveBDirection?: Readonly<Vector2 | NumberArray2>;
  waveBSpeed?: number;
  waveBFrequency?: number;
  waveBAmplitude?: number;
};

export type WaterMaterialProps = Omit<WaterMaterialUniforms, 'mappingMode'> & {
  mapping?: 'uv' | 'world';
};

/** Animated water material with procedural waves and Fresnel/specular shading. */
export const waterMaterial: ShaderModule<WaterMaterialProps, WaterMaterialUniforms> = {
  name: 'waterMaterial',
  firstBindingSlot: 0,
  bindingLayout: [{name: 'waterMaterial', group: 3}],
  dependencies: [lighting],
  source: WATER_WGSL,
  vs: WATER_VS,
  fs: WATER_FS,
  defines: {
    LIGHTING_FRAGMENT: true
  },
  uniformTypes: {
    time: 'f32',
    baseColor: 'vec3<f32>',
    opacity: 'f32',
    fresnelColor: 'vec3<f32>',
    fresnelPower: 'f32',
    specularIntensity: 'f32',
    normalStrength: 'f32',
    mappingMode: 'i32',
    coordinateScale: 'vec2<f32>',
    coordinateOffset: 'vec2<f32>',
    waveADirection: 'vec2<f32>',
    waveASpeed: 'f32',
    waveAFrequency: 'f32',
    waveAAmplitude: 'f32',
    waveBDirection: 'vec2<f32>',
    waveBSpeed: 'f32',
    waveBFrequency: 'f32',
    waveBAmplitude: 'f32'
  },
  defaultUniforms: {
    time: 0,
    baseColor: [0.04, 0.18, 0.31],
    opacity: 0.82,
    fresnelColor: [0.86, 0.95, 1],
    fresnelPower: 5,
    specularIntensity: 1.4,
    normalStrength: 0.35,
    mappingMode: 0,
    coordinateScale: [1, 1],
    coordinateOffset: [0, 0],
    waveADirection: [0.9805806756909201, 0.19611613513818402],
    waveASpeed: 0.6,
    waveAFrequency: 4,
    waveAAmplitude: 0.08,
    waveBDirection: [0.09950371902099893, 0.9950371902099893],
    waveBSpeed: -0.45,
    waveBFrequency: 7,
    waveBAmplitude: 0.04
  } as Required<WaterMaterialUniforms>,
  getUniforms(
    props?: WaterMaterialProps,
    previousUniforms: Partial<WaterMaterialUniforms> = waterMaterial.defaultUniforms
  ) {
    const {mapping, ...uniformProps} = props || {};
    const uniforms = mergeWaterMaterialUniforms(previousUniforms);

    if (uniformProps.time !== undefined) {
      uniforms.time = uniformProps.time;
    }
    if (uniformProps.opacity !== undefined) {
      uniforms.opacity = uniformProps.opacity;
    }
    if (uniformProps.fresnelPower !== undefined) {
      uniforms.fresnelPower = uniformProps.fresnelPower;
    }
    if (uniformProps.specularIntensity !== undefined) {
      uniforms.specularIntensity = uniformProps.specularIntensity;
    }
    if (uniformProps.normalStrength !== undefined) {
      uniforms.normalStrength = uniformProps.normalStrength;
    }
    if (uniformProps.coordinateScale !== undefined) {
      uniforms.coordinateScale = [
        Number(uniformProps.coordinateScale[0]),
        Number(uniformProps.coordinateScale[1])
      ];
    }
    if (uniformProps.coordinateOffset !== undefined) {
      uniforms.coordinateOffset = [
        Number(uniformProps.coordinateOffset[0]),
        Number(uniformProps.coordinateOffset[1])
      ];
    }
    if (uniformProps.waveASpeed !== undefined) {
      uniforms.waveASpeed = uniformProps.waveASpeed;
    }
    if (uniformProps.waveAFrequency !== undefined) {
      uniforms.waveAFrequency = uniformProps.waveAFrequency;
    }
    if (uniformProps.waveAAmplitude !== undefined) {
      uniforms.waveAAmplitude = uniformProps.waveAAmplitude;
    }
    if (uniformProps.waveBSpeed !== undefined) {
      uniforms.waveBSpeed = uniformProps.waveBSpeed;
    }
    if (uniformProps.waveBFrequency !== undefined) {
      uniforms.waveBFrequency = uniformProps.waveBFrequency;
    }
    if (uniformProps.waveBAmplitude !== undefined) {
      uniforms.waveBAmplitude = uniformProps.waveBAmplitude;
    }

    if (uniformProps.baseColor) {
      uniforms.baseColor = normalizeColor3(uniformProps.baseColor);
    }
    if (uniformProps.fresnelColor) {
      uniforms.fresnelColor = normalizeColor3(uniformProps.fresnelColor);
    }
    if (uniformProps.waveADirection) {
      uniforms.waveADirection = normalizeDirection2(uniformProps.waveADirection);
    }
    if (uniformProps.waveBDirection) {
      uniforms.waveBDirection = normalizeDirection2(uniformProps.waveBDirection);
    }

    if (mapping !== undefined) {
      uniforms.mappingMode = mapping === 'world' ? 1 : 0;
    }

    return uniforms;
  }
};

function mergeWaterMaterialUniforms(
  previousUniforms: Partial<WaterMaterialUniforms>
): Required<WaterMaterialUniforms> {
  return {
    time: previousUniforms.time ?? waterMaterial.defaultUniforms.time,
    baseColor: previousUniforms.baseColor
      ? normalizeColor3(previousUniforms.baseColor)
      : waterMaterial.defaultUniforms.baseColor,
    opacity: previousUniforms.opacity ?? waterMaterial.defaultUniforms.opacity,
    fresnelColor: previousUniforms.fresnelColor
      ? normalizeColor3(previousUniforms.fresnelColor)
      : waterMaterial.defaultUniforms.fresnelColor,
    fresnelPower: previousUniforms.fresnelPower ?? waterMaterial.defaultUniforms.fresnelPower,
    specularIntensity:
      previousUniforms.specularIntensity ?? waterMaterial.defaultUniforms.specularIntensity,
    normalStrength: previousUniforms.normalStrength ?? waterMaterial.defaultUniforms.normalStrength,
    mappingMode: previousUniforms.mappingMode ?? waterMaterial.defaultUniforms.mappingMode,
    coordinateScale: previousUniforms.coordinateScale
      ? [Number(previousUniforms.coordinateScale[0]), Number(previousUniforms.coordinateScale[1])]
      : waterMaterial.defaultUniforms.coordinateScale,
    coordinateOffset: previousUniforms.coordinateOffset
      ? [Number(previousUniforms.coordinateOffset[0]), Number(previousUniforms.coordinateOffset[1])]
      : waterMaterial.defaultUniforms.coordinateOffset,
    waveADirection: previousUniforms.waveADirection
      ? normalizeDirection2(previousUniforms.waveADirection)
      : waterMaterial.defaultUniforms.waveADirection,
    waveASpeed: previousUniforms.waveASpeed ?? waterMaterial.defaultUniforms.waveASpeed,
    waveAFrequency: previousUniforms.waveAFrequency ?? waterMaterial.defaultUniforms.waveAFrequency,
    waveAAmplitude: previousUniforms.waveAAmplitude ?? waterMaterial.defaultUniforms.waveAAmplitude,
    waveBDirection: previousUniforms.waveBDirection
      ? normalizeDirection2(previousUniforms.waveBDirection)
      : waterMaterial.defaultUniforms.waveBDirection,
    waveBSpeed: previousUniforms.waveBSpeed ?? waterMaterial.defaultUniforms.waveBSpeed,
    waveBFrequency: previousUniforms.waveBFrequency ?? waterMaterial.defaultUniforms.waveBFrequency,
    waveBAmplitude: previousUniforms.waveBAmplitude ?? waterMaterial.defaultUniforms.waveBAmplitude
  };
}

function normalizeColor3(color: Readonly<Vector3 | NumberArray3>): [number, number, number] {
  const normalizedColor = [Number(color[0]), Number(color[1]), Number(color[2])] as [
    number,
    number,
    number
  ];
  const maxChannel = Math.max(...normalizedColor.map(channel => Math.abs(channel)));

  if (maxChannel > 1) {
    normalizedColor[0] /= 255;
    normalizedColor[1] /= 255;
    normalizedColor[2] /= 255;
  }

  return normalizedColor;
}

function normalizeDirection2(direction: Readonly<Vector2 | NumberArray2>): [number, number] {
  const x = Number(direction[0]);
  const y = Number(direction[1]);
  const length = Math.hypot(x, y);

  if (length === 0) {
    return [1, 0];
  }

  return [x / length, y / length];
}
