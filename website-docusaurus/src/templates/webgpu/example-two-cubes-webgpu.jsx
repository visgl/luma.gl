import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoop from '../../../examples/webgpu/two-cubes/app';

export default class Example extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
    );
  }
}
