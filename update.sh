#!/bin/bash

cd /home/pi/meteor

echo "start downloading $1"

curl --user "$1" https://jenkins.yakaranda.com/job/live-view/lastSuccessfulBuild/artifact/_build/live-view.tar.gz --output live-view.tar.gz

# extract
tar -xzf live-view.tar.gz

# build fibers
cd /home/pi/meteor/bundle/programs/server/node_modules/fibers
node ./build

# add pigpio
cd /home/pi/meteor/bundle/programs/server
npm install rpio i2c-mpu6050
