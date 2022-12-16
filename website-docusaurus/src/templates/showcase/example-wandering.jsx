import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoop from '../../../examples/showcase/wandering/app';

export default class Example extends React.Component {
  render() {
    return (
      <LumaExample AnimationLoop={AnimationLoop} exampleConfig={this.props.pageContext.exampleConfig} />
    );
  }
}
