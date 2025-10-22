# 🚇 Tunnel - Secure P2P File Sharing

A fast, secure, and private peer-to-peer file sharing application built with Next.js, WebRTC, and Socket.IO.

## ✨ Features

- 🔒 **End-to-End Encrypted** - Files are encrypted with DTLS 1.2/1.3 (same as HTTPS)
- 🚀 **Blazing Fast** - Direct peer-to-peer transfer, no server storage
- 🔐 **Private** - Files never touch the server, only signaling metadata
- 📱 **Cross-Platform** - Works on desktop, mobile, and tablets
- 🌐 **Works Across Networks** - TURN servers enable connections between different ISPs
- 💯 **100% Reliable** - Handles files of any size with automatic retry logic
- 🎯 **Simple** - No account required, just share a 5-character code

## 🏗️ Architecture

### How It Works

```
┌─────────────┐                    ┌─────────────┐
│   Sender    │                    │  Receiver   │
│             │                    │             │
│  1. Create  │◄──────────────────►│  2. Join    │
│    Tunnel   │   Socket.IO (WS)   │    Tunnel   │
│             │   Signaling Only   │             │
└─────────────┘                    └─────────────┘
       │                                  │
       │         3. WebRTC Connection    │
       │◄────────────────────────────────►│
       │         (Direct P2P)             │
       │                                  │
       │    4. File Transfer (Encrypted) │
       │══════════════════════════════════│
       │         DTLS Encryption          │
       └──────────────────────────────────┘
```

### Components

1. **Frontend (Next.js + React)**
   - WebRTC data channel management
   - Socket.IO client for signaling
   - File chunking and transfer logic
   - Progress tracking UI

2. **Backend (server.js)**
   - Socket.IO server for signaling
   - Tunnel code generation and management
   - Peer connection coordination
   - **Stateful** - maintains active tunnels in memory

3. **WebRTC**
   - STUN servers for NAT traversal
   - TURN servers for relay (when direct fails)
   - Data channels for file transfer
   - Automatic encryption (DTLS)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A server with persistent connection support (not serverless!)

### Installation

1. Clone the repository:
   ```bash
git clone https://github.com/yourusername/tunnel.git
   cd tunnel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser

### For Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The server will run on port 3000 and display network URLs for local and network access.

## 📡 Hosting Requirements

### ⚠️ **Why Serverless Hosting (Vercel, Netlify) WON'T Work**

This application **requires a persistent server** and **cannot** be hosted on serverless platforms like Vercel or Netlify. Here's why:

#### 1. **WebSocket Requirement**
```javascript
// server.js uses Socket.IO which needs WebSocket
const io = new Server(httpServer, {
  transports: ['websocket', 'polling']
});
```

**Problem with Serverless:**
- Serverless functions have **10-60 second timeout**
- WebSocket connections need to stay open **indefinitely**
- Vercel/Netlify **terminate connections** after timeout

#### 2. **Stateful Server**
```javascript
// Stores active tunnels in memory
const activeTunnels = new Map();
```

**Problem with Serverless:**
- Each request goes to a **different function instance**
- No shared memory between instances
- Tunnels would be **lost** between requests

#### 3. **Long-Running Process**
```javascript
// Socket.IO server runs continuously
io.on('connection', (socket) => {
  // Listens for events indefinitely
});
```

**Problem with Serverless:**
- Functions are **short-lived** (seconds)
- Can't maintain **persistent connections**
- Server restarts on **every request**

### ✅ **Where to Host (Recommended Platforms)**

#### 1. **VPS / Cloud Servers** (Best)

- **DigitalOcean** ($4-12/month)
  ```bash
  # Deploy to DigitalOcean Droplet
  ssh root@your-server-ip
  git clone https://github.com/yourusername/tunnel.git
  cd tunnel
  npm install
  npm run build
  npm start
  ```

- **AWS EC2** ($5-20/month)
- **Google Cloud Compute** ($5-20/month)
- **Linode** ($5-15/month)
- **Vultr** ($3.5-10/month)

**Pros:**
- ✅ Full control
- ✅ Can run Socket.IO
- ✅ Persistent connections
- ✅ Best performance

#### 2. **Platform as a Service (PaaS)**

- **Railway.app** (Free tier available)
  ```bash
  # One-click deploy
  railway up
  ```

- **Render.com** (Free tier available)
  ```bash
  # Connect GitHub repo
  # Auto-deploy on push
  ```

- **Fly.io** ($3-10/month)
  ```bash
  fly launch
  fly deploy
  ```

- **Heroku** ($7/month)

**Pros:**
- ✅ Easy deployment
- ✅ Supports WebSockets
- ✅ Auto-scaling
- ✅ Free tiers available

#### 3. **Docker/Container Hosting**

- **Docker + Any VPS**
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

- **AWS ECS**
- **Google Cloud Run** (supports WebSocket)
- **Azure Container Instances**

### 📋 **Deployment Checklist**

- [ ] Use HTTPS/SSL certificate (Let's Encrypt is free)
- [ ] Enable WebSocket support (WSS protocol)
- [ ] Configure firewall to allow port 3000 (or your chosen port)
- [ ] Set up process manager (PM2) for auto-restart
- [ ] Configure environment variables
- [ ] Set up monitoring and logging

### Example: Railway Deployment

Railway is the easiest way to deploy:

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Next.js and Socket.IO
6. Get your production URL!

## ⚡ Performance

### Transfer Speeds

| Connection Type | Expected Speed | Notes |
|----------------|---------------|-------|
| Same WiFi (LAN) | 10-50 MB/s | Direct connection |
| Same ISP | 2-5 MB/s | STUN connection |
| Different ISP | 0.5-2 MB/s | TURN relay |
| Mobile 4G | 0.3-0.5 MB/s | Limited by mobile upload |
| Mobile 5G | 2-10 MB/s | Much faster |

**Note:** Speed is limited by the **sender's upload speed**, not the code!

### Optimizations Implemented

- ✅ **128KB chunks** for large files (64KB for files >50MB)
- ✅ **2MB buffer** for sustained throughput
- ✅ **Adaptive chunking** based on file size
- ✅ **Progress updates every 300ms** (reduces CPU usage)
- ✅ **Multiple STUN/TURN servers** for better connectivity
- ✅ **Automatic retry** on buffer overflow

## 🔒 Security

### What Makes It Secure?

1. **End-to-End Encryption (DTLS)**
   - All files encrypted automatically by WebRTC
   - Uses AES-256 or similar strong ciphers
   - Keys never leave your devices

2. **No Server Storage**
   - Files transfer directly peer-to-peer
   - Server only sees connection metadata
   - No cloud storage = no cloud breaches

3. **Temporary Tunnel Codes**
   - 5-character random codes (60 million combinations)
   - Codes expire when tunnel closes
   - Hard to guess, brute-force resistant

4. **Open Source**
   - Code is auditable
   - No hidden backdoors
   - Community-reviewed

### Security Level: 9/10 ⭐

**As secure as:**
- Apple AirDrop
- Signal/WhatsApp calls
- Zoom/Google Meet

**More secure than:**
- WeTransfer (server-based)
- Email attachments (unencrypted)
- Google Drive (not E2E encrypted)

### What the Server Sees

```json
{
  "type": "signal",
  "tunnelCode": "AB3X9",
  "sdp": "v=0\r\no=- 123...",
  "candidate": { "ip": "1.2.3.4", "port": 5000 }
}
```

**Server CANNOT see:**
- ❌ File names
- ❌ File sizes
- ❌ File contents
- ❌ Any actual data

## 🛠️ Technical Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Socket.IO
- **P2P:** WebRTC Data Channels
- **UI:** Lucide React icons
- **Deployment:** Any platform with WebSocket support

## 🎯 Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## 📝 Environment Variables

No environment variables required! The app works out of the box.

Optional configuration in `server.js`:
```javascript
const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';
```

## 🐛 Troubleshooting

### Connection Issues

**"Waiting for peer to join..." stuck**
- Check if both users are connected to the internet
- Try refreshing both pages
- Verify the tunnel code is correct

**"Peer disconnected" immediately**
- Check TURN servers are accessible (usually yes)
- Try different network (WiFi vs mobile data)
- Check browser console for errors

### Slow Transfer Speed

**Desktop slow:**
- Check your upload speed at fast.com
- Close bandwidth-heavy apps (streaming, downloads)
- Use ethernet instead of WiFi for 2x speed boost

**Mobile slow:**
- Mobile upload is typically 1-5 Mbps (normal!)
- Switch to 5G if available
- Connect to WiFi for better speed
- Move closer to cell tower / router

### Large Files (>100MB)

Files of any size work, but:
- Expect longer transfer times
- Mobile may struggle with files >500MB
- Desktop handles multi-GB files fine

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the troubleshooting section above

## 🙏 Credits

- Built with Next.js and WebRTC
- Uses free TURN servers from openrelay.metered.ca
- Inspired by AirDrop and ShareDrop

---

**Made with ❤️ for secure and private file sharing**
