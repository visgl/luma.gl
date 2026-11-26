// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type TextureFormatColor, type Framebuffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {ThreeMeshAdapter} from '@luma.gl/three/objects';
import {
  Mesh,
  MeshBasicMaterial,
  Matrix4,
  Color,
  WebGLCoordinateSystem,
  type Scene,
  type Camera
} from 'three/webgpu';

const nativeShader = /* wgsl */ `
struct Uniforms { transform: mat4x4<f32>, color: vec4<f32>, flags: vec4<f32> };
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return uniforms.transform * vec4<f32>(position, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  let color = uniforms.color.rgb;
  let encoded = select(1.055 * pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055, color * 12.92, color <= vec3<f32>(0.0031308));
  return vec4<f32>(mix(color, encoded, uniforms.flags.x), 1.0);
}`;

/** Example-only facade. Owns a luma pass containing one adapted mesh and one native Model. */
export class MixedObjectRenderer {
  readonly domElement: HTMLCanvasElement;
  private adapter?: ThreeMeshAdapter;
  private nativeModel?: Model;
  private nativeBuffer?: Buffer;
  private uniformBuffer?: Buffer;
  private sourceScene?: Scene;
  private readonly transform = new Matrix4();
  private readonly uniformBytes = new Float32Array(24);
  private animationFrame = 0;
  private disposed = false;

  constructor(
    readonly device: Device,
    private readonly colorFormat: TextureFormatColor = device.preferredColorFormat,
    private readonly outputColorSpace: 'linear' | 'srgb' = 'srgb'
  ) {
    const canvas = device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error('Mixed example requires an HTML canvas');
    this.domElement = canvas;
  }
  async init(): Promise<void> {}
  setSize(width: number, height: number, _updateStyle = false): void {
    this.device.getDefaultCanvasContext().setDrawingBufferSize(width, height);
  }
  setAnimationLoop(callback: (() => void) | null): void {
    cancelAnimationFrame(this.animationFrame);
    if (!callback) return;
    const renderFrame = () => {
      callback();
      this.animationFrame = requestAnimationFrame(renderFrame);
    };
    this.animationFrame = requestAnimationFrame(renderFrame);
  }
  render(scene: Scene, camera: Camera, framebuffer?: Framebuffer): void {
    if (this.disposed) throw new Error('MixedObjectRenderer is disposed');
    const mesh = scene.getObjectByName('adaptedMesh');
    const nativeMesh = scene.getObjectByName('nativeMesh');
    if (
      !(mesh instanceof Mesh) ||
      !(mesh.material instanceof MeshBasicMaterial) ||
      !(nativeMesh instanceof Mesh) ||
      !(nativeMesh.material instanceof MeshBasicMaterial)
    )
      throw new Error('Mixed example requires its two basic meshes');
    if (this.sourceScene && this.sourceScene !== scene)
      throw new Error('Recreate the mixed renderer when replacing its scene');
    if (!this.adapter) {
      this.sourceScene = scene;
      this.adapter = new ThreeMeshAdapter({
        device: this.device,
        mesh,
        colorAttachmentFormat: this.colorFormat,
        outputColorSpace: this.outputColorSpace
      });
      this.nativeBuffer = this.device.createBuffer({
        data: nativeMesh.geometry.getAttribute('position').array,
        usage: Buffer.VERTEX
      });
      this.uniformBuffer = this.device.createBuffer({
        byteLength: 96,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      this.nativeModel = new Model(this.device, {
        source: nativeShader,
        vertexCount: 3,
        topology: 'triangle-list',
        shaderLayout: {
          attributes: [{name: 'position', location: 0, type: 'vec3<f32>'}],
          bindings: [{name: 'uniforms', group: 0, location: 0, type: 'uniform', visibility: 3}]
        },
        bufferLayout: [
          {
            name: 'position',
            byteStride: 12,
            attributes: [{attribute: 'position', format: 'float32x3', byteOffset: 0}]
          }
        ],
        attributes: {position: this.nativeBuffer},
        bindings: {uniforms: this.uniformBuffer},
        colorAttachmentFormats: [this.colorFormat],
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: true, cullMode: 'back'}
      });
    }
    this.adapter.synchronize(camera);
    nativeMesh.updateWorldMatrix(true, false);
    this.transform
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(nativeMesh.matrixWorld);
    this.transform.toArray(this.uniformBytes);
    if (camera.coordinateSystem === WebGLCoordinateSystem) {
      for (const offset of [0, 4, 8, 12])
        this.uniformBytes[offset + 2] =
          (this.uniformBytes[offset + 2] + this.uniformBytes[offset + 3]) * 0.5;
    }
    this.uniformBytes.set(
      [nativeMesh.material.color.r, nativeMesh.material.color.g, nativeMesh.material.color.b, 1],
      16
    );
    this.uniformBytes[20] = this.outputColorSpace === 'srgb' ? 1 : 0;
    this.uniformBuffer!.write(this.uniformBytes);
    const background = scene.background instanceof Color ? scene.background.clone() : new Color();
    if (this.outputColorSpace === 'srgb') background.convertLinearToSRGB();
    const pass = this.device.beginRenderPass({
      framebuffer:
        framebuffer ||
        this.device
          .getDefaultCanvasContext()
          .getCurrentFramebuffer({depthStencilFormat: 'depth24plus'}),
      clearColor: [background.r, background.g, background.b, 1],
      clearDepth: 1
    });
    this.adapter.draw(pass);
    this.nativeModel!.draw(pass);
    pass.end();
    this.device.submit();
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.setAnimationLoop(null);
    this.adapter?.dispose();
    this.nativeModel?.destroy();
    this.nativeBuffer?.destroy();
    this.uniformBuffer?.destroy();
  }
}
