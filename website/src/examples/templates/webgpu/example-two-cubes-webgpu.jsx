import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/webgpu/two-cubes/app';

export class TwoCubesWebGPUExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id='two-cubes-webgpu' AnimationLoopTemplate={AnimationLoopTemplate}  exampleConfig={exampleConfig} />
    );
  }
}
