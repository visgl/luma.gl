// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUGraph} from './gpu-graph';
import {
  GPUGraphScalar,
  GPUGraphVector,
  gpuGraph,
  type GPUGraphValueDescriptor
} from './gpu-graph-value';
import {GPUCompositeOperation, isGPUOperation, type GPUGraphOperation} from './gpu-operation';
import {getGPUOperationValueName, validateGPUOperationContract} from './gpu-operation-contract';

/** Resolve operation-owned logical results without modifying the authored graph. @internal */
export function resolveGPUGraphDeclarations(source: GPUGraph): GPUGraph {
  const program = source.clone();
  const values = new Map([...program.scalars, ...program.vectors].map(value => [value.id, value]));
  const written = new Set<string>();
  const visit = (operation: GPUGraphOperation, conditional = false): void => {
    if (operation instanceof GPUCompositeOperation) {
      for (const child of operation.operations)
        visit(child, conditional || operation.type !== 'composite');
      return;
    }
    if (!isGPUOperation(operation)) return;
    try {
      const contract = operation.contract;
      if (!contract) return;
      const outputs =
        typeof contract.outputs === 'function'
          ? contract.outputs({
              getValue(name): GPUGraphValueDescriptor {
                const value = values.get(name);
                if (!value) throw new Error(`Undeclared operation value ${name}`);
                return value instanceof GPUGraphScalar
                  ? gpuGraph.scalar(value.format)
                  : gpuGraph.vector(value.format, {
                      length: value.length,
                      chunkLengths: value.chunkLengths
                    });
              }
            })
          : contract.outputs;
      for (const [name, descriptor] of Object.entries(outputs ?? {})) {
        if (
          !contract.values.some(
            use => use.access === 'write' && getGPUOperationValueName(use.value) === name
          )
        )
          throw new Error(`Operation result ${name} requires a write`);
        const existing = values.get(name);
        if (existing?.role === 'input' || existing?.role === 'state')
          throw new Error(`Operation result conflicts with ${existing.role} ${name}`);
        if (!existing) {
          if (conditional)
            throw new Error('Operation results inside control flow require explicit declarations');
          const shape = contract.values.find(
            use => getGPUOperationValueName(use.value) === name && use.access === 'write'
          )?.shape;
          let resolvedDescriptor = descriptor;
          if (descriptor.type === 'vector' && descriptor.length === undefined && shape) {
            const source =
              'like' in shape ? values.get(getGPUOperationValueName(shape.like)) : undefined;
            const dimensions =
              'length' in shape ? shape : source instanceof GPUGraphVector ? source : undefined;
            if (dimensions?.length !== undefined)
              resolvedDescriptor = {
                ...descriptor,
                length: dimensions.length,
                chunkLengths: descriptor.chunkLengths ?? dimensions.chunkLengths
              };
          }
          const declaration = program.addDeclaration(name, resolvedDescriptor, 'value');
          values.set(name, declaration);
        } else if (
          existing.format !== descriptor.format ||
          existing instanceof GPUGraphVector !== (descriptor.type === 'vector')
        )
          throw new Error(`Incompatible operation result ${name}`);
        else if (existing instanceof GPUGraphVector && descriptor.type === 'vector')
          values.set(name, program.constrainResult(existing, descriptor));
      }
      validateGPUOperationContract(program, contract);
      for (const use of contract.values) {
        const name = getGPUOperationValueName(use.value);
        const declaration = values.get(name);
        if (use.access !== 'read' && declaration?.role === 'input')
          throw new Error(`Cannot write graph input ${name}`);
        if (use.access !== 'write' && declaration?.role === 'value' && !written.has(name))
          throw new Error(`Reads ${name} before it is produced`);
      }
      const writes = new Set(
        contract.values
          .filter(use => use.access !== 'read')
          .map(use => getGPUOperationValueName(use.value))
      );
      for (const name of writes) {
        if (values.get(name)?.role === 'value' && written.has(name))
          throw new Error(`Multiple writers for graph result ${name}`);
        written.add(name);
      }
    } catch (error) {
      throw new Error(
        `${operation.id}: ${error instanceof Error ? error.message : String(error)}`,
        {cause: error}
      );
    }
  };
  program.operations.forEach(operation => visit(operation));
  return program;
}
