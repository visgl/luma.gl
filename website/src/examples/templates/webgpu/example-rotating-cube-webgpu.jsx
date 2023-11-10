import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/webgpu/rotating-cube/app';

export class RotatingCubeWebGPUExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id='rotating-cube-webgpu' AnimationLoopTemplate={AnimationLoopTemplate}  exampleConfig={exampleConfig} />
    );
  }
}
