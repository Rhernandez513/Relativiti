#!/bin/bash
#
# Used to build TravisCI Versions of Apps && GitHub Pages version
#

set -o pipefail

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]
then
  git config --global user.email "rhernandez513@gmail.com" && \
  git config --global user.name "Robert David Hernandez" && \
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
