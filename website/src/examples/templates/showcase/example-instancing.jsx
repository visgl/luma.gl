import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoopTemplate from '../../../../examples/showcase/instancing/app';

export class InstancingShowcaseExample extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample  name="instancing" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
