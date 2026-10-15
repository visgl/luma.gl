// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
  _GlobeViewport,
  Layer,
  type LayerContext,
  type LayerProps,
  type GetPickingInfoParams,
  type PickingInfo,
  type Viewport
} from '@deck.gl/core';
import {type RenderPass, type RenderPipelineParameters} from '@luma.gl/core';
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
import {
  ThreeMeshAdapter,
  ThreeSceneAdapter,
  type ThreeMeshAdapterProps,
  type ThreePickingColor
} from './objects';

// deck encodes the layer in alpha using the caller pass's blend constant.
const PICKING_PARAMETERS: RenderPipelineParameters = {
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'one',
  blendColorDstFactor: 'zero',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'constant',
  blendAlphaDstFactor: 'zero'
};

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

/** Application identity and the Three root selected by any rendered descendant. */
export type ThreeScenePickingObject = {id: string | number; object: Object3D};
export type ThreeScenePickingInfo = PickingInfo<ThreeScenePickingObject>;

export type ThreeSceneLayerProps = LayerProps & {
  adapter: ThreeSceneAdapter;
  scene: Scene;
  camera: Camera;
  /** Immutable membership list. Use object.id for identity; info.index is positional. */
  pickingObjects?: readonly ThreeScenePickingObject[];
};

/** Draw a prepared upstream-compiled PBR scene without replacing deck's pass. */
export class ThreeSceneLayer extends Layer<ThreeSceneLayerProps> {
  static override layerName = 'ThreeSceneLayer';
  static override defaultProps = {
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickingObjects: {type: 'object', value: [], compare: false}
  };
  declare state: {
    pickingIndices: Map<Object3D, number>;
    disabledPickingIndices: Set<number>;
    highlightedObjectColor?: ArrayLike<number> | null;
    highlightColor?: ArrayLike<number>;
  };
  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {
    this.setState({pickingIndices: new Map(), disabledPickingIndices: new Set()});
  }
  override updateState(): void {
    if (
      this.context.device !== this.props.adapter.device ||
      this.props.opacity !== 1 ||
      this.props.extensions.length ||
      this.props.modelMatrix ||
      Object.keys(this.props.parameters || {}).length ||
      (this.props.coordinateSystem !== COORDINATE_SYSTEM.METER_OFFSETS &&
        (this.props.coordinateOrigin.some(value => value !== 0) ||
          this.props.coordinateSystem !== COORDINATE_SYSTEM.CARTESIAN))
    )
      throw new Error(
        "ThreeSceneLayer requires a prepared adapter on deck's device and a Cartesian or local meter scene"
      );
    const pickingIndices = new Map<Object3D, number>();
    const identities = new Set<string | number>();
    (this.props.pickingObjects || []).forEach((entry, index) => {
      if (identities.has(entry.id) || pickingIndices.has(entry.object))
        throw new Error('ThreeSceneLayer picking roots and IDs must be unique');
      identities.add(entry.id);
      pickingIndices.set(entry.object, index);
    });
    this.setState({pickingIndices});
  }

  override setShaderModuleProps(
    ...moduleProps: Parameters<Layer<ThreeSceneLayerProps>['setShaderModuleProps']>
  ): void {
    super.setShaderModuleProps(...moduleProps);
    // deck owns hover/controlled precedence and accessor evaluation, even without a luma Model.
    for (const properties of moduleProps) {
      const picking = properties['picking'] as
        | Pick<ThreeSceneLayer['state'], 'highlightColor' | 'highlightedObjectColor'>
        | undefined;
      if (picking?.highlightedObjectColor !== undefined)
        this.state.highlightedObjectColor = picking.highlightedObjectColor;
      if (picking?.highlightColor !== undefined) this.state.highlightColor = picking.highlightColor;
    }
  }

  private getPickingIndex(object: Object3D): number | undefined {
    for (let root: Object3D | null = object; root; root = root.parent) {
      const index = this.state.pickingIndices.get(root);
      if (index !== undefined) return index;
    }
    return undefined;
  }

  override getPickingInfo({info}: GetPickingInfoParams): ThreeScenePickingInfo {
    info.object = info.index >= 0 ? this.props.pickingObjects?.[info.index] : undefined;
    return info;
  }

  override disablePickingIndex(index: number): void {
    this.state.disabledPickingIndices.add(index);
  }

  override restorePickingColors(): void {
    this.state.disabledPickingIndices.clear();
  }

  override draw({
    renderPass,
    shaderModuleProps
  }: {
    renderPass: RenderPass;
    shaderModuleProps?: {picking?: {isActive?: boolean | number; isAttribute?: boolean | number}};
  }): void {
    const picking = shaderModuleProps?.picking;
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
    if (picking?.isActive) {
      const getColor = (object: Object3D): ThreePickingColor | null => {
        const index = this.getPickingIndex(object);
        // Unlisted scene geometry remains a depth occluder in deck's shared pick pass.
        if (index === undefined) return [0, 0, 0, 0];
        if (this.state.disabledPickingIndices.has(index)) return null;
        const color = this.encodePickingColor(index);
        return [color[0] / 255, color[1] / 255, color[2] / 255, 1];
      };
      if (picking.isAttribute) {
        this.props.adapter.drawPickingDepth(
          this.props.scene,
          this.props.camera,
          renderPass,
          getColor
        );
      } else {
        this.props.adapter.drawPicking(
          this.props.scene,
          this.props.camera,
          renderPass,
          getColor,
          PICKING_PARAMETERS
        );
      }
    } else if (this.state.highlightedObjectColor && this.state.highlightColor) {
      const encodedIndex = this.state.highlightedObjectColor;
      const index = encodedIndex[0] + encodedIndex[1] * 256 + encodedIndex[2] * 65536 - 1;
      const color = this.state.highlightColor;
      const highlight: [number, number, number, number] = [
        color[0] / 255,
        color[1] / 255,
        color[2] / 255,
        (color[3] ?? 255) / 255
      ];
      this.props.adapter.drawHighlighted(this.props.scene, this.props.camera, renderPass, object =>
        this.getPickingIndex(object) === index ? highlight : null
      );
    } else this.props.adapter.draw(this.props.scene, this.props.camera, renderPass);
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
