// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVolumeBufferChannel, GPUVolumeMetadata} from './types';
import {
  getDirectionDeterminant,
  validateVolumeChannel,
  validateVolumeMetadata,
  type VolumeResourceOwner
} from './volume-utils';

/** Borrowed graph resources and explicit physical metadata for one dense volume grid. */
export type GPUVolumeProps = {
  id?: string;
  metadata: GPUVolumeMetadata;
  channels: readonly GPUVolumeBufferChannel[];
};

/**
 * Non-owning, graph-native volume metadata and channel collection.
 *
 * Volume construction never allocates, uploads, encodes, submits, or destroys GPU resources.
 */
export class GPUVolume {
  readonly id: string;
  readonly metadata: GPUVolumeMetadata;
  readonly channels: readonly GPUVolumeBufferChannel[];
  readonly voxelCount: number;
  /** Graph that owns every borrowed value and validity-mask handle. */
  readonly graph: VolumeResourceOwner;

  private readonly channelsById = new Map<string, GPUVolumeBufferChannel>();

  constructor(props: GPUVolumeProps) {
    this.id = props.id ?? 'gpu-volume';
    this.metadata = props.metadata;
    this.channels = props.channels;
    this.voxelCount = validateVolumeMetadata(this.metadata, this.id);
    if (this.channels.length === 0) {
      throw new Error(`${this.id} requires at least one channel`);
    }

    let owner: VolumeResourceOwner | undefined;
    for (const channel of this.channels) {
      if (this.channelsById.has(channel.id)) {
        throw new Error(`${this.id} channel identifiers must be unique`);
      }
      const channelOwner = validateVolumeChannel(
        channel,
        this.metadata,
        `${this.id} ${channel.id}`
      );
      if (owner && channelOwner !== owner) {
        throw new Error(`${this.id} channels must belong to the same graph`);
      }
      owner = channelOwner;
      this.channelsById.set(channel.id, channel);
    }
    this.graph = owner!;
  }

  /** Returns an existing borrowed channel without creating or synchronizing another representation. */
  getChannel(id: string): GPUVolumeBufferChannel {
    const channel = this.channelsById.get(id);
    if (!channel) {
      throw new Error(`${this.id} does not contain channel ${id}`);
    }
    return channel;
  }

  /** Maps one voxel center into the original double-precision physical coordinate frame. */
  getVoxelWorldPosition(x: number, y: number, z: number): readonly [number, number, number] {
    const centerOffset = this.metadata.voxelInterpretation === 'cell' ? 0.5 : 0;
    const scaled = [
      (x + centerOffset) * this.metadata.spacing[0],
      (y + centerOffset) * this.metadata.spacing[1],
      (z + centerOffset) * this.metadata.spacing[2]
    ];
    const direction = this.metadata.direction;
    return [
      this.metadata.origin[0] +
        direction[0] * scaled[0] +
        direction[1] * scaled[1] +
        direction[2] * scaled[2],
      this.metadata.origin[1] +
        direction[3] * scaled[0] +
        direction[4] * scaled[1] +
        direction[5] * scaled[2],
      this.metadata.origin[2] +
        direction[6] * scaled[0] +
        direction[7] * scaled[1] +
        direction[8] * scaled[2]
    ];
  }

  /** Returns one voxel's physical volume without assuming an orthonormal direction matrix. */
  getVoxelPhysicalVolume(): number {
    return (
      Math.abs(getDirectionDeterminant(this.metadata.direction)) *
      this.metadata.spacing[0] *
      this.metadata.spacing[1] *
      this.metadata.spacing[2]
    );
  }

  /** Conservatively checks the complete physical grid without implicit resampling. */
  isCompatibleWith(other: GPUVolume): boolean {
    return (
      this.metadata.width === other.metadata.width &&
      this.metadata.height === other.metadata.height &&
      this.metadata.depth === other.metadata.depth &&
      this.metadata.voxelInterpretation === other.metadata.voxelInterpretation &&
      this.metadata.spacing.every((value, index) => value === other.metadata.spacing[index]) &&
      this.metadata.origin.every((value, index) => value === other.metadata.origin[index]) &&
      this.metadata.direction.every((value, index) => value === other.metadata.direction[index])
    );
  }

  /** Rejects mismatched grids instead of silently resampling or transforming coordinates. */
  assertCompatibleWith(other: GPUVolume): void {
    if (!this.isCompatibleWith(other)) {
      throw new Error(`${this.id} volume grids must match`);
    }
  }
}
