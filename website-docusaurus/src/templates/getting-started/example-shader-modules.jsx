import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/getting-started/shader-modules/app';

export class ShaderModulesExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample name="shader-modules" RenderLoop={RenderLoop} exampleConfig={exampleConfig} />
    );
  }
}
