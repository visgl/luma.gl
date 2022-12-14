import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/getting-started/shader-hooks/app';

export class ShaderHooksExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample name="shader-hooks" RenderLoop={RenderLoop} exampleConfig={exampleConfig} />
    );
  }
}
