import React from 'react';
import {LumaExample} from '../../react-luma';
import RenderLoop from '../../../../examples/showcase/instancing/app';

export class InstancingShowcaseExample extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample  name="transform-feedback" RenderLoop={RenderLoop} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
