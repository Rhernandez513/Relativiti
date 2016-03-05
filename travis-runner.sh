#!/bin/bash
set -o pipefail

if [ "$TRAVIS_BRANCH" = "master" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]
then
  git config --global user.email "rhernandez513@gmail.com" && \
  git config --global user.name "auto deployer" && \
  echo "Deploying!" && \
  sed -i.tmp "s/\/\/ app.baseUrl = '\/your-pathname/app.baseUrl = '\/your-pathname/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp && \
  bower i && \
  gulp --cordova 'platform add android' && \
  gulp --cordova 'plugin add cordova-plugin-media' && \
  gulp --cordova 'build' && \
  gulp deploy-gh-pages && \
  sed -i.tmp "s/app.baseUrl = '\/your-pathname/\/\/ app.baseUrl = '\/your-pathname /" app/scripts/app.js && \
  rm app/scripts/app.js.tmp
else
  npm run lint
  npm test
fi
