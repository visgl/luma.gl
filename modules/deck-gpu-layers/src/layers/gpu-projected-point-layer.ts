// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
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
import {GPUVectorModel, type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {fp64arithmetic} from '@luma.gl/shadertools';
import type {ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import type {
  ProjectionRenderTransform,
  ProjectedRenderPosition
} from '@luma.gl/experimental/gpu-project/crs';
import {
  createGPUVectorStyleBuffer,
  getGPUVectorStyleBufferBinding,
  getGPUVectorBuffer,
  getGPUVectorLayerBatches,
  getGPUVectorPickingProvenance,
  makeGPUVectorBufferLayout,
  resizeGPUVectorStyleBuffer,
  type GPUVectorLayerPickingInfo
} from './gpu-vector-layer-utils';

export type GPUProjectedPointLayerProps = Omit<LayerProps, 'data'> & {
  transform: ProjectionRenderTransform;
  /** Raw binary64 x/y bits, not four integer coordinates. Caller-owned vertex buffers. */
  getPosition: GPUVector<'uint32x4'>;
  /** One nonzero-valid word per row, with the same physical chunks as positions. */
  inputValidity: GPUVector<'uint32'>;
  /** CPU mirror lookup for picking only. Must match the current GPU rows; never reads back. */
  getSourcePosition: (rowIndex: number) => ProjectionCoordinates | null;
  getColor?: Color;
  pointSize?: number;
};

export type GPUProjectedPointPickingInfo = GPUVectorLayerPickingInfo & {
  projection?: ProjectedRenderPosition | null;
};

type ProjectedPointState = {
  model: GPUVectorModel | null;
  parameters: Buffer | null;
  styleBuffer: Buffer | null;
  transform: ProjectionRenderTransform;
  positions: GPUVector<'uint32x4'>;
  validity: GPUVector<'uint32'>;
};

/** Inline 2D CRS projection in a non-geospatial Cartesian deck viewport. */
export class GPUProjectedPointLayer extends Layer<GPUProjectedPointLayerProps> {
  static override layerName = 'GPUProjectedPointLayer';
  static override defaultProps = {coordinateSystem: COORDINATE_SYSTEM.CARTESIAN};

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    this.validateFrame();
    const {transform, getPosition: positions, inputValidity: validity} = this.props;
    this.validateVectors();
    if (!positions.data.length) {
      this.setState({
        model: null,
        parameters: null,
        styleBuffer: null,
        transform,
        positions,
        validity
      } satisfies ProjectedPointState);
      return;
    }
    const shader = transform.compiled.getShader({namespace: 'render'});
    const parameters = device.createBuffer({
      id: `${this.id}-projection-parameters`,
      data: transform.compiled.packParameters(),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    let styleBuffer: Buffer | undefined;
    try {
      styleBuffer = createGPUVectorStyleBuffer(
        device,
        `${this.id}-style`,
        32,
        positions.data.length
      );
      const model = new GPUVectorModel(device, {
        ...this.getShaders({
          // Model reflects the shared WGSL uniform declaration even on the integer path.
          // Restore its uniform metadata; graph kernels strip this unused declaration instead.
          modules: [
            ...shader.modules.map(module =>
              module.name === fp64arithmetic.name ? fp64arithmetic : module
            ),
            project32,
            picking
          ],
          defines: shader.defines,
          source: `${shader.source}\n${getProjectedPointShader(shader.entryPoint)}`
        }),
        id: `${this.id}-model`,
        topology: 'triangle-list',
        isInstanced: true,
        vertexCount: 6,
        instanceCount: 0,
        attributes: {
          positions: getGPUVectorBuffer(positions),
          validity: getGPUVectorBuffer(validity)
        },
        bufferLayout: [
          makeGPUVectorBufferLayout(positions, 'positions'),
          makeGPUVectorBufferLayout(validity, 'validity')
        ],
        bindings: {
          [shader.bindingName]: parameters,
          projectedPointStyle: getGPUVectorStyleBufferBinding(styleBuffer, 32)
        }
      });
      this.setState({
        model,
        parameters,
        styleBuffer,
        transform,
        positions,
        validity
      } satisfies ProjectedPointState);
    } catch (error) {
      parameters.destroy();
      styleBuffer?.destroy();
      throw error;
    }
  }

  override getModels(): GPUVectorModel[] {
    const {model} = this.state as ProjectedPointState;
    return model ? [model] : [];
  }

  override updateState({props, changeFlags}: UpdateParameters<this>): void {
    const state = this.state as ProjectedPointState;
    // Immutable transform replacement invalidates both CPU picking and the GPU parameter plan.
    // Rebuild even for compatible shaders; there is no hidden retained parameter cache.
    if (
      props.transform !== state.transform ||
      props.getPosition !== state.positions ||
      props.inputValidity !== state.validity ||
      changeFlags.extensionsChanged ||
      (!state.model && props.getPosition.data.length)
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    this.validateFrame();
    this.validateVectors();
    const state = this.state as ProjectedPointState;
    const {model} = state;
    if (!model && this.props.getPosition.data.length) {
      // An initially empty appendable vector can gain chunks without a prop identity change.
      // Build through deck's update lifecycle so its module uniforms are initialized before draw.
      this.setNeedsUpdate();
      return;
    }
    if (!model || !state.styleBuffer) return;
    const styleBuffer = resizeGPUVectorStyleBuffer(
      state.styleBuffer,
      32,
      this.props.getPosition.data.length
    );
    if (styleBuffer !== state.styleBuffer) {
      this.setState({styleBuffer});
      model.setBindings({projectedPointStyle: getGPUVectorStyleBufferBinding(styleBuffer, 32)});
    }
    const [red, green, blue, alpha = 255] = this.props.getColor ?? [0, 0, 0, 255];
    const bytes = new ArrayBuffer(32);
    const floats = new Float32Array(bytes);
    const integers = new Uint32Array(bytes);
    floats.set([red / 255, green / 255, blue / 255, alpha / 255, this.props.pointSize ?? 4]);
    model.drawBatches(renderPass, {
      vectors: {positions: this.props.getPosition, validity: this.props.inputValidity},
      onBatch: batch => {
        integers[5] = batch.rowIndexOffset;
        const binding = getGPUVectorStyleBufferBinding(styleBuffer, 32, batch.batchIndex);
        styleBuffer.write(new Uint8Array(bytes), binding.offset);
        model.setBindings({projectedPointStyle: binding});
      }
    });
  }

  override getPickingInfo({info}: {info: PickingInfo}): GPUProjectedPointPickingInfo {
    const result: GPUProjectedPointPickingInfo = info;
    if (info.index < 0 || info.index >= this.props.getPosition.length) return result;
    result.gpuVector = getGPUVectorPickingProvenance(this.props.getPosition, info.index);
    const source = this.props.getSourcePosition(info.index);
    result.projection = source ? this.props.transform.projectPosition(source) : null;
    return result;
  }

  override finalizeState(context: LayerContext): void {
    this.destroyResources();
    super.finalizeState(context);
  }

  private validateFrame(): void {
    // No implicit conversion from arbitrary projected CRS units into map/globe common space.
    if (
      this.context.device.type !== 'webgpu' ||
      this.context.viewport.isGeospatial ||
      this.props.coordinateSystem !== COORDINATE_SYSTEM.CARTESIAN ||
      this.props.modelMatrix ||
      this.props.coordinateOrigin.some(value => value !== 0)
    ) {
      throw new Error(
        'GPUProjectedPointLayer requires a WebGPU Cartesian viewport with no model transform'
      );
    }
  }

  private validateVectors(): void {
    const {getPosition: positions, inputValidity: validity} = this.props;
    getGPUVectorLayerBatches(
      this.id,
      {positions, validity},
      {positions: ['uint32x4'], validity: ['uint32']}
    );
    // RGB picking IDs reserve zero for background.
    if (positions.length > 0xffffff)
      throw new Error('projected point picking exceeds 24-bit row IDs');
    for (const vector of [positions, validity]) {
      for (const chunk of vector.data) {
        const buffer = chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
        if (
          buffer.device !== this.context.device ||
          !(buffer.usage & Buffer.VERTEX) ||
          chunk.nullBitmap
        ) {
          throw new Error(
            'projected points require same-device vertex buffers and explicit validity'
          );
        }
      }
    }
  }

  private destroyResources(): void {
    const state = this.state as Partial<ProjectedPointState>;
    state.model?.destroy();
    state.parameters?.destroy();
    state.styleBuffer?.destroy();
    this.setState({model: null, parameters: null, styleBuffer: null});
  }
}

function getProjectedPointShader(entryPoint: string): string {
  return /* wgsl */ `
struct ProjectedPointStyle {
  color: vec4f,
  pointSize: f32,
  rowIndexOffset: u32,
};
@group(0) @binding(auto) var<uniform> projectedPointStyle: ProjectedPointStyle;
struct ProjectedPointVertex {
  @builtin(position) position: vec4f,
  @location(0) corner: vec2f,
  @location(1) @interpolate(flat) pickingColor: vec3f,
  @location(2) @interpolate(flat) valid: u32,
};
@vertex fn vertexMain(
  @location(0) positions: vec4u,
  @location(1) validity: u32,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> ProjectedPointVertex {
  let corners = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1));
  let corner = corners[vertexIndex];
  let projected = ${entryPoint}(positions, validity);
  let commonPosition = vec3f(projected.position, 0.0);
  var clipPosition = project_position_to_clipspace(commonPosition, vec3f(0.0), vec3f(0.0));
  clipPosition = vec4f(clipPosition.xy + project_pixel_size_to_clipspace(corner * projectedPointStyle.pointSize * 0.5) * clipPosition.w, clipPosition.zw);
  let pickingIndex = instanceIndex + projectedPointStyle.rowIndexOffset + 1u;
  let pickingColor = vec3f(f32(pickingIndex % 256u), f32((pickingIndex / 256u) % 256u), f32((pickingIndex / 65536u) % 256u)) / 255.0;
  geometry.worldPosition = commonPosition;
  geometry.pickingColor = pickingColor;
  return ProjectedPointVertex(clipPosition, corner, pickingColor, projected.valid);
}
@fragment fn fragmentMain(input: ProjectedPointVertex) -> @location(0) vec4f {
  if (input.valid == 0u || dot(input.corner, input.corner) > 1.0) { discard; }
  if (picking.isActive > 0.5) { return vec4f(input.pickingColor, 1.0); }
  return vec4f(projectedPointStyle.color.rgb, projectedPointStyle.color.a * layer.opacity);
}`;
}
