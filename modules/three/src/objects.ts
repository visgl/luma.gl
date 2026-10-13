// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type Device,
  type RenderPass,
  type RenderPipeline,
  type VertexArray,
  type Shader,
  type ShaderLayout,
  type BufferLayout,
  type TextureFormatColor,
  type TextureFormatDepthStencil
} from '@luma.gl/core';
import {
  BufferAttribute,
  Matrix4,
  MeshBasicMaterial,
  WebGLCoordinateSystem,
  type Object3D,
  type BufferGeometry,
  type Camera,
  type Mesh
} from 'three/webgpu';
import {translateMaterial} from './translate';

export type ThreeMeshAdapterProps = {
  device: Device;
  mesh: Mesh<BufferGeometry, MeshBasicMaterial | MeshBasicMaterial[]>;
  colorAttachmentFormat?: TextureFormatColor;
  depthStencilAttachmentFormat?: TextureFormatDepthStencil;
  /** Match the caller's output transfer function. Default: linear. */
  outputColorSpace?: 'linear' | 'srgb';
};

const shaderSource = /* wgsl */ `
struct Uniforms { transform: mat4x4<f32>, color: vec4<f32>, flags: vec4<f32> };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  var clip = uniforms.transform * vec4<f32>(position, 1.0);
  clip.z = mix(clip.z, (clip.z + clip.w) * 0.5, uniforms.flags.x);
  return clip;
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  let color = uniforms.color.rgb;
  let encoded = select(1.055 * pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055, color * 12.92, color <= vec3<f32>(0.0031308));
  let outputColor = mix(color, encoded, uniforms.flags.y);
  return vec4<f32>(mix(outputColor, outputColor * uniforms.color.a, uniforms.flags.z), uniforms.color.a);
}`;

const shaderLayout: ShaderLayout = {
  attributes: [{name: 'position', location: 0, type: 'vec3<f32>'}],
  bindings: [{name: 'uniforms', group: 0, location: 0, type: 'uniform', visibility: 3}]
};
const bufferLayout: BufferLayout[] = [
  {
    name: 'position',
    byteStride: 12,
    attributes: [{attribute: 'position', format: 'float32x3', byteOffset: 0}]
  }
];

type MaterialState = {
  material: MeshBasicMaterial;
  key: string;
  pipeline: RenderPipeline;
  uniforms: Buffer;
};
type AttributeState = {attribute: BufferAttribute; version: number; buffer: Buffer};

/** Borrow a Three mesh; own GPU resources, but never own its source objects or device. */
export class ThreeMeshAdapter {
  readonly device: Device;
  readonly mesh: ThreeMeshAdapterProps['mesh'];
  private readonly props: ThreeMeshAdapterProps;
  private readonly vertexShader: Shader;
  private readonly fragmentShader: Shader;
  private readonly vertexArray: VertexArray;
  private readonly transform = new Matrix4();
  private readonly uniformBytes = new Float32Array(24);
  private readonly materialStates: MaterialState[] = [];
  private positionState?: AttributeState;
  private indexState?: AttributeState;
  private disposed = false;
  private synchronized = false;

  constructor(props: ThreeMeshAdapterProps) {
    if (props.device.type !== 'webgpu') throw new Error('ThreeMeshAdapter requires WebGPU');
    this.props = props;
    this.device = props.device;
    this.mesh = props.mesh;
    this.validateMesh();
    this.vertexShader = this.device.createShader({stage: 'vertex', source: shaderSource});
    this.fragmentShader = this.device.createShader({stage: 'fragment', source: shaderSource});
    this.vertexArray = this.device.createVertexArray({shaderLayout, bufferLayout});
  }

  private validateMesh(): void {
    const mesh = this.mesh;
    if (
      !mesh.isMesh ||
      'isSkinnedMesh' in mesh ||
      'isInstancedMesh' in mesh ||
      'isBatchedMesh' in mesh ||
      mesh.geometry.morphAttributes.position?.length
    )
      throw new Error('ThreeMeshAdapter: only ordinary triangle meshes are supported');
    const position = mesh.geometry.getAttribute('position');
    if (
      !(position instanceof BufferAttribute) ||
      !(position.array instanceof Float32Array) ||
      position.itemSize !== 3 ||
      position.normalized
    )
      throw new Error('ThreeMeshAdapter: positions must be ordinary float32x3 attributes');
    const index = mesh.geometry.index;
    if (index && !(index.array instanceof Uint16Array || index.array instanceof Uint32Array))
      throw new Error('ThreeMeshAdapter: indices must be uint16 or uint32');
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (
        !(material instanceof MeshBasicMaterial) ||
        'isNodeMaterial' in material ||
        material.map ||
        material.alphaMap ||
        material.aoMap ||
        material.lightMap ||
        material.envMap ||
        material.vertexColors ||
        material.wireframe ||
        material.alphaTest ||
        material.clippingPlanes?.length
      )
        throw new Error('ThreeMeshAdapter: only untextured MeshBasicMaterial is supported');
      translateMaterial(material, mesh.matrixWorld.determinant() < 0);
    }
  }

  private synchronizeAttribute(
    attribute: BufferAttribute,
    usage: number,
    state?: AttributeState
  ): AttributeState {
    if (
      state?.attribute !== attribute ||
      state.buffer.byteLength < attribute.array.byteLength ||
      (usage & Buffer.INDEX &&
        state.buffer.indexType !== (attribute.array instanceof Uint32Array ? 'uint32' : 'uint16'))
    ) {
      state?.buffer.destroy();
      return {
        attribute,
        version: attribute.version,
        buffer: this.device.createBuffer({
          data: attribute.array,
          byteLength: Math.ceil(attribute.array.byteLength / 4) * 4,
          usage: usage | Buffer.COPY_DST,
          indexType:
            usage & Buffer.INDEX
              ? attribute.array instanceof Uint32Array
                ? 'uint32'
                : 'uint16'
              : undefined
        })
      };
    }
    if (state.version !== attribute.version) {
      if (attribute.array.byteLength % 4) {
        const padded = new Uint8Array(Math.ceil(attribute.array.byteLength / 4) * 4);
        padded.set(
          new Uint8Array(
            attribute.array.buffer,
            attribute.array.byteOffset,
            attribute.array.byteLength
          )
        );
        state.buffer.write(padded);
      } else state.buffer.write(attribute.array);
      state.version = attribute.version;
    }
    return state;
  }

  /** Update before recording draws. Submit a pass before reusing these uniforms for another camera. */
  synchronize(camera: Camera): void {
    if (this.disposed) throw new Error('ThreeMeshAdapter is disposed');
    this.validateMesh();
    this.mesh.updateWorldMatrix(true, false);
    camera.updateWorldMatrix(true, false);
    const position = this.mesh.geometry.getAttribute('position');
    // validateMesh above restricts position to BufferAttribute.
    this.positionState = this.synchronizeAttribute(
      position as BufferAttribute,
      Buffer.VERTEX,
      this.positionState
    );
    this.vertexArray.setBuffer(0, this.positionState.buffer);
    const index = this.mesh.geometry.index;
    if (index) {
      this.indexState = this.synchronizeAttribute(index, Buffer.INDEX, this.indexState);
      this.vertexArray.setIndexBuffer(this.indexState.buffer);
    } else {
      this.indexState?.buffer.destroy();
      this.indexState = undefined;
      this.vertexArray.setIndexBuffer(null);
    }
    this.transform
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(this.mesh.matrixWorld);
    this.transform.toArray(this.uniformBytes);
    this.uniformBytes[20] = camera.coordinateSystem === WebGLCoordinateSystem ? 1 : 0;
    this.uniformBytes[21] = this.props.outputColorSpace === 'srgb' ? 1 : 0;
    const materials = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
    for (let materialIndex = 0; materialIndex < materials.length; materialIndex++) {
      const material = materials[materialIndex];
      const parameters = translateMaterial(material, this.mesh.matrixWorld.determinant() < 0);
      const key = JSON.stringify(parameters);
      let state = this.materialStates[materialIndex];
      if (!state || state.material !== material || state.key !== key) {
        state?.pipeline.destroy();
        const uniforms =
          state?.uniforms ||
          this.device.createBuffer({byteLength: 96, usage: Buffer.UNIFORM | Buffer.COPY_DST});
        state = {
          material,
          key,
          uniforms,
          pipeline: this.device.createRenderPipeline({
            vs: this.vertexShader,
            fs: this.fragmentShader,
            vertexEntryPoint: 'vertexMain',
            fragmentEntryPoint: 'fragmentMain',
            shaderLayout,
            bufferLayout,
            topology: 'triangle-list',
            colorAttachmentFormats: [
              this.props.colorAttachmentFormat || this.device.preferredColorFormat
            ],
            depthStencilAttachmentFormat: this.props.depthStencilAttachmentFormat || 'depth24plus',
            parameters
          })
        };
        this.materialStates[materialIndex] = state;
      }
      this.uniformBytes.set(
        [
          material.color.r,
          material.color.g,
          material.color.b,
          material.transparent ? material.opacity : 1
        ],
        16
      );
      this.uniformBytes[22] = material.premultipliedAlpha ? 1 : 0;
      state.uniforms.write(this.uniformBytes);
    }
    for (const state of this.materialStates.splice(materials.length)) {
      state.pipeline.destroy();
      state.uniforms.destroy();
    }
    this.synchronized = true;
  }

  /** Record draws only. Pass lifecycle, draw order and submission belong to the caller. */
  draw(pass: RenderPass): void {
    if (this.disposed || !this.synchronized)
      throw new Error('ThreeMeshAdapter: synchronize before drawing');
    for (let object: Object3D | null = this.mesh; object; object = object.parent) {
      if (!object.visible) return;
    }
    const geometry = this.mesh.geometry;
    const available = this.indexState?.attribute.count ?? this.positionState!.attribute.count;
    const rangeStart = geometry.drawRange.start;
    const rangeEnd = Math.min(available, rangeStart + geometry.drawRange.count);
    const groups = Array.isArray(this.mesh.material)
      ? geometry.groups
      : [{start: 0, count: available, materialIndex: 0}];
    for (const group of groups) {
      const state = this.materialStates[group.materialIndex ?? 0];
      if (!state) throw new Error('ThreeMeshAdapter: invalid group material index');
      if (!state.material.visible) continue;
      const start = Math.max(rangeStart, group.start);
      const count = Math.max(0, Math.min(rangeEnd, group.start + group.count) - start);
      if (!count) continue;
      pass.setPipeline(state.pipeline);
      pass.setBindings({uniforms: state.uniforms});
      pass.setVertexArray(this.vertexArray);
      pass.draw(
        this.indexState
          ? {indexCount: count, firstIndex: start}
          : {vertexCount: count, firstVertex: start}
      );
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.positionState?.buffer.destroy();
    this.indexState?.buffer.destroy();
    for (const state of this.materialStates) {
      state.pipeline.destroy();
      state.uniforms.destroy();
    }
    this.vertexArray.destroy();
    this.vertexShader.destroy();
    this.fragmentShader.destroy();
  }
}

export {ThreeSceneAdapter} from './scene-adapter';
