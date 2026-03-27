import React from 'react';
import Layout from '@theme/Layout';

import {GPUConceptGrid} from '../components/gpu-concepts';

export default function GPUConceptsPage() {
  return (
    <Layout description="Interactive GPU concept cards for buffers, textures, and pipelines." title="GPU Concepts">
      <main className="gpuConceptDemoPage">
        <GPUConceptGrid />
      </main>
    </Layout>
  );
}
