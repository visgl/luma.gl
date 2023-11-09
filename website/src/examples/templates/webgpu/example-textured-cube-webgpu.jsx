import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/webgpu/textured-cube/app';

export class TexturedCubeWebGPUExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id='textured-cube-webgpu' AnimationLoopTemplate={AnimationLoopTemplate}  exampleConfig={exampleConfig} />
    );
  }
}
