# Button Component

## 📌 Overview

The `Button` component is a reusable, accessible button component that provides consistent styling and behavior across the Timer Lockout Application.

---

## 📁 File Information

| Property | Value |
|----------|-------|
| **File Path** | `/src/components/Button.tsx` |
| **Type** | React Functional Component |
| **Language** | TypeScript |
| **Lines of Code** | ~50 |
| **Test File** | `/tests/components/Button.test.tsx` |
| **Test Coverage** | 19 tests |

---

## 🎯 Purpose

The Button component serves as the primary interactive element in the application, providing:

- **Consistent styling** across all buttons
- **Multiple variants** for different use cases (primary, secondary, danger, outline)
- **Multiple sizes** for different contexts (sm, md, lg)
- **Accessibility features** for keyboard and screen reader users
- **Loading state** for async operations
- **Reusable** across the entire application

---

## 🏗️ Component Structure

```
Button Component
├── Props Interface (ButtonProps)
├── Size Classes (sm, md, lg)
├── Variant Classes (primary, secondary, danger, outline)
├── Loading Spinner (SVG)
└── Accessibility Attributes
```

---

## 📦 Props

### ButtonProps Interface

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}
```

### Props Details

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | string | No | 'primary' | Button visual style variant |
| `size` | string | No | 'md' | Button size |
| `disabled` | boolean | No | false | Whether button is disabled |
| `isLoading` | boolean | No | false | Whether to show loading spinner |
| `children` | React.ReactNode | Yes | - | Button content |
| `onClick` | function | No | undefined | Click event handler |
| `type` | string | No | 'button' | HTML button type attribute |
| `className` | string | No | '' | Additional CSS classes |
| `aria-label` | string | No | undefined | Accessible name for screen readers |

---

## 🎨 Variants

### Primary Variant

**Purpose**: Main action buttons, most prominent

**Visual**: Blue background with white text

**Usage**: Start timer, main actions

**Example**:
```tsx
<Button variant="primary" onClick={start}>
  Start Timer
</Button>
```

**Classes**: `btn-primary` → `bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500`

---

### Secondary Variant

**Purpose**: Secondary actions, less prominent

**Visual**: Light gray background with dark text

**Usage**: Reset timer, cancel actions

**Example**:
```tsx
<Button variant="secondary" onClick={reset}>
  Reset Timer
</Button>
```

**Classes**: `btn-secondary` → `bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500`

---

### Danger Variant

**Purpose**: Destructive actions or warnings

**Visual**: Red background with white text

**Usage**: Unlock during lockout (requires attention)

**Example**:
```tsx
<Button variant="danger" onClick={unlock}>
  Unlock Timer
</Button>
```

**Classes**: `btn-danger` → `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`

---

### Outline Variant

**Purpose**: Subtle actions, minimal visual weight

**Visual**: Transparent background with colored border and text

**Usage**: Toggle instructions, secondary options

**Example**:
```tsx
<Button variant="outline" onClick={() => setShowInstructions(!show)}>
  Show Instructions
</Button>
```

**Classes**: `btn-outline` → `border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500`

---

## 📏 Sizes

### Small (sm)

**Purpose**: Compact buttons, tight spaces

**Visual**: Smaller padding, smaller text

**Example**:
```tsx
<Button size="sm">Small</Button>
```

**Classes**: `px-4 py-2 text-sm`

---

### Medium (md)

**Purpose**: Default button size

**Visual**: Standard padding and text size

**Example**:
```tsx
<Button size="md">Medium</Button>
# or just <Button>Medium</Button>
```

**Classes**: `px-6 py-3 text-base`

---

### Large (lg)

**Purpose**: Prominent buttons, important actions

**Visual**: Larger padding, larger text

**Example**:
```tsx
<Button size="lg">Large</Button>
```

**Classes**: `px-8 py-4 text-lg`

---

## 🎭 States

### Normal State

**Visual**: Standard appearance based on variant

**Behavior**: Clickable, triggers onClick

**Example**:
```tsx
<Button onClick={handleClick}>Normal</Button>
```

---

### Disabled State

**Visual**: Reduced opacity (50%), cursor: not-allowed

**Behavior**: Not clickable, onClick not triggered

**Trigger**: `disabled={true}` or `isLoading={true}`

**Example**:
```tsx
<Button disabled onClick={handleClick}>
  Disabled
</Button>
```

---

### Loading State

**Visual**: 
- Disabled appearance
- Loading spinner SVG on the left
- Original children text

**Behavior**: Not clickable, shows loading indicator

**Trigger**: `isLoading={true}`

**Example**:
```tsx
<Button isLoading onClick={handleAsync}>
  Loading...
</Button>
```

---

## ♿ Accessibility

### Keyboard Navigation

- ✅ **Focusable**: Button receives focus via Tab key
- ✅ **Clickable**: Can be activated via Space or Enter keys
- ✅ **Disabled Handling**: Disabled buttons are not focusable

### Screen Reader Support

- ✅ **ARIA Attributes**: Supports `aria-label` for custom labels
- ✅ **Disabled State**: `aria-disabled` attribute set when disabled
- ✅ **Semantic HTML**: Uses native `<button>` element

### Focus States

- ✅ **Visible Focus**: Custom focus ring styling
- ✅ **Consistent**: Same focus style across all variants
- ✅ **Accessible**: Meets WCAG contrast requirements

**Focus Classes**: `focus:outline-none focus:ring-2 focus:ring-offset-2`

---

## 🔧 Implementation Details

### File: `/src/components/Button.tsx`

```typescript
import React from 'react';
import type { ButtonProps } from '@/types';

/**
 * Reusable Button component with consistent styling and accessibility
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    outline: 'btn-outline',
  };

  // Disabled state
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      className={`btn ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      data-testid="button"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.823 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
```

### Styling

The Button component uses **Tailwind CSS** for styling. Base styles are defined in `/src/styles/globals.css`:

```css
/* Base button styles */
.btn {
  @apply inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium 
         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500;
}

.btn-danger {
  @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.btn-outline {
  @apply btn border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500;
}
```

---

## 🧪 Testing

### Test File: `/tests/components/Button.test.tsx`

**Total Tests**: 19

**Test Coverage**:
- ✅ Rendering with children
- ✅ All variant styles
- ✅ All size styles
- ✅ Disabled state
- ✅ Loading state
- ✅ Loading spinner display
- ✅ Custom className
- ✅ Type attribute
- ✅ aria-label
- ✅ onClick handler
- ✅ Disabled click prevention
- ✅ Test ID

**Example Test**:
```typescript
it('should render with children', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});

it('should be disabled when disabled prop is true', () => {
  render(<Button disabled>Disabled</Button>);
  const button = screen.getByRole('button');
  expect(button).toBeDisabled();
});

it('should call onClick when clicked', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Clickable</Button>);
  const button = screen.getByRole('button');
  button.click();
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## 📊 Usage Examples

### Basic Usage

```tsx
import { Button } from '@/components';

function MyComponent() {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <Button onClick={handleClick}>
      Click Me
    </Button>
  );
}
```

### With All Props

```tsx
<Button
  variant="primary"
  size="lg"
  disabled={false}
  isLoading={false}
  onClick={handleClick}
  type="button"
  className="my-4"
  aria-label="Primary action"
>
  Complete Button
</Button>
```

### Loading Button

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAsync = async () => {
  setIsLoading(true);
  try {
    await doSomethingAsync();
  } finally {
    setIsLoading(false);
  }
};

return (
  <Button isLoading={isLoading} onClick={handleAsync}>
    Save
  </Button>
);
```

### Disabled Button

```tsx
<Button disabled onClick={handleClick}>
  Cannot Click
</Button>
```

---

## 🔌 Integration

### Dependencies

| Dependency | Purpose | Location |
|------------|---------|----------|
| React | UI library | External |
| ButtonProps | Type definition | `@/types` |

### Consumers

The Button component is used by:
- `App.tsx` (main application)
- All other components that need buttons

### Exports

The component is exported from:
- `/src/components/Button.tsx` (default export)
- `/src/components/index.ts` (named export)

**Import Paths**:
```typescript
// Default import
import Button from '@/components/Button';

// Named import
import { Button } from '@/components';
```

---

## ⚡ Performance

### Rendering

- **Re-renders**: Only when props change
- **Memoization**: Not memoized (props are primitive, memoization not needed)
- **Bundle Size**: ~2 KB (including SVG)

### Accessibility

- **Keyboard**: ✅ Full support
- **Screen Reader**: ✅ Full support
- **Focus**: ✅ Visible and consistent
- **Contrast**: ✅ Meets WCAG 2.1 AA

---

## 🛡️ Error Handling

The Button component handles errors gracefully:

- **Invalid Props**: TypeScript prevents invalid prop types at compile time
- **Missing onClick**: Button is still rendered, just doesn't do anything
- **Disabled State**: Prevents clicks when disabled or loading

---

## 📝 Best Practices

### When to Use

✅ **Use Button component when**:
- You need a clickable interactive element
- You want consistent styling
- You need accessibility features
- You want reusable code

### When Not to Use

❌ **Don't use Button component when**:
- You need a link (use `<a>` or Link component)
- You need a form submit without JavaScript (use native `<button type="submit">`)
- You need custom behavior that doesn't fit the Button pattern

### Styling Tips

- Use the built-in variants for consistency
- Add custom classes via `className` prop for additional styling
- Don't override the base button styles unless necessary

---

## 🔄 Modification Risks

### Safe to Modify

- Adding new variants (update `variantClasses`)
- Adding new sizes (update `sizeClasses`)
- Adjusting padding or spacing
- Changing colors (via Tailwind config)

### Risky to Modify

- Changing the base button structure
- Removing accessibility attributes
- Changing the disabled behavior
- Modifying the loading spinner

### Do Not Modify

- The native `<button>` element
- The `data-testid` attribute (used by tests)
- The `aria-disabled` attribute (accessibility)

---

## 📚 Related Documentation

- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Project structure
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture overview
- [types/index.ts](/src/types/index.ts) - ButtonProps type definition
- [TESTING.md](../TESTING.md) - Testing strategy
- [ACCESSIBILITY.md](../ACCESSIBILITY.md) - Accessibility features
