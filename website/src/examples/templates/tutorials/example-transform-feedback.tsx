import React from 'react';
// import {LumaExample} from '../../../react-luma';
// import AnimationLoopTemplate from '../../../../../examples/tutorials/transform-feedback/app';

export class TransformFeedbackExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <h2><i>Note: Transform examples temporarily disabled</i></h2>
      // <LumaExample id="transform-feedback" name="transform-feedback" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
