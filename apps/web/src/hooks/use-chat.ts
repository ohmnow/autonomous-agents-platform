'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/components/chat';
import { 
  extractAppSpec, 
  extractAppDescription,
  type ExtractedDescription,
} from '@/lib/utils/extract-spec';

interface UseChatOptions {
  onSpecExtracted?: (spec: string) => void;
  onDescriptionExtracted?: (description: ExtractedDescription) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setSavedSpec: (spec: string) => void;
  setSavedDescription: (description: ExtractedDescription | null) => void;
  savedSpec: string;
  savedDescription: ExtractedDescription | null;
}

/**
 * useChat hook - handles chat messaging and spec extraction
 * 
 * This hook is stateless regarding persistence - it only manages
 * the current chat session in memory. Persistence to database
 * should be handled by the parent component.
 */
export function useChat({ onSpecExtracted, onDescriptionExtracted }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedSpec, setSavedSpec] = useState('');
  const [savedDescription, setSavedDescription] = useState<ExtractedDescription | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');
      setError(null);

      try {
        // Prepare messages for API (without timestamps and ids)
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                } else if (data.type === 'done') {
                  // Message complete
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
                if (!(e instanceof SyntaxError)) {
                  throw e;
                }
              }
            }
          }
        }

        // Add the complete assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');

        // Check for app_description first (Stage 1: Discovery)
        const description = extractAppDescription(fullContent);
        if (description) {
          setSavedDescription(description);
          if (onDescriptionExtracted) {
            onDescriptionExtracted(description);
          }
        }
        
        // Also check for app_spec (Stage 2: Expansion or legacy flow)
        const spec = extractAppSpec(fullContent);
        if (spec) {
          setSavedSpec(spec);
          if (onSpecExtracted) {
            onSpecExtracted(spec);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, onSpecExtracted, onDescriptionExtracted]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    setSavedSpec('');
    setSavedDescription(null);
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
    setMessages,
    setSavedSpec,
    setSavedDescription,
    savedSpec,
    savedDescription,
  };
}

// Re-export type for consumers
export type { ExtractedDescription };
