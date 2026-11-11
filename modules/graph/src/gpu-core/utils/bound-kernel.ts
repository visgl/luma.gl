// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Kernel, type KernelProps} from '../../execution/compute/kernel';

/** Caller-owned bindings kept alongside a reusable executable kernel. */
export type BoundKernel = {kernel: Kernel; bindings: Record<string, Binding>};
export type BoundKernelProps = KernelProps & {bindings?: Record<string, Binding>};

export function createBoundKernel(device: Device, props: BoundKernelProps): BoundKernel {
  const {bindings = {}, ...kernelProps} = props;
  return {kernel: new Kernel(device, kernelProps), bindings: {...bindings}};
}

export async function createBoundKernelAsync(
  device: Device,
  props: BoundKernelProps
): Promise<BoundKernel> {
  const {bindings = {}, ...kernelProps} = props;
  return {kernel: await Kernel.createAsync(device, kernelProps), bindings: {...bindings}};
}
