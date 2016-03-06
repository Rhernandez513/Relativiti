#!/bin/bash
#
# Used to build TravisCI Versions of Apps && GitHub Pages version
#
# Should run only on dev environments  && TravisCI
#

set -o pipefail

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]
then
  git config --global user.email "Rhernandez513@gmail.com" && \
  git config --global user.name "auto deployer" && \
  echo "github password is: $pass" && \
  git config --global user.password "$pass" && \
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
