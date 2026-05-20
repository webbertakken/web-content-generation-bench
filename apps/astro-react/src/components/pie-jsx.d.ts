/**
 * Minimal JSX declarations for the Pie web components we use. React 19 has
 * native custom-element support at runtime; this file only teaches TS the
 * tag names.
 *
 * We deliberately keep the prop types loose: web components accept attributes
 * as strings, so detailed typing would be overkill for the benchmark.
 */
import type {} from 'react';

type AnyAttrs = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'pie-modal': AnyAttrs;
      'pie-button': AnyAttrs;
      'pie-card-container': AnyAttrs;
      'pie-radio-group': AnyAttrs;
      'pie-radio': AnyAttrs;
      'is-land': AnyAttrs & { 'on:idle'?: string; 'on:visible'?: string; import?: string };
    }
  }
}
