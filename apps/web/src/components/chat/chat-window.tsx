'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';
import { MessageBubble, type Message } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { ChatInput } from './chat-input';
import { Sparkles } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  streamingContent?: string;
  examplePrompts?: string[];
  onExampleClick?: (prompt: string) => void;
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  streamingContent,
  examplePrompts = [],
  onExampleClick,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll on new messages or streaming content
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Also scroll when loading starts (typing indicator appears)
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  const hasMessages = messages.length > 0 || streamingContent;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Messages Area - fixed container with overflow scroll */}
      <div 
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4"
      >
        {hasMessages ? (
          <div className="flex min-h-full flex-col justify-end">
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                  }}
                />
              )}

              {/* Typing indicator */}
              {isLoading && !streamingContent && <TypingIndicator />}
            </div>
            {/* Invisible anchor element at the bottom */}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty state with example prompts */
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              What would you like to build?
            </h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Describe your app idea and I&apos;ll help you create a detailed
              specification. Then we&apos;ll build it together!
            </p>

            {examplePrompts.length > 0 && (
              <div className="grid max-w-lg gap-2 sm:grid-cols-2">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onExampleClick?.(prompt)}
                    className="rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="shrink-0 border-t p-4">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
