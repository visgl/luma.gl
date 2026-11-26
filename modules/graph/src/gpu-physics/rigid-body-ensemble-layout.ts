// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Word offsets matching Targets' WGSL layout, including vec2u/Manifold alignment. */
export function getEnsembleContactLayout(
  bodyCount: number,
  instances: number,
  maximumPairs: number,
  independentRecovery = false
) {
  const keyOffset = bodyCount * 8 + 8;
  const headOffset = keyOffset + maximumPairs * 2;
  const frameOffset = headOffset + instances;
  const linkOffset = frameOffset + instances;
  const markOffset = linkOffset + maximumPairs;
  const journalOffset = markOffset + maximumPairs;
  const savedKeyOffset = Math.ceil((journalOffset + maximumPairs) / 2) * 2;
  const savedLinkOffset = savedKeyOffset + maximumPairs * 2;
  const savedHeadOffset = savedLinkOffset + maximumPairs;
  const savedFrameOffset = savedHeadOffset + instances;
  const savedHeaderOffset = savedFrameOffset + instances;
  const savedManifoldOffset = Math.ceil((savedHeaderOffset + 8) / 4) * 4;
  /** Local fault words and one aggregate flag follow the journal payloads. */
  const failureOffset = savedManifoldOffset + maximumPairs * 104;
  return {
    keyOffset,
    headOffset,
    frameOffset,
    linkOffset,
    markOffset,
    journalOffset,
    savedKeyOffset,
    savedLinkOffset,
    savedHeadOffset,
    savedFrameOffset,
    savedHeaderOffset,
    savedManifoldOffset,
    failureOffset,
    byteLength: (failureOffset + (independentRecovery ? Math.ceil((instances + 1) / 4) * 4 : 0)) * 4
  };
}
