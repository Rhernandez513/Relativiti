#!/bin/sh

npm update @npm -g latest
# "Server side" gulp & bower
npm install -g gulp bower && \
# "App Backend" backend-modules
## Install "Client side" modules
npm install && \
# "App Backend" frontend-modules
# # Install "Client side bower"
bower install --allow-root

# "Client side" build Android APKs via cordova
## Android SDK Location so Cordova can see it

export ANDROID_HOME=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platforms-tools

GH_USER="$GH_USER"
GH_PASS="$GH_PASSWORD"

# Git Credentials
touch ~/.git-credentials && \
echo "https://$GH_USER:$GH_PASS@github.com" > ~/.git-credentials

# Running this in dev sets owner to sudo
# Should be a developer sanity test
# Should not be needed in prod
# chown -R $(whoami):$GROUP .

gulp
gulp --cordova 'platform add android'
gulp --cordova 'plugin add cordova-plugin-media'
gulp --cordova 'build'

# Deploy!
gulp deploy-gh-pages

# Cleanup
rm ~/.git-credentials

# EOF

