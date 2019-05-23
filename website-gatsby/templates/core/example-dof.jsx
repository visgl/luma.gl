import React from 'react';
import AnimationLoopRunner from '../../src/components/animation-loop-runner';
import AnimationLoop from '../../../examples/core/dof/app';
import {setPathPrefix} from '@luma.gl/core'

export default class Example extends React.Component {
  componentDidMount() {
    const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/master';
    setPathPrefix(`${RAW_GITHUB}/examples/core/dof/`);
  }

  render() {
    return (
      <AnimationLoopRunner AnimationLoop={AnimationLoop} />
    );
  }
}
