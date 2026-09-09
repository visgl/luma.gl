// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const EXAMPLE_NAVIGATION_START_EVENT = 'luma-example-navigation-start';
export const EXAMPLE_NAVIGATION_END_EVENT = 'luma-example-navigation-end';

export type ExclusiveExample = {
  start: () => Promise<void> | void;
  stop: () => Promise<void> | void;
  onError: (error: unknown) => void;
};

type ExclusiveExampleSession = ExclusiveExample & {
  started: boolean;
  stopRequested: boolean;
  stopped: boolean;
};

let activeExampleSession: ExclusiveExampleSession | null = null;
let exampleLifecycleTask: Promise<void> = Promise.resolve();

/**
 * Starts an example after the previous example has completely stopped.
 *
 * The returned function is idempotent and requests teardown. A session also stops when another
 * session starts, which protects the GPU if two example pages overlap during a route transition.
 */
export function startExclusiveExample(example: ExclusiveExample): () => void {
  const session: ExclusiveExampleSession = {
    ...example,
    started: false,
    stopRequested: false,
    stopped: false
  };

  const startTask = enqueueExampleLifecycleTask(async () => {
    if (session.stopRequested) {
      return;
    }
    if (activeExampleSession) {
      await stopExampleSession(activeExampleSession);
    }
    if (session.stopRequested) {
      return;
    }

    activeExampleSession = session;
    session.started = true;
    try {
      await session.start();
    } catch (error) {
      await stopExampleSession(session);
      throw error;
    }

    if (session.stopRequested) {
      await stopExampleSession(session);
    }
  });
  void startTask.catch(session.onError);

  return () => {
    if (session.stopRequested) {
      return;
    }
    session.stopRequested = true;
    const stopTask = enqueueExampleLifecycleTask(() => stopExampleSession(session));
    void stopTask.catch(session.onError);
  };
}

async function stopExampleSession(session: ExclusiveExampleSession): Promise<void> {
  if (session.stopped) {
    return;
  }

  session.stopped = true;
  if (activeExampleSession === session) {
    activeExampleSession = null;
  }
  if (!session.started) {
    return;
  }
  try {
    await session.stop();
  } catch (error) {
    session.onError(error);
  }
}

function enqueueExampleLifecycleTask(task: () => Promise<void> | void): Promise<void> {
  const queuedTask = exampleLifecycleTask.then(task);
  exampleLifecycleTask = queuedTask.catch(() => {});
  return queuedTask;
}
