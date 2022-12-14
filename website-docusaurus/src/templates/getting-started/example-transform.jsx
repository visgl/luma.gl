import React from 'react';
import {LumaExample} from '../../react-luma';
// import AnimationLoopTemplate from '../../../../examples/getting-started/transform/app';

export class TransformExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <div />
    );
    // LumaExample name="transform" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
  }
}
