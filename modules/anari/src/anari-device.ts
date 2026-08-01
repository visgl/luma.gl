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

const OBJECT_SUBTYPES: Record<ANARIObjectType, readonly string[]> = {
  array: ['array1D'],
  camera: ['perspective', 'orthographic'],
  frame: ['default'],
  geometry: ['triangle', 'sphere', 'cylinder', 'cone', 'quad'],
  group: ['default'],
  instance: ['transform'],
  light: ['ambient', 'directional', 'point', 'spot'],
  material: ['matte', 'physicallyBased'],
  renderer: ['default', 'debugNormals', 'debugDepth'],
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

export class ANARIDevice {
  readonly device: Device;
  readonly extensions = SUPPORTED_EXTENSIONS;

  private renderingRuntime: ANARIRenderingRuntime | null = null;

  constructor(device: Device) {
    this.device = device;
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

  newFrame(parameters: ANARIFrameParameters): ANARIFrame {
    return new ANARIFrame(this, parameters);
  }

  getObjectSubtypes(type: ANARIObjectType): readonly string[] {
    return OBJECT_SUBTYPES[type];
  }

  getObjectInfo(type: ANARIObjectType): ANARIObjectInfo {
    return {type, subtypes: OBJECT_SUBTYPES[type], extensions: this.extensions};
  }

  renderFrame(frame: ANARIFrame): ANARIFrameStatistics {
    this.renderingRuntime ||= new ANARIRenderingRuntime(this.device);
    return this.renderingRuntime.render(frame);
  }

  destroyFrame(frame: ANARIFrame): void {
    this.renderingRuntime?.destroyFrame(frame);
  }

  destroy(): void {
    this.renderingRuntime?.destroy();
    this.renderingRuntime = null;
  }
}
