// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {InteractivityPropertyAdapter} from '../interactivity/interactivity';
import type {AnimationBinding} from './animation-track';
import type {Material} from '../material/material';
import {getTextureTransformDeltaMatrix, type PBRTextureTransform} from './texture-transform';

export type MaterialAnimationTarget = {property: string; component?: number};
export type TextureTransformAnimationTarget = {
  textureSlot: string;
  uniform: string;
  path: 'offset' | 'rotation' | 'scale';
  component?: number;
  baseTransform: PBRTextureTransform;
};
export type MaterialTextureTransformState = Map<
  Material,
  Partial<Record<string, PBRTextureTransform>>
>;

/** Binds resolved material instances, including inactive material variants. */
export function makeMaterialAnimationBinding(
  materials: readonly Material[],
  target: MaterialAnimationTarget,
  id?: string
): AnimationBinding {
  return {
    id,
    getValue: () => getMaterialAnimationBindingValue(materials[0], target),
    setValue: value => {
      for (const material of materials) applyMaterialAnimationValue(material, target, value);
    }
  };
}

/** Animates texture transforms relative to the authored UV transform. */
export function makeTextureTransformAnimationBinding(
  materials: readonly Material[],
  target: TextureTransformAnimationTarget,
  state: MaterialTextureTransformState = new Map(),
  id?: string
): AnimationBinding {
  return {
    id,
    setValue: value => {
      for (const material of materials)
        applyTextureTransformAnimationValue(material, target, value, state);
    }
  };
}

/** Binds an already resolved camera or light property; source addressing is import-time work. */
export function makePropertyAnimationBinding(
  object: Record<string, any>,
  property: string,
  options: {id?: string; component?: number; onChange?: () => void} = {}
): AnimationBinding {
  return {
    id: options.id,
    getValue: () => {
      const value = object[property];
      if (Array.isArray(value))
        return options.component === undefined ? [...value] : [value[options.component]];
      return typeof value === 'number' ? [value] : [];
    },
    setValue: value => {
      if (options.component !== undefined) {
        const components = [...(object[property] || [1, 1, 1])];
        components[options.component] = value[0];
        object[property] = components;
      } else object[property] = value.length === 1 ? value[0] : [...value];
      options.onChange?.();
    }
  };
}

function getMaterialAnimationBindingValue(
  material: Material,
  channel: MaterialAnimationTarget
): number[] {
  const uniformValues = material.shaderInputs.getUniformValues() as Record<string, any>;
  const currentValue = uniformValues['pbrMaterial']?.[channel.property];
  if (Array.isArray(currentValue)) {
    return channel.component === undefined ? [...currentValue] : [currentValue[channel.component]];
  }
  return typeof currentValue === 'number' ? [currentValue] : [];
}

function applyMaterialAnimationValue(
  material: Material,
  channel: MaterialAnimationTarget,
  value: number[]
): void {
  const pbrMaterial =
    channel.component !== undefined
      ? {
          [channel.property]: updateMaterialArrayComponent(
            getCurrentMaterialValue(material, channel.property),
            channel.component,
            value[0]
          )
        }
      : {
          [channel.property]: value.length === 1 ? value[0] : value
        };

  material.setProps({pbrMaterial});
}

function getCurrentMaterialValue(material: Material, property: string): number[] {
  const uniformValues = material.shaderInputs.getUniformValues() as Record<string, any>;
  const currentValue = uniformValues['pbrMaterial']?.[property];
  return Array.isArray(currentValue) ? [...currentValue] : [];
}

function updateMaterialArrayComponent(
  currentValue: number[],
  component: number,
  nextValue: number
): number[] {
  const updatedValue = [...currentValue];
  updatedValue[component] = nextValue;
  return updatedValue;
}

function applyTextureTransformAnimationValue(
  material: Material,
  channel: TextureTransformAnimationTarget,
  value: number[],
  materialTextureTransformState: Map<Material, Partial<Record<string, PBRTextureTransform>>>
): void {
  const currentTransform = getCurrentTextureTransform(
    materialTextureTransformState,
    material,
    channel
  );

  switch (channel.path) {
    case 'offset':
      if (channel.component !== undefined) {
        currentTransform.offset[channel.component] = value[0];
      } else {
        currentTransform.offset = [value[0], value[1]];
      }
      break;

    case 'rotation':
      currentTransform.rotation = value[0];
      break;

    case 'scale':
      if (channel.component !== undefined) {
        currentTransform.scale[channel.component] = value[0];
      } else {
        currentTransform.scale = [value[0], value[1]];
      }
      break;
  }

  material.setProps({
    pbrMaterial: {
      [channel.uniform]: getTextureTransformDeltaMatrix(channel.baseTransform, currentTransform)
    }
  });
}

function getCurrentTextureTransform(
  materialTextureTransformState: Map<Material, Partial<Record<string, PBRTextureTransform>>>,
  material: Material,
  channel: TextureTransformAnimationTarget
): PBRTextureTransform {
  const materialState = materialTextureTransformState.get(material) || {};
  let textureTransformState = materialState[channel.textureSlot];
  if (!textureTransformState) {
    textureTransformState = {
      offset: [...channel.baseTransform.offset] as [number, number],
      rotation: channel.baseTransform.rotation,
      scale: [...channel.baseTransform.scale] as [number, number]
    };
    materialState[channel.textureSlot] = textureTransformState;
    materialTextureTransformState.set(material, materialState);
  }

  return textureTransformState;
}

/** Bind a resolved host property adapter to the shared animation mixer. */
export function makeAdapterAnimationBinding(
  adapter: InteractivityPropertyAdapter,
  pointer: string
): AnimationBinding {
  const read = () => {
    const value = adapter.get(pointer);
    if (
      !value ||
      !value.every(component => typeof component === 'number' || typeof component === 'boolean')
    )
      throw new Error('Missing numeric animation property');
    return value;
  };
  const boolean = typeof read()[0] === 'boolean';
  return {
    id: pointer,
    getValue: () => read().map(Number),
    setValue: value => {
      if (!adapter.set(pointer, boolean ? [value[0] !== 0] : [...value]))
        throw new Error('Animation property is not writable');
    }
  };
}
