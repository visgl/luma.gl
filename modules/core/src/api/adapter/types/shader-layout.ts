// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Buffer} from '../resources/buffer';
import {type Sampler} from '../resources/sampler';
import {type ExternalTexture} from '../resources/external-texture';
import {type Texture} from '../resources/texture';
import {type TextureView} from '../resources/texture-view';

// BINDING VALUE TYPES

/** Binding value */
export type Binding =
  | TextureView
  | Texture
  | ExternalTexture
  | Sampler
  | Buffer
  | {buffer: Buffer; offset?: number; size?: number};

/** Named binding map */
export type Bindings = Record<string, Binding>;

/** Bindings partitioned by bind-group index */
export type BindingsByGroup = Partial<Record<number, Bindings>>;

/** @deprecated */
export type AttributeBinding = {
  name: string;
  location: number;
  accessor: AccessorObject;
};

/**
 * Attribute descriptor object
 * @deprecated Use ShaderLayout
 */
export interface AccessorObject {
  buffer?: Buffer;
  // format: VertexFormat;
  offset?: number;
  // can now be described with single WebGPU-style `format` string

  //
  stride?: number;

  /** @deprecated - Use accessor.stepMode */
  divisor?: number;

  /** @deprecated - Infer from format */
  type?: number;
  /** @deprecated - Infer from format */
  size?: number;
  /** @deprecated - Infer from format */
  normalized?: boolean;
  /** @deprecated - Infer from format */
  integer?: boolean;

  /** @deprecated */
  index?: number;
}

export type {
  UniformBinding,
  UniformBlockBinding,
  VaryingBinding,
  StorageTextureBindingLayout,
  SamplerBindingLayout,
  ExternalTextureBindingLayout,
  TextureBindingLayout,
  StorageBufferBindingLayout,
  UniformInfo,
  UniformBlockLayout,
  UniformBufferBindingLayout,
  BindingDeclaration,
  AttributeDeclaration,
  ComputeShaderLayout,
  ShaderLayout
} from '@luma.gl/shaders/types';
