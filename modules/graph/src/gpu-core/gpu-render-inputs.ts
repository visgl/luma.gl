// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  type Buffer,
  type BufferLayout,
  type Bindings,
  type Sampler,
  type VertexFormat,
  type ShaderLayout
} from '@luma.gl/core';
import {GraphDataView} from './gpu-command-graph-types';
import type {
  GraphBufferHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphResourceUse,
  GPUCommandGraphEncodeContext
} from './gpu-command-graph-types';

export type GPURenderInputsProps = {
  /** Shader attribute names. Views retain stored format, stride, and starting offset. */
  attributes?: Readonly<
    Record<string, {source: GraphDataView<VertexFormat>; stepMode?: 'vertex' | 'instance'}>
  >;
  /** Shader storage binding names. Offsets are relative to the source view. */
  storage?: Readonly<
    Record<
      string,
      {
        source: GraphBufferHandle | GraphDataView;
        access: 'read' | 'read-write';
        byteOffset?: number;
        byteLength?: number;
      }
    >
  >;
  /** Shader sampled-texture binding names. Samplers use their own shader binding names. */
  textures?: Readonly<Record<string, {source: GraphTextureHandle | GraphTextureView}>>;
  /** Borrowed samplers; texture access determines graph dependencies. */
  samplers?: Readonly<Record<string, Sampler>>;
};

/** One immutable binding plan shared by graph render nodes on either backend. Owns no GPU resources. */
export class GPURenderInputs {
  private readonly attributeBufferLayout: BufferLayout[];
  private readonly attributes: NonNullable<GPURenderInputsProps['attributes']>;
  private readonly storage: NonNullable<GPURenderInputsProps['storage']>;
  private readonly storageViews: Record<string, GraphDataView<'uint32'>>;
  private readonly textures: NonNullable<GPURenderInputsProps['textures']>;
  private readonly samplers: NonNullable<GPURenderInputsProps['samplers']>;

  constructor(props: GPURenderInputsProps) {
    this.attributes = copyEntries(props.attributes);
    this.storage = copyEntries(props.storage);
    this.textures = copyEntries(props.textures);
    this.samplers = Object.freeze({...props.samplers});
    const bindingNames = [
      ...Object.keys(this.storage),
      ...Object.keys(this.textures),
      ...Object.keys(this.samplers)
    ];
    // A shader binding has exactly one declared source.
    assert(new Set(bindingNames).size === bindingNames.length);
    this.attributeBufferLayout = Object.entries(this.attributes).map(
      ([name, {source, stepMode}]) => ({
        name,
        ...(source.byteOffset % 4
          ? {
              attributes: [
                {attribute: name, format: source.format, byteOffset: source.byteOffset % 4}
              ]
            }
          : {format: source.format}),
        byteStride: source.byteStride,
        stepMode: stepMode ?? 'vertex'
      })
    );
    this.storageViews = Object.fromEntries(
      Object.entries(this.storage).map(([name, input]) => {
        const {offset, size} = getStorageRange(input);
        const buffer = input.source instanceof GraphDataView ? input.source.buffer : input.source;
        // A contiguous byte-range view declares precisely the storage bytes bound by apply().
        return [
          name,
          new GraphDataView(buffer, {
            format: 'uint32',
            length: size / 4,
            byteOffset: offset,
            byteStride: 4,
            rowByteLength: 4
          })
        ];
      })
    );
  }

  /** Layout supplied when constructing the consuming Model. */
  get bufferLayout(): BufferLayout[] {
    return this.attributeBufferLayout.map(layout => ({
      ...layout,
      ...(layout.attributes
        ? {attributes: layout.attributes.map(attribute => ({...attribute}))}
        : {})
    }));
  }

  /** Resource accesses are derived once from the same declarations used for binding. */
  getResourceUses(): GraphResourceUse[] {
    return [
      ...Object.values(this.attributes).map(({source}) => ({
        buffer: source,
        usage: 'vertex' as const
      })),
      ...Object.entries(this.storage).map(([name, {access}]) => ({
        buffer: this.storageViews[name],
        usage: access === 'read' ? ('storage-read' as const) : ('storage-read-write' as const)
      })),
      ...Object.values(this.textures).map(({source}) => ({
        texture: source,
        usage: 'sampled' as const
      }))
    ];
  }

  /** Resolve current physical resources at encoding time, preserving imported-resource overrides. */
  apply(
    model: {
      setAttributes(
        attributes: Record<string, Buffer>,
        options?: {byteOffsets?: Record<string, number>}
      ): unknown;
      setBindings(bindings: Bindings): unknown;
      pipeline: {shaderLayout: Pick<ShaderLayout, 'bindings'>};
    },
    context: Pick<GPUCommandGraphEncodeContext<unknown>, 'getBuffer' | 'getTextureView'>
  ): void {
    const attributes: Record<string, Buffer> = {};
    const byteOffsets: Record<string, number> = {};
    const bindings: Bindings = {...this.samplers};
    for (const [name, {source}] of Object.entries(this.attributes)) {
      attributes[name] = context.getBuffer(source);
      byteOffsets[name] = source.byteOffset - (source.byteOffset % 4);
    }
    for (const [name, input] of Object.entries(this.storage)) {
      const declaration = model.pipeline.shaderLayout.bindings?.find(
        binding => binding.name === name
      );
      // Shader access must agree with the graph dependency declaration.
      assert(declaration?.type === (input.access === 'read' ? 'read-only-storage' : 'storage'));
      const {offset, size} = getStorageRange(input);
      bindings[name] = {buffer: context.getBuffer(input.source), offset, size};
    }
    for (const [name, {source}] of Object.entries(this.textures)) {
      bindings[name] = context.getTextureView(source);
    }
    if (Object.keys(attributes).length) model.setAttributes(attributes, {byteOffsets});
    if (Object.keys(bindings).length) model.setBindings(bindings);
  }
}

function copyEntries<Value extends object>(
  entries: Readonly<Record<string, Value>> | undefined
): Readonly<Record<string, Value>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(entries ?? {}).map(([name, value]) => [name, Object.freeze({...value})])
    )
  );
}

function getStorageRange(input: NonNullable<GPURenderInputsProps['storage']>[string]): {
  offset: number;
  size: number;
} {
  const view = input.source instanceof GraphDataView ? input.source : null;
  const capacity = view
    ? view.length
      ? (view.length - 1) * view.byteStride + view.rowByteLength
      : 0
    : (input.source as GraphBufferHandle).byteLength;
  const relativeOffset = input.byteOffset ?? 0;
  const size = input.byteLength ?? capacity - relativeOffset;
  const offset = (view?.byteOffset ?? 0) + relativeOffset;
  // Storage ranges must be nonempty, bounded, and four-byte aligned; device binding alignment is validated by the backend.
  assert(
    Number.isSafeInteger(relativeOffset) &&
      relativeOffset >= 0 &&
      Number.isSafeInteger(size) &&
      size > 0 &&
      relativeOffset + size <= capacity &&
      offset % 4 === 0 &&
      size % 4 === 0
  );
  return {offset, size};
}
