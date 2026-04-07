'use client';

import { useState, useMemo } from 'react';
import { extractPropsFromCode } from '@/hooks/extract-props';
import { cn } from '@/lib/utils';
import { Palette, Type, Hash, ToggleRight, Move, Clock, Check, X } from 'lucide-react';

interface PropertyEditorProps {
  /** Current TSX code string */
  code: string;
  /** Called when a property value is changed, receives the modified TSX code */
  onCodeChange: (newCode: string) => void;
  /** Called to apply all pending changes to the source code */
  onApplyChanges?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  color: Palette,
  text: Type,
  number: Hash,
  boolean: ToggleRight,
  position: Move,
  timing: Clock,
};

const CATEGORY_LABELS: Record<string, string> = {
  color: 'Colors',
  text: 'Text Content',
  number: 'Numbers',
  boolean: 'Toggles',
  position: 'Position',
  timing: 'Timing',
};

export function PropertyEditor({ code, onCodeChange }: PropertyEditorProps) {
  const [editedValues, setEditedValues] = useState<Record<string, string | number | boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Extract properties from the source code
  const extractedProps = useMemo(() => {
    if (!code?.trim()) return [];
    return extractPropsFromCode(code);
  }, [code]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof extractedProps> = {};
    for (const prop of extractedProps) {
      if (!groups[prop.category]) groups[prop.category] = [];
      groups[prop.category].push(prop);
    }
    return groups;
  }, [extractedProps]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applyChanges = () => {
    if (!code) return;

    let newCode = code;
    for (const [key, value] of Object.entries(editedValues)) {
      // Replace the value in the source code
      // Handle string values
      if (typeof value === 'string') {
        // Match patterns like key: "value" or key: 'value' or key: `value`
        const regex = new RegExp(
          `(${key}\\s*:\\s*)(?:"[^"]*"|'[^']*'|\\x60[^\\x60]*\\x60)`,
          'g'
        );
        newCode = newCode.replace(regex, `$1"${value}"`);
      }
      // Handle numeric values
      else if (typeof value === 'number') {
        const regex = new RegExp(`(${key}\\s*:\\s*)\\d+\\.?\\d*`, 'g');
        newCode = newCode.replace(regex, `$1${value}`);
      }
      // Handle boolean values
      else if (typeof value === 'boolean') {
        const regex = new RegExp(`(${key}\\s*:\\s*)(true|false)`, 'g');
        newCode = newCode.replace(regex, `$1${value}`);
      }
    }

    onCodeChange(newCode);
    setEditedValues({});
    setHasChanges(false);
  };

  const resetChanges = () => {
    setEditedValues({});
    setHasChanges(false);
  };

  if (extractedProps.length === 0) {
    return (
      <div className="flex flex-col h-[600px]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-ghost">
          <Palette className="w-4 h-4 text-primary-dim" />
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">
            Properties
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Palette className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">
              No editable properties found in the generated code.
            </p>
            <p className="text-xs text-text-muted mt-2">
              The AI should generate named constants (colors, text, sizes) for the property editor to detect them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-ghost">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary-dim" />
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">
            Properties
          </h3>
          <span className="text-xs text-text-muted">({extractedProps.length} found)</span>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-1">
            <button
              onClick={resetChanges}
              className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-accent-red transition-colors"
              title="Reset"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={applyChanges}
              className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-accent-green transition-colors"
              title="Apply changes to code"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Properties list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        {Object.entries(grouped).map(([category, props]) => {
          const Icon = CATEGORY_ICONS[category] || Hash;
          return (
            <div key={category}>
              <h4 className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                <Icon className="w-3.5 h-3.5" />
                {CATEGORY_LABELS[category]}
              </h4>
              <div className="space-y-2">
                {props.map((prop) => {
                  const currentValue = editedValues[prop.key] ?? prop.value;
                  return (
                    <div key={prop.key} className="glass rounded-xl p-3">
                      <label className="text-xs text-text-muted mb-1.5 block capitalize">
                        {prop.key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {prop.category === 'color' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={String(currentValue)}
                            onChange={(e) => handleChange(prop.key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={String(currentValue)}
                            onChange={(e) => handleChange(prop.key, e.target.value)}
                            className="flex-1 bg-surface-high text-text-primary text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      )}
                      {prop.category === 'boolean' && (
                        <button
                          onClick={() => handleChange(prop.key, !currentValue)}
                          className={cn(
                            "w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            currentValue
                              ? "bg-primary/20 text-primary-dim"
                              : "bg-surface-high text-text-muted"
                          )}
                        >
                          {currentValue ? 'On' : 'Off'}
                        </button>
                      )}
                      {prop.category === 'text' && (
                        <input
                          type="text"
                          value={String(currentValue)}
                          onChange={(e) => handleChange(prop.key, e.target.value)}
                          className="w-full bg-surface-high text-text-primary text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      )}
                      {(prop.category === 'number' || prop.category === 'position' || prop.category === 'timing') && (
                        <input
                          type="number"
                          value={typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue : 0}
                          onChange={(e) => handleChange(prop.key, parseFloat(e.target.value) || 0)}
                          className="w-full bg-surface-high text-text-primary text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                          step={prop.category === 'timing' ? 0.1 : 1}
                        />
                      )}
                      {editedValues[prop.key] !== undefined && (
                        <div className="mt-1 text-[10px] text-primary-dim">
                          Original: {String(prop.value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply bar */}
      {hasChanges && (
        <div className="px-4 py-3 border-t border-border-ghost">
          <button
            onClick={applyChanges}
            className="w-full gradient-btn rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply {Object.keys(editedValues).length} change{Object.keys(editedValues).length !== 1 ? 's' : ''} to Code
          </button>
        </div>
      )}
    </div>
  );
}
