#!/bin/sh
#
# http://RobertHernandez.io/
# 
# Used to prep TravisCI Env

touch ~/.bashrc
export NVM_DIR="/home/travis/.nvm"
rm -rf "$NVM_DIR"
touch update_nvm.sh
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh > install_nvm.sh
sh "./install_nvm.sh"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
rm -f "./update_nvm.sh"
cd "$STARTDIR"
nvm use stable

# EOF
