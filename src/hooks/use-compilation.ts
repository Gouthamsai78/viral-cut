import { transform } from 'sucrase';
import React, { useMemo } from 'react';
import * as Remotion from 'remotion';
import { extractPropsFromCode, type ExtractedProperty } from './extract-props';

export type { ExtractedProperty } from './extract-props';

export interface CompilationResult {
  Component: React.ComponentType | null;
  error: string | null;
  /** Extracted editable properties from the TSX source code */
  extractedProps: ExtractedProperty[];
  /** The composition config (duration, fps, dimensions) */
  compositionConfig: Record<string, unknown> | null;
}

/**
 * Runtime compilation hook for dynamic Remotion TSX code.
 *
 * Uses Sucrase's `imports` transform to convert ES modules to CommonJS,
 * then executes with a custom `require()` shim that maps module names
 * to real Remotion/React globals.
 *
 * This eliminates the need for regex-based import/export stripping,
 * handling multi-line imports, nested JSX, and complex structures reliably.
 */
export function useCompilation(code: string): CompilationResult {
  return useMemo(() => {
    if (!code?.trim()) return { Component: null, error: null, extractedProps: [], compositionConfig: null };

    try {
      // ── Step 1: Extract props from source code BEFORE transpilation ──
      const extractedProps = extractPropsFromCode(code);

      // ── Step 2: Transpile TSX → JS with imports transform ──
      // `imports` converts `import X from 'Y'` → `const X = require('Y')`
      const compiled = transform(code, {
        transforms: ['typescript', 'jsx', 'imports'],
        jsxRuntime: 'classic',
        production: false,
      });

      if (!compiled.code) {
        return { Component: null, error: 'Transpilation failed: no output', extractedProps, compositionConfig: null };
      }

      // ── Step 3: Custom require shim ──
      const mockRequire = (name: string) => {
        if (name === 'remotion') return Remotion;
        if (name === 'react') return React;
        throw new Error(`Module not found: "${name}". Only 'remotion' and 'react' imports are supported.`);
      };

      // ── Step 4: Execute with CommonJS module system ──
      const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
      const exportsObj = moduleObj.exports;

      new Function(
        'require',
        'module',
        'exports',
        'React',
        compiled.code
      )(mockRequire, moduleObj, exportsObj, React);

      // ── Step 5: Extract component and config ──
      const Component = exportsObj.default as React.ComponentType | undefined;
      const compositionConfig = exportsObj.compositionConfig;

      if (!Component || typeof Component !== 'function') {
        return {
          Component: null,
          error: !Component
            ? 'No default export found. Make sure your code has "export default ComponentName".'
            : `Default export is not a valid React component. Got: ${typeof Component}.`,
          extractedProps,
          compositionConfig: compositionConfig as Record<string, unknown> | null,
        };
      }

      return { Component, error: null, extractedProps, compositionConfig: compositionConfig as Record<string, unknown> | null };
    } catch (error) {
      console.error('Compilation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
      return {
        Component: null,
        error: `Compilation failed: ${errorMessage}\n\nMake sure your code:\n1. Has valid TypeScript/JSX syntax\n2. Uses only 'remotion' and 'react' imports\n3. Has "export default ComponentName"`,
        extractedProps: [],
        compositionConfig: null,
      };
    }
  }, [code]);
}
