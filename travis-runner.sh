#!/bin/bash
#
# Used to build TravisCI Versions of Apps && GitHub Pages version
#
# Should run only on dev environments  && TravisCI
#

# Env should be built
# This is Deploy Script

set -o pipefail

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]
then

# Info that shows up on Github
  # git config --global user.email "$GH_USER" && \
  # git config --global user.name "auto deployer"

# Attempt to use TravisCI Env Variables to set git credentials
  # touch ~/.git-credentials && \
  # echo "https://$GH_USER:$GH_PASS@github.com" > ~/.git-credentials

# Having built back-end worker, build and deploy frontend to github
  echo "Deploying!" && \
  sed -i.tmp "s/\/\/app.baseUrl = '\/your-pathname/app.baseUrl = '\/Sheet-Music-App/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp && \
  bower i && \
  gulp deploy-gh-pages && \
  sed -i.tmp "s/app.baseUrl = '\/Sheet-Music-App/\/\/ app.baseUrl = '\/your-pathname/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp
else
  npm run lint
  npm test
fi

# EOF
