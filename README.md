# 🚇 Tunnel

Fast, secure, peer-to-peer file sharing. No accounts, no limits, no BS.

**Live:** https://tunnel-58wd.onrender.com/

## What is this?

Share files directly between devices. Your files never touch our servers - they go straight from you to the recipient, encrypted.

## How to use

1. Go to https://tunnel-58wd.onrender.com/
2. Click "Create Tunnel" and share the code
3. Recipient enters code and hits "Join"
4. Send files!

## Features

- **Encrypted** - All files encrypted with WebRTC (DTLS)
- **Private** - Direct peer-to-peer, no server storage
- **Fast** - Limited only by your upload speed
- **Simple** - No signup, no tracking, no data collection
- **Batch Transfer** - Send multiple files at once
- **Open Source** - Check the code yourself

## Tech Stack

- Next.js + React + TypeScript
- WebRTC for P2P connection
- Socket.IO for signaling
- Works on desktop and mobile

## Run Locally

```bash
git clone https://github.com/xrazz/tunnel.git
cd tunnel
npm install
npm run dev
```

Open http://localhost:3000

## Deploy Your Own

You need a platform that supports WebSocket (not serverless).

**Works:**
- Railway
- Render
- DigitalOcean
- Any VPS

**Doesn't work:**
- Vercel
- Netlify
- Other serverless platforms

Why? Because Socket.IO needs persistent connections and shared state.

## Known Issues

- **Same mobile hotspot won't work** - Carriers block device-to-device
- **Mobile slower than desktop** - Mobile upload speeds are typically 1-5 Mbps
- Use different networks or WiFi router instead

## Contributing

PRs welcome! Check out [CONTRIBUTING.md](CONTRIBUTING.md)

## Security

- Files encrypted end-to-end with DTLS 1.2/1.3
- Server only sees connection metadata, never file contents
- 5-character random tunnel codes (60M combinations)
- Codes expire when tunnel closes

## Contact

Questions or issues? Open an issue on [GitHub](https://github.com/xrazz/tunnel) or email: **rajtripathi2580@gmail.com**

## License

MIT

---

**Made with ❤️ for simple file sharing**
