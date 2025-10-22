# 🚀 Deployment Guide

This guide explains how to deploy Tunnel to various hosting platforms.

## 🚫 Why NOT Vercel, Netlify, or Other Serverless Platforms?

### The Problem with Serverless

Tunnel requires:
1. **WebSocket connections** that stay open indefinitely
2. **Stateful server** with shared memory (`Map` for active tunnels)
3. **Long-running process** for Socket.IO server

Serverless platforms provide:
1. ❌ **10-60 second timeouts** (kills WebSocket)
2. ❌ **New instance per request** (no shared state)
3. ❌ **Ephemeral functions** (can't run continuously)

**Result:** The signaling server won't work, peers can't connect!

---

## ✅ Recommended Hosting Options

### 1. Railway.app (Easiest - Recommended for Beginners)

**Cost:** Free tier available, then $5/month

**Steps:**
1. Push your code to GitHub
2. Go to https://railway.app
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway auto-detects Next.js + Socket.IO
7. Click "Deploy"
8. Get your production URL!

**Pros:**
- ✅ One-click deployment
- ✅ Free tier (500 hours/month)
- ✅ Auto-deploy on git push
- ✅ Built-in HTTPS
- ✅ WebSocket support

**Configuration:**
Railway auto-detects `package.json` scripts. No config needed!

---

### 2. Render.com

**Cost:** Free tier available

**Steps:**
1. Push code to GitHub
2. Go to https://render.com
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free or Starter
6. Click "Create Web Service"

**Pros:**
- ✅ Free tier available
- ✅ Easy deployment
- ✅ Auto-scaling
- ✅ WebSocket support

**render.yaml** (optional):
```yaml
services:
  - type: web
    name: tunnel
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

### 3. DigitalOcean App Platform

**Cost:** $5/month

**Steps:**
1. Push code to GitHub
2. Go to https://cloud.digitalocean.com
3. Click "Create" → "App"
4. Choose GitHub and select your repo
5. DigitalOcean auto-detects settings
6. Click "Deploy"

**Pros:**
- ✅ Reliable infrastructure
- ✅ Good performance
- ✅ Easy scaling
- ✅ $5/month is affordable

---

### 4. VPS (DigitalOcean Droplet, AWS EC2, Linode)

**Cost:** $4-12/month

**Best for:** Full control, best performance

#### Setup on Ubuntu 22.04

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Git
sudo apt-get install -y git

# 4. Clone your repository
git clone https://github.com/xrazz/tunnel.git
cd tunnel

# 5. Install dependencies
npm install

# 6. Build the application
npm run build

# 7. Install PM2 (process manager)
sudo npm install -g pm2

# 8. Start with PM2
pm2 start npm --name "tunnel" -- start

# 9. Save PM2 configuration
pm2 save

# 10. Set PM2 to start on boot
pm2 startup
```

#### Setup NGINX Reverse Proxy (Optional - for HTTPS)

```bash
# Install NGINX
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Create NGINX config
sudo nano /etc/nginx/sites-available/tunnel
```

```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tunnel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

**Pros:**
- ✅ Full control
- ✅ Best performance
- ✅ Custom domain easy
- ✅ Can run other services

**Cons:**
- ❌ Requires server management
- ❌ Manual updates
- ❌ More complex setup

---

### 5. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  tunnel:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 🔒 Security Best Practices

### 1. Enable HTTPS

**Why:** Encrypts signaling data (WebRTC already encrypts files)

**How:**
- Railway/Render: Automatic HTTPS ✅
- VPS: Use Certbot + Let's Encrypt (free)

### 2. Set Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
```

### 3. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your app port
sudo ufw allow 3000

# Enable firewall
sudo ufw enable
```

### 4. Keep Dependencies Updated

```bash
npm audit
npm audit fix
npm update
```

---

## 📊 Monitoring

### Railway/Render
- Built-in metrics and logs
- Check dashboard for errors

### VPS with PM2
```bash
# View logs
pm2 logs tunnel

# Monitor
pm2 monit

# Restart if needed
pm2 restart tunnel
```

### Health Check Endpoint

Add to `server.js`:
```javascript
httpServer.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    tunnels: activeTunnels.size 
  });
});
```

---

## 🐛 Common Issues

### "Connection Refused"
- ✅ Check if server is running: `pm2 status`
- ✅ Check firewall allows port 3000
- ✅ Verify NGINX proxy is configured

### "WebSocket connection failed"
- ✅ Ensure HTTPS is enabled
- ✅ Check NGINX WebSocket headers
- ✅ Verify Socket.IO transports

### "Application crashes"
- ✅ Check logs: `pm2 logs`
- ✅ Ensure Node.js 18+ is installed
- ✅ Run `npm install` again

---

## 💡 Tips

1. **Use a custom domain** for better branding
2. **Enable auto-deploy** on git push
3. **Set up monitoring** (UptimeRobot, Pingdom)
4. **Regular backups** (not needed, stateless app!)
5. **CDN** not needed (it's P2P!)

---

## 📝 Summary

| Platform | Cost | Difficulty | Best For |
|----------|------|------------|----------|
| Railway | Free/$5 | ⭐ Easy | Beginners |
| Render | Free/$7 | ⭐ Easy | Small projects |
| DigitalOcean | $5 | ⭐⭐ Medium | Reliability |
| VPS | $4-12 | ⭐⭐⭐ Hard | Full control |
| Docker | $0+ | ⭐⭐⭐ Hard | DevOps |

**Recommendation:** Start with Railway for ease, move to VPS for control.

---

**Need help? Open an issue on [GitHub](https://github.com/xrazz/tunnel) or email rajtripathi2580@gmail.com** 🚀

