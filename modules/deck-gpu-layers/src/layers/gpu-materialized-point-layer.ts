// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type Color,
  type LayerContext,
  type LayerProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {Buffer, type RenderPass} from '@luma.gl/core';
import {GPUVectorModel} from '@luma.gl/engine';
import type {GPUVector} from '@luma.gl/graph/gpu-data';
import type {ProjectionCoordinates} from '@luma.gl/graph/gpu-project';
import type {ProjectionRenderTransform} from '@luma.gl/graph/gpu-project-crs';
import {
  getProjectedPointShader,
  type GPUProjectedPointPickingInfo
} from './gpu-projected-point-layer';
import {
  createGPUVectorStyleBuffer,
  getGPUDataBuffer,
  getGPUVectorBuffer,
  getGPUVectorLayerBatches,
  getGPUVectorPickingProvenance,
  getGPUVectorStyleBufferBinding,
  makeGPUVectorBufferLayout,
  resizeGPUVectorStyleBuffer
} from './gpu-vector-layer-utils';

/** Props for rendering retained projected points in a Cartesian viewport. */
export type GPUMaterializedPointLayerProps = Omit<LayerProps, 'data'> & {
  /** Borrowed positions in the viewport's local Cartesian frame. */
  positions: GPUVector<'float32x2'>;
  /** Borrowed mask with one nonzero value per valid point, in matching chunks. */
  validity: GPUVector<'uint32'>;
  /** CRS transform used only to enrich picked rows on the CPU. */
  transform?: ProjectionRenderTransform;
  /** CPU lookup for the selected row. Omit to return only row and chunk identity. */
  getSourcePosition?: (rowIndex: number) => ProjectionCoordinates | null;
  /** Uniform fill color in bytes. */
  getColor?: Color;
  /** Diameter in pixels. */
  pointSize?: number;
};

/** Model and style allocations owned by the layer, with their borrowed input identities. */
type MaterializedPointState = {
  /** Model for the current nonempty vectors. */
  model: GPUVectorModel | null;
  /** Per-chunk drawing uniforms. */
  styleBuffer: Buffer | null;
  /** Input positions used to build the model. */
  positions: GPUVector<'float32x2'>;
  /** Input validity used to build the model. */
  validity: GPUVector<'uint32'>;
};

/** Byte length of one point-style uniform block. */
const STYLE_BYTES = 32;

/** Draws materialized Cartesian positions directly without scheduling projection work. */
export class GPUMaterializedPointLayer extends Layer<GPUMaterializedPointLayerProps> {
  /** Deck layer name. */
  static override layerName = 'GPUMaterializedPointLayer';
  /** Cartesian coordinates are already in the local render frame. */
  static override defaultProps = {coordinateSystem: 'cartesian'};
  /** Retained model and style resources. */
  declare state: MaterializedPointState;

  /** Vertex attributes come directly from the borrowed GPU buffers. */
  override getAttributeManager() {
    return null;
  }

  /** Builds a model for the current vector layout. */
  override initializeState({device}: LayerContext): void {
    this.validateFrame();
    const {positions, validity} = this.props;
    getGPUVectorLayerBatches(
      this.id,
      {positions, validity},
      {positions: ['float32x2'], validity: ['uint32']}
    );
    if (positions.length > 0xffffff)
      throw new Error('materialized point picking exceeds 24-bit row IDs');
    for (const vector of [positions, validity]) {
      for (const chunk of vector.data) {
        const buffer = getGPUDataBuffer(chunk);
        if (buffer.device !== device || !(buffer.usage & Buffer.VERTEX) || chunk.nullBitmap) {
          throw new Error(
            'materialized points require same-device vertex buffers and explicit validity'
          );
        }
      }
    }
    if (!positions.data.length) {
      this.setState({model: null, styleBuffer: null, positions, validity});
      return;
    }
    const styleBuffer = createGPUVectorStyleBuffer(
      device,
      `${this.id}-style`,
      STYLE_BYTES,
      positions.data.length
    );
    try {
      const model = new GPUVectorModel(device, {
        shaderAssembler: this.context.shaderAssembler,
        ...this.getShaders({modules: [project32, picking], source: getProjectedPointShader()}),
        id: `${this.id}-model`,
        topology: 'triangle-list',
        isInstanced: true,
        inferDrawCount: 'instance',
        vertexCount: 6,
        attributes: {
          positions: getGPUVectorBuffer(positions),
          validity: getGPUVectorBuffer(validity)
        },
        bufferLayout: [
          makeGPUVectorBufferLayout(positions, 'positions'),
          makeGPUVectorBufferLayout(validity, 'validity')
        ],
        bindings: {projectedPointStyle: getGPUVectorStyleBufferBinding(styleBuffer, STYLE_BYTES)}
      });
      this.setState({model, styleBuffer, positions, validity});
    } catch (error) {
      styleBuffer.destroy();
      throw error;
    }
  }

  /** Replaces the draw model only when the bound vectors or shader extensions change. */
  override updateState({props, changeFlags}: UpdateParameters<this>): void {
    if (
      props.positions !== this.state.positions ||
      props.validity !== this.state.validity ||
      changeFlags.extensionsChanged ||
      (!this.state.model && props.positions.data.length)
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }

  /** Returns the current render model, if allocated. */
  override getModels(): GPUVectorModel[] {
    return this.state.model ? [this.state.model] : [];
  }

  /** Draws one batch per physical position chunk. */
  override draw({renderPass}: {renderPass: RenderPass}): void {
    this.validateFrame();
    const {model, styleBuffer: previousStyleBuffer} = this.state;
    const {positions, validity, getColor, pointSize} = this.props;
    if (!model && positions.data.length) {
      this.setNeedsUpdate();
      return;
    }
    if (!model || !previousStyleBuffer) return;
    if (positions.length > 0xffffff)
      throw new Error('materialized point picking exceeds 24-bit row IDs');
    const styleBuffer = resizeGPUVectorStyleBuffer(
      previousStyleBuffer,
      STYLE_BYTES,
      positions.data.length
    );
    if (styleBuffer !== previousStyleBuffer) {
      this.setState({styleBuffer});
      model.setBindings({
        projectedPointStyle: getGPUVectorStyleBufferBinding(styleBuffer, STYLE_BYTES)
      });
    }
    const [red, green, blue, alpha = 255] = getColor ?? [0, 0, 0, 255];
    const bytes = new ArrayBuffer(STYLE_BYTES);
    new Float32Array(bytes).set([red / 255, green / 255, blue / 255, alpha / 255, pointSize ?? 4]);
    const words = new Uint32Array(bytes);
    model.drawBatches(renderPass, {
      vectors: {positions, validity},
      onBatch: batch => {
        words[5] = batch.rowIndexOffset;
        const binding = getGPUVectorStyleBufferBinding(styleBuffer, STYLE_BYTES, batch.batchIndex);
        styleBuffer.write(new Uint8Array(bytes), binding.offset);
        model.setBindings({projectedPointStyle: binding});
      }
    });
  }

  /** Enriches a pick from its row ID without reading coordinate buffers. */
  override getPickingInfo({info}: {info: PickingInfo}): GPUProjectedPointPickingInfo {
    const result: GPUProjectedPointPickingInfo = info;
    if (info.index < 0 || info.index >= this.props.positions.length) return result;
    result.gpuVector = getGPUVectorPickingProvenance(this.props.positions, info.index);
    const {transform, getSourcePosition} = this.props;
    if (transform && getSourcePosition) {
      const source = getSourcePosition(info.index);
      result.projection = source ? transform.projectPosition(source) : null;
    }
    return result;
  }

  /** Releases only layer-owned resources. */
  override finalizeState(context: LayerContext): void {
    this.destroyResources();
    super.finalizeState(context);
  }

  /** Ensures the supplied local positions can be used directly as Cartesian coordinates. */
  protected validateFrame(): void {
    const {coordinateSystem, coordinateOrigin, modelMatrix} = this.props;
    if (
      this.context.device.type !== 'webgpu' ||
      this.context.viewport.isGeospatial ||
      coordinateSystem !== 'cartesian' ||
      modelMatrix ||
      coordinateOrigin.some(value => value !== 0)
    ) {
      throw new Error(
        'GPUMaterializedPointLayer requires WebGPU and an untransformed Cartesian viewport'
      );
    }
  }

  /** Destroys the draw model and its uniforms while leaving all borrowed inputs intact. */
  private destroyResources(): void {
    this.state.model?.destroy();
    this.state.styleBuffer?.destroy();
    this.setState({model: null, styleBuffer: null});
  }
}
