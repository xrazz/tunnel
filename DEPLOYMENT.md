# Deployment Guide

How to deploy your own instance of Tunnel.

## Why Not Vercel/Netlify?

Tunnel needs:
- **WebSocket connections** (stay open indefinitely)
- **Stateful server** (shared memory for active tunnels)
- **Long-running process** (Socket.IO server)

Serverless platforms provide:
- ❌ 10-60 second timeouts
- ❌ New instance per request (no shared state)
- ❌ Can't run continuously

**Result:** Won't work on serverless!

## Where to Deploy

### Railway.app (Easiest - Recommended)

**Cost:** Free tier, then $5/month

**Steps:**
1. Push code to GitHub
2. Go to https://railway.app
3. "New Project" → "Deploy from GitHub"
4. Select your repo
5. Done!

**Pros:**
- One-click deploy
- Free tier
- Auto HTTPS
- WebSocket support

### Render.com

**Cost:** Free tier available

**Steps:**
1. Go to https://render.com
2. "New +" → "Web Service"
3. Connect GitHub repo
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Deploy!

### VPS (Full Control)

**Cost:** $4-12/month (DigitalOcean, Linode, Vultr)

**Ubuntu Setup:**
```bash
# SSH into server
ssh root@your-server-ip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/xrazz/tunnel.git
cd tunnel

# Install dependencies
npm install
npm run build

# Install PM2
sudo npm install -g pm2

# Start server
pm2 start npm --name "tunnel" -- start

# Auto-start on boot
pm2 save
pm2 startup
```

**Add HTTPS (Optional):**
```bash
# Install NGINX
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Deploy:**
```bash
docker build -t tunnel .
docker run -p 3000:3000 tunnel
```

## Platform Comparison

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| Railway | ⭐ Easy | Free/$5 | Beginners |
| Render | ⭐ Easy | Free/$7 | Quick start |
| VPS | ⭐⭐⭐ Hard | $4-12 | Full control |
| Docker | ⭐⭐⭐ Hard | Varies | DevOps |

## Security

1. **Use HTTPS** - Railway/Render do this automatically
2. **Set env vars** - `NODE_ENV=production`
3. **Keep updated** - `npm update`

## Troubleshooting

**Connection refused:**
- Check if server is running
- Check firewall allows port 3000

**WebSocket failed:**
- Ensure HTTPS is enabled
- Check Socket.IO transports

**App crashes:**
- Check logs: `pm2 logs`
- Ensure Node.js 18+ installed

## Need Help?

Open an issue on [GitHub](https://github.com/xrazz/tunnel) or email rajtripathi2580@gmail.com
