const express = require('express');
const rp = require('request-promise-native')
const bodyParser = require('body-parser');
const app = express();

const github = {
  token: process.env.GITHUB_TOKEN,

  getStarred: (uri, repos) => {
    return rp({
      "method": "GET",
      "uri": uri,
      "json": true,
      "headers": {
        "Authorization": `Bearer ${github.token}`,
        "User-Agent": "request-promise",
      },
      "resolveWithFullResponse": true
    }).then((response) => {
      if (!repos) {
        repos = []
      }
      repos = repos.concat(response.body);
      if (response.headers.link.split(",").filter(function (link) {
          return link.match(/rel="next"/)
        }).length > 0) {
        let next = new RegExp(/<(.*)>/).exec(response.headers.link.split(",").filter(function (link) {
          return link.match(/rel="next"/)
        })[0])[1];
        return github.getStarred(next, repos);
      }

      return repos
    }).catch((err) => {
      console.error(`Error fetching starred repos: ${err.message}`);
      throw new Error()
    })
  },

  getIssuesUrls: (repos) => {
    return repos.map((repo) => {
      return repo.url + '/issues'
    })
  },

  getIssues: (issuesUrls) => {
    return Promise.all(issuesUrls.map(url => rp({
      "method": "GET",
      "uri": url,
      "json": true,
      "headers": {
        "Authorization": `Bearer ${github.token}`,
        "User-Agent": "request-promise",
      }
    })));

    hasIssues: (repo) => {
      return repo.open_issue_count == 0;
    }
  }

}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/', (req, res) => {
  let username = req.body.username;
  let data = [];
  github.getStarred(`https://api.github.com/users/${username}/starred`)
    .catch((err) => {
      res.render('index', {
        data: null,
        issues: null,
        error: `Invalid username ${username}`
      });
      throw new Error();
    })
    .then((repos) => {
      return data = repos.filter((repo) => {
        return repo.open_issues_count != 0
      })
    })
    .then((filteredRepos) => {
      return data = filteredRepos.map((fRepo) => {
        return {
          "name": fRepo.name,
          "description": fRepo.description,
          "url": fRepo.url,
        }
      })
    })
    .then(github.getIssuesUrls)
    .then(github.getIssues)
    .then((issues) => {
      let issueList = issues.map((issue) => {
        return issue.map((i) => {
          return i.title
        })
      })

      res.render('index', {
        data: data,
        issues: issueList
      })
    })
    .catch((err) => {
      console.error(`Catching all errors: ${err}`);
    })

});

app.listen(3000, () => {
  console.log('listening on port 3000');
})