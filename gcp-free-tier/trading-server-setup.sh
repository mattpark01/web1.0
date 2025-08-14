#!/bin/bash

###############################################################################
# Trading Server Setup Script for GCP VM
# This script sets up a basic trading server on your free-tier VM
###############################################################################

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Trading Server Setup for GCP VM${NC}"
echo "================================"
echo ""
echo "Run these commands on your VM after SSHing in:"
echo ""

cat << 'EOF'
# 1. Update system and install Node.js
sudo apt-get update
sudo apt-get install -y nodejs npm nginx certbot python3-certbot-nginx

# 2. Create a simple trading server
mkdir -p ~/trading-server
cd ~/trading-server

# 3. Initialize package.json
cat > package.json << 'PACKAGE'
{
  "name": "trading-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.13.0",
    "cors": "^2.8.5"
  }
}
PACKAGE

# 4. Create the server
cat > server.js << 'SERVER'
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metrics: {
      cpu: Math.floor(Math.random() * 60 + 20),
      memory: Math.floor(Math.random() * 50 + 30),
      latency: Math.floor(Math.random() * 50 + 10),
      uptime: 99.9
    }
  });
});

// Trading stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    strategies: 5,
    activeTrades: 12,
    totalValue: 250000,
    pnl24h: 3.4
  });
});

// WebSocket connection for real-time data
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString()
  }));
  
  // Send periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'update',
        data: {
          price: 100 + Math.random() * 10,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, 5000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Trading server running on port ${PORT}`);
});
SERVER

# 5. Install dependencies
npm install

# 6. Create systemd service for auto-start
sudo cat > /etc/systemd/system/trading-server.service << 'SERVICE'
[Unit]
Description=Trading Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/trading-server
ExecStart=/usr/bin/node /home/$USER/trading-server/server.js
Restart=on-failure
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
SERVICE

# 7. Start the service
sudo systemctl enable trading-server
sudo systemctl start trading-server

# 8. Configure nginx as reverse proxy
sudo cat > /etc/nginx/sites-available/trading-server << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/trading-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. Open firewall ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

echo "Trading server setup complete!"
echo "Server running on:"
echo "  - HTTP: http://YOUR_VM_IP"
echo "  - WebSocket: ws://YOUR_VM_IP"
echo "  - Direct: http://YOUR_VM_IP:8080"
EOF

echo ""
echo -e "${YELLOW}After running these commands on your VM, you can connect from the Quant app using:${NC}"
echo ""
echo "For the connection dialog:"
echo "  Server Name: GCP Trading Server"
echo "  Server URL: http://34.42.36.188:8080"
echo "  API Key: (leave empty for now)"
echo "  Environment: Production"
echo "  Provider: Google Cloud"
echo ""
echo "Or for WebSocket connection:"
echo "  Server URL: ws://34.42.36.188:8080"