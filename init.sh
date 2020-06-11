#!/bin/bash

cd /home/pi
curl -o nodejs.tar.gz http://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
tar -xzf nodejs.tar.gz
sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/

git clone https://github.com/swoitge/pi-413-control.git
cd pi-413-control
npm install rpio i2c-bus pigpio -save
