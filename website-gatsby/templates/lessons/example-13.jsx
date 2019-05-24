import React from 'react';
import AnimationLoopRunner from '../../src/components/animation-loop-runner';
import AnimationLoop from '../../../examples/lessons/13/app';

export default class Example extends React.Component {
  render() {
    return (
      <AnimationLoopRunner AnimationLoop={AnimationLoop} path={this.props.pageContext.exampleConfig.path} />
    );
  }
}
