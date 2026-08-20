// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ANARIArray,
  ANARICamera,
  ANARIFrame,
  ANARIGeometry,
  ANARIGroup,
  ANARIInstance,
  ANARILight,
  ANARIMaterial,
  ANARIRenderer,
  ANARISampler,
  ANARISurface,
  ANARIWorld
} from './anari-objects';
import {ANARIRayTracingRuntime} from './anari-ray-tracing-runtime';
import type {ANARIRendererRuntime, ANARIRendererRuntimeFactory} from './anari-renderer-runtime';
import {ANARIRenderingRuntime} from './anari-rendering-runtime';
import type {
  ANARIArrayParameters,
  ANARICameraParameters,
  ANARICameraSubtype,
  ANARIFrameParameters,
  ANARIFrameStatistics,
  ANARIGeometryParameters,
  ANARIGeometrySubtype,
  ANARIGroupParameters,
  ANARIInstanceParameters,
  ANARILightParameters,
  ANARILightSubtype,
  ANARIMaterialParameters,
  ANARIMaterialSubtype,
  ANARIObjectInfo,
  ANARIObjectType,
  ANARIRendererParameters,
  ANARIRendererSubtype,
  ANARISamplerParameters,
  ANARISamplerSubtype,
  ANARISurfaceParameters,
  ANARIWorldParameters
} from './anari-types';

const OBJECT_SUBTYPES: Record<Exclude<ANARIObjectType, 'renderer'>, readonly string[]> = {
  array: ['array1D'],
  camera: ['perspective', 'orthographic'],
  frame: ['default'],
  geometry: ['triangle', 'sphere', 'cylinder', 'cone', 'quad'],
  group: ['default'],
  instance: ['transform'],
  light: ['ambient', 'directional', 'point', 'spot'],
  material: ['matte', 'physicallyBased'],
  sampler: ['image2D'],
  surface: ['default'],
  world: ['default']
};

const SUPPORTED_EXTENSIONS = [
  'KHR_CAMERA_PERSPECTIVE',
  'KHR_CAMERA_ORTHOGRAPHIC',
  'KHR_GEOMETRY_TRIANGLE',
  'KHR_GEOMETRY_SPHERE',
  'KHR_GEOMETRY_CYLINDER',
  'KHR_GEOMETRY_CONE',
  'KHR_GEOMETRY_QUAD',
  'KHR_INSTANCE_TRANSFORM',
  'KHR_LIGHT_DIRECTIONAL',
  'KHR_LIGHT_POINT',
  'KHR_LIGHT_SPOT',
  'KHR_MATERIAL_MATTE',
  'KHR_MATERIAL_PHYSICALLY_BASED',
  'KHR_SAMPLER_IMAGE2D'
] as const;

const MAXIMUM_SCENE_COMMIT_HISTORY = 256;

/** @internal Committed retained-scene category observed by format adapters. */
export type ANARISceneCommitCategory = 'topology' | 'transforms' | 'materials' | 'lights';

/** @internal One bounded, device-local retained-object commit notification. */
export type ANARISceneCommit = {
  revision: number;
  objectId: string;
  categories: readonly ANARISceneCommitCategory[];
};

export class ANARIDevice {
  readonly device: Device;
  readonly extensions = SUPPORTED_EXTENSIONS;

  private readonly rendererRuntimeFactories = new Map<
    ANARIRendererSubtype,
    ANARIRendererRuntimeFactory
  >();
  private readonly renderingRuntimes = new Map<ANARIRendererRuntimeFactory, ANARIRendererRuntime>();
  private readonly sceneCommits: ANARISceneCommit[] = [];
  private sceneCommitRevision = 0;

  constructor(device: Device) {
    this.device = device;

    const forwardRuntimeFactory: ANARIRendererRuntimeFactory = graphicsDevice =>
      new ANARIRenderingRuntime(graphicsDevice);
    this.registerRenderer('default', forwardRuntimeFactory);
    this.registerRenderer(
      'deferred',
      graphicsDevice => new ANARIRenderingRuntime(graphicsDevice, {deferred: true})
    );
    this.registerRenderer('debugNormals', forwardRuntimeFactory);
    this.registerRenderer('debugDepth', forwardRuntimeFactory);
    this.registerRenderer('raytrace', graphicsDevice => new ANARIRayTracingRuntime(graphicsDevice));
  }

  newArray(parameters: ANARIArrayParameters): ANARIArray {
    return new ANARIArray(this, parameters);
  }

  newGeometry(
    subtype: ANARIGeometrySubtype,
    parameters: ANARIGeometryParameters = {}
  ): ANARIGeometry {
    return new ANARIGeometry(this, subtype, parameters);
  }

  newMaterial(
    subtype: ANARIMaterialSubtype,
    parameters: ANARIMaterialParameters = {}
  ): ANARIMaterial {
    return new ANARIMaterial(this, subtype, parameters);
  }

  newSampler(subtype: ANARISamplerSubtype, parameters: ANARISamplerParameters): ANARISampler {
    return new ANARISampler(this, subtype, parameters);
  }

  newSurface(parameters: ANARISurfaceParameters): ANARISurface {
    return new ANARISurface(this, parameters);
  }

  newGroup(parameters: ANARIGroupParameters = {}): ANARIGroup {
    return new ANARIGroup(this, parameters);
  }

  newInstance(parameters: ANARIInstanceParameters): ANARIInstance {
    return new ANARIInstance(this, parameters);
  }

  newWorld(parameters: ANARIWorldParameters = {}): ANARIWorld {
    return new ANARIWorld(this, parameters);
  }

  newLight(subtype: ANARILightSubtype, parameters: ANARILightParameters = {}): ANARILight {
    return new ANARILight(this, subtype, parameters);
  }

  newCamera(subtype: ANARICameraSubtype, parameters: ANARICameraParameters = {}): ANARICamera {
    return new ANARICamera(this, subtype, parameters);
  }

  newRenderer(
    subtype: ANARIRendererSubtype = 'default',
    parameters: ANARIRendererParameters = {}
  ): ANARIRenderer {
    return new ANARIRenderer(this, subtype, parameters);
  }

  /** Registers a lazily created rendering backend for a built-in or application-defined subtype. */
  registerRenderer(
    subtype: ANARIRendererSubtype,
    runtimeFactory: ANARIRendererRuntimeFactory
  ): this {
    const previousRuntimeFactory = this.rendererRuntimeFactories.get(subtype);
    this.rendererRuntimeFactories.set(subtype, runtimeFactory);

    if (
      previousRuntimeFactory &&
      previousRuntimeFactory !== runtimeFactory &&
      !Array.from(this.rendererRuntimeFactories.values()).includes(previousRuntimeFactory)
    ) {
      this.renderingRuntimes.get(previousRuntimeFactory)?.destroy();
      this.renderingRuntimes.delete(previousRuntimeFactory);
    }

    return this;
  }

  newFrame(parameters: ANARIFrameParameters): ANARIFrame {
    return new ANARIFrame(this, parameters);
  }

  getObjectSubtypes(type: ANARIObjectType): readonly string[] {
    if (type === 'renderer') {
      return Array.from(this.rendererRuntimeFactories.keys());
    }
    return OBJECT_SUBTYPES[type];
  }

  getObjectInfo(type: ANARIObjectType): ANARIObjectInfo {
    return {type, subtypes: this.getObjectSubtypes(type), extensions: this.extensions};
  }

  /** @internal Returns the latest committed non-camera scene mutation. */
  getSceneCommitRevision(): number {
    return this.sceneCommitRevision;
  }

  /** @internal Returns bounded commits after a revision, or null when history expired. */
  getSceneCommitsSince(revision: number): readonly ANARISceneCommit[] | null {
    if (revision === this.sceneCommitRevision) {
      return [];
    }
    if (this.sceneCommits.length === 0 || revision < this.sceneCommits[0].revision - 1) {
      return null;
    }
    return this.sceneCommits.filter(commit => commit.revision > revision);
  }

  /** @internal Publishes retained-object commits without invalidating camera-only frames. */
  recordSceneObjectCommit(
    objectType: ANARIObjectType,
    objectId: string,
    instanceGroupChanged = false
  ): void {
    let categories: readonly ANARISceneCommitCategory[];
    switch (objectType) {
      case 'world':
      case 'group':
      case 'array':
        categories = ['topology', 'lights'];
        break;
      case 'geometry':
      case 'surface':
        categories = ['topology'];
        break;
      case 'instance':
        categories = instanceGroupChanged ? ['topology', 'lights'] : ['transforms'];
        break;
      case 'material':
      case 'sampler':
        categories = ['materials'];
        break;
      case 'light':
        categories = ['lights'];
        break;
      default:
        return;
    }

    this.sceneCommitRevision++;
    this.sceneCommits.push({revision: this.sceneCommitRevision, objectId, categories});
    if (this.sceneCommits.length > MAXIMUM_SCENE_COMMIT_HISTORY) {
      this.sceneCommits.shift();
    }
  }

  renderFrame(frame: ANARIFrame): ANARIFrameStatistics {
    const rendererSubtype = frame.getParameter('renderer')?.subtype ?? 'default';
    const runtimeFactory = this.rendererRuntimeFactories.get(rendererSubtype);
    if (!runtimeFactory) {
      throw new Error(`ANARI renderer "${rendererSubtype}" is not registered.`);
    }

    let renderingRuntime = this.renderingRuntimes.get(runtimeFactory);
    if (!renderingRuntime) {
      renderingRuntime = runtimeFactory(this.device);
      this.renderingRuntimes.set(runtimeFactory, renderingRuntime);
    }
    return renderingRuntime.render(frame);
  }

  destroyFrame(frame: ANARIFrame): void {
    for (const renderingRuntime of this.renderingRuntimes.values()) {
      renderingRuntime.destroyFrame(frame);
    }
  }

  destroy(): void {
    for (const renderingRuntime of this.renderingRuntimes.values()) {
      renderingRuntime.destroy();
    }
    this.renderingRuntimes.clear();
    this.sceneCommits.length = 0;
  }
}
