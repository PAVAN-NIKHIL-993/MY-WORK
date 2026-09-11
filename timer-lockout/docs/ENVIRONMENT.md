# Environment Documentation

This document specifies the supported environments and requirements for the Timer Lockout Application.

---

## 🖥️ Supported Operating Systems

The Timer Lockout Application is designed to work on the following operating systems:

| OS | Version | Support Level | Notes |
|----|---------|---------------|-------|
| **Windows** | 10 (64-bit) | ✅ Full Support | Tested on Windows 10/11 |
| **Windows** | 11 (64-bit) | ✅ Full Support | Tested on Windows 10/11 |
| **macOS** | 10.15 (Catalina) | ✅ Full Support | Tested on macOS 10.15+ |
| **macOS** | 11 (Big Sur) | ✅ Full Support | Tested on macOS 10.15+ |
| **macOS** | 12 (Monterey) | ✅ Full Support | Tested on macOS 10.15+ |
| **macOS** | 13 (Ventura) | ✅ Full Support | Tested on macOS 10.15+ |
| **macOS** | 14 (Sonoma) | ✅ Full Support | Tested on macOS 10.15+ |
| **Linux** | Ubuntu 20.04+ | ✅ Full Support | Tested on Ubuntu 20.04/22.04 |
| **Linux** | Debian 10+ | ✅ Full Support | Tested on Debian 10/11 |
| **Linux** | Fedora 36+ | ✅ Full Support | Tested on Fedora 36+ |
| **Linux** | CentOS 8+ | ✅ Full Support | Tested on CentOS 8 |
| **Linux** | Arch Linux | ✅ Full Support | Rolling release |

---

## 💻 Runtime Requirements

### Node.js

| Version | Support | Notes |
|---------|---------|-------|
| **18.x** | ✅ Recommended | Long-Term Support (LTS) |
| **20.x** | ✅ Supported | Current LTS |
| **22.x** | ✅ Supported | Latest stable |
| **16.x** | ⚠️ Limited | May work but not officially supported |
| **< 16.x** | ❌ Not Supported | Will not work |

**Verification**:
```bash
node --version
# Should output: v18.x.x, v20.x.x, or v22.x.x
```

**Installation**:
- **Windows/macOS**: Download from [nodejs.org](https://nodejs.org/)
- **Linux**: Use NodeSource or package manager

---

### npm

| Version | Support | Notes |
|---------|---------|-------|
| **9.x** | ✅ Recommended | Works with Node.js 18+ |
| **10.x** | ✅ Supported | Latest stable |
| **8.x** | ⚠️ Limited | May work but not recommended |
| **< 8.x** | ❌ Not Supported | Will not work |

**Verification**:
```bash
npm --version
# Should output: 9.x.x or 10.x.x
```

**Alternative**: yarn 1.22+ can be used instead of npm

---

### Git

| Version | Support | Notes |
|---------|---------|-------|
| **2.x** | ✅ Supported | Any recent version |
| **1.x** | ⚠️ Limited | Older versions may have issues |

**Verification**:
```bash
git --version
# Should output: 2.x.x or higher
```

---

## 🌐 Browser Requirements

The Timer Lockout Application is a **client-side web application** that runs in the browser. The following browsers are officially supported:

### Desktop Browsers

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| **Chrome** | Latest 2 versions | ✅ Full Support | Primary target |
| **Firefox** | Latest 2 versions | ✅ Full Support | Full feature support |
| **Safari** | Latest 2 versions | ✅ Full Support | macOS and iOS |
| **Edge** | Latest 2 versions | ✅ Full Support | Chromium-based |
| **Opera** | Latest 2 versions | ✅ Full Support | Chromium-based |
| **Brave** | Latest 2 versions | ✅ Full Support | Chromium-based |

### Mobile Browsers

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| **Chrome for Android** | Latest 2 versions | ✅ Full Support | Primary mobile target |
| **Safari for iOS** | Latest 2 versions | ✅ Full Support | iPhone and iPad |
| **Samsung Internet** | Latest 2 versions | ✅ Full Support | Android |
| **Firefox for Android** | Latest 2 versions | ✅ Full Support | Android |

### Browser Feature Requirements

The application requires the following browser features:

| Feature | Required | Notes |
|---------|----------|-------|
| **ES2020 Support** | ✅ Yes | JavaScript features |
| **CSS Grid** | ✅ Yes | Layout |
| **CSS Flexbox** | ✅ Yes | Layout |
| **CSS Custom Properties** | ✅ Yes | Tailwind CSS |
| **Fetch API** | ❌ No | Not used |
| **Web Components** | ❌ No | Not used |
| **Service Workers** | ❌ No | Not used |

---

## 📦 Development Environment

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|-------------|
| **Node.js** | 18+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Package manager | Included with Node.js |
| **Git** | 2+ | Version control | [git-scm.com](https://git-scm.com/) |
| **Code Editor** | Any | Development | VS Code recommended |

### Recommended Tools

| Tool | Purpose | Installation |
|------|---------|-------------|
| **Visual Studio Code** | Code editor | [code.visualstudio.com](https://code.visualstudio.com/) |
| **ESLint Extension** | Linting | VS Code Marketplace |
| **Prettier Extension** | Formatting | VS Code Marketplace |
| **TypeScript Extension** | TypeScript support | VS Code Marketplace |
| **Tailwind CSS IntelliSense** | Tailwind support | VS Code Marketplace |

### VS Code Settings

Recommended workspace settings for optimal development:

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  
  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  
  // ESLint
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.alwaysShowStatus": true,
  
  // Prettier
  "prettier.semi": true,
  "prettier.singleQuote": true,
  "prettier.printWidth": 100,
  
  // Files
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  
  // Git
  "git.autofetch": true,
  "git.confirmSync": false
}
```

---

## 🏭 Production Environment

### Production Requirements

| Requirement | Details |
|-------------|---------|
| **Static Hosting** | Any static file hosting |
| **Node.js** | Not required for production |
| **npm** | Not required for production |
| **Server** | Any HTTP server (Nginx, Apache, etc.) |
| **Port** | Configurable (default: 80 for HTTP) |

### Production Server Options

| Server | Configuration | Notes |
|--------|---------------|-------|
| **Nginx** | `nginx.conf` included | Recommended |
| **Apache** | Custom configuration | Requires setup |
| **Vercel** | Zero configuration | Recommended |
| **Netlify** | Zero configuration | Recommended |
| **GitHub Pages** | Custom configuration | Works well |
| **AWS S3** | Static website hosting | Works well |
| **Cloudflare Pages** | Zero configuration | Recommended |

### Production Build Requirements

| Requirement | Details |
|-------------|---------|
| **Node.js** | 18+ (for building only) |
| **npm** | 9+ (for building only) |
| **Disk Space** | ~500 MB for dependencies |
| **Memory** | ~2 GB for build process |

---

## 🔧 Development vs Production

### Development Environment

| Aspect | Development | Production |
|--------|-------------|------------|
| **Source Maps** | ✅ Yes | ❌ No (configurable) |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Minification** | ❌ No | ✅ Yes |
| **Tree Shaking** | ❌ No | ✅ Yes |
| **Optimization** | ❌ Minimal | ✅ Full |
| **Console Logs** | ✅ Visible | ❌ Removed |
| **Error Details** | ✅ Full | ⚠️ Limited |

### Environment Detection

The application can detect the current environment:

```typescript
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const mode = import.meta.env.MODE; // 'development' or 'production'
```

---

## 📊 Environment Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Debug Info** | ✅ Full | ⚠️ Limited | ❌ None |
| **Error Details** | ✅ Full | ✅ Full | ⚠️ Limited |
| **Logging** | ✅ Verbose | ✅ Standard | ⚠️ Minimal |
| **Source Maps** | ✅ Yes | ⚠️ Optional | ❌ No |
| **Optimization** | ❌ Minimal | ✅ Full | ✅ Full |
| **Caching** | ❌ Disabled | ✅ Enabled | ✅ Enabled |

---

## 🛠️ Environment Setup Checklist

### For Development

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`.env`)
- [ ] IDE configured
- [ ] Extensions installed

### For Production

- [ ] Static hosting configured
- [ ] Build completed (`npm run build`)
- [ ] Build artifacts in `dist/` directory
- [ ] Server configured (Nginx, Apache, etc.)
- [ ] Environment variables set (if any)
- [ ] SSL certificate configured (recommended)
- [ ] Domain configured

---

## 🔍 Environment Verification

### Verify Development Environment

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check if all dependencies are installed
ls node_modules/react/package.json

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Start development server
npm run dev
```

### Verify Production Build

```bash
# Build for production
npm run build

# Check build output
ls -la dist/
ls -la dist/assets/

# Verify build size
du -sh dist/

# Preview production build
npm run preview
```

---

## 📚 Related Documentation

- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
- [SETUP.md](./SETUP.md) - Setup instructions
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Dependency documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [BUILD.md](./BUILD.md) - Build process
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
