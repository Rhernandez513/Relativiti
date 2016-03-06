#!/bin/bash
#
# Used to build TravisCI Versions of Apps && GitHub Pages version
#
# Should run only on dev environments  && TravisCI
#

set -o pipefail

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]
then

# Info that shows up on Github
  git config --global user.email "$GH_USER" && \
  git config --global user.name "auto deployer"

# Attempt to use TravisCI Env Variables to set git credentials
  touch ~/.git-credentials && \
  echo "https://$GH_USER:$GH_PASS@github.com" > ~/.git-credentials

# Have built back-end worker
  echo "Deploying!" && \
  sed -i.tmp "s/\/\/ app.baseUrl = '\/your-pathname/app.baseUrl = '\/your-pathname/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp && \
  bower i && \
  gulp deploy-gh-pages && \
  sed -i.tmp "s/app.baseUrl = '\/your-pathname/\/\/ app.baseUrl = '\/your-pathname/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp
else
  npm run lint
  npm test
fi

# EOF
