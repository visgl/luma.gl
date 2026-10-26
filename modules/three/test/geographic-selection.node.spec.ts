// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createSceneSelection} from '../../../examples/experimental/three/scene-selection';

function createPendingPick() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<unknown>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}

test('a delayed reference pick cannot overwrite a newer reference click', async () => {
  const first = createPendingPick();
  const second = createPendingPick();
  const select = vi.fn();
  const onError = vi.fn();
  const pick = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const selection = createSceneSelection({pick, select, onError});
  const older = selection.selectAt([1, 2]);
  const newer = selection.selectAt([3, 4]);
  second.resolve('newer');
  await newer;
  first.resolve('older');
  await older;
  expect(select.mock.calls).toEqual([['newer']]);
  expect(pick.mock.calls).toEqual([[[1, 2]], [[3, 4]]]);
  expect(onError).not.toHaveBeenCalled();
});

for (const action of ['deck click', 'model toggle', 'disposal'] as const) {
  test(`a delayed pick and its error are ignored after ${action}`, async () => {
    const pending = createPendingPick();
    const rejected = createPendingPick();
    const select = vi.fn();
    const onError = vi.fn();
    const pick = vi.fn().mockReturnValueOnce(pending.promise).mockReturnValueOnce(rejected.promise);
    const selection = createSceneSelection({pick, select, onError});
    const first = selection.selectAt([0, 0]);
    const second = selection.selectAt([1, 1]);
    if (action === 'deck click') selection.select('native-building');
    else if (action === 'model toggle') selection.invalidate();
    else selection.dispose();
    pending.resolve('old-lantern');
    rejected.reject(new Error('stale GPU readback'));
    await Promise.all([first, second]);
    expect(select.mock.calls).toEqual(action === 'deck click' ? [['native-building']] : []);
    expect(onError).not.toHaveBeenCalled();
    if (action === 'disposal') {
      selection.select('late-click');
      await selection.selectAt([2, 2]);
      expect(pick).toHaveBeenCalledTimes(2);
      expect(select).not.toHaveBeenCalled();
    }
  });
}

test('a current background hit clears selection and current failures are reported', async () => {
  const select = vi.fn();
  const onError = vi.fn();
  const pick = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce('GPU failure');
  const selection = createSceneSelection({pick, select, onError});
  await selection.selectAt([0, 0]);
  expect(select).toHaveBeenCalledWith(undefined);
  await selection.selectAt([1, 1]);
  expect(onError).toHaveBeenCalledWith(new Error('GPU failure'));
});
