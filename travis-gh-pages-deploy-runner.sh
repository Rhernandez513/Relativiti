#!/usr/bin/env bash
#
# http://RobertHernandez.io/
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

# Store System var before editing
  # SYS_GH_USER_NAME=git config --global user.name

# Load nvm
. ~/.nvm/nvm.sh
# source "$NVM_DIR/nvm.sh"
nvm install 5.11.0
nvm use 5.11.0

# Info that shows up on Github
  # GH_DEPLOY_BOT_NAME=$GH_DEPLOY_BOT_NAME
  # GH_EMAIL=$GH_EMAIL

  echo "Github deploy bot name is: $GH_DEPLOY_BOT_NAME"
  git config --global user.name "$GH_DEPLOY_BOT_NAME"
  git config --global user.email "$GH_EMAIL"

# Attempt to use TravisCI Env Variables to set git credentials
  touch ./.git-credentials && \
  echo "https://$GH_USER:$GH_PASS@github.com" > ./.git-credentials
  git config --global credential.helper 'cache --timeout=300'

# Having built back-end worker, build and deploy frontend to github
  echo "Deploying!" && \
  sed -i.tmp "s/\/\/app.baseUrl = '\/your-pathname/app.baseUrl = '\/Relativiti/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp && \
  # bower i  && \
  gulp deploy-gh-pages && \
  sed -i.tmp "s/app.baseUrl = '\/Relativiti/\/\/app.baseUrl = '\/your-pathname/" app/scripts/app.js && \
  rm app/scripts/app.js.tmp
  rm ./.git-credentials

# Make sure to reset env var
  # git config --global user.name "$SYS_GH_USER_NAME"
else
  npm run lint
  npm test
fi

# EOF
