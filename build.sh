#!/bin/sh

# "Server side" gulp & bower
# npm install -g gulp bower && \
# "App Backend" modules
npm install && \
# "App Backend" frontend modules
# bower install

# Install "Client side" gulp shell
npm i gulp
# Install "Client side bower"
npm i bower
bower install

# "Client side" gulp used to build Android APKs via cordova
sudo gulp --cordova 'platform add android'
sudo gulp --cordova 'plugin add cordova-plugin-media'
sudo chown -R $USER .
gulp --cordova 'build'

# This is in travis runner so I suspect this one is a duplicate

# gulp deploy-gh-pages

#EOF
