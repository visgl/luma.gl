// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
  _GlobeViewport,
  Layer,
  type LayerContext,
  type LayerProps,
  type Viewport
} from '@deck.gl/core';
import {type RenderPass} from '@luma.gl/core';
import {
  Camera,
  type Scene,
  Matrix4,
  Vector3,
  Raycaster,
  type Object3D,
  WebGLCoordinateSystem,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {ThreeMeshAdapter, ThreeSceneAdapter, type ThreeMeshAdapterProps} from './objects';

const depthConversion = new Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 1);

/** Three strips camera scale; absorb deck's common-space transform into projection. */
export function synchronizeThreeCamera(
  camera: Camera,
  viewport: Pick<Viewport, 'viewMatrix' | 'projectionMatrix' | 'isGeospatial'> &
    Partial<Pick<Viewport, 'projectPosition' | 'getDistanceScales'>>,
  coordinateSystem: Camera['coordinateSystem'] = WebGLCoordinateSystem,
  coordinateOrigin?: [number, number, number]
): void {
  if (coordinateOrigin && !viewport.isGeospatial)
    throw new Error('A local meter origin requires a geographic Mercator viewport');
  const viewMatrix = new Matrix4().fromArray(viewport.viewMatrix);
  if (viewport.isGeospatial) {
    if (viewport instanceof _GlobeViewport)
      throw new Error('Geographic Three scenes require Mercator projection');
    if (!coordinateOrigin || !viewport.projectPosition || !viewport.getDistanceScales)
      throw new Error('Geographic Three scenes require a local meter coordinate origin');
    const origin = viewport.projectPosition(coordinateOrigin);
    const scale = viewport.getDistanceScales(coordinateOrigin).unitsPerMeter;
    viewMatrix.multiply(new Matrix4().makeTranslation(...origin));
    viewMatrix.scale(new Vector3(...scale));
  }
  camera.matrixAutoUpdate = false;
  camera.matrixWorldAutoUpdate = false;
  camera.coordinateSystem = coordinateSystem;
  camera.matrixWorldInverse.copy(viewMatrix);
  camera.matrixWorld.copy(camera.matrixWorldInverse).invert();
  camera.matrixWorld.decompose(camera.position, camera.quaternion, new Vector3());
  camera.quaternion.normalize();
  camera.scale.set(1, 1, 1);
  camera.matrixWorld.compose(camera.position, camera.quaternion, camera.scale);
  camera.matrix.copy(camera.matrixWorld);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  camera.projectionMatrix
    .fromArray(viewport.projectionMatrix)
    .multiply(viewMatrix)
    .multiply(camera.matrixWorld);
  if (coordinateSystem === WebGPUCoordinateSystem)
    camera.projectionMatrix.premultiply(depthConversion);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

export type ThreeMeshLayerProps = LayerProps & {
  /** Borrowed, ordinary Three triangle meshes with untextured MeshBasicMaterial. */
  meshes: readonly ThreeMeshAdapterProps['mesh'][];
};

/** Draw Three meshes in deck's active pass, using deck's device, viewport and depth. */
export class ThreeMeshLayer extends Layer<ThreeMeshLayerProps> {
  static override layerName = 'ThreeMeshLayer';
  static override defaultProps = {
    meshes: {type: 'object', value: [], compare: false},
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
  };
  declare state: {camera: Camera; adapters: ThreeMeshAdapter[]; attachmentKey?: string};

  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {
    this.setState({camera: new Camera(), adapters: []});
  }
  override updateState(): void {
    if (this.context.device.type !== 'webgpu') throw new Error('ThreeMeshLayer requires WebGPU');
    if (
      this.props.pickable ||
      this.props.opacity !== 1 ||
      this.props.extensions.length ||
      this.props.modelMatrix ||
      Object.keys(this.props.parameters || {}).length ||
      this.props.coordinateOrigin.some(value => value !== 0) ||
      this.props.coordinateSystem !== COORDINATE_SYSTEM.CARTESIAN
    )
      throw new Error(
        'ThreeMeshLayer supports non-pickable Cartesian meshes; use Three transforms and materials'
      );
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    const framebuffer = renderPass.props.framebuffer;
    if (
      !framebuffer ||
      framebuffer.colorAttachments.length !== 1 ||
      !framebuffer.depthStencilAttachment
    )
      throw new Error('ThreeMeshLayer requires one color attachment and a shared depth attachment');
    const colorTexture = framebuffer.colorAttachments[0].texture;
    const depthTexture = framebuffer.depthStencilAttachment.texture;
    if (colorTexture.samples !== 1) throw new Error('ThreeMeshLayer multisampling is unsupported');
    const attachmentKey = `${colorTexture.format}:${depthTexture.format}`;
    if (
      this.state.attachmentKey !== attachmentKey ||
      this.state.adapters.length !== this.props.meshes.length ||
      this.state.adapters.some((adapter, index) => adapter.mesh !== this.props.meshes[index])
    ) {
      for (const adapter of this.state.adapters) adapter.dispose();
      const adapters: ThreeMeshAdapter[] = [];
      try {
        for (const mesh of this.props.meshes)
          adapters.push(
            new ThreeMeshAdapter({
              device: this.context.device,
              mesh,
              outputColorSpace: 'srgb',
              colorAttachmentFormat:
                colorTexture.format as ThreeMeshAdapterProps['colorAttachmentFormat'],
              depthStencilAttachmentFormat:
                depthTexture.format as ThreeMeshAdapterProps['depthStencilAttachmentFormat']
            })
          );
      } catch (error) {
        for (const adapter of adapters) adapter.dispose();
        this.setState({adapters: [], attachmentKey: undefined});
        throw error;
      }
      this.setState({adapters, attachmentKey});
    }
    synchronizeThreeCamera(this.state.camera, this.context.viewport);
    for (const adapter of this.state.adapters) {
      adapter.synchronize(this.state.camera);
      adapter.draw(renderPass);
    }
  }
  override finalizeState(context: LayerContext): void {
    for (const adapter of this.state.adapters) adapter.dispose();
    super.finalizeState(context);
  }
}

export type ThreeSceneLayerProps = LayerProps & {
  adapter: ThreeSceneAdapter;
  scene: Scene;
  camera: Camera;
};

/** Draw a prepared upstream-compiled PBR scene without replacing deck's pass. */
export class ThreeSceneLayer extends Layer<ThreeSceneLayerProps> {
  static override layerName = 'ThreeSceneLayer';
  static override defaultProps = {coordinateSystem: COORDINATE_SYSTEM.CARTESIAN};
  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {}
  override updateState(): void {
    if (
      this.context.device !== this.props.adapter.device ||
      this.props.pickable ||
      this.props.opacity !== 1 ||
      this.props.extensions.length ||
      this.props.modelMatrix ||
      Object.keys(this.props.parameters || {}).length ||
      (this.props.coordinateSystem !== COORDINATE_SYSTEM.METER_OFFSETS &&
        (this.props.coordinateOrigin.some(value => value !== 0) ||
          this.props.coordinateSystem !== COORDINATE_SYSTEM.CARTESIAN))
    )
      throw new Error(
        "ThreeSceneLayer requires a prepared adapter on deck's device and a non-pickable Cartesian or local meter scene"
      );
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    synchronizeThreeCamera(
      this.props.camera,
      this.context.viewport,
      WebGPUCoordinateSystem,
      this.props.coordinateSystem === COORDINATE_SYSTEM.METER_OFFSETS
        ? [
            this.props.coordinateOrigin[0],
            this.props.coordinateOrigin[1],
            this.props.coordinateOrigin[2] ?? 0
          ]
        : undefined
    );
    this.props.adapter.draw(this.props.scene, this.props.camera, renderPass);
  }
  // Adapter/source ownership belongs to the caller; removing this layer preserves both.
}

/** CPU triangle picking in the synchronized local frame; include occluders in roots. */
export function pickThreeObject(
  camera: Camera,
  normalizedPosition: [number, number],
  roots: Object3D[]
) {
  for (const root of roots) root.updateWorldMatrix(true, true);
  const near = new Vector3(
    ...normalizedPosition,
    camera.coordinateSystem === WebGPUCoordinateSystem ? 0 : -1
  ).unproject(camera);
  const far = new Vector3(...normalizedPosition, 1).unproject(camera);
  const raycaster = new Raycaster(near, far.clone().sub(near).normalize(), 0, near.distanceTo(far));
  const intersections = raycaster.intersectObjects(roots, true);
  return intersections.find(intersection => {
    for (let object: Object3D | null = intersection.object; object; object = object.parent)
      if (!object.visible) return false;
    return true;
  });
}
