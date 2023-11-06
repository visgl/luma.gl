import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoop from '../../../../../examples/webgpu/instanced-cubes/app';

export class InstancedCubesWebGPUExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
    );
  }
}
