#!/bin/bash
#
# # Used to build "master branch" dev environment
#
# # Runs on TracvisCI Docker build
#

npm install
bower install
gulp
gulp --cordova 'platform add android'
gulp --cordova 'plugin add cordova-plugin-media'
gulp --cordova 'build'

# EOF
