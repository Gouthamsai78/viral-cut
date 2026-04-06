import { transform } from 'sucrase';
import React, { useMemo } from 'react';
import * as Remotion from 'remotion';

interface CompilationResult {
  Component: React.ComponentType | null;
  error: string | null;
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
    if (!code?.trim()) return { Component: null, error: null };

    try {
      // ── Step 1: Transpile TSX → JS with imports transform ──
      // `imports` converts `import X from 'Y'` → `const X = require('Y')`
      const compiled = transform(code, {
        transforms: ['typescript', 'jsx', 'imports'],
        jsxRuntime: 'classic',
        production: false,
      });

      if (!compiled.code) {
        return { Component: null, error: 'Transpilation failed: no output' };
      }

      // ── Step 2: Custom require shim ──
      const mockRequire = (name: string) => {
        if (name === 'remotion') return Remotion;
        if (name === 'react') return React;
        throw new Error(`Module not found: "${name}". Only 'remotion' and 'react' imports are supported.`);
      };

      // ── Step 3: Execute with CommonJS module system ──
      const exports: Record<string, any> = {};
      const module = { exports };

      const executeCode = new Function(
        'require',
        'module',
        'exports',
        'React',
        compiled.code
      );

      executeCode(mockRequire, module, exports, React);

      // ── Step 4: Extract component and config ──
      const Component = exports.default || module.exports.default;
      const compositionConfig = exports.compositionConfig || module.exports.compositionConfig;

      if (!Component) {
        return {
          Component: null,
          error: 'No default export found. Make sure your code has "export default ComponentName".',
        };
      }

      if (typeof Component !== 'function') {
        return {
          Component: null,
          error: `Default export is not a valid React component. Got: ${typeof Component}.`,
        };
      }

      // Log config for debugging (optional)
      if (compositionConfig) {
        console.log('Composition config:', compositionConfig);
      }

      return { Component, error: null };
    } catch (error) {
      console.error('Compilation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
      return {
        Component: null,
        error: `Compilation failed: ${errorMessage}\n\nMake sure your code:\n1. Has valid TypeScript/JSX syntax\n2. Uses only 'remotion' and 'react' imports\n3. Has "export default ComponentName"`,
      };
    }
  }, [code]);
}
