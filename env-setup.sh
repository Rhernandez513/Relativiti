#!/bin/sh

# "Server side" gulp & bower
npm install -g gulp bower && \
# "App Backend" modules
npm install && \
# "App Backend" frontend modules
bower install

# EOF
