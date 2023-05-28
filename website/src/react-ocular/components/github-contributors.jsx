import React, {Component} from 'react';
import styled from 'styled-components';

// GitHub api has rate-limits. We want to cache the response
// as much as we can. This component gets re-mounted multiple times.
let cachedResponse = null;

/* for debug */
// cachedResponse = [
//   {
//     id: 'Pessimistress',
//     avatar_url: 'https://avatars3.githubusercontent.com/u/2059298',
//     login: 'Pessimistress',
//     html_url: 'https://github.com/Pessimistress'
//   },
//   {
//     id: 'ibgreen',
//     avatar_url: 'https://avatars1.githubusercontent.com/u/7025232',
//     login: 'ibgreen',
//     html_url: 'https://github.com/ibgreen'
//   }
// ];

const ContribContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

const ContribLink = styled.a`
  margin: 10px;
  display: inline-block;
  width: 6rem;
  height: 8rem;
  text-decoration: none;
  text-align: center;
  color: ${(props) => props.theme.colors.mono900};

  &:hover img {
    border: 4px solid #fff;
    box-shadow: 0 0 20px hsla(0, 0%, 0%, 0.3);
    opacity: 1;
  }
`;

const ContribImage = styled.img`
  border-radius: 50%;
  border: 4px solid transparent;
  box-shadow: 0 0 0 hsla(0, 0%, 0%, 0.3);
  transition: border 0.5s, box-shadow 0.5s;
  opacity: 0.9;
`;

export default class GithubContributors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      response: cachedResponse
    };
  }

  componentDidMount() {
    if (cachedResponse) {
      return;
    }

    const {project} = this.props;
    fetch(`https://api.github.com/repos/${project}/contributors`)
      .then((response) => response.json())
      .then((response) => {
        cachedResponse = response;
        this.setState({response});
      });
  }

  render() {
    const {response} = this.state;
    const contributors = Array.isArray(response) ? response : [];
    return (
      <div>
        <h2 style={{textAlign: 'center'}}>Contributors</h2>
        <ContribContainer>
          {contributors.map(
            (contributor) =>
              contributor && (
                <ContribLink
                  target="_blank"
                  rel="noopener noreferrer"
                  href={contributor.html_url}
                  key={contributor.id}
                >
                  <ContribImage src={contributor.avatar_url} width="100%" alt={contributor.login} />
                  <div>{contributor.login}</div>
                </ContribLink>
              )
          )}
        </ContribContainer>
      </div>
    );
  }
}
