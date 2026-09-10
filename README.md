# Timer Lockout Application

A production-quality web application implementing a 3-minute lockout timer that cannot be reactivated until a button is pressed. This demonstrates professional software engineering practices including clean architecture, responsive design, accessibility, and comprehensive error handling.

## Features

- **3-Minute Lockout Timer**: Automatically turns off for 3 minutes from start
- **Manual Reactivation**: Cannot turn back on until user presses the reset button
- **Professional UI**: Clean, modern, accessible interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **State Persistence**: Timer state maintained during session
- **Error Handling**: Graceful degradation and user feedback

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript

## Project Structure

```
MY-WORK/
├── public/                    # Static assets
│   └── favicon.ico
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── TimerDisplay.tsx
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   │   └── useTimer.ts
│   ├── styles/               # Global styles
│   │   └── globals.css
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   └── formatTime.ts
│   ├── App.tsx               # Main application component
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts
├── tests/                    # Test files
│   ├── components/
│   └── hooks/
├── .eslintrc.cjs            # ESLint configuration
├── .prettierrc              # Prettier configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd MY-WORK

# Install dependencies
npm install

# Or using yarn
yarn install
```

## Development

```bash
# Start development server
npm run dev

# Or using yarn
yarn dev
```

The application will be available at `http://localhost:5173`

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Environment Variables

Create a `.env` file in the project root for custom configuration:

```env
VITE_APP_TITLE=Timer Lockout
VITE_APP_VERSION=1.0.0
```

## Deployment

### Static Hosting

The production build generates static files in the `dist/` directory. Deploy to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Cloudflare Pages

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Architecture Decisions

### Why React + TypeScript?

- **Type Safety**: TypeScript catches errors at compile time
- **Component Architecture**: React's component model enables reusable, maintainable UI
- **Ecosystem**: Rich ecosystem with excellent tooling

### Why Vite?

- **Fast Development**: Near-instantaneous hot module replacement
- **Modern Build**: Uses esbuild for lightning-fast builds
- **Zero Configuration**: Works out of the box with sensible defaults

### Why Tailwind CSS?

- **Utility-First**: Rapid development without leaving your HTML
- **Consistency**: Enforces consistent design language
- **Customization**: Easily extensible with custom themes

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Safari | ✅ Latest 2 versions |
| Edge | ✅ Latest 2 versions |
| Opera | ✅ Latest 2 versions |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Contact

For questions or support, please open an issue on the GitHub repository.
