rewrite of https://github.com/djm158/github-starred-issues because using github's API purely client side exposes your api key (which is necessary to avoid their githubs [rate limit](https://developer.github.com/v3/rate_limit/))

## Install

[get an access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

```sh
$ npm install
$ GITHUB_TOKEN=your_token npm start
```