// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import useBaseUrl from '@docusaurus/useBaseUrl';
import React, {type ReactNode} from 'react';
import {ClientOnlyLiveExample} from './client-only-live-example';

/** Embeds the standalone rigid-body lab, which opens on Newton's cradle. */
export function GPUPhysicsExample(): ReactNode {
  const source = useBaseUrl('/standalone-examples/gpu-rigid-body-world/index.html');
  return (
    <ClientOnlyLiveExample
      activationLabel="Run Newton's cradle"
      description="Explore GPU physics with the interactive rigid-body lab. Requires WebGPU."
      height={640}
    >
      <iframe
        title="Newton's cradle GPU physics lab"
        src={source}
        style={{border: 0, height: 640, width: '100%'}}
        allow="fullscreen"
      />
    </ClientOnlyLiveExample>
  );
}
