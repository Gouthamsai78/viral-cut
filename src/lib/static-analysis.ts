/**
 * Static analysis utilities for AI-generated TSX code.
 * Detects dangerous patterns before code execution in the browser.
 */

/**
 * Dangerous patterns that could cause security issues or browser abuse.
 */
const DANGEROUS_PATTERNS = [
  // Network access
  { pattern: /\bfetch\s*\(/gi, name: 'fetch() call', severity: 'high' as const },
  { pattern: /\bXMLHttpRequest\b/gi, name: 'XMLHttpRequest', severity: 'high' as const },
  { pattern: /\bWebSocket\b/gi, name: 'WebSocket', severity: 'high' as const },
  { pattern: /\bnavigator\.sendBeacon\b/gi, name: 'navigator.sendBeacon', severity: 'high' as const },
  
  // DOM access that could leak data
  { pattern: /\bdocument\.cookie\b/gi, name: 'document.cookie access', severity: 'high' as const },
  { pattern: /\blocalStorage\b/gi, name: 'localStorage access', severity: 'medium' as const },
  { pattern: /\bsessionStorage\b/gi, name: 'sessionStorage access', severity: 'medium' as const },
  { pattern: /\bdocument\.location\b/gi, name: 'document.location access', severity: 'high' as const },
  { pattern: /\bwindow\.location\b/gi, name: 'window.location access', severity: 'high' as const },
  
  // Code execution
  { pattern: /\beval\s*\(/gi, name: 'eval() call', severity: 'critical' as const },
  { pattern: /\bnew\s+Function\s*\(/gi, name: 'new Function() constructor', severity: 'critical' as const },
  { pattern: /\bsetTimeout\s*\(/gi, name: 'setTimeout() call', severity: 'medium' as const },
  { pattern: /\bsetInterval\s*\(/gi, name: 'setInterval() call', severity: 'medium' as const },
  
  // React hooks (forbidden in Remotion)
  { pattern: /\buseState\s*\(/gi, name: 'useState() hook', severity: 'high' as const },
  { pattern: /\buseEffect\s*\(/gi, name: 'useEffect() hook', severity: 'high' as const },
  { pattern: /\buseContext\s*\(/gi, name: 'useContext() hook', severity: 'medium' as const },
  { pattern: /\buseRef\s*\(/gi, name: 'useRef() hook', severity: 'low' as const },
  
  // Dangerous DOM manipulation
  { pattern: /\binnerHTML\s*=/gi, name: 'innerHTML assignment', severity: 'high' as const },
  { pattern: /\bdangerouslySetInnerHTML\b/gi, name: 'dangerouslySetInnerHTML', severity: 'critical' as const },
  { pattern: /\bdocument\.write\s*\(/gi, name: 'document.write() call', severity: 'critical' as const },
  
  // External resource loading
  { 
    pattern: /src\s*=\s*["']https?:\/\/(?!.*\.blob\.vercel-storage\.com\/|.*vercel-storage\.com\/)[^"']*["']/gi, 
    name: 'External URL in src attribute (non-Vercel Blob)', 
    severity: 'medium' as const 
  },
  { pattern: /href\s*=\s*["']https?:\/\//gi, name: 'External URL in href attribute', severity: 'low' as const },
  
  // Infinite loop patterns
  { pattern: /\bwhile\s*\(\s*true\s*\)/gi, name: 'while(true) infinite loop', severity: 'critical' as const },
  { pattern: /\bfor\s*\(\s*;\s*;\s*\)/gi, name: 'for(;;) infinite loop', severity: 'critical' as const },
] as const;

/**
 * Result of static analysis on TSX code.
 */
export interface StaticAnalysisResult {
  /** Whether the code is safe to execute */
  isSafe: boolean;
  /** List of detected issues */
  issues: Array<{
    name: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    /** Line number where the issue was found (if detectable) */
    line?: number;
  }>;
}

/**
 * Perform static analysis on TSX code to detect dangerous patterns.
 * 
 * @param code The TSX code to analyze
 * @returns Analysis result with any detected issues
 */
export function analyzeTSXCode(code: string): StaticAnalysisResult {
  const issues: StaticAnalysisResult['issues'] = [];

  for (const { pattern, name, severity } of DANGEROUS_PATTERNS) {
    const matches = code.match(pattern);
    if (matches) {
      // Try to find line number of first match
      const matchIndex = code.search(pattern);
      let lineNumber: number | undefined;
      
      if (matchIndex !== -1) {
        const lines = code.substring(0, matchIndex).split('\n');
        lineNumber = lines.length;
      }

      issues.push({ name, severity, line: lineNumber });
    }
  }

  // Check for import statements from forbidden packages
  const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(code)) !== null) {
    const packageName = match[1];
    
    // Only allow imports from 'react' and 'remotion'
    if (!packageName.startsWith('react') && !packageName.startsWith('remotion')) {
      issues.push({
        name: `Forbidden import: ${packageName}`,
        severity: 'high',
      });
    }
  }

  return {
    isSafe: issues.length === 0,
    issues,
  };
}

/**
 * Validates TSX code and throws an error if dangerous patterns are found.
 * 
 * @param code The TSX code to validate
 * @throws Error if code contains dangerous patterns
 */
export function validateTSXCode(code: string): void {
  const result = analyzeTSXCode(code);
  
  if (!result.isSafe) {
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    const highIssues = result.issues.filter(i => i.severity === 'high');
    
    const errorMessages: string[] = [];
    
    if (criticalIssues.length > 0) {
      errorMessages.push('Critical security issues detected:');
      errorMessages.push(...criticalIssues.map(i => `  - ${i.name}`));
    }
    
    if (highIssues.length > 0) {
      errorMessages.push('High-risk patterns detected:');
      errorMessages.push(...highIssues.map(i => `  - ${i.name}`));
    }
    
    throw new Error(errorMessages.join('\n'));
  }
}
