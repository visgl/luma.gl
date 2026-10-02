import React from 'react';
import InstancingApp from '../../../examples/showcase/instancing/app';
import {LumaExample} from '../react-luma';

/** Loads the homepage scene independently of the complete interactive-example registry. */
export default function HomepageGPUScene(): React.JSX.Element {
  return (
    <LumaExample
      id="instancing"
      directory="showcase"
      template={InstancingApp}
      config={{}}
      exampleId="homepage/instancing"
      mobileMode="reduced"
      mobileProfile="large-data"
      canvasContextProfile="high-dynamic-range"
      panel={false}
    />
  );
}
