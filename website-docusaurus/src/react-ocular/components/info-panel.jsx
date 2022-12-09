import React, {PureComponent} from 'react';
import {
  PanelContainer,
  PanelContent,
  PanelTitle,
  PanelExpander,
  SourceLink
} from '../styled/example';

export default class InfoPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {isExpanded: false};
  }

  render() {
    const {title, children, sourceLink} = this.props;
    const {isExpanded} = this.state;

    return (
      <PanelContainer>
        <PanelTitle onClick={() => this.setState({isExpanded: !isExpanded})}>
          <div>{title}</div>
          <PanelExpander $expanded={isExpanded}>{isExpanded ? '✕' : 'i'}</PanelExpander>
        </PanelTitle>
        <PanelContent $expanded={isExpanded}>{children}</PanelContent>
        <SourceLink $expanded={isExpanded} href={sourceLink} target="_new">
          View Code ↗
        </SourceLink>
      </PanelContainer>
    );
  }
}
