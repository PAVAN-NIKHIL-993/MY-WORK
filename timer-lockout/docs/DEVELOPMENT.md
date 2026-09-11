# Development Guide

This document provides comprehensive instructions for developing the Timer Lockout Application.

---

## 🚀 Getting Started

Before starting development, ensure you have completed the setup process:

1. ✅ Node.js 18+ installed
2. ✅ npm 9+ installed
3. ✅ Repository cloned
4. ✅ Dependencies installed (`npm install`)
5. ✅ Environment configured

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

## 📁 Project Structure

```
timer-lockout/
├── src/
│   ├── components/           # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── tests/                   # Test files
├── public/                  # Static assets
└── docs/                   # Documentation
```

---

## 🔧 Development Workflow

### Starting the Development Server

```bash
# Start the Vite development server
npm run dev
```

This will:
1. Start the Vite development server on port 5173 (or configured port)
2. Compile TypeScript files
3. Apply Tailwind CSS styles
4. Open the application in your default browser
5. Enable Hot Module Replacement (HMR) for instant updates

**Development Server Features**:
- ✅ Hot Module Replacement (HMR)
- ✅ TypeScript compilation
- ✅ Tailwind CSS processing
- ✅ Error overlays in browser
- ✅ Automatic browser refresh

### Stopping the Development Server

Press `Ctrl + C` in the terminal to stop the development server.

---

## 📝 Development Commands

### Run the Application

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev -- --port 3000` | Start on custom port |
| `npm run dev -- --host` | Allow external connections |

### Code Quality

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run lint` | Run ESLint | Before committing |
| `npm run lint:fix` | Auto-fix linting issues | When linting fails |
| `npm run lint:all` | Lint all files | Full project check |
| `npm run type-check` | Run TypeScript check | Before committing |
| `npm run type-check:watch` | Watch mode | During development |
| `npm run format` | Format source code | Before committing |
| `npm run format:all` | Format all code | Full project formatting |

### Testing

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run test` | Run all tests once | CI/CD, before committing |
| `npm run test:watch` | Run tests in watch mode | During development |
| `npm run test:coverage` | Run tests with coverage | Before release |

### Build

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run build` | Build for production | Before deployment |
| `npm run build:prod` | Full production build | Final release |
| `npm run preview` | Preview production build | After building |

### Combined Checks

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run check` | Run type-check + lint + test | Full validation |
| `npm run check:ci` | Full CI validation | CI/CD pipelines |

---

## 💻 Development Environment

### IDE Configuration

#### Visual Studio Code (Recommended)

**Recommended Extensions**:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind CSS support
- **Reactjs** - React support

**Recommended Settings** (`settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.alwaysShowStatus": true
}
```

### Terminal Configuration

**Recommended Terminal Setup**:
- Use a modern terminal (VS Code, iTerm2, Windows Terminal)
- Enable shell integration for better development experience
- Consider using `zsh` or `bash` with modern features

---

## 📦 Adding New Features

### Step-by-Step Feature Development

1. **Create a Branch**
   ```bash
   git checkout -b feat/feature-name
   ```

2. **Design the Feature**
   - Define requirements
   - Design UI/UX
   - Plan data flow
   - Identify dependencies

3. **Implement the Feature**
   - Create new files in appropriate directories
   - Follow existing patterns and conventions
   - Use TypeScript for type safety
   - Write clean, maintainable code

4. **Write Tests**
   - Create test file in `tests/` directory
   - Test all functionality
   - Test edge cases
   - Test error conditions

5. **Verify Code Quality**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

6. **Update Documentation**
   - Update relevant documentation files
   - Add component documentation if new component
   - Update API documentation if new API
   - Update configuration documentation if new config

7. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add feature-name"
   ```

8. **Push Branch**
   ```bash
   git push origin feat/feature-name
   ```

9. **Create Pull Request**
   - Open PR on GitHub
   - Request review
   - Address feedback

---

### Creating a New Component

1. **Create Component File**
   ```bash
   touch src/components/NewComponent.tsx
   ```

2. **Component Template**
   ```tsx
   import React from 'react';
   
   interface NewComponentProps {
     // Define props here
     className?: string;
   }
   
   export const NewComponent: React.FC<NewComponentProps> = ({
     className = '',
   }) => {
     return (
       <div className={` ${className}`}>
         {/* Component content */}
       </div>
     );
   };
   
   export default NewComponent;
   ```

3. **Add to Component Index**
   ```typescript
   // src/components/index.ts
   export { NewComponent } from './NewComponent';
   ```

4. **Create Test File**
   ```bash
   touch tests/components/NewComponent.test.tsx
   ```

5. **Test Template**
   ```tsx
   import { render, screen } from '@testing-library/react';
   import NewComponent from '@/components/NewComponent';
   
   describe('NewComponent', () => {
     it('should render correctly', () => {
       render(<NewComponent />);
       expect(screen.getByTestId('new-component')).toBeInTheDocument();
     });
   });
   ```

6. **Add Type Definitions** (if needed)
   ```typescript
   // src/types/index.ts
   export interface NewComponentProps {
     className?: string;
   }
   ```

---

### Creating a New Hook

1. **Create Hook File**
   ```bash
   touch src/hooks/useNewHook.ts
   ```

2. **Hook Template**
   ```typescript
   import { useState, useEffect, useCallback } from 'react';
   
   interface UseNewHookOptions {
     // Define options here
   }
   
   interface UseNewHookReturn {
     // Define return values here
   }
   
   export function useNewHook(options: UseNewHookOptions = {}): UseNewHookReturn {
     const [state, setState] = useState(initialState);
     
     // Hook logic here
     
     return {
       // Return values here
     };
   }
   
   export default useNewHook;
   ```

3. **Add to Hook Index**
   ```typescript
   // src/hooks/index.ts
   export { useNewHook } from './useNewHook';
   ```

4. **Create Test File**
   ```bash
   touch tests/hooks/useNewHook.test.tsx
   ```

5. **Test Template**
   ```typescript
   import { renderHook, act } from '@testing-library/react';
   import { useNewHook } from '@/hooks/useNewHook';
   
   describe('useNewHook', () => {
     it('should initialize correctly', () => {
       const { result } = renderHook(() => useNewHook());
       expect(result.current.state).toBeDefined();
     });
   });
   ```

---

### Creating a New Utility Function

1. **Create Utility File**
   ```bash
   touch src/utils/newUtility.ts
   ```

2. **Utility Template**
   ```typescript
   /**
   * Description of what the function does
   * @param param1 - Description of first parameter
   * @param param2 - Description of second parameter
   * @returns Description of return value
   */
   export function newUtility(param1: string, param2: number): string {
     // Implementation here
     return result;
   }
   ```

3. **Add to Utility Index**
   ```typescript
   // src/utils/index.ts
   export { newUtility } from './newUtility';
   ```

4. **Create Test File**
   ```bash
   touch tests/utils/newUtility.test.ts
   ```

5. **Test Template**
   ```typescript
   import { newUtility } from '@/utils/newUtility';
   
   describe('newUtility', () => {
     it('should return expected result', () => {
       const result = newUtility('input', 42);
       expect(result).toBe('expected');
     });
   });
   ```

---

## 🔍 Debugging

### Debugging Tools

| Tool | Purpose | How to Use |
|------|---------|------------|
| **Browser DevTools** | Inspect DOM, styles, network | F12 or Ctrl+Shift+I |
| **React DevTools** | Inspect React component tree | Browser extension |
| **TypeScript** | Type checking | `npm run type-check` |
| **ESLint** | Linting | `npm run lint` |
| **Tests** | Unit testing | `npm run test` |
| **Console** | Logging | `console.log()` |

### Debugging Tips

#### Debugging React Components

1. **Use React DevTools**:
   - View component hierarchy
   - Inspect props and state
   - View hooks
   - Profile performance

2. **Add Debug Logging**:
   ```typescript
   console.log('Component rendered', { props, state });
   ```

3. **Use useDebugValue Hook**:
   ```typescript
   import { useDebugValue } from 'react';
   
   function useCustomHook() {
     const value = computeValue();
     useDebugValue(value);
     return value;
   }
   ```

#### Debugging State Issues

1. **Log State Changes**:
   ```typescript
   useEffect(() => {
     console.log('State changed', state);
   }, [state]);
   ```

2. **Use React DevTools**:
   - View state in the Components tab
   - Track state changes over time

3. **Check Dependencies**:
   ```typescript
   useEffect(() => {
     // This effect runs when dependency changes
   }, [dependency]); // Check if this is correct
   ```

#### Debugging Styling Issues

1. **Use Browser DevTools**:
   - Inspect element
   - View applied styles
   - Check computed styles
   - Edit styles in real-time

2. **Check Tailwind Classes**:
   - Ensure classes are in the `content` paths
   - Check for typos in class names
   - Verify Tailwind is processing the file

3. **Add Temporary Styles**:
   ```tsx
   <div className="bg-red-500"> {/* Temporary highlight */}
     Content
   </div>
   ```

#### Debugging Build Issues

1. **Check Build Output**:
   ```bash
   npm run build
   ```

2. **Check Error Messages**:
   - Read the error message carefully
   - Look at the file and line number mentioned
   - Check the stack trace

3. **Common Build Issues**:
   - **TypeScript errors**: Run `npm run type-check`
   - **Missing dependencies**: Run `npm install`
   - **Syntax errors**: Check the file mentioned
   - **Configuration errors**: Check config files

---

## 📊 Code Quality

### Linting

**Run Linting**:
```bash
npm run lint
```

**Auto-Fix Linting Issues**:
```bash
npm run lint:fix
```

**Common Linting Issues**:

| Issue | Fix | Prevention |
|-------|-----|------------|
| Unused variable | Add `_` prefix or remove | Use all variables |
| Missing type | Add type annotation | Always type variables |
| Unused import | Remove import | Remove unused imports |
| Console statement | Remove or use debug | Use proper logging |
| React hooks rule | Fix dependency array | Check useEffect dependencies |

### Type Checking

**Run Type Checking**:
```bash
npm run type-check
```

**Common Type Errors**:

| Error | Fix | Prevention |
|-------|-----|------------|
| Missing type | Add type annotation | Always type variables |
| Type mismatch | Fix type or value | Check expected types |
| Missing property | Add property or make optional | Check interface definitions |
| Null/undefined | Add null check or make optional | Handle edge cases |

### Formatting

**Format Code**:
```bash
npm run format
```

**Format All Code**:
```bash
npm run format:all
```

**Prettier Configuration**:
- Semi-colons: true
- Single quotes: true
- Print width: 100
- Tab width: 2
- Trailing commas: es5

---

## 🎯 Best Practices

### Code Organization

1. **Keep Components Small**: Each component should have a single responsibility
2. **Use Clear Naming**: Names should be descriptive and consistent
3. **Follow Conventions**: Use established patterns and conventions
4. **Separate Concerns**: Keep logic, presentation, and styles separate
5. **Use TypeScript**: Always use TypeScript for type safety

### Component Development

1. **Props**:
   - Use clear, descriptive prop names
   - Define prop types with interfaces
   - Provide default values where appropriate
   - Document props with JSDoc

2. **State**:
   - Use hooks for state management
   - Keep state minimal
   - Derive values from state when possible
   - Use useMemo for expensive calculations

3. **Effects**:
   - Specify all dependencies
   - Clean up effects (return cleanup function)
   - Handle errors in effects
   - Keep effects focused

### Testing

1. **Test Coverage**: Aim for 100% coverage of critical paths
2. **Test Types**:
   - Unit tests for individual functions/components
   - Integration tests for component interactions
   - Edge case testing
   - Error condition testing
3. **Test Organization**:
   - Keep tests close to the code they test
   - Use descriptive test names
   - Test one thing per test
   - Use setup/teardown appropriately

### Performance

1. **Rendering**:
   - Use React.memo for expensive components
   - Use useMemo for expensive calculations
   - Use useCallback for event handlers
   - Avoid unnecessary re-renders

2. **Code**:
   - Avoid premature optimization
   - Optimize critical paths
   - Use efficient algorithms
   - Minimize DOM operations

### Security

1. **Input Validation**: Validate all external inputs
2. **Sanitization**: Sanitize user-generated content
3. **Error Handling**: Handle errors gracefully
4. **No Secrets**: Never commit secrets to repository
5. **Dependencies**: Keep dependencies updated

---

## 📚 Coding Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `my-component.tsx` |
| Components | PascalCase | `MyComponent` |
| Functions | camelCase | `myFunction` |
| Variables | camelCase | `myVariable` |
| Constants | UPPER_SNAKE_CASE | `MY_CONSTANT` |
| Types | PascalCase | `MyType` |
| Interfaces | PascalCase | `MyInterface` |
| CSS Classes | kebab-case | `my-class` |

### File Structure

**Component File**:
```tsx
import React from 'react';
import type { ComponentProps } from '@/types';

/**
 * Component description
 */
export const MyComponent: React.FC<ComponentProps> = ({ prop }) => {
  return <div>{prop}</div>;
};

export default MyComponent;
```

**Hook File**:
```typescript
import { useState, useEffect } from 'react';

interface UseHookOptions {
  // Options
}

interface UseHookReturn {
  // Return values
}

export function useHook(options: UseHookOptions = {}): UseHookReturn {
  // Implementation
}

export default useHook;
```

**Utility File**:
```typescript
/**
 * Utility function description
 * @param param - Parameter description
 * @returns Return description
 */
export function myUtility(param: string): string {
  // Implementation
}
```

### Import Order

```typescript
// 1. External dependencies
import React from 'react';
import { useState } from 'react';

// 2. Internal dependencies (by path depth)
import { useHook } from '@/hooks/useHook';
import { Component } from '@/components/Component';
import { utility } from '@/utils/utility';

// 3. Local dependencies
import { LocalComponent } from './LocalComponent';

// 4. Type imports
import type { MyType } from '@/types';

// 5. CSS imports
import './styles.css';
```

---

## 🚀 Continuous Development

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/feature-name
   ```

2. **Make Changes**
   - Implement feature
   - Write tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add feature-name"
   ```

4. **Push Branch**
   ```bash
   git push origin feat/feature-name
   ```

5. **Create Pull Request**
   - Open PR on GitHub
   - Request review
   - Address feedback

6. **Merge PR**
   - After approval
   - Squash and merge or rebase and merge

### Branch Naming Convention

| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feat/` | `feat/add-timer` |
| Bug Fix | `fix/` | `fix/timer-bug` |
| Documentation | `docs/` | `docs/update-readme` |
| Refactor | `refactor/` | `refactor/timer-hook` |
| Performance | `perf/` | `perf/optimize-rendering` |
| Test | `test/` | `test/add-coverage` |
| Chore | `chore/` | `chore/update-deps` |

### Commit Message Convention

```
type(scope): description

body (optional)

footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semi-colons, etc.)
- `refactor` - Code refactoring (no functional changes)
- `perf` - Performance improvements
- `test` - Adding or modifying tests
- `chore` - Build process or auxiliary tool changes
- `revert` - Revert a previous commit

**Example**:
```
feat(timer): add lockout duration configuration

- Add VITE_LOCKOUT_DURATION environment variable
- Update useTimer hook to use configurable duration
- Update documentation

Closes #123
```

---

## 🔗 Related Documentation

- [SETUP.md](./SETUP.md) - Setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture overview
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Project structure
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
- [BUILD.md](./BUILD.md) - Build process
- [TESTING.md](./TESTING.md) - Testing strategy
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [guides/developer-guide.md](./guides/developer-guide.md) - Developer guide
- [guides/debugging-guide.md](./guides/debugging-guide.md) - Debugging guide
