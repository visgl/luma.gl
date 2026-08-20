// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import type {GraphBufferHandle, GraphDataView} from '@luma.gl/gpgpu/gpu-core';

const WORD_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Scalar format accepted by compact trace-analytics chart outputs. */
export type GPUTraceAnalyticsOutputFormat = 'uint32' | 'float32';

/** One named series requested from a compact trace-analytics result buffer. */
export type GPUTraceAnalyticsOutputSpec = Readonly<{
  id: string;
  format: GPUTraceAnalyticsOutputFormat;
  length: number;
}>;

/** One packed series with deterministic word and byte offsets. */
export type GPUTraceAnalyticsOutputSeries = GPUTraceAnalyticsOutputSpec &
  Readonly<{
    wordOffset: number;
    byteOffset: number;
    byteLength: number;
  }>;

/** Typed array returned when one packed series is decoded after a compact readback. */
export type GPUTraceAnalyticsOutputValues = Uint32Array | Float32Array;

/**
 * Defines and decodes one compact, reusable result buffer for trace analytics and charts.
 *
 * The layout owns no GPU resources. Applications create one caller-owned result buffer with
 * {@link byteLength}, use {@link createView} to bind named series to graph contributors, then read
 * back the compact buffer or consume the same offsets from another GPU pass.
 */
export class GPUTraceAnalyticsOutputLayout {
  /** Named series in packed order. */
  readonly series: readonly GPUTraceAnalyticsOutputSeries[];
  /** Total number of 32-bit words in the packed output. */
  readonly wordLength: number;
  /** Total byte length required by the packed output buffer. */
  readonly byteLength: number;

  private readonly seriesById = new Map<string, GPUTraceAnalyticsOutputSeries>();

  constructor(specs: readonly GPUTraceAnalyticsOutputSpec[]) {
    let wordOffset = 0;
    const series = specs.map(spec => {
      if (!spec.id) {
        throw new Error('GPUTraceAnalyticsOutputLayout series id must not be empty');
      }
      if (this.seriesById.has(spec.id)) {
        throw new Error(`GPUTraceAnalyticsOutputLayout series id "${spec.id}" must be unique`);
      }
      if (!Number.isSafeInteger(spec.length) || spec.length <= 0) {
        throw new Error(
          `GPUTraceAnalyticsOutputLayout series "${spec.id}" length must be a positive safe integer`
        );
      }
      const output = Object.freeze({
        ...spec,
        wordOffset,
        byteOffset: wordOffset * WORD_BYTE_LENGTH,
        byteLength: spec.length * WORD_BYTE_LENGTH
      });
      this.seriesById.set(output.id, output);
      wordOffset += output.length;
      return output;
    });
    this.series = Object.freeze(series);
    this.wordLength = wordOffset;
    this.byteLength = wordOffset * WORD_BYTE_LENGTH;
  }

  /** Returns one named packed series. */
  getSeries(id: string): GPUTraceAnalyticsOutputSeries {
    const series = this.seriesById.get(id);
    if (!series) {
      throw new Error(`GPUTraceAnalyticsOutputLayout has no series named "${id}"`);
    }
    return series;
  }

  /** Creates a typed graph view over one named series in a caller-owned result buffer. */
  createView<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    buffer: GraphBufferHandle,
    id: string
  ): GraphDataView<'uint32'> | GraphDataView<'float32'> {
    const series = this.getSeries(id);
    if (series.format === 'uint32') {
      return graph.createDataView(buffer, {
        format: 'uint32',
        length: series.length,
        byteOffset: series.byteOffset
      });
    }
    return graph.createDataView(buffer, {
      format: 'float32',
      length: series.length,
      byteOffset: series.byteOffset
    });
  }

  /** Creates a graph view for a named unsigned-integer series. */
  createUint32View<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    buffer: GraphBufferHandle,
    id: string
  ): GraphDataView<'uint32'> {
    const series = this.assertSeriesFormat(id, 'uint32');
    return graph.createDataView(buffer, {
      format: 'uint32',
      length: series.length,
      byteOffset: series.byteOffset
    });
  }

  /** Creates a graph view for a named floating-point series. */
  createFloat32View<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    buffer: GraphBufferHandle,
    id: string
  ): GraphDataView<'float32'> {
    const series = this.assertSeriesFormat(id, 'float32');
    return graph.createDataView(buffer, {
      format: 'float32',
      length: series.length,
      byteOffset: series.byteOffset
    });
  }

  /** Decodes one named series from a compact result readback without copying its values. */
  decode(data: Uint8Array, id: string): GPUTraceAnalyticsOutputValues {
    const series = this.getSeries(id);
    if (data.byteLength < this.byteLength) {
      throw new Error(
        `GPUTraceAnalyticsOutputLayout requires ${this.byteLength} readback bytes; received ${data.byteLength}`
      );
    }
    const byteOffset = data.byteOffset + series.byteOffset;
    if (byteOffset % WORD_BYTE_LENGTH !== 0) {
      throw new Error('GPUTraceAnalyticsOutputLayout readback must be aligned to 32-bit words');
    }
    return series.format === 'uint32'
      ? new Uint32Array(data.buffer, byteOffset, series.length)
      : new Float32Array(data.buffer, byteOffset, series.length);
  }

  /** Decodes one unsigned-integer series from a compact readback. */
  decodeUint32(data: Uint8Array, id: string): Uint32Array {
    this.assertSeriesFormat(id, 'uint32');
    return this.decode(data, id) as Uint32Array;
  }

  /** Decodes one floating-point series from a compact readback. */
  decodeFloat32(data: Uint8Array, id: string): Float32Array {
    this.assertSeriesFormat(id, 'float32');
    return this.decode(data, id) as Float32Array;
  }

  private assertSeriesFormat(
    id: string,
    format: GPUTraceAnalyticsOutputFormat
  ): GPUTraceAnalyticsOutputSeries {
    const series = this.getSeries(id);
    if (series.format !== format) {
      throw new Error(
        `GPUTraceAnalyticsOutputLayout series "${id}" uses ${series.format}, not ${format}`
      );
    }
    return series;
  }
}
