# Setup Guide

This document provides step-by-step instructions for setting up the Timer Lockout Application development environment.

---

## 📋 Prerequisites

Before you begin, ensure your system meets the following requirements:

### Operating System

| OS | Support | Notes |
|----|---------|-------|
| **Windows** | ✅ Supported | 10/11 (64-bit) |
| **macOS** | ✅ Supported | 10.15+ (Catalina or later) |
| **Linux** | ✅ Supported | Most modern distributions |

### Software Requirements

| Software | Version | Purpose | Verification Command |
|---------|---------|---------|---------------------|
| **Node.js** | 18.x or higher | JavaScript runtime | `node --version` |
| **npm** | 9.x or higher | Package manager | `npm --version` |
| **Git** | Any recent version | Version control | `git --version` |

### Hardware Requirements

| Resource | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| **CPU** | 2 cores | 4+ cores | Faster builds |
| **RAM** | 4 GB | 8+ GB | Better for development |
| **Disk** | 500 MB | 1+ GB | For dependencies |
| **Network** | Any | Broadband | For npm packages |

---

## 🚀 Quick Start

For experienced developers who want to get started quickly:

```bash
# 1. Navigate to the project directory
cd timer-lockout

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Application will automatically open at http://localhost:5173
```

---

## 📦 Detailed Setup Instructions

### Step 1: Clone the Repository

If you haven't already cloned the repository:

```bash
# Clone the repository
git clone https://github.com/PAVAN-NIKHIL-993/MY-WORK.git

# Navigate to the project
cd MY-WORK/timer-lockout
```

If you're already in the repository:

```bash
# Navigate to the timer-lockout directory
cd timer-lockout
```

### Step 2: Verify Prerequisites

Check that all required software is installed:

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check Git version
git --version
# Should output a version number
```

If any prerequisites are missing:

#### Installing Node.js and npm

**Windows/macOS**:
- Download from [Node.js official website](https://nodejs.org/)
- Choose the LTS version (18.x or higher)
- npm is included with Node.js

**Linux (Ubuntu/Debian)**:
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (Fedora/RHEL)**:
```bash
# Using NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

#### Installing Git

**Windows**: Download from [Git official website](https://git-scm.com/)

**macOS**:
```bash
# Using Homebrew
brew install git
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install git
```

**Linux (Fedora/RHEL)**:
```bash
sudo dnf install git
```

### Step 3: Install Dependencies

From the `timer-lockout` directory, install all project dependencies:

```bash
# Install all dependencies (production + development)
npm install
```

This command will:
1. Read `package.json` to identify dependencies
2. Download and install all packages to `node_modules/`
3. Create/update `package-lock.json` with exact versions
4. Verify installation

**Expected Output**:
```
added XXX packages in YYs

XXX packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Note**: If you see warnings about deprecated packages or vulnerabilities, these are typically in transitive dependencies and don't affect the application directly.

### Step 4: Verify Installation

After installation, verify everything is working:

```bash
# Check that all dependencies are installed
ls node_modules | head -20
# Should list many packages including react, typescript, vite, etc.

# Check package.json scripts
npm run
# Should list all available scripts
```

---

## 🔍 Post-Setup Verification

### Verify Development Environment

```bash
# Run type checking
npm run type-check
# Should complete with no errors

# Run linting
npm run lint
# Should complete with no errors

# Run tests
npm run test
# Should pass all 90 tests

# Start development server
npm run dev
# Should start server and open browser
```

### Verify Project Structure

The project should have the following structure:

```
timer-lockout/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ...
│   ├── hooks/
│   │   └── useTimer.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatTime.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── public/
│   └── favicon.svg
├── docs/
│   └── ...
├── package.json
├── vite.config.ts
└── ...
```

---

## 🛠️ Development Environment Setup

### IDE/Editor Setup

#### Visual Studio Code (Recommended)

1. **Install VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/)

2. **Recommended Extensions**:
   - **ESLint** - For linting support
   - **Prettier** - For code formatting
   - **TypeScript** - For TypeScript support
   - **Tailwind CSS IntelliSense** - For Tailwind CSS support
   - **Reactjs** - For React support

3. **Workspace Settings**:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "eslint.validate": ["typescript", "typescriptreact"],
     "typescript.tsdk": "node_modules/typescript/lib"
   }
   ```

#### Other Editors

**WebStorm/IntelliJ**:
- Built-in support for TypeScript, ESLint, Prettier
- Install Node.js plugin

**Sublime Text**:
- Install LSP (Language Server Protocol)
- Install TypeScript, ESLint, Prettier plugins

### Git Setup

#### Configure Git Identity

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

#### Configure Line Endings

```bash
# For cross-platform development
git config --global core.autocrlf input
```

---

## 🌍 Environment Configuration

### Environment Variables

The application uses environment variables for configuration. These are defined in `.env` files:

1. **`.env.example`** - Template with default values (already in repository)
2. **`.env`** - Your local configuration (create this file)

#### Create Local Environment File

```bash
# Copy the example file
cp .env.example .env

# Or create manually
cat > .env << EOF
VITE_APP_TITLE=Timer Lockout
VITE_APP_VERSION=1.0.0
VITE_LOCKOUT_DURATION=180
VITE_PORT=5173
EOF
```

#### Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_APP_TITLE` | string | Timer Lockout | Application title displayed in UI |
| `VITE_APP_VERSION` | string | 1.0.0 | Application version |
| `VITE_LOCKOUT_DURATION` | number | 180 | Lockout duration in seconds (3 minutes) |
| `VITE_PORT` | number | 5173 | Development server port |

**Note**: All variables must be prefixed with `VITE_` to be exposed to the client-side code.

---

## 🎯 First Run

After completing all setup steps:

```bash
# Start the development server
npm run dev
```

The application should:
1. Compile successfully
2. Start the Vite development server
3. Open your default browser to `http://localhost:5173`
4. Display the Timer Lockout Application

---

## ❌ Troubleshooting Setup Issues

### Common Issues and Solutions

#### Issue: Node.js version too old

**Symptom**: `Error: Node.js version X.X.X is not supported`

**Solution**:
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Install Node.js 18
nvm install 18

# Use Node.js 18
nvm use 18
```

#### Issue: npm install fails

**Symptom**: Network errors or permission issues during installation

**Solutions**:

1. **Network Issues**:
   ```bash
   # Try with a different registry
   npm config set registry https://registry.npmjs.org/
   npm install
   ```

2. **Permission Issues**:
   ```bash
   # Use sudo (not recommended for global installs)
   sudo npm install
   
   # Or fix permissions
   sudo chown -R $USER:$USER node_modules/
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

#### Issue: Missing dependencies after install

**Symptom**: `Cannot find module 'react'` or similar errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Port already in use

**Symptom**: `Error: Port 5173 is already in use`

**Solutions**:

1. **Use a different port**:
   ```bash
   # Edit vite.config.ts and change port
   # Or use environment variable
   VITE_PORT=3000 npm run dev
   ```

2. **Kill the process using the port**:
   ```bash
   # Linux/macOS
   lsof -i :5173
   kill -9 <PID>
   
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

#### Issue: TypeScript errors

**Symptom**: `npm run type-check` reports errors

**Solution**:
```bash
# Check the errors and fix them
npm run type-check

# If errors are in your code, fix them
# If errors are in dependencies, check if they're expected
```

#### Issue: Linting errors

**Symptom**: `npm run lint` reports errors

**Solution**:
```bash
# Auto-fix linting issues
npm run lint:fix

# Or manually fix the reported issues
```

---

## ✅ Setup Checklist

Use this checklist to verify your setup is complete:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Navigated to `timer-lockout` directory
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`.env`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Development server starts (`npm run dev`)
- [ ] Application loads in browser

---

## 📚 Next Steps

After successful setup, you can:

1. **Start Developing**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Learn Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Configure**: See [CONFIGURATION.md](./CONFIGURATION.md)
4. **Build for Production**: See [BUILD.md](./BUILD.md)
5. **Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture overview
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Repository structure
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment requirements
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Dependency documentation
