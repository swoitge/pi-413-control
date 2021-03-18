#!/bin/bash

# install git
sudo apt-get update && sudo apt-get install -y git

# enable i2c module.
sudo raspi-config nonint do_i2c 0

# node install - unofficial
cd /home/pi
NODE_VERSION=v12.18.3
wget https://unofficial-builds.nodejs.org/download/release/${NODE_VERSION}/node-${NODE_VERSION}-linux-armv6l.tar.gz
tar -xzf node-${NODE_VERSION}-linux-armv6l.tar.gz
cd node-${NODE_VERSION}-linux-armv6l
sudo cp -R * /usr/local

# enable shutdown without password
sudo cat > /etc/sudoers.d/pi-extension << EOL
# pi user can shutdown and reboot
pi ALL=(ALL) NOPASSWD: /sbin/poweroff, /sbin/reboot, /sbin/shutdown
EOL

#official node arm6 v9
#curl -o nodejs.tar.gz https://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
#tar --skip-old-files -xzf nodejs.tar.gz
#sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/

# install control software
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

git clone https://github.com/swoitge/pi-413-control.git
cd pi-413-control

npm install rpio i2c-bus

# service
sudo cat > /home/pi/glider.service << EOL
[Unit]
Description=stabilized.js - stabilized gliding
Documentation=https://github.com/swoitge/pi-413-control
After=network.target

[Service]
Environment=PORT=8080
Environment=ROOT_URL=http://localhost:8080
Environment=MONGO_URL="$1"
Type=simple
User=root
WorkingDirectory=/home/pi/meteor/bundle
ExecStart=/usr/local/bin/node /home/pi/meteor/bundle/main.js
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
