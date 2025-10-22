# 🤝 Contributing to Tunnel

Thank you for your interest in contributing! This document provides guidelines for contributing to Tunnel.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/tunnel.git
   cd tunnel
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

Examples:
```
feat: add multiple file selection
fix: resolve buffer overflow on large files
docs: update README with deployment guide
```

### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

5. Wait for review and address feedback

## 🎯 Areas for Contribution

### High Priority

- [ ] Multiple file selection and batch transfer
- [ ] File compression before transfer
- [ ] Resume interrupted transfers
- [ ] QR code for easy mobile sharing
- [ ] Transfer history

### Medium Priority

- [ ] Dark mode
- [ ] Custom tunnel code
- [ ] Password-protected tunnels
- [ ] Transfer expiration time
- [ ] File preview before download

### Nice to Have

- [ ] Video/audio streaming
- [ ] Text messaging
- [ ] Screen sharing
- [ ] Voice/video calls
- [ ] Mobile app (React Native)

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description** of the issue
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Browser/OS** information
7. **Console errors** (F12 → Console)

Example:
```
**Bug:** Connection stuck on "Waiting for peer"

**Steps:**
1. User A creates tunnel
2. User B joins with code
3. Connection stuck for User B

**Expected:** Should show "Connected"
**Actual:** Shows "Waiting for peer to join..."

**Browser:** Chrome 120, Windows 11
**Console:** [Error logs here]
```

## ✨ Feature Requests

For feature requests, include:

1. **Problem** you're trying to solve
2. **Proposed solution**
3. **Alternatives considered**
4. **Use case** examples

## 🔍 Code Review Checklist

Before submitting PR:

- [ ] Code follows project style
- [ ] No console errors
- [ ] Works on desktop and mobile
- [ ] Tested with different file sizes
- [ ] Tested across networks (different ISPs)
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or clearly documented)

## 💡 Tips

1. **Test thoroughly** - especially on mobile and different networks
2. **Keep PRs focused** - one feature/fix per PR
3. **Update docs** - if adding features
4. **Ask questions** - open an issue for discussion first
5. **Be patient** - reviews may take time

## 📚 Resources

### WebRTC
- [WebRTC Docs](https://webrtc.org/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Socket.IO
- [Socket.IO Docs](https://socket.io/docs/v4/)

### Next.js
- [Next.js Docs](https://nextjs.org/docs)

## 🙏 Thank You!

Every contribution helps make Tunnel better for everyone. Thank you for your time and effort!

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

