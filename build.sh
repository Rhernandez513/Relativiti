#!/bin/sh

source env_setup.sh

# Install "Client side" gulp shell
npm i gulp
# Install "Client side bower"
# npm i bower
bower install

# "Client side" gulp used to build Android APKs via cordova
gulp --cordova 'build'

gulp deploy-gh-pages

#EOF
