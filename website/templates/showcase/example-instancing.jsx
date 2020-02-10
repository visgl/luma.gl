import React from 'react';
import AnimationLoopExamplePage from '../../src/components/animation-loop-example-page';
import AnimationLoop from '../../../examples/showcase/instancing/app';

export default class Example extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <AnimationLoopExamplePage AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
