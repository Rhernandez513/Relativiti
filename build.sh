#!/bin/sh

# "Server side" gulp & bower
# npm install -g gulp bower && \
# "App Backend" modules
# npm install && \
# "App Backend" frontend modules
# bower install

# Install "Client side" gulp shell
npm i gulp
# # Install "Client side bower"
npm i bower
bower install --allow-root

# "Client side" gulp used to build Android APKs via cordova
## Android SDK Location so Cordova can see it
ANDROID_HOME=$ANDROID_HOME
PATH=$PATH:$ANDROID_HOME
# export $PATH
# export $ANDROID_HOME

gulp --cordova 'platform add android'
gulp --cordova 'plugin add cordova-plugin-media'
chown -R $USER:$GROUP .
gulp --cordova 'build'

# This is in travis runner so I suspect this one is a duplicate

# gulp deploy-gh-pages

#EOF
