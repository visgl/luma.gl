// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {GPUHistogram} from '@luma.gl/gpgpu/gpu-core';
import {GPUReduction} from '@luma.gl/gpgpu/gpu-core';
import {getRasterDeviceLimits} from './raster-device-limits';
import {
  assertRasterStorageBindingFits,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  validateRasterBand
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterScalarFormat} from './types';

const RASTER_HISTOGRAM_WORKGROUP_SIZE = 256;

/** A fixed scalar domain, caller-owned GPU domain, or validity-aware automatic extent. */
export type GPURasterHistogramDomain<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  | readonly [number, number]
  | GraphDataView<Format>
  | 'valid-auto';

/** Caller-owned inputs and outputs for a graph-native, validity-aware raster histogram. */
export type GPURasterHistogramProps<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  {
    id?: string;
    /** Raw, packed raster values. Integer samples remain in their exact source representation. */
    input: GPURasterBufferBand<Format>;
    /** Caller-owned uint32 bin counts, cleared on every graph encoding. */
    output: GraphDataView<'uint32'>;
    /** Defaults to an extent computed only from valid, finite, non-nodata raster samples. */
    domain?: GPURasterHistogramDomain<Format>;
    /** Optional caller-owned two-row extent output for the default validity-aware domain. */
    domainOutput?: GraphDataView<Format>;
  };

/**
 * Composes a nodata-aware raster extent and histogram entirely inside a command graph.
 *
 * Unlike the generic histogram's deliberately unmasked automatic domain, `valid-auto` first runs
 * a masked reduction and passes its two-row GPU result explicitly to the histogram. Finite raw
 * nodata sentinels receive an exact source-format comparison before any reduction or binning.
 * Caller inputs, output bins, and an optional published domain remain borrowed; generated domain
 * and validity buffers belong to the graph.
 */
export class GPURasterHistogram<Format extends GPURasterScalarFormat = GPURasterScalarFormat>
  implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly input: GPURasterBufferBand<Format>;
  readonly output: GraphDataView<'uint32'>;
  readonly domain: GPURasterHistogramDomain<Format>;
  readonly domainOutput?: GraphDataView<Format>;

  constructor(props: GPURasterHistogramProps<Format>) {
    this.id = props.id ?? 'gpu-raster-histogram';
    this.input = props.input;
    this.output = props.output;
    this.domain = props.domain ?? 'valid-auto';
    this.domainOutput = props.domainOutput;

    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed raster band`);
    }

    const values = this.input.storage.values;
    const owner = validateRasterBand(this.input, {width: values.length, height: 1}, this.id);

    if (this.domainOutput && this.domain !== 'valid-auto') {
      throw new Error(`${this.id} domainOutput requires a validity-aware automatic domain`);
    }
    if (this.domainOutput) {
      if (this.domainOutput.buffer.graph !== owner) {
        throw new Error(`${this.id} domain output must belong to the same graph`);
      }
      if (
        this.domainOutput.buffer === values.buffer ||
        this.domainOutput.buffer === this.input.validity?.buffer
      ) {
        throw new Error(`${this.id} domain output must not alias its source values or validity`);
      }
    }

    // Reuse the generic primitive's complete packed-layout, alias, bin-count, and domain checks.
    const defaultValidationDomain: readonly [number, number] = [0, 0];
    const validationDomain =
      this.domain === 'valid-auto' ? (this.domainOutput ?? defaultValidationDomain) : this.domain;
    new GPUHistogram<GPURasterScalarFormat>({
      id: this.id,
      input: values,
      mask: this.input.validity,
      output: this.output,
      domain: validationDomain
    });

    if (this.output.buffer.graph !== owner) {
      throw new Error(`${this.id} output must belong to the same graph`);
    }
    if (isRasterHistogramDomainView(this.domain) && this.domain.buffer.graph !== owner) {
      throw new Error(`${this.id} domain must belong to the same graph`);
    }
  }

  /** Adds explicit validity resolution, masked extent, clear, and accumulation graph passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const values = this.input.storage.values;
    if (
      values.buffer.graph !== graph ||
      this.output.buffer.graph !== graph ||
      (this.input.validity && this.input.validity.buffer.graph !== graph) ||
      (this.domainOutput && this.domainOutput.buffer.graph !== graph) ||
      (isRasterHistogramDomainView(this.domain) && this.domain.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} resources must belong to the target graph`);
    }

    const limits = getRasterDeviceLimits(graph.device, {
      workgroupSize: RASTER_HISTOGRAM_WORKGROUP_SIZE
    });
    if (values.length > limits.maxDispatchElementCount) {
      throw new Error(`${this.id} input exceeds one bounded scalar-analysis dispatch`);
    }
    if (this.output.length > limits.maxDispatchElementCount) {
      throw new Error(`${this.id} output exceeds one bounded histogram-clear dispatch`);
    }
    assertRasterStorageBindingFits(graph.device, values, `${this.id} input`);
    assertRasterStorageBindingFits(graph.device, this.output, `${this.id} output`);
    if (this.input.validity) {
      assertRasterStorageBindingFits(
        graph.device,
        this.input.validity,
        `${this.id} input validity`
      );
    }

    const mask = this.resolveValidity(graph);
    let domain: readonly [number, number] | GraphDataView<GPURasterScalarFormat>;

    if (this.domain === 'valid-auto') {
      const resolvedDomain =
        this.domainOutput ??
        createTransientView(graph, `${this.id}-valid-domain`, this.input.format, 2);
      assertRasterStorageBindingFits(graph.device, resolvedDomain, `${this.id} domain`);
      new GPUReduction<GPURasterScalarFormat>({
        id: `${this.id}-valid-extent`,
        input: values,
        mask,
        output: resolvedDomain,
        operation: 'extent'
      }).addToGraph(graph);
      domain = resolvedDomain;
    } else {
      domain = this.domain;
      if (isRasterHistogramDomainView(domain)) {
        assertRasterStorageBindingFits(graph.device, domain, `${this.id} domain`);
      }
    }

    new GPUHistogram<GPURasterScalarFormat>({
      id: `${this.id}-bins`,
      input: values,
      mask,
      output: this.output,
      domain
    }).addToGraph(graph);
  }

  private resolveValidity<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): GraphDataView<'uint32'> | undefined {
    const noDataValue = this.input.noDataValue;
    if (noDataValue === undefined || Number.isNaN(noDataValue)) {
      return this.input.validity;
    }

    const values = this.input.storage.values;
    if (values.length === 0) return this.input.validity;

    const resolvedValidity = createTransientView(
      graph,
      `${this.id}-resolved-validity`,
      'uint32',
      values.length
    );
    assertRasterStorageBindingFits(graph.device, resolvedValidity, `${this.id} resolved validity`);

    const resources: GraphResourceUse[] = [
      {buffer: values, usage: 'storage-read'},
      {buffer: resolvedValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      resources.push({buffer: this.input.validity, usage: 'storage-read'});
    }

    graph.addComputePass({
      id: `${this.id}-resolve-validity`,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'resolvedValidity', type: 'storage', group: 0, location: 1}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 2});
        }

        const computation = new Computation(device, {
          id: `${this.id}-resolve-validity`,
          source: this.getValidityShaderSource(resolvedValidity, noDataValue),
          shaderLayout: {bindings}
        });

        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(values, getBuffer),
              resolvedValidity: getViewBinding(resolvedValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(
              computePass,
              Math.ceil(values.length / RASTER_HISTOGRAM_WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });

    return resolvedValidity;
  }

  private getValidityShaderSource(
    resolvedValidity: GraphDataView<'uint32'>,
    noDataValue: number
  ): string {
    const values = this.input.storage.values;
    const scalarType = getRasterShaderScalarType(this.input.format);
    const validityDeclaration = this.input.validity
      ? `@group(0) @binding(2) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const validityCondition = this.input.validity
      ? 'sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u && '
      : '';
    const finiteCondition =
      this.input.format === 'float32'
        ? 'rawSample == rawSample && abs(rawSample) <= 3.402823466e+38 && '
        : '';

    return `
@group(0) @binding(0) var<storage, read> sourceValues: array<${scalarType}>;
@group(0) @binding(1) var<storage, read_write> resolvedValidity: array<u32>;
${validityDeclaration}

const SOURCE_OFFSET: u32 = ${getViewElementOffset(values)}u;
const RESOLVED_VALIDITY_OFFSET: u32 = ${getViewElementOffset(resolvedValidity)}u;
const PIXEL_COUNT: u32 = ${values.length}u;

@compute @workgroup_size(${RASTER_HISTOGRAM_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let pixelIndex = globalId.x;
  if (pixelIndex >= PIXEL_COUNT) {
    return;
  }

  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let valid = ${validityCondition}${finiteCondition}rawSample != ${getRasterScalarLiteral(
    noDataValue,
    this.input.format
  )};
  resolvedValidity[RESOLVED_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, valid);
}
`;
  }
}

function isRasterHistogramDomainView<Format extends GPURasterScalarFormat>(
  domain: GPURasterHistogramDomain<Format>
): domain is GraphDataView<Format> {
  return domain !== 'valid-auto' && !Array.isArray(domain);
}
