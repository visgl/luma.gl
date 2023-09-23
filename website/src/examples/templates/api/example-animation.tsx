import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/api/animation/app';

export class AnimationExample extends React.Component {
  render() {
    const {pageContext} = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample
        id="hello-cube"
        name="hello-cube"
        AnimationLoopTemplate={AnimationLoopTemplate}
        exampleConfig={exampleConfig}
      />
    );
  }
}
