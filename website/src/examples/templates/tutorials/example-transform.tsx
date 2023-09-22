import React from 'react';
import {LumaExample} from '../../../react-luma';
// import AnimationLoopTemplate from '../../../../../examples/tutorials/transform/app';

export class TransformExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <h2><i>Note: Transform examples temporarily disabled</i></h2>
    );
    // LumaExample name="transform" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
  }
}
