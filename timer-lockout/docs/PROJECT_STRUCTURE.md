# Project Structure Documentation

This document provides a comprehensive overview of the Timer Lockout Application repository structure, explaining the purpose, contents, and architectural role of each directory and file.

---

## 📁 Repository Root Structure

```
timer-lockout/
├── .env.example              # Environment variable template
├── .eslintrc.cjs            # ESLint configuration
├── .gitignore               # Git ignore patterns
├── .prettierrc              # Prettier configuration
├── Dockerfile                # Docker build configuration
├── LICENSE                  # MIT License
├── index.html               # HTML entry point
├── nginx.conf               # Nginx production configuration
├── package-lock.json        # npm lock file (auto-generated)
├── package.json             # Project dependencies and scripts
├── postcss.config.js        # PostCSS configuration for Tailwind
├── public/                  # Static assets directory
├── src/                    # Source code directory
├── tailwind.config.js       # Tailwind CSS configuration
├── tests/                  # Test files directory
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # TypeScript configuration for Node
├── vite.config.ts          # Vite build configuration
└── docs/                   # Documentation directory
```

---

## 📦 Directory Documentation

---

### `/` (Root Directory)

**Purpose**: Project root containing configuration files, entry points, and build artifacts.

**What Belongs Here**:
- Configuration files (ESLint, Prettier, TypeScript, Vite, PostCSS, Tailwind)
- Entry point files (index.html)
- Build configuration (Dockerfile, nginx.conf)
- Dependency files (package.json, package-lock.json)
- License file
- Environment templates (.env.example)

**What Should NOT Belong Here**:
- Source code files (should be in `/src`)
- Test files (should be in `/tests`)
- Generated build artifacts (should be in `/dist`)
- Node modules (should be in `/node_modules`)

**Architectural Role**: Project configuration and build root. Contains all files needed to configure the development environment, build process, and production deployment.

**Important Files**:
- `package.json` - Defines dependencies, scripts, and project metadata
- `vite.config.ts` - Configures the Vite build system
- `tsconfig.json` - TypeScript compiler configuration
- `index.html` - Application entry point

---

### `/public/` - Static Assets

**Purpose**: Contains static assets that are served directly without processing by the build system.

**What Belongs Here**:
- Favicon and application icons
- Static images that don't need processing
- Robots.txt
- Other static files served as-is

**What Should NOT Belong Here**:
- JavaScript/TypeScript files (should be in `/src`)
- CSS files (should be in `/src`)
- Dynamic assets

**Architectural Role**: Static asset serving. Files in this directory are copied directly to the build output.

**Current Contents**:
```
public/
└── favicon.svg              # Application favicon
```

**File: `public/favicon.svg`**
- **Purpose**: Application icon displayed in browser tabs
- **Format**: SVG for scalability
- **Size**: Minimal (approximately 518 bytes)
- **Usage**: Automatically included in build output

---

### `/src/` - Source Code

**Purpose**: Contains all application source code including components, hooks, utilities, styles, and types.

**What Belongs Here**:
- React components
- Custom hooks
- TypeScript type definitions
- Utility functions
- Application styles
- Application entry point

**What Should NOT Belong Here**:
- Test files (should be in `/tests`)
- Configuration files (should be in root)
- Build artifacts

**Architectural Role**: Core application logic. This is the heart of the Timer Lockout Application.

**Structure**:
```
src/
├── components/              # Reusable UI components
├── hooks/                  # Custom React hooks
├── styles/                 # Global styles and CSS
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── vite-env.d.ts           # Vite environment type declarations
```

---

#### `/src/components/` - UI Components

**Purpose**: Contains all reusable React components that make up the application's user interface.

**What Belongs Here**:
- Presentational components
- Container components
- Layout components
- UI utility components

**What Should NOT Belong Here**:
- Business logic (should be in hooks or services)
- Type definitions (should be in `/types`)
- Utility functions (should be in `/utils`)

**Architectural Role**: UI presentation layer. Components are responsible for rendering and user interaction, delegating business logic to hooks.

**Current Contents**:
```
src/components/
├── Button.tsx              # Reusable button component
├── Card.tsx                # Card container component
├── ErrorBoundary.tsx       # Error boundary component
├── Instructions.tsx        # Instructions display component
├── LoadingSpinner.tsx      # Loading spinner component
├── ProgressRing.tsx        # Circular progress indicator
├── Skeleton.tsx            # Skeleton loading component
├── StatusIndicator.tsx     # Timer status indicator
├── TimerDisplay.tsx        # Timer display component
└── index.ts                # Component exports
```

**Component Documentation**:
- See [components/](./components/) directory for detailed component documentation

---

#### `/src/hooks/` - Custom React Hooks

**Purpose**: Contains custom React hooks that encapsulate reusable stateful logic.

**What Belongs Here**:
- Custom hooks for state management
- Logic hooks for reusable functionality
- Timer and timing-related hooks

**What Should NOT Belong Here**:
- UI components
- Utility functions (unless hook-specific)
- Type definitions (should be in `/types`)

**Architectural Role**: State and logic encapsulation layer. Hooks separate business logic from presentation, making components cleaner and more reusable.

**Current Contents**:
```
src/hooks/
├── useTimer.ts             # Timer logic hook (core functionality)
└── index.ts                # Hook exports
```

**Hook Documentation**:
- See [modules/](./modules/) directory for detailed hook documentation

---

#### `/src/styles/` - Global Styles

**Purpose**: Contains global CSS styles and Tailwind CSS configuration.

**What Belongs Here**:
- Global CSS reset/normalization
- Tailwind CSS imports
- Custom CSS utilities
- Theme configurations

**What Should NOT Belong Here**:
- Component-specific styles (should be co-located with components)
- Inline styles

**Architectural Role**: Styling layer. Provides consistent styling across the entire application.

**Current Contents**:
```
src/styles/
└── globals.css             # Global styles and Tailwind directives
```

**File: `src/styles/globals.css`**
- **Purpose**: Global style definitions and Tailwind CSS imports
- **Contents**:
  - Tailwind base, components, and utilities
  - Custom scrollbar styles
  - Focus styles for accessibility
  - Custom utility classes
  - Animation keyframes
- **Dependencies**: Tailwind CSS
- **Consumers**: All components via CSS import in `main.tsx`

---

#### `/src/types/` - TypeScript Type Definitions

**Purpose**: Contains TypeScript type definitions used throughout the application.

**What Belongs Here**:
- Interface definitions
- Type aliases
- Enum definitions
- Prop types for components
- State types

**What Should NOT Belong Here**:
- Implementation code
- Utility functions
- Runtime logic

**Architectural Role**: Type safety layer. Provides compile-time type checking and better developer experience.

**Current Contents**:
```
src/types/
└── index.ts                # All type definitions
```

**File: `src/types/index.ts`**
- **Purpose**: Central type definitions for the application
- **Exports**:
  - `TimerStatus` - Type for timer states ('idle' | 'running' | 'locked' | 'completed')
  - `TimerState` - Interface for timer state object
  - `AppConfig` - Application configuration interface
  - `ApiResponse<T>` - API response wrapper type
  - `TimerEvent` - Timer event types
  - `ButtonProps` - Button component props
  - `CardProps` - Card component props
  - `TimerDisplayProps` - TimerDisplay component props
  - `LoadingSpinnerProps` - LoadingSpinner component props
  - `SkeletonProps` - Skeleton component props
- **Dependencies**: None
- **Consumers**: All components and hooks that use these types

---

#### `/src/utils/` - Utility Functions

**Purpose**: Contains reusable utility functions that don't belong in components or hooks.

**What Belongs Here**:
- Pure functions
- Helper functions
- Formatters
- Validators
- Reusable algorithms

**What Should NOT Belong Here**:
- State management
- UI components
- Type definitions

**Architectural Role**: Utility layer. Provides reusable, testable functions for common operations.

**Current Contents**:
```
src/utils/
├── formatTime.ts           # Time formatting utilities
└── index.ts                # Utility exports
```

**File: `src/utils/formatTime.ts`**
- **Purpose**: Format time values for display
- **Functions**:
  - `formatTime(seconds: number, showMilliseconds?: boolean): string` - Formats seconds into MM:SS or HH:MM:SS
  - `formatTimeForAria(seconds: number): string` - Formats time for screen readers
  - `isValidNumber(value: unknown): value is number` - Type guard for number validation
- **Dependencies**: None
- **Consumers**: TimerDisplay component, tests
- **Runtime Behavior**: Pure functions, no side effects
- **Failure Behavior**: Returns safe defaults for invalid inputs

---

### `/tests/` - Test Files

**Purpose**: Contains all test files for the application.

**What Belongs Here**:
- Unit tests
- Integration tests
- Test utilities
- Test fixtures
- Test setup files

**What Should NOT Belong Here**:
- Source code
- Configuration files
- Build artifacts

**Architectural Role**: Testing layer. Ensures application correctness and prevents regressions.

**Structure**:
```
tests/
├── setup.ts                 # Test setup file
├── components/              # Component tests
│   ├── Button.test.tsx
│   ├── ErrorBoundary.test.tsx
│   ├── LoadingSpinner.test.tsx
│   ├── Skeleton.test.tsx
│   └── TimerDisplay.test.tsx
├── hooks/                   # Hook tests
│   └── useTimer.test.tsx
└── utils/                   # Utility tests
    └── formatTime.test.ts
```

**Test Statistics**:
- **Total Tests**: 90
- **Component Tests**: 51 tests (Button: 19, ErrorBoundary: 5, LoadingSpinner: 7, Skeleton: 10, TimerDisplay: 15)
- **Hook Tests**: 10 tests (useTimer)
- **Utility Tests**: 24 tests (formatTime)
- **Coverage**: 100% of tested code paths

---

### `/docs/` - Documentation

**Purpose**: Contains comprehensive engineering-grade documentation for the project.

**What Belongs Here**:
- Architecture documentation
- API documentation
- Configuration documentation
- Development guides
- Operational documentation
- Troubleshooting guides

**What Should NOT Belong Here**:
- Source code
- Test files
- Configuration files

**Architectural Role**: Documentation layer. Provides complete information for understanding, maintaining, and extending the project.

**Structure**:
```
docs/
├── ARCHITECTURE.md          # System architecture overview
├── PROJECT_STRUCTURE.md    # This file - Repository structure
├── SETUP.md                # Setup instructions
├── CONFIGURATION.md        # Configuration documentation
├── ENVIRONMENT.md          # Environment requirements
├── DEPENDENCIES.md         # Dependency documentation
├── DEVELOPMENT.md          # Development workflow
├── BUILD.md                # Build process
├── TESTING.md              # Testing strategy
├── DEPLOYMENT.md           # Deployment guide
├── OPERATIONS.md           # Operations manual
├── TROUBLESHOOTING.md       # Troubleshooting guide
├── SECURITY.md             # Security considerations
├── PERFORMANCE.md          # Performance analysis
├── ACCESSIBILITY.md        # Accessibility features
├── CHANGELOG.md            # Version history
├── DOCUMENTATION_COVERAGE.md # Documentation audit
├── architecture/            # Architecture documentation
│   ├── system-overview.md
│   ├── application-flow.md
│   ├── data-flow.md
│   ├── state-management.md
│   ├── error-handling.md
│   └── decisions.md
├── modules/                # Module documentation
│   └── useTimer.md
├── components/             # Component documentation
│   ├── Button.md
│   ├── Card.md
│   ├── ErrorBoundary.md
│   ├── Instructions.md
│   ├── LoadingSpinner.md
│   ├── ProgressRing.md
│   ├── Skeleton.md
│   ├── StatusIndicator.md
│   └── TimerDisplay.md
└── guides/                 # Developer guides
    ├── developer-guide.md
    ├── debugging-guide.md
    └── extension-guide.md
```

---

## 📄 File-by-File Documentation

---

### Configuration Files

#### File: `package.json`

**Path**: `/package.json`

**Purpose**: Project manifest defining dependencies, scripts, and metadata.

**Responsibilities**:
- Define project name, version, description
- List production and development dependencies
- Define npm scripts for development, build, test, etc.
- Configure project entry point and types

**Exports**: None (JSON configuration file)

**Dependencies**: None

**Consumers**: npm, Node.js, build tools

**Runtime Behavior**: Read at install/build time, not at runtime

**Failure Behavior**: Invalid JSON or missing required fields will cause npm errors

**Configuration**:
- Scripts: dev, build, preview, test, lint, type-check, format, etc.
- Dependencies: react, react-dom
- Dev Dependencies: @testing-library/react, vitest, eslint, prettier, tailwindcss, etc.

**Modification Risks**:
- Adding new dependencies increases bundle size
- Changing scripts may break CI/CD pipelines
- Version changes may introduce compatibility issues

**Related Documentation**:
- [DEPENDENCIES.md](./DEPENDENCIES.md)
- [BUILD.md](./BUILD.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)

---

#### File: `vite.config.ts`

**Path**: `/vite.config.ts`

**Purpose**: Vite build system configuration.

**Responsibilities**:
- Configure Vite plugins (React)
- Set up path aliases (@/ for src/)
- Configure build options (outDir, sourcemap)
- Configure test environment
- Configure development server (port, open)

**Exports**: Vite configuration object

**Dependencies**:
- vite
- @vitejs/plugin-react
- path (Node.js)

**Consumers**: Vite CLI

**Runtime Behavior**: Read at build/dev time

**Failure Behavior**: Invalid configuration will cause Vite errors

**Configuration**:
- Alias: `@/*` → `./src/*`
- Test: jsdom environment, setup file, CSS enabled
- Server: Port 5173, auto-open browser
- Build: Output to dist/, source maps enabled, vendor chunk splitting

**Modification Risks**:
- Changing aliases may break imports
- Changing test configuration may break tests
- Changing build options may affect production deployment

**Related Documentation**:
- [BUILD.md](./BUILD.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)

---

#### File: `tsconfig.json`

**Path**: `/tsconfig.json`

**Purpose**: TypeScript compiler configuration for application code.

**Responsibilities**:
- Define TypeScript target (ES2020)
- Configure module system (ESNext)
- Set up path aliases
- Enable strict type checking
- Configure JSX handling

**Exports**: TypeScript configuration object

**Dependencies**: None

**Consumers**: TypeScript compiler, IDEs

**Runtime Behavior**: Read at compile time

**Failure Behavior**: Invalid configuration will cause TypeScript errors

**Configuration**:
- Target: ES2020
- Module: ESNext
- Module Resolution: bundler
- JSX: react-jsx
- Strict: true
- Paths: `@/*` → `src/*`
- Include: src/

**Modification Risks**:
- Changing target may affect browser compatibility
- Changing module resolution may break imports
- Disabling strict mode reduces type safety

**Related Documentation**:
- None (TypeScript standard configuration)

---

#### File: `tailwind.config.js`

**Path**: `/tailwind.config.js`

**Purpose**: Tailwind CSS framework configuration.

**Responsibilities**:
- Define content paths for purge
- Configure custom theme (colors, fonts, animations)
- Set up plugins

**Exports**: Tailwind configuration object

**Dependencies**: None

**Consumers**: Tailwind CSS processor

**Runtime Behavior**: Read at build time

**Failure Behavior**: Invalid configuration will cause Tailwind errors

**Configuration**:
- Content: index.html, src/**/*.{js,ts,jsx,tsx}
- Theme extensions:
  - Custom colors (primary, secondary)
  - Custom font family (Inter)
  - Custom animations (spin-slow, pulse-slow)

**Modification Risks**:
- Changing content paths may cause unused styles to be purged
- Changing theme may affect visual consistency

**Related Documentation**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Design decisions

---

#### File: `index.html`

**Path**: `/index.html`

**Purpose**: HTML entry point for the application.

**Responsibilities**:
- Define document structure
- Load fonts (Inter from Google Fonts)
- Set meta tags (viewport, description, theme color)
- Mount React application to #root element
- Load main TypeScript module

**Exports**: None (HTML file)

**Dependencies**: None

**Consumers**: Browser, Vite

**Runtime Behavior**: Served as entry point, hydrated by React

**Failure Behavior**: Invalid HTML may prevent application from loading

**Configuration**:
- Title: Timer Lockout | Production Application
- Viewport: width=device-width, initial-scale=1.0
- Description: Professional timer lockout application with 3-minute delay
- Theme Color: #2563eb (primary blue)
- Font: Inter from Google Fonts

**Modification Risks**:
- Changing #root element ID may break React mounting
- Removing font preload may cause FOUC (Flash of Unstyled Content)

**Related Documentation**:
- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

#### File: `Dockerfile`

**Path**: `/Dockerfile`

**Purpose**: Multi-stage Docker build configuration for containerized deployment.

**Responsibilities**:
- Define build stages (builder, production)
- Install dependencies
- Build application
- Configure production server (nginx)
- Set up health checks

**Exports**: Docker image

**Dependencies**:
- node:18-alpine (builder stage)
- nginx:alpine (production stage)

**Consumers**: Docker CLI

**Runtime Behavior**: Build-time configuration

**Failure Behavior**: Build errors if dependencies fail to install or build fails

**Configuration**:
- Stage 1 (builder): Install npm dependencies, run `npm run build`
- Stage 2 (production): Copy built files from builder, configure nginx
- Health check: wget http://localhost/ every 30s
- Exposed port: 80

**Modification Risks**:
- Changing Node version may affect dependency compatibility
- Changing nginx configuration may affect production serving

**Related Documentation**:
- [DEPLOYMENT.md](./DEPLOYMENT.md)

---

#### File: `nginx.conf`

**Path**: `/nginx.conf`

**Purpose**: Nginx server configuration for production deployment.

**Responsibilities**:
- Configure server to listen on port 80
- Set up gzip compression
- Configure caching for static assets
- Set up health check endpoint
- Configure security headers
- Configure CORS headers
- Handle error pages

**Exports**: Nginx configuration

**Dependencies**: None

**Consumers**: Nginx server

**Runtime Behavior**: Loaded at nginx startup

**Failure Behavior**: Invalid configuration will prevent nginx from starting

**Configuration**:
- Gzip: Enabled for text-based assets
- Cache: 1 year for static assets with immutable cache control
- Health check: /health endpoint returns 200 OK
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- CORS: Allows all origins with standard methods
- Error pages: 404 → index.html, 500/502/503/504 → 50x.html

**Modification Risks**:
- Changing cache settings may affect asset loading
- Changing security headers may reduce security
- Changing CORS settings may affect API access

**Related Documentation**:
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SECURITY.md](./SECURITY.md)

---

#### File: `.eslintrc.cjs`

**Path**: `/eslintrc.cjs`

**Purpose**: ESLint configuration for code linting.

**Responsibilities**:
- Define linting rules
- Configure parser (@typescript-eslint/parser)
- Set up plugins (react-hooks, react-refresh)
- Define environment (browser, es2020)
- Configure ignore patterns

**Exports**: ESLint configuration object

**Dependencies**:
- eslint
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh

**Consumers**: ESLint CLI, IDEs

**Runtime Behavior**: Read at lint time

**Failure Behavior**: Invalid configuration will cause ESLint errors

**Configuration**:
- Environment: browser, es2020
- Parser: @typescript-eslint/parser
- Plugins: react-hooks, react-refresh
- Ignore patterns: dist, .eslintrc.cjs
- Rules: react-refresh/only-export-components (warn), @typescript-eslint/no-unused-vars (warn), @typescript-eslint/no-explicit-any (warn)

**Modification Risks**:
- Adding too many rules may slow down linting
- Disabling important rules may reduce code quality

**Related Documentation**:
- [DEVELOPMENT.md](./DEVELOPMENT.md)

---

#### File: `.prettierrc`

**Path**: `/prettierrc`

**Purpose**: Prettier configuration for code formatting.

**Responsibilities**:
- Define formatting rules
- Configure plugins

**Exports**: Prettier configuration object

**Dependencies**: None

**Consumers**: Prettier CLI, IDEs

**Runtime Behavior**: Read at format time

**Failure Behavior**: Invalid JSON will cause Prettier errors

**Configuration**:
- Semi-colons: true
- Trailing commas: es5
- Single quotes: true
- Print width: 100
- Tab width: 2
- Use tabs: false
- Bracket spacing: true
- Bracket same line: false
- Arrow parens: always
- End of line: lf
- Plugins: prettier-plugin-tailwindcss

**Modification Risks**:
- Changing rules may cause formatting inconsistencies
- Team must agree on formatting style

**Related Documentation**:
- [DEVELOPMENT.md](./DEVELOPMENT.md)

---

#### File: `.gitignore`

**Path**: `/gitignore`

**Purpose**: Specify files and directories to be ignored by Git.

**Responsibilities**:
- Prevent unnecessary files from being committed
- Reduce repository size
- Protect sensitive files

**Exports**: None (text file)

**Dependencies**: None

**Consumers**: Git

**Runtime Behavior**: Read at Git operations

**Failure Behavior**: Invalid patterns may cause files to be incorrectly tracked

**Ignored Patterns**:
- node_modules/
- .pnp, .pnp.js
- dist/, build/
- *.local
- .env, .env.*
- .idea/, .vscode/
- *.swp, *.swo, *~
- .DS_Store, Thumbs.db
- *.log, npm-debug.log*
- .cache/, .pnpm-store/
- tmp/, temp/

**Modification Risks**:
- Adding wrong patterns may cause important files to be ignored
- Removing patterns may cause unnecessary files to be committed

**Related Documentation**:
- None (standard Git configuration)

---

#### File: `.env.example`

**Path**: `/env.example`

**Purpose**: Template for environment variables.

**Responsibilities**:
- Document available environment variables
- Provide default values
- Guide users on configuration

**Exports**: None (template file)

**Dependencies**: None

**Consumers**: Developers setting up the project

**Runtime Behavior**: None (template only)

**Failure Behavior**: None (not used at runtime)

**Variables**:
- VITE_APP_TITLE: Application title (default: Timer Lockout)
- VITE_APP_VERSION: Application version (default: 1.0.0)
- VITE_LOCKOUT_DURATION: Lockout duration in seconds (default: 180)
- VITE_PORT: Development server port (default: 5173)

**Modification Risks**:
- Adding new variables requires documentation
- Changing defaults may affect existing deployments

**Related Documentation**:
- [CONFIGURATION.md](./CONFIGURATION.md)
- [ENVIRONMENT.md](./ENVIRONMENT.md)

---

## 📊 Summary Tables

### Directory Summary

| Directory | Purpose | File Count | Key Contents |
|-----------|---------|------------|--------------|
| `/` | Project root | 14 | Configuration, entry points |
| `/public/` | Static assets | 1 | favicon.svg |
| `/src/` | Source code | 15 | Components, hooks, styles, types, utils |
| `/src/components/` | UI components | 9 | Button, Card, ErrorBoundary, etc. |
| `/src/hooks/` | Custom hooks | 2 | useTimer, index |
| `/src/styles/` | Global styles | 1 | globals.css |
| `/src/types/` | Type definitions | 1 | index.ts |
| `/src/utils/` | Utility functions | 2 | formatTime, index |
| `/tests/` | Test files | 8 | setup, component tests, hook tests, utility tests |
| `/docs/` | Documentation | 20+ | Architecture, project structure, etc. |

### File Type Summary

| File Type | Count | Examples |
|-----------|-------|----------|
| TypeScript Source | 15 | App.tsx, main.tsx, Button.tsx |
| TypeScript Config | 2 | tsconfig.json, tsconfig.node.json |
| JavaScript Config | 5 | vite.config.ts, tailwind.config.js, postcss.config.js, .eslintrc.cjs, .prettierrc |
| JSON Config | 2 | package.json, package-lock.json |
| HTML | 1 | index.html |
| CSS | 1 | globals.css |
| Markdown | 20+ | README.md, ARCHITECTURE.md, etc. |
| SVG | 1 | favicon.svg |
| Text/Config | 5 | .gitignore, .env.example, LICENSE, Dockerfile, nginx.conf |

---

## 🎯 Navigation Guide

### For Developers

1. **First Time Setup**: See [SETUP.md](./SETUP.md)
2. **Development Workflow**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **Adding Features**: See [guides/extension-guide.md](./guides/extension-guide.md)

### For Maintainers

1. **Architecture Overview**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Project Structure**: This document
3. **Configuration**: See [CONFIGURATION.md](./CONFIGURATION.md)

### For Operators

1. **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Operations**: See [OPERATIONS.md](./OPERATIONS.md)
3. **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📝 Modification Guidelines

### Adding New Files

When adding new files to the project:

1. **Determine the correct directory** based on the file's purpose
2. **Follow existing naming conventions** (kebab-case for files, PascalCase for React components)
3. **Add appropriate type definitions** if using TypeScript
4. **Write tests** for new functionality
5. **Update documentation** to reflect changes

### Modifying Existing Files

When modifying existing files:

1. **Understand the file's purpose** and dependencies
2. **Check for side effects** on other parts of the application
3. **Update tests** if behavior changes
4. **Update documentation** if interfaces change
5. **Verify all checks pass** (lint, type-check, tests)

### Removing Files

When removing files:

1. **Ensure no other files depend on it**
2. **Update all imports** that reference the file
3. **Update tests** that test the file
4. **Update documentation** that references the file
5. **Verify the application still works** after removal

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [BUILD.md](./BUILD.md) - Build process documentation
- [TESTING.md](./TESTING.md) - Testing strategy and coverage
