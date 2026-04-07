'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatEditorProps {
  currentCode: string;
  onCodeUpdate: (newCode: string, explanation: string) => void;
}

// Quick action suggestions
const QUICK_ACTIONS = [
  'Change the text to something more engaging',
  'Make the colors brighter and more vibrant',
  'Add a countdown timer at the end',
  'Make the animation slower and smoother',
  'Change the background to dark mode',
  'Add more visual effects',
];

export function ChatEditor({ currentCode, onCodeUpdate }: ChatEditorProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/editor-chat',
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Watch for tool results containing modified code
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    for (const part of lastMessage.parts) {
      if (part.type === 'tool-modifyCode') {
        // In v6, tool parts have output property when result is available
        if ('output' in part && part.output) {
          const output = part.output as { explanation?: string; tsxCode?: string };
          if (output?.tsxCode) {
            onCodeUpdate(output.tsxCode, output.explanation || 'Code updated');
          }
        }
      }
    }
  }, [messages, onCodeUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    sendMessage({ text: action });
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-ghost">
        <Wand2 className="w-4 h-4 text-primary-dim" />
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">
          AI Editor
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.filter((m) => m.role === 'user' || m.role === 'assistant').length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-primary-dim mx-auto mb-3" />
            <p className="text-sm text-text-muted mb-4">
              Ask me to modify your video. Try things like:
            </p>
            <div className="space-y-2">
              {QUICK_ACTIONS.slice(0, 3).map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="w-full text-left text-xs text-text-secondary glass rounded-lg px-3 py-2 hover:border-primary/30 transition-colors"
                  disabled={isLoading}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  message.role === 'user'
                    ? 'bg-primary/20 text-primary-dim rounded-br-md'
                    : 'glass rounded-bl-md'
                )}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                          {part.text}
                        </div>
                      );
                    case 'tool-modifyCode':
                      if ('output' in part && part.output) {
                        const output = part.output as { explanation?: string };
                        return (
                          <div key={`${message.id}-${i}`} className="flex items-center gap-2 text-xs text-accent-green">
                            <Sparkles className="w-3 h-3" />
                            <span>{output?.explanation || 'Code updated'}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={`${message.id}-${i}`} className="flex items-center gap-2 text-xs text-text-muted">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Modifying code...</span>
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-bl-md rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-accent-red/10 border border-accent-red/20">
          <p className="text-xs text-accent-red">{error.message}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border-ghost">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the changes you want..."
            className="flex-1 bg-surface-high text-text-primary text-sm rounded-xl px-4 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-primary/20 text-primary-dim hover:bg-primary/30 disabled:opacity-40 disabled:hover:bg-primary/20 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
