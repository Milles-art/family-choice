/**
 * React 18's runtime rejects the camelCase `fetchPriority` prop (added in
 * React 19), so we pass the standard lowercase `fetchpriority` attribute —
 * but the React 18 type definitions don't declare it. Augment them here so
 * the attribute type-checks and still reaches the DOM.
 */
import 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
