/**
 * Global JSX namespace bridge.
 *
 * React 19 moved the JSX namespace from the global scope to `React.JSX`, so
 * `JSX.Element` in a return type no longer resolves by default. Declaring the
 * minimal global surface here keeps component signatures readable
 * (`(): JSX.Element`) without importing `React` into every file or repeating
 * `React.JSX.Element` in dozens of places.
 *
 * Only `Element` is declared because that is the single member this codebase
 * uses; extend this file if a future component needs another member.
 */

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
  }
}
