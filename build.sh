#!/bin/sh

# Install "Client side" gulp shell
npm i gulp

# "Client side" gulp used to build Android APKs via cordova
gulp --cordova 'build'

#EOF
