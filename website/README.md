# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

Run these commands from the repository root.

### Installation

```
$ yarn install
$ yarn build
```

Build the workspace packages before starting or building the website. The standalone
examples use compiled workspace exports. Rerun `yarn build` after changing those packages.

### Local Development

```
$ yarn website:start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn website:build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn workspace website-docusaurus deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn workspace website-docusaurus deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
