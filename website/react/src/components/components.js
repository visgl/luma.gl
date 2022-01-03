import styled from 'styled-components';

export const Button = styled.div.attrs({
  className: 'button'
})`
  align-items: center;
  background-color: ${props => props.theme.primaryBtnBgd};
  border-radius: 6px;
  color: ${props => props.theme.primaryBtnColor};
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-family: ${props => props.theme.fontFamilySemiBold};
  justify-content: center;
  letter-spacing: 0.3px;
  line-height: 14px;
  outline: 0;
  padding: 14px 32px;
  text-align: center;
  transition: ${props => props.theme.transition};
  vertical-align: middle;
  width: ${props => props.width || 'auto'};

  :hover,
  :focus,
  :active,
  &.active {
    background-color: ${props => props.theme.primaryBtnBgdHover};
  }

  svg {
    margin-right: 8px;
  }
`;
