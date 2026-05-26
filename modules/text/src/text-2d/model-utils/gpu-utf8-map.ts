// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';

/** Storage binding names used by the reusable GPU UTF-8 mapping shader fragment. */
export type GpuUtf8MapBindingNames = {
  /** `vec2<u32>` start/end UTF-8 byte range per logical text row. */
  rowByteRanges: string;
  /** Packed UTF-8 bytes, four source bytes per `u32`. */
  utf8Bytes: string;
  /** `vec2<u32>` pairs containing `[codePoint, mappedValue]`. */
  mapStorage: string;
};

/** Options for composing the reusable GPU UTF-8 mapping bindings. */
export type GpuUtf8MapBindingOptions = Partial<GpuUtf8MapBindingNames> & {
  /** Bind group used by every emitted storage binding. */
  group?: number;
  /** First binding location reserved for the UTF-8 map inputs. */
  firstLocation?: number;
};

/** Options for composing the reusable GPU UTF-8 mapping WGSL fragment. */
export type GpuUtf8MapShaderSourceOptions = GpuUtf8MapBindingOptions & {
  /** WGSL `u32` expression that evaluates to the number of `[codePoint, mappedValue]` pairs. */
  mapEntryCountExpression: string;
};

/** Default public storage binding names for GPU UTF-8 map composition. */
export const DEFAULT_GPU_UTF8_MAP_BINDING_NAMES: GpuUtf8MapBindingNames = {
  rowByteRanges: 'utf8RowByteRanges',
  utf8Bytes: 'utf8Bytes',
  mapStorage: 'utf8MapStorage'
};

/**
 * Returns the shared read-only storage bindings expected by {@link getGpuUtf8MapShaderSource}.
 *
 * Callers can append their own storage/output bindings after this returned prefix.
 */
export function getGpuUtf8MapShaderBindings(
  options: GpuUtf8MapBindingOptions = {}
): NonNullable<ShaderLayout['bindings']> {
  const bindingNames = resolveGpuUtf8MapBindingNames(options);
  const group = options.group ?? 0;
  const firstLocation = options.firstLocation ?? 0;
  return [
    {
      name: bindingNames.rowByteRanges,
      type: 'read-only-storage',
      group,
      location: firstLocation
    },
    {
      name: bindingNames.utf8Bytes,
      type: 'read-only-storage',
      group,
      location: firstLocation + 1
    },
    {
      name: bindingNames.mapStorage,
      type: 'read-only-storage',
      group,
      location: firstLocation + 2
    }
  ];
}

/**
 * Builds reusable WGSL helpers for sparse UTF-8 mapping.
 *
 * One potential output slot exists per UTF-8 byte. Callers iterate a row's returned byte range,
 * skip continuation bytes with `isGpuUtf8MapCodePointStart`, decode leading bytes with
 * `decodeGpuUtf8MapCodePoint`, and map code points with `mapGpuUtf8CodePoint`.
 */
export function getGpuUtf8MapShaderSource(options: GpuUtf8MapShaderSourceOptions): string {
  const bindingNames = resolveGpuUtf8MapBindingNames(options);
  const group = options.group ?? 0;
  const firstLocation = options.firstLocation ?? 0;

  return /* wgsl */ `
@group(${group}) @binding(${firstLocation}) var<storage, read> ${bindingNames.rowByteRanges} : array<vec2<u32>>;
@group(${group}) @binding(${firstLocation + 1}) var<storage, read> ${bindingNames.utf8Bytes} : array<u32>;
@group(${group}) @binding(${firstLocation + 2}) var<storage, read> ${bindingNames.mapStorage} : array<vec2<u32>>;

fn getGpuUtf8MapRowByteRange(rowIndex: u32) -> vec2<u32> {
  return ${bindingNames.rowByteRanges}[rowIndex];
}

fn readGpuUtf8MapByte(byteIndex: u32) -> u32 {
  let word = ${bindingNames.utf8Bytes}[byteIndex >> 2u];
  let byteShift = (byteIndex & 3u) << 3u;
  return (word >> byteShift) & 0xffu;
}

fn isGpuUtf8MapCodePointStart(firstByte: u32) -> bool {
  return (firstByte & 0xc0u) != 0x80u;
}

fn decodeGpuUtf8MapCodePoint(byteIndex: u32) -> u32 {
  let firstByte = readGpuUtf8MapByte(byteIndex);
  if ((firstByte & 0x80u) == 0u) {
    return firstByte;
  }
  if ((firstByte & 0xe0u) == 0xc0u) {
    return ((firstByte & 0x1fu) << 6u) | (readGpuUtf8MapByte(byteIndex + 1u) & 0x3fu);
  }
  if ((firstByte & 0xf0u) == 0xe0u) {
    return
      ((firstByte & 0x0fu) << 12u) |
      ((readGpuUtf8MapByte(byteIndex + 1u) & 0x3fu) << 6u) |
      (readGpuUtf8MapByte(byteIndex + 2u) & 0x3fu);
  }
  if ((firstByte & 0xf8u) == 0xf0u) {
    return
      ((firstByte & 0x07u) << 18u) |
      ((readGpuUtf8MapByte(byteIndex + 1u) & 0x3fu) << 12u) |
      ((readGpuUtf8MapByte(byteIndex + 2u) & 0x3fu) << 6u) |
      (readGpuUtf8MapByte(byteIndex + 3u) & 0x3fu);
  }
  return 0xfffdu;
}

fn mapGpuUtf8CodePoint(codePoint: u32) -> u32 {
  let mapEntryCount = ${options.mapEntryCountExpression};
  var mapEntryIndex = 0u;
  loop {
    if (mapEntryIndex >= mapEntryCount) {
      break;
    }
    let mapEntry = ${bindingNames.mapStorage}[mapEntryIndex];
    if (mapEntry.x == codePoint) {
      return mapEntry.y;
    }
    mapEntryIndex += 1u;
  }
  return 0u;
}
`;
}

function resolveGpuUtf8MapBindingNames(options: GpuUtf8MapBindingOptions): GpuUtf8MapBindingNames {
  return {
    rowByteRanges: options.rowByteRanges ?? DEFAULT_GPU_UTF8_MAP_BINDING_NAMES.rowByteRanges,
    utf8Bytes: options.utf8Bytes ?? DEFAULT_GPU_UTF8_MAP_BINDING_NAMES.utf8Bytes,
    mapStorage: options.mapStorage ?? DEFAULT_GPU_UTF8_MAP_BINDING_NAMES.mapStorage
  };
}
