// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PrimitiveTopology} from '@luma.gl/core';

export const GLTF_REFERENCE_EVIDENCE_SCHEMA = 'luma.gl/gltf-reference-evidence';
export const GLTF_REFERENCE_EVIDENCE_VERSION = 1;

export type GLTFReferenceCaptureOptions = {
  modelName: string;
  variant: string;
  fileName: string;
  yaw: number;
  pitch: number;
  distanceMultiplier: number;
};

export type GLTFReferenceModelDraw = {
  topology: PrimitiveTopology;
  isInstanced?: boolean;
  instanceCount: number;
  vertexCount: number;
  indexCount?: number;
  indexBuffer: {byteLength: number; indexType?: 'uint16' | 'uint32'} | null;
};

export type GLTFReferenceDrawMetrics = {
  drawCount: number;
  submittedIndexReferences: number;
  submittedVertexReferences: number;
  triangleCount: number;
};

export type GLTFReferenceResourceMetrics = {
  requestCount: number;
  transferBytes: number;
  encodedBodyBytes: number;
  decodedBodyBytes: number;
};

export type GLTFReferenceEvidence = {
  schema: typeof GLTF_REFERENCE_EVIDENCE_SCHEMA;
  version: typeof GLTF_REFERENCE_EVIDENCE_VERSION;
  status: 'ready';
  model: {
    name: string;
    variant: string;
    fileName: string;
    url: string;
  };
  renderer: {
    backend: string;
    vendor: string;
    renderer: string;
    version: string;
    gpu: string;
    gpuType: string;
    gpuBackend?: string;
    featureLevel?: string;
    shadingLanguage: string;
  };
  camera: {
    yaw: number;
    pitch: number;
    distanceMultiplier: number;
    position: [number, number, number];
    target: [number, number, number];
    verticalFieldOfViewRadians: number;
    near: number;
    far: number;
  };
  rendering: {
    animation: 'disabled';
    automaticLevelOfDetail: 'disabled';
    environment: 'fixed-fallback-lights';
    exposure: 1;
    toneMapping: 'none';
    outputColorSpace: 'srgb';
  };
  extensions: Array<{
    extensionName: string;
    required: boolean;
    supported: boolean;
    supportLevel: string;
    standardStatus?: string;
  }>;
  metrics: {
    frameCount: number;
    averageFrameCpuMilliseconds: number;
    animationCpuMilliseconds: number;
    loadMilliseconds: number;
    fetchAndPostprocessMilliseconds: number;
    scenegraphCreationMilliseconds: number;
    initialDrawCpuMilliseconds: number;
    shaderCompilationMilliseconds: null;
    shaderCompilationAvailability: 'not-exposed-by-device-api';
    gpuMemoryBytes: number;
    resources: GLTFReferenceResourceMetrics;
    drawCount: number;
    submittedIndexReferences: number;
    submittedVertexReferences: number;
    triangleCount: number;
  };
};

/** Parse the opt-in deterministic capture contract from a URL query string. */
export function getGLTFReferenceCaptureOptions(
  search: string
): GLTFReferenceCaptureOptions | undefined {
  const searchParameters = new URLSearchParams(search);
  if (searchParameters.get('gltf-reference') !== '1') {
    return undefined;
  }

  const modelName = searchParameters.get('model')?.trim() || 'BumpMaterial';
  const variant = searchParameters.get('variant')?.trim() || 'glTF';
  const defaultFileExtension = variant === 'glTF-Binary' ? 'glb' : 'gltf';

  return {
    modelName,
    variant,
    fileName: searchParameters.get('file')?.trim() || `${modelName}.${defaultFileExtension}`,
    yaw: getFiniteSearchNumber(searchParameters, 'yaw', 0.35),
    pitch: getFiniteSearchNumber(searchParameters, 'pitch', -0.15),
    distanceMultiplier: Math.max(0.05, getFiniteSearchNumber(searchParameters, 'distance', 1))
  };
}

/** Calculate submitted geometry metrics for models that completed a draw. */
export function getGLTFReferenceDrawMetrics(
  drawnModels: readonly GLTFReferenceModelDraw[]
): GLTFReferenceDrawMetrics {
  const metrics: GLTFReferenceDrawMetrics = {
    drawCount: 0,
    submittedIndexReferences: 0,
    submittedVertexReferences: 0,
    triangleCount: 0
  };

  for (const model of drawnModels) {
    const instanceCount = model.isInstanced ? model.instanceCount : 1;
    if (instanceCount <= 0) {
      continue;
    }

    const indexCount = model.indexBuffer
      ? (model.indexCount ??
        model.indexBuffer.byteLength / (model.indexBuffer.indexType === 'uint32' ? 4 : 2))
      : 0;
    const vertexCount = model.indexBuffer ? 0 : model.vertexCount;
    const submittedElementCount = (indexCount || vertexCount) * instanceCount;

    metrics.drawCount++;
    metrics.submittedIndexReferences += indexCount * instanceCount;
    metrics.submittedVertexReferences += vertexCount * instanceCount;
    metrics.triangleCount += getTriangleCount(model.topology, submittedElementCount);
  }

  return metrics;
}

/** Read browser resource-timing bytes for the selected model asset. */
export function getGLTFReferenceResourceMetrics(modelUrl: string): GLTFReferenceResourceMetrics {
  const resourceEntries = performance
    .getEntriesByType('resource')
    .filter(entry => entry.name === modelUrl) as PerformanceResourceTiming[];

  return resourceEntries.reduce<GLTFReferenceResourceMetrics>(
    (metrics, entry) => ({
      requestCount: metrics.requestCount + 1,
      transferBytes: metrics.transferBytes + entry.transferSize,
      encodedBodyBytes: metrics.encodedBodyBytes + entry.encodedBodySize,
      decodedBodyBytes: metrics.decodedBodyBytes + entry.decodedBodySize
    }),
    {requestCount: 0, transferBytes: 0, encodedBodyBytes: 0, decodedBodyBytes: 0}
  );
}

function getTriangleCount(topology: PrimitiveTopology, submittedElementCount: number): number {
  if (topology === 'triangle-list') {
    return Math.floor(submittedElementCount / 3);
  }
  if (topology === 'triangle-strip') {
    return Math.max(0, submittedElementCount - 2);
  }
  return 0;
}

function getFiniteSearchNumber(
  searchParameters: URLSearchParams,
  name: string,
  fallback: number
): number {
  const value = searchParameters.get(name);
  if (value === null || value.trim() === '') {
    return fallback;
  }
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
