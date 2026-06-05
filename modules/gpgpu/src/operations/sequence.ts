// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

type SequenceInputs = {
  start: number;
  step: number;
};

/** Deferred integer sequence generation operation. */
class SequenceOperation extends Operation<SequenceInputs> {
  /** Operation name used for backend lookup. */
  name = 'sequence';

  /** Lazy output table for the generated sequence. */
  output: GPUDataEvaluator;

  constructor(start: number, length: number, step: number) {
    super({start, step});

    this.output = new GPUDataEvaluator({
      type: 'sint32',
      size: 1,
      length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {start, step} = this.inputs;
    return `sequence(start=${start}, step=${step}, length=${this.output.length})`;
  }
}

/**
 * Generates an integer sequence with `count` values starting at `start` and incrementing by `step`.
 */
export function sequence(count: number, start: number = 0, step: number = 1): GPUDataEvaluator {
  ensureInteger('count', count);
  ensureInteger('start', start);
  ensureInteger('step', step);
  if (count < 0) {
    throw new Error(`sequence count must be non-negative, got ${count}`);
  }
  if (step === 0) {
    throw new Error('sequence step must not be 0');
  }

  return new SequenceOperation(start, count, step).output;
}

function ensureInteger(name: string, value: number) {
  if (!Number.isInteger(value)) {
    throw new Error(`sequence ${name} must be an integer, got ${value}`);
  }
}
