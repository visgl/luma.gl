import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/webgpu/instanced-cubes/app';

export class InstancedCubesWebGPUExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id='instanced-cubes-webgpu' AnimationLoopTemplate={AnimationLoopTemplate}  exampleConfig={exampleConfig} />
    );
  }
}
