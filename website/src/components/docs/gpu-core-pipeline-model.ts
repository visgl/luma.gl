export const GPU_CORE_TUTORIAL_VALUES = [8, 3, 5, 2, 9, 1, 6, 4] as const;
export const GPU_CORE_TUTORIAL_DEFAULT_FLAGS = [1, 0, 1, 0, 1, 0, 0, 1] as const;

export type GPUCoreTutorialStageId = 'source' | 'mask' | 'scan' | 'scatter' | 'draw';

export type GPUCoreTutorialResult = {
  flags: number[];
  offsets: number[];
  compactedValues: number[];
  compactedSourceIndices: number[];
  instanceCount: number;
};

/** Evaluates the small deterministic dataflow visualized by the GPU Core tutorial. */
export function evaluateGPUCoreTutorial(
  values: readonly number[],
  selectionFlags: readonly number[]
): GPUCoreTutorialResult {
  if (values.length !== selectionFlags.length) {
    throw new Error('Tutorial values and flags must have the same length');
  }

  const flags = selectionFlags.map(flag => (flag === 0 ? 0 : 1));
  const offsets: number[] = [];
  const compactedValues: number[] = [];
  const compactedSourceIndices: number[] = [];
  let selectedCount = 0;

  for (let sourceIndex = 0; sourceIndex < values.length; sourceIndex++) {
    offsets.push(selectedCount);
    if (flags[sourceIndex]) {
      compactedValues.push(values[sourceIndex]);
      compactedSourceIndices.push(sourceIndex);
      selectedCount++;
    }
  }

  return {
    flags,
    offsets,
    compactedValues,
    compactedSourceIndices,
    instanceCount: selectedCount
  };
}
