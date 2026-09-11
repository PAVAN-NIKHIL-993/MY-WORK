# Configuration Documentation

This document provides comprehensive information about all configuration options available in the Timer Lockout Application.

---

## 📋 Configuration Overview

The Timer Lockout Application supports configuration through multiple mechanisms:

| Mechanism | Scope | Usage |
|-----------|-------|-------|
| **Environment Variables** | Runtime | Application settings, API keys |
| **Build Configuration** | Build-time | Vite, TypeScript, ESLint, etc. |
| **Application Constants** | Runtime | Hard-coded values in source |
| **Feature Flags** | Runtime | Enable/disable features |

---

## 🌍 Environment Variables

Environment variables are the primary mechanism for configuring the application at runtime. They are defined in `.env` files and must be prefixed with `VITE_` to be exposed to client-side code.

### Environment File Hierarchy

The application respects the following environment file hierarchy (in order of precedence):

```
1. .env.local          # Local overrides (ignored by Git)
2. .env.development    # Development-specific
3. .env                # Local environment (ignored by Git)
4. .env.example        # Example/template (committed)
5. Package.json        # Default values
```

### Available Environment Variables

| Variable | Type | Required | Default | Description | Security Sensitive |
|----------|------|----------|---------|-------------|-------------------|
| `VITE_APP_TITLE` | string | No | `Timer Lockout` | Application title displayed in UI | ❌ No |
| `VITE_APP_VERSION` | string | No | `1.0.0` | Application version displayed | ❌ No |
| `VITE_LOCKOUT_DURATION` | number | No | `180` | Timer lockout duration in seconds | ❌ No |
| `VITE_PORT` | number | No | `5173` | Development server port | ❌ No |
| `VITE_BASE_URL` | string | No | `/` | Base URL for the application | ❌ No |

### Environment Variable Details

#### VITE_APP_TITLE

**Purpose**: Sets the application title displayed in the browser tab and potentially in the UI.

**Type**: `string`

**Default**: `"Timer Lockout"`

**Example**:
```env
VITE_APP_TITLE=My Custom Timer
```

**Usage**:
```typescript
// Can be accessed in code via:
import.meta.env.VITE_APP_TITLE
```

**Effect**: Changes the title displayed in the browser tab.

---

#### VITE_APP_VERSION

**Purpose**: Sets the application version, useful for display in UI or for analytics.

**Type**: `string`

**Default**: `"1.0.0"`

**Example**:
```env
VITE_APP_VERSION=2.0.0-beta.1
```

**Usage**:
```typescript
// Can be accessed in code via:
import.meta.env.VITE_APP_VERSION
```

**Effect**: Changes the version displayed in the application.

---

#### VITE_LOCKOUT_DURATION

**Purpose**: Sets the timer lockout duration in seconds. This is the core functionality of the application.

**Type**: `number` (integer)

**Default**: `180` (3 minutes)

**Example**:
```env
# 5 minutes
VITE_LOCKOUT_DURATION=300

# 1 minute (for testing)
VITE_LOCKOUT_DURATION=60
```

**Usage**:
```typescript
// Accessed in useTimer hook:
const lockoutDuration = Number(import.meta.env.VITE_LOCKOUT_DURATION) || 180;
```

**Effect**: Changes how long the timer runs before entering lockout state.

**Constraints**:
- Must be a positive integer
- Very large values may cause display issues
- Very small values (< 1) may cause timer to complete instantly

---

#### VITE_PORT

**Purpose**: Sets the port for the Vite development server.

**Type**: `number` (integer)

**Default**: `5173`

**Example**:
```env
VITE_PORT=3000
```

**Usage**: Automatically used by Vite when starting the development server.

**Effect**: Changes the port the development server listens on.

**Constraints**:
- Must be a valid port number (1-65535)
- Must not be in use by another process
- Ports below 1024 may require root privileges

---

#### VITE_BASE_URL

**Purpose**: Sets the base URL for the application, useful for deployment to subdirectories.

**Type**: `string`

**Default**: `/`

**Example**:
```env
# Deploy to GitHub Pages
VITE_BASE_URL=/timer-lockout/

# Deploy to subdirectory
VITE_BASE_URL=/apps/timer/
```

**Usage**: Automatically used by Vite for asset paths.

**Effect**: Changes the base path for all application assets.

---

## ⚙️ Build Configuration

Build-time configuration files control how the application is compiled and bundled.

### Vite Configuration (`vite.config.ts`)

**Purpose**: Configure the Vite build system.

**Location**: `/vite.config.ts`

**Current Configuration**:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

**Configurable Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `plugins` | Plugin[] | [react()] | Vite plugins to use |
| `resolve.alias` | Object | {@: src/} | Path aliases for imports |
| `test.globals` | boolean | true | Enable global variables in tests |
| `test.environment` | string | 'jsdom' | Test environment |
| `test.setupFiles` | string | './tests/setup.ts' | Test setup file path |
| `test.css` | boolean | true | Enable CSS in tests |
| `server.port` | number | 5173 | Development server port |
| `server.open` | boolean | true | Auto-open browser |
| `build.outDir` | string | 'dist' | Output directory |
| `build.sourcemap` | boolean | true | Generate source maps |
| `build.rollupOptions` | Object | {manualChunks} | Rollup configuration |

**Modification Instructions**:

To modify Vite configuration:

1. Edit `vite.config.ts`
2. Ensure TypeScript types are correct
3. Test the build: `npm run build`
4. Test the development server: `npm run dev`

**Common Modifications**:

**Change development port**:
```typescript
server: {
  port: 3000, // Change from 5173 to 3000
  open: true,
}
```

**Add new path alias**:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
  },
}
```

**Change output directory**:
```typescript
build: {
  outDir: 'build', // Change from 'dist' to 'build'
  // ...
}
```

---

### TypeScript Configuration (`tsconfig.json`)

**Purpose**: Configure the TypeScript compiler.

**Location**: `/tsconfig.json`

**Current Configuration**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Configurable Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | string | ES2020 | ECMAScript target version |
| `lib` | string[] | ES2020, DOM, DOM.Iterable | Library definitions |
| `module` | string | ESNext | Module system |
| `jsx` | string | react-jsx | JSX handling |
| `strict` | boolean | true | Enable all strict checks |
| `noEmit` | boolean | true | Don't emit output (handled by Vite) |
| `baseUrl` | string | "." | Base directory for module resolution |
| `paths` | Object | {@/*: src/*} | Path aliases |

**Modification Instructions**:

To modify TypeScript configuration:

1. Edit `tsconfig.json`
2. Run `npm run type-check` to verify
3. Ensure all type errors are resolved

**Common Modifications**:

**Change target version**:
```json
{
  "compilerOptions": {
    "target": "ES2021"
  }
}
```

**Add path alias**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

**Enable/disable strict mode**:
```json
{
  "compilerOptions": {
    "strict": false // Not recommended
  }
}
```

---

### ESLint Configuration (`.eslintrc.cjs`)

**Purpose**: Configure code linting rules.

**Location**: `/eslintrc.cjs`

**Current Configuration**:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

**Configurable Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | Object | {browser: true, es2020: true} | Environment definitions |
| `extends` | string[] | eslint:recommended, etc. | Extended configurations |
| `parser` | string | @typescript-eslint/parser | Parser to use |
| `plugins` | string[] | react-refresh | Plugins to load |
| `ignorePatterns` | string[] | ['dist', '.eslintrc.cjs'] | Files to ignore |
| `rules` | Object | Various | Custom linting rules |

**Modification Instructions**:

To modify ESLint configuration:

1. Edit `.eslintrc.cjs`
2. Run `npm run lint` to verify
3. Fix any linting errors

**Common Modifications**:

**Add new rule**:
```javascript
rules: {
  'new-rule': 'error'
}
```

**Change rule severity**:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error' // Change from warn to error
}
```

**Ignore additional files**:
```javascript
ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage']
```

---

### Prettier Configuration (`.prettierrc`)

**Purpose**: Configure code formatting rules.

**Location**: `/prettierrc`

**Current Configuration**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Configurable Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `semi` | boolean | true | Use semicolons |
| `trailingComma` | string | es5 | Trailing commas |
| `singleQuote` | boolean | true | Use single quotes |
| `printWidth` | number | 100 | Line length before wrapping |
| `tabWidth` | number | 2 | Number of spaces per tab |
| `useTabs` | boolean | false | Use tabs instead of spaces |
| `bracketSpacing` | boolean | true | Spaces inside brackets |
| `arrowParens` | string | always | Parentheses around arrow function parameters |
| `endOfLine` | string | lf | Line ending character |

**Modification Instructions**:

To modify Prettier configuration:

1. Edit `.prettierrc`
2. Run `npm run format` to reformat all files
3. Verify formatting looks correct

**Common Modifications**:

**Change line length**:
```json
{
  "printWidth": 120
}
```

**Use tabs instead of spaces**:
```json
{
  "useTabs": true,
  "tabWidth": 2
}
```

---

### Tailwind CSS Configuration (`tailwind.config.js`)

**Purpose**: Configure the Tailwind CSS framework.

**Location**: `/tailwind.config.js`

**Current Configuration**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... (all shades)
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          // ... (all shades)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
```

**Configurable Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `content` | string[] | index.html, src/** | Files to scan for classes |
| `theme.extend.colors` | Object | Custom colors | Custom color palette |
| `theme.extend.fontFamily` | Object | Inter | Custom font family |
| `theme.extend.animation` | Object | Custom animations | Custom animations |
| `plugins` | Array | [] | Tailwind plugins |

**Modification Instructions**:

To modify Tailwind configuration:

1. Edit `tailwind.config.js`
2. Run development server to verify styles
3. Check that all classes are being applied correctly

**Common Modifications**:

**Add new color**:
```javascript
extend: {
  colors: {
    primary: {
      // ... existing
      950: '#172554',
    },
    accent: {
      500: '#8b5cf6',
    },
  },
}
```

**Add new font**:
```javascript
extend: {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['Fira Code', 'Monaco', 'monospace'],
  },
}
```

---

## 🔧 Application Constants

Application constants are hard-coded values used throughout the application. These can be found in various source files.

### Timer Constants

**Location**: `/src/hooks/useTimer.ts`

```typescript
const DEFAULT_LOCKOUT_DURATION = 180; // 3 minutes in seconds
```

**Purpose**: Default lockout duration if not specified via environment variable.

**Modification**: Change this value to set a different default duration.

---

### Time Formatting Constants

**Location**: `/src/utils/formatTime.ts`

The formatting functions use the following logic:
- **Minutes and seconds**: `MM:SS` format
- **Hours, minutes, seconds**: `HH:MM:SS` format
- **With milliseconds**: `MM:SS.mmm` or `HH:MM:SS.mmm` format

---

## 🎛️ Feature Flags

The application currently doesn't use feature flags, but they can be added for future extensibility.

### Suggested Feature Flag Structure

```env
# Enable experimental features
VITE_FEATURE_EXPERIMENTAL=true

# Enable analytics
VITE_FEATURE_ANALYTICS=false

# Enable dark mode
VITE_FEATURE_DARK_MODE=true
```

**Implementation**:

```typescript
// In source code
const isFeatureEnabled = import.meta.env.VITE_FEATURE_EXPERIMENTAL === 'true';

if (isFeatureEnabled) {
  // Load experimental feature
}
```

---

## 📊 Configuration Summary Table

| Category | File | Purpose | Modifiable |
|----------|------|---------|------------|
| Environment | `.env` | Runtime configuration | ✅ Yes |
| Environment | `.env.example` | Configuration template | ✅ Yes |
| Build | `vite.config.ts` | Vite build configuration | ✅ Yes |
| TypeScript | `tsconfig.json` | TypeScript compiler configuration | ✅ Yes |
| TypeScript | `tsconfig.node.json` | TypeScript for Node configuration | ✅ Yes |
| Linting | `.eslintrc.cjs` | ESLint configuration | ✅ Yes |
| Formatting | `.prettierrc` | Prettier configuration | ✅ Yes |
| CSS | `tailwind.config.js` | Tailwind CSS configuration | ✅ Yes |
| Git | `.gitignore` | Git ignore patterns | ✅ Yes |
| Docker | `Dockerfile` | Docker build configuration | ✅ Yes |
| Nginx | `nginx.conf` | Nginx server configuration | ✅ Yes |

---

## 🔍 Configuration Validation

After modifying any configuration:

1. **TypeScript Configuration**:
   ```bash
   npm run type-check
   ```

2. **ESLint Configuration**:
   ```bash
   npm run lint
   ```

3. **Build Configuration**:
   ```bash
   npm run build
   ```

4. **Development Server**:
   ```bash
   npm run dev
   ```

---

## 🛡️ Configuration Security

### Security Considerations

1. **Never commit secrets**: Ensure `.env.local` and `.env` are in `.gitignore`
2. **Validate inputs**: All environment variables should be validated
3. **Use safe defaults**: Always provide safe default values
4. **Type safety**: Use TypeScript to ensure type correctness

### Example: Safe Configuration Access

```typescript
// Safe access with default
const lockoutDuration = Number(import.meta.env.VITE_LOCKOUT_DURATION) || 180;

// Validate
if (isNaN(lockoutDuration) || lockoutDuration <= 0) {
  console.warn('Invalid lockout duration, using default');
  // Use default
}
```

---

## 📚 Related Documentation

- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment requirements
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Dependency documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [BUILD.md](./BUILD.md) - Build process
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
