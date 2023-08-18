import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../examples/showcase/instancing/app';

export class InstancingExample extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample  name="transform-feedback" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
