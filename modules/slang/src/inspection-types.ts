// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderType, ShaderInterface, SourceLocation} from './ir';

/** Logical values only: no inferred target byte offsets or compiler syntax nodes. */
export type InspectionType =
  | Exclude<ShaderType, {kind: 'array'}>
  | {kind: 'array'; element: InspectionType; length?: number; lengthExpression?: string}
  | {kind: 'opaque'; name: string}
  | {kind: 'inferred'};
export type InspectionVariable = {
  name: string;
  type: InspectionType;
  location: SourceLocation;
  qualifiers: string[];
  interface?: ShaderInterface;
  binding?: {group?: number; binding: number};
  layout?: Record<string, string | true>;
  block?: {name: string; members: InspectionVariable[]; instanceName?: string};
  addressSpace?: 'private' | 'uniform' | 'storage' | 'handle';
};
export type InspectionFunction = {
  name: string;
  returnType: InspectionType;
  parameters: InspectionVariable[];
  location: SourceLocation;
  stage?: 'vertex' | 'fragment' | 'compute';
  hasBody: boolean;
  returnInterface?: ShaderInterface;
};
export type ShaderInspection = {
  language: 'wgsl' | 'glsl';
  sourceName: string;
  version?: string;
  structures: {name: string; members: InspectionVariable[]; location: SourceLocation}[];
  globals: InspectionVariable[];
  functions: InspectionFunction[];
  entryPoints: InspectionFunction[];
};
export type InspectShaderOptions = {sourceName?: string};
