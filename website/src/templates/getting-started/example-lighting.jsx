import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/getting-started/lighting/app';

export class LightingExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id="lighting" name="lighting" RenderLoop={RenderLoop} exampleConfig={exampleConfig} />
    );
  }
}
