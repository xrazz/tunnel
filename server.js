const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const activeTunnels = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-tunnel', (callback) => {
      const code = generateCode();
      activeTunnels.set(code, { creator: socket.id, joiner: null });
      socket.join(code);
      console.log('Tunnel created:', code);
      callback({ code });
    });

    socket.on('join-tunnel', ({ code }, callback) => {
      const tunnel = activeTunnels.get(code);
      if (!tunnel) {
        callback({ success: false, error: 'Tunnel not found' });
        return;
      }
      if (tunnel.joiner) {
        callback({ success: false, error: 'Tunnel already full' });
        return;
      }
      
      tunnel.joiner = socket.id;
      socket.join(code);
      
      socket.to(code).emit('peer-joined', { peerId: socket.id });
      callback({ success: true, peerId: tunnel.creator });
    });

    socket.on('signal', ({ code, signal, to }) => {
      socket.to(to).emit('signal', { signal, from: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      for (const [code, tunnel] of activeTunnels.entries()) {
        if (tunnel.creator === socket.id || tunnel.joiner === socket.id) {
          socket.to(code).emit('peer-disconnected');
          activeTunnels.delete(code);
        }
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, '0.0.0.0', () => {
      const networkInterfaces = require('os').networkInterfaces();
      const addresses = [];
      
      for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }
      
      console.log(`\n> Ready on:`);
      console.log(`  - Local:    http://localhost:${port}`);
      addresses.forEach(addr => {
        console.log(`  - Network:  http://${addr}:${port}`);
      });
      console.log(`\n> Use the Network URL on your mobile device\n`);
    });
});

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (activeTunnels.has(code)) {
    return generateCode();
  }
  return code;
}
