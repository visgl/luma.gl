import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoop from '../../../examples/showcase/instancing/app';

export default class Example extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
