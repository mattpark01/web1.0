const express = require('express');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint for Cloud Run
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy',
    workspace: process.env.WORKSPACE_ID,
    user: process.env.USER_ID
  });
});

const server = app.listen(PORT, () => {
  console.log(`Workspace server running on port ${PORT}`);
});

// WebSocket server for terminal
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  console.log('New terminal connection');
  
  // Create PTY instance
  const shell = process.env.SHELL || 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || '/home/user',
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    }
  });

  // Handle PTY output
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });

  // Handle WebSocket input
  ws.on('message', (data) => {
    ptyProcess.write(data.toString());
  });

  // Handle resize
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'resize') {
        ptyProcess.resize(data.cols, data.rows);
      }
    } catch (e) {
      // Not JSON, treat as terminal input
    }
  });

  // Clean up on disconnect
  ws.on('close', () => {
    console.log('Terminal connection closed');
    ptyProcess.kill();
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    ptyProcess.kill();
  });

  ptyProcess.onExit(() => {
    ws.close();
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});