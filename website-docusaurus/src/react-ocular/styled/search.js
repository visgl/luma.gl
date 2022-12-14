import {Link} from 'gatsby';
import styled from 'styled-components';

import {A} from './typography';

// search

export const SearchContainer = styled.div`
  position: relative;
  height: ${(props) => props.theme.sizing.scale1000};
  margin-bottom: 20px;
  background: ${(props) => props.theme.colors.mono200};
`;

export const IconContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.theme.sizing.scale1000};
  height: ${(props) => props.theme.sizing.scale1000};
`;

export const SearchInput = styled.input`
  width: 100%;
  border: 1px solid ${(props) => props.theme.colors.mono500};
  transition: 0.3s;
  font-size: 14px;
  font-weight: 500;
  line-jeight: 20px;
  padding: 10px 10px 10px 40px;
  &:focus {
    box-shadow: ${(props) => props.theme.lighting.shadow600};
    border-color: rgb(39, 110, 241);
    outline: none;
  }
`;

export const MainSearch = styled.main`
  font: ${(props) => props.theme.typography.font300};
  width: 600px;
  max-width: 90%;
  margin: ${(props) => props.theme.sizing.scale2400} auto 0px;
`;

export const SearchResultItem = styled.div`
  margin: 1em 0;
`;

export const SearchResultLink = styled(Link)`
  font: ${(props) => props.theme.typography.font450};
  margin-bottom: 0.5rem;
  color: ${(props) => props.theme.colors.linkText};
  text-decoration: none;
  &:visited {
    color: ${(props) => props.theme.colors.linkVisited};
  }
  &:active {
    color: ${(props) => props.theme.colors.linkHover};
  }
  &:hover {
    color: ${(props) => props.theme.colors.linkHover};
  }
`;

export const SearchResultHighlight = styled.span`
  display: inline-block;
  background: yellow;
`;

export const SearchResultPager = styled(A)`
  cursor: pointer;
  padding: 20px 0 80px;
`;
