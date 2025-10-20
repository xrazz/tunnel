# Tunnel 🚇

![Tunnel Logo](public/logo.png)

A **free, open-source** peer-to-peer file sharing application built with Next.js and WebRTC. Share files directly between devices without any server storage - completely private and fast!

## 🎯 Why I Built This

I created Tunnel because I was frustrated with existing file sharing solutions that either:
- Store your files on their servers (privacy concerns)
- Have file size limits or require accounts
- Are slow due to server bottlenecks
- Don't work well across different networks

Tunnel solves all these problems by enabling **direct device-to-device** file transfers using WebRTC technology. Your files never touch any server - they go straight from your device to the recipient's device.

## ✨ Features

### Current Features
- 🔐 **100% Private** - Files never stored on servers
- ⚡ **Lightning Fast** - Direct peer-to-peer transfers
- 🎯 **Simple** - Just share a 5-character code
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🚀 **No Registration** - No accounts or sign-ups required
- 📊 **Real-time Progress** - See transfer speed and progress
- 🔄 **Flow Control** - Handles large files efficiently
- 🎨 **Clean UI** - Minimal, professional design

### Upcoming Features 🚧
- 👥 **Multiple Users** - Support for 3+ users in one tunnel
- 📁 **Multiple Files** - Send multiple files simultaneously
- 📂 **Folder Transfer** - Send entire folders at once
- 🔗 **Permanent Links** - Create shareable tunnel links
- 📱 **Mobile App** - Native iOS/Android apps
- 🌐 **Public Tunnels** - Browse and join public file sharing rooms

## 🏗️ How It Works

```
┌─────────────────┐    WebRTC     ┌─────────────────┐
│   Device A      │◄─────────────►│   Device B      │
│                 │   Connection  │                 │
│ ┌─────────────┐ │               │ ┌─────────────┐ │
│ │   Browser   │ │               │ │   Browser   │ │
│ │             │ │               │ │             │ │
│ │ ┌─────────┐ │ │               │ │ ┌─────────┐ │ │
│ │ │Tunnel UI │ │ │               │ │ │Tunnel UI │ │ │
│ │ └─────────┘ │ │               │ │ └─────────┘ │ │
│ └─────────────┘ │               │ └─────────────┘ │
└─────────────────┘               └─────────────────┘
         │                                 │
         └───────── Socket.io ─────────────┘
                    Signaling
                    Server
```

### Architecture Overview

1. **Signaling Server** (Socket.io)
   - Helps devices find each other
   - Exchanges WebRTC connection info
   - Manages tunnel codes
   - **No file data passes through**

2. **WebRTC Connection**
   - Direct peer-to-peer connection
   - Files transfer directly between devices
   - Uses STUN servers for NAT traversal
   - Encrypted by default

3. **Data Channel**
   - Reliable file transfer
   - Chunked data transmission
   - Flow control for large files
   - Progress tracking

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/xrazz/tunnel.git
   cd tunnel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

The server will start on port 3000 and show network URLs for mobile access.

## 📖 How to Use

### Creating a Tunnel
1. Open Tunnel in your browser
2. Click **"Create Tunnel"**
3. Share the 5-character code with your friend
4. Wait for them to join
5. Start sending files!

### Joining a Tunnel
1. Open Tunnel in your browser
2. Enter the 5-character code
3. Click **"Join Tunnel"**
4. Start receiving files!

### File Transfer
- Click **"Send File"** to select a file
- Watch the progress bar and speed indicator
- Files automatically download when received
- Supports all file types

## 🌐 Network Requirements

### Same Network (WiFi)
- **Best performance** - Direct connection
- **Typical speed**: 20-50 MB/s
- **Requirements**: Both devices on same WiFi

### Different Networks
- **Good performance** - Through internet
- **Typical speed**: 5-20 MB/s
- **Requirements**: Both devices have internet

### Mobile Hotspot
- **Reliable connection** - Bypasses router restrictions
- **Typical speed**: 10-30 MB/s
- **Requirements**: One device creates hotspot, other connects

## 🔧 Technical Details

### Built With
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Signaling**: Socket.io
- **P2P**: WebRTC Data Channels
- **Font**: Inter

### Browser Support
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 80+

### File Limits
- **No size limits** - Transfer files of any size
- **Chunk size**: 16KB (optimized for WebRTC)
- **Buffer management**: Automatic flow control

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Bug Reports
- Use GitHub Issues
- Include browser version and steps to reproduce
- Attach console logs if possible

### Feature Requests
- Open a GitHub Issue with the "enhancement" label
- Describe the use case and expected behavior

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebRTC** - For enabling peer-to-peer connections
- **Socket.io** - For reliable signaling
- **Next.js** - For the amazing React framework
- **Tailwind CSS** - For beautiful, utility-first styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/xrazz/tunnel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xrazz/tunnel/discussions)
- **Email**: rajtripathi2580@gmail.com

---

**Made with ❤️ by [TinyHead Labs](https://tinyhead.space)**

*Tunnel - Because your files deserve privacy and speed.*

---

**TinyHead Labs** - A tech research lab focused on building innovative, privacy-first solutions for the modern web.