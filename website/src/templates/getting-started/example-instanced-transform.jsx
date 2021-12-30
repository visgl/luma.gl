import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/getting-started/instanced-transform/app';

export class InstancedTransformExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample name="instanced-transform" RenderLoop={RenderLoop} exampleConfig={exampleConfig} />
    );
  }
}
