#!/bin/bash

# service
cat > /home/pi/glider.service << EOL
[Unit]
Description=stabilized.js - stabilized gliding
Documentation=https://github.com/swoitge/pi-413-control
After=network.target

[Service]
Environment=NODE_PORT=8080
Type=simple
User=pi
ExecStart=/usr/bin/node /home/pi/pi-413-control/main.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOL

# copy service to proper location
sudo cp /home/pi/glider.service /lib/systemd/system/

# reload
sudo systemctl daemon-reload

# autostart on boot
sudo systemctl enable glider

# start it immediately
sudo systemctl start glider
