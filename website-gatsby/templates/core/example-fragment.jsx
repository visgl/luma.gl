import React from 'react';
import AnimationLoopRunner from '../../src/components/animation-loop-runner';
import AnimationLoop from '../../../examples/core/fragment/app';

export default class Example extends React.Component {
  render() {
    return (
      <AnimationLoopRunner AnimationLoop={AnimationLoop} path={this.props.pageContext.exampleConfig.path} />
    );
  }
}
