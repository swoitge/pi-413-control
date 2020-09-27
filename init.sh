#!/bin/bash

# install git
sudo apt-get update && sudo apt-get install -y git

# enable i2c module.
sudo raspi-config nonint do_i2c 0

# npm install
cd /home/pi
curl -o nodejs.tar.gz https://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
tar --skip-old-files -xzf nodejs.tar.gz
sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/

# install control software
git clone https://github.com/swoitge/pi-413-control.git
cd pi-413-control

npm install rpio i2c-bus mpu6050-gyro

# service
sudo cat > /home/pi/glider.service << EOL
[Unit]
Description=stabilized.js - stabilized gliding
Documentation=https://github.com/swoitge/pi-413-control
After=network.target

[Service]
Environment=NODE_PORT=8080
Type=simple
User=root
ExecStart=/usr/bin/node /home/pi/pi-413-control/main.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOL

sudo cp /home/pi/glider.service /lib/systemd/system/

# reload
sudo systemctl daemon-reload

# autostart on boot
sudo systemctl enable glider

# start it immediately
sudo systemctl start glider
