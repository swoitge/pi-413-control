#!/bin/bash

curl -o nodejs.tar.gz http://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
tar -xzf nodejs.tar.gz
sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/
