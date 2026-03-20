import React, {Children, useState} from 'react';
import styled from 'styled-components';

const Header = styled.div`
  display: inline-flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  min-height: 48px;
  background-color: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  border-radius: 12px;
`;

const HeaderItem = styled.div(
  props => `
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 20px;
  font-weight: bold;
  font-size: 18px;
  border-bottom: 4px solid transparent;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  &:hover {
    background-color: rgba(238, 239, 239, 0.9);
  }
  ${
    props.isSelected
      ? `
    color: #276EF1;
    border-bottom: 4px solid #276EF1;
    background-color: rgba(39, 110, 241, 0.06);
  `
      : `
    color: #111;
  `
  }
`
);

const Body = styled.div`
  margin-top: 0;
`;

export const Tabs = props => {
  const {children} = props;
  const tabs = Children.toArray(children);
  const [selectedItem, setSelectedItem] = useState(tabs[0]?.props.tag || tabs[0]?.props.title);
  let selected = props.selectedItem !== undefined ? props.selectedItem : selectedItem;
  const setSelected = props.setSelectedItem !== undefined ? props.setSelectedItem : setSelectedItem;
  // check if the selected tab even exists in the list
  if (!tabs.some(e => (e.props.tag || e.props.title) === selected)) {
    selected = selectedItem;
  }
  return (
    <>
      <Header>
        {tabs.map(tab => (
          <HeaderItem
            key={tab.props.title}
            isSelected={(tab.props.tag || tab.props.title) === selected}
            onClick={() => setSelected(tab.props.tag || tab.props.title)}
          >
            {tab.props.title}
          </HeaderItem>
        ))}
      </Header>
      <Body>{tabs.find(tab => (tab.props.tag || tab.props.title) === selected)}</Body>
    </>
  );
};

export const Tab = props => {
  const {children} = props;
  return <>{children}</>;
};
