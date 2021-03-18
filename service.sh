#!/bin/bash

# service
cat > /home/pi/glider.service << EOL
[Unit]
Description=stabilized.js - stabilized gliding
Documentation=https://github.com/swoitge/pi-413-control
After=network.target

[Service]
Environment=PORT=8080
Environment=ROOT_URL=http://localhost:8080
Environment=MONGO_URL="${1}"
Type=simple
User=root
WorkingDirectory=/home/pi/meteor/bundle
ExecStart=/usr/local/bin/node /home/pi/meteor/bundle/main.js
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
