import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/getting-started/hello-instancing/app';

export class HelloInstancingExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample name="hello-instancing" RenderLoop={RenderLoop} exampleConfig={exampleConfig} />
    );
  }
}
