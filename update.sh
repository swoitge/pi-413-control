#!/bin/bash

cd /home/pi/meteor

echo "start downloading $1"

curl --user "$1" https://jenkins.yakaranda.com/job/glider/lastSuccessfulBuild/artifact/pi-413-control/_build/pi-413-control.tar.gz --output pi-413-control.tar.gz

# extract
tar -xzf pi-413-control.tar.gz

# build fibers
cd /home/pi/meteor/bundle/programs/server/node_modules/fibers
node ./build

# add pigpio
cd /home/pi/meteor/bundle/programs/server
npm install rpio i2c-mpu6050