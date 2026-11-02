// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Texture, TextureView, type Device, type TextureViewProps} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUGraphTexture, GPUGraphTextureDescriptor} from './gpu-graph-value';
import type {GPUOperationContract} from './gpu-operation-contract';
import {getGPUOperationValueName} from './gpu-operation-contract';
import type {GraphTextureUsage, GraphTextureViewProps} from './gpu-command-graph';

export type GPUGraphTextureBinding = Texture | TextureView;
export type GPUGraphOutput = GPUVector | GPUGraphTextureBinding;
export type GPUGraphOutputs = Record<string, GPUGraphOutput>;

/** Selected view geometry, without creating another view. @internal */
export function getTextureBindingInfo(binding: GPUGraphTextureBinding) {
  const texture = binding instanceof TextureView ? binding.texture : binding;
  const props: Partial<TextureViewProps> = binding instanceof TextureView ? binding.props : {};
  const baseMipLevel = props.baseMipLevel ?? 0;
  const baseArrayLayer = props.baseArrayLayer ?? 0;
  const dimension = props.dimension ?? texture.dimension;
  const mipLevels = props.mipLevelCount ?? texture.mipLevels - baseMipLevel;
  const depth =
    dimension === '3d'
      ? Math.max(1, texture.depth >> baseMipLevel)
      : (props.arrayLayerCount ?? (dimension === '2d' ? 1 : texture.depth - baseArrayLayer));
  // Format reinterpretation and partial aspects need separate binding/operation semantics.
  assert((props.format ?? texture.format) === texture.format && (props.aspect ?? 'all') === 'all');
  assert(!binding.destroyed && !texture.destroyed);
  assert(
    Number.isInteger(baseMipLevel) &&
      baseMipLevel >= 0 &&
      Number.isInteger(mipLevels) &&
      mipLevels > 0 &&
      baseMipLevel + mipLevels <= texture.mipLevels
  );
  assert(
    Number.isInteger(baseArrayLayer) &&
      baseArrayLayer >= 0 &&
      Number.isInteger(depth) &&
      depth > 0 &&
      (dimension === '3d' ? baseArrayLayer === 0 : baseArrayLayer + depth <= texture.depth)
  );
  return {
    texture,
    format: texture.format,
    dimension,
    width: Math.max(1, texture.width >> baseMipLevel),
    height: Math.max(1, texture.height >> baseMipLevel),
    depth,
    mipLevels,
    samples: texture.samples,
    baseMipLevel,
    baseArrayLayer
  };
}

/** Compose a logical view relative to an execution-supplied view. @internal */
export function getBoundTextureViewProps(
  binding: TextureView,
  props: GraphTextureViewProps = {}
): GraphTextureViewProps {
  const info = getTextureBindingInfo(binding);
  const baseMipLevel = props.baseMipLevel ?? 0;
  const baseArrayLayer = props.baseArrayLayer ?? 0;
  const mipLevelCount = props.mipLevelCount ?? info.mipLevels - baseMipLevel;
  const arrayLayerCount =
    props.arrayLayerCount ?? (info.dimension === '3d' ? 1 : info.depth - baseArrayLayer);
  // Nested selections cannot escape the caller-supplied view.
  assert(
    baseMipLevel >= 0 &&
      baseMipLevel + mipLevelCount <= info.mipLevels &&
      baseArrayLayer >= 0 &&
      baseArrayLayer + arrayLayerCount <= info.depth
  );
  return {
    ...props,
    dimension: props.dimension ?? info.dimension,
    baseMipLevel: info.baseMipLevel + baseMipLevel,
    mipLevelCount,
    baseArrayLayer: info.baseArrayLayer + baseArrayLayer,
    arrayLayerCount
  };
}

const TEXTURE_USAGE: Record<GraphTextureUsage, number> = {
  sampled: Texture.SAMPLE,
  'storage-read': Texture.STORAGE,
  'storage-write': Texture.STORAGE,
  'storage-read-write': Texture.STORAGE,
  'render-attachment': Texture.RENDER,
  'copy-source': Texture.COPY_SRC,
  'copy-destination': Texture.COPY_DST
};

/** Per-invocation texture allocation and ownership, shared by independent executors. @internal */
export class GPUTextureInvocation {
  readonly values = new Map<string, GPUGraphTextureBinding>();
  private readonly owned = new Set<Texture>();
  constructor(
    device: Device,
    declarations: readonly GPUGraphTexture[],
    contracts: readonly GPUOperationContract[],
    bindings: Readonly<Record<string, GPUVector | number | GPUGraphTextureBinding>>,
    targets: Readonly<Record<string, GPUGraphOutput>>
  ) {
    const usages = new Map<string, number>();
    const writable = new Set<string>();
    for (const contract of contracts)
      for (const use of contract.values) {
        const name = getGPUOperationValueName(use.value);
        if (!declarations.some(value => value.id === name)) continue;
        // Every reusable texture access declares its physical purpose.
        assert(use.textureUsage);
        const usage = use.textureUsage;
        assert(
          (use.access === 'read' && ['sampled', 'storage-read', 'copy-source'].includes(usage)) ||
            (use.access === 'write' &&
              ['storage-write', 'render-attachment', 'copy-destination'].includes(usage)) ||
            (use.access === 'read-write' &&
              ['storage-read-write', 'render-attachment'].includes(usage))
        );
        usages.set(name, (usages.get(name) ?? 0) | TEXTURE_USAGE[usage]);
        if (use.access !== 'read') writable.add(name);
      }
    try {
      const pending = new Set(declarations);
      while (pending.size) {
        let progress = false;
        for (const declaration of pending) {
          const descriptor: GPUGraphTextureDescriptor = declaration.descriptor ?? {
            type: 'texture',
            format: declaration.format,
            dimension: declaration.dimension,
            extent:
              declaration.width === undefined
                ? undefined
                : {width: declaration.width, height: declaration.height!, depth: declaration.depth},
            mipLevels: declaration.mipLevels,
            samples: declaration.samples
          };
          const extent = descriptor.extent;
          const template = extent && 'like' in extent ? this.values.get(extent.like) : undefined;
          if (extent && 'like' in extent && !template) continue;
          const source = template ? getTextureBindingInfo(template) : undefined;
          const scale = extent && 'like' in extent ? (extent.scale ?? [1, 1]) : [1, 1];
          assert(scale.every(value => Number.isFinite(value) && value > 0));
          const width = source
            ? Math.max(1, Math.round(source.width * scale[0]))
            : extent && 'width' in extent
              ? extent.width
              : undefined;
          const height = source
            ? Math.max(1, Math.round(source.height * scale[1]))
            : extent && 'height' in extent
              ? extent.height
              : undefined;
          const depth = source?.depth ?? (extent && 'depth' in extent ? extent.depth : undefined);
          const dimension = descriptor.dimension ?? source?.dimension ?? '2d';
          const mipLevels = descriptor.mipLevels ?? source?.mipLevels ?? 1;
          const samples = descriptor.samples ?? source?.samples ?? 1;
          const usage = (usages.get(declaration.id) ?? 0) | declaration.usage;
          // Copy commands cannot read or write multisampled storage.
          assert(samples === 1 || !(usage & (Texture.COPY_SRC | Texture.COPY_DST)));
          let binding = targets[declaration.id] ?? bindings[declaration.id];
          if (binding === undefined) {
            // Input textures are always supplied; produced extents must be inferable before encoding.
            assert(
              declaration.role !== 'input' &&
                !declaration.external &&
                width !== undefined &&
                height !== undefined &&
                usage !== 0
            );
            assert(
              Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0
            );
            const texture = device.createTexture({
              id: declaration.id,
              format: descriptor.format,
              dimension,
              width,
              height,
              depth: depth ?? 1,
              mipLevels,
              samples,
              usage: usage | (samples === 1 ? Texture.COPY_SRC : 0) | Texture.SAMPLE
            });
            this.owned.add(texture);
            binding = texture;
          }
          assert(binding instanceof Texture || binding instanceof TextureView);
          const info = getTextureBindingInfo(binding);
          assert(info.samples === 1 || !(usage & (Texture.COPY_SRC | Texture.COPY_DST)));
          assert(
            info.texture.device === device &&
              info.format === descriptor.format &&
              info.dimension === dimension &&
              (width === undefined || info.width === width) &&
              (height === undefined || info.height === height) &&
              (depth === undefined || info.depth === depth) &&
              ((descriptor.mipLevels === undefined && declaration.role === 'input') ||
                info.mipLevels === mipLevels) &&
              ((descriptor.samples === undefined && declaration.role === 'input') ||
                info.samples === samples) &&
              (info.texture.props.usage & usage) === usage
          );
          this.values.set(declaration.id, binding);
          pending.delete(declaration);
          progress = true;
        }
        assert(progress); // Missing or cyclic texture extent dependency.
      }
      // Conservative alias policy: writable values cannot share backing storage with another value.
      for (const name of writable) {
        const texture = getTextureBindingInfo(this.values.get(name)!).texture;
        for (const [otherName, value] of this.values)
          assert(name === otherName || getTextureBindingInfo(value).texture !== texture);
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  finish(outputs: readonly string[]): void {
    for (const name of outputs) {
      const value = this.values.get(name);
      if (value instanceof Texture) this.owned.delete(value);
    }
    this.destroy();
  }
  destroy(): void {
    for (const texture of this.owned) texture.destroy();
    this.owned.clear();
  }
}
