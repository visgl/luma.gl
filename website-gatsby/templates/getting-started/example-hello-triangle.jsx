import React from 'react';
import AnimationLoopExamplePage from '../../src/components/animation-loop-example-page';
import AnimationLoop from '../../../examples/getting-started/hello-triangle/app';

export default class Example extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <AnimationLoopExamplePage AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
    );
  }
}
