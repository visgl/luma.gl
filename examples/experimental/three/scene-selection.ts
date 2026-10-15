// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Coordinate delayed reference picks with immediate deck clicks and scene lifecycle. */
export function createSceneSelection({
  pick,
  select,
  onError
}: {
  pick: (position: [number, number]) => Promise<unknown>;
  select: (value: unknown) => void;
  onError: (error: Error) => void;
}) {
  let request = 0;
  let disposed = false;
  return {
    select(value: unknown): void {
      if (disposed) return;
      request++;
      select(value);
    },
    async selectAt(position: [number, number]): Promise<void> {
      if (disposed) return;
      const currentRequest = ++request;
      try {
        const value = await pick(position);
        if (!disposed && currentRequest === request) select(value);
      } catch (error) {
        if (!disposed && currentRequest === request)
          onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    invalidate(): void {
      request++;
    },
    dispose(): void {
      disposed = true;
      request++;
    }
  };
}
