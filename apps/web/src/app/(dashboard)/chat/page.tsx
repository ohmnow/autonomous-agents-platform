'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatWindow, SpecPreview, SpecReviewPanel, type ComplexityTier } from '@/components/chat';
import { useChat, type ExtractedDescription } from '@/hooks/use-chat';
import { extractAppSpec, extractAppDescription } from '@/lib/utils/extract-spec';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertCircle, 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Save,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react';

/**
 * Chat Builder Page - Two-Stage Spec Generation (Database-Oriented)
 * 
 * All chat data is persisted to and loaded from the database.
 * URL query param `chatId` tracks the current chat session.
 * 
 * Stage 1: Discovery - Chat collects requirements and outputs an App Description
 * Stage 2: Expansion - System expands description into full XML app_spec
 * Stage 3: Review - User can review the spec and start the build
 */

type ChatStage = 'discovery' | 'expansion' | 'review';

const EXAMPLE_PROMPTS = [
  'Build a personal recipe organizer just for myself',
  'Create a task manager for my team of 8 people',
  'Make a SaaS product for small business invoicing',
  'Build a simple landing page for my portfolio',
];

interface ChatHistoryItem {
  id: string;
  title: string;
  updatedAt: string;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const urlChatId = searchParams.get('chatId');
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(urlChatId);
  const [showHistory, setShowHistory] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Stage management
  const [stage, setStage] = useState<ChatStage>('discovery');
  const [appDescription, setAppDescription] = useState<ExtractedDescription | null>(null);
  const [appSpec, setAppSpec] = useState<string>('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  
  // Complexity state
  const [complexityTier, setComplexityTier] = useState<ComplexityTier>('standard');
  const [targetFeatureCount, setTargetFeatureCount] = useState(80);
  const [complexityReasoning, setComplexityReasoning] = useState('');
  const [complexityInferred, setComplexityInferred] = useState(true);
  
  // Review gates state
  const [reviewGatesEnabled, setReviewGatesEnabled] = useState(false);

  // Track if we've initialized from URL
  const initializedRef = useRef(false);
  const lastSavedRef = useRef<string>('');
  
  // Use the chat hook (no localStorage)
  const { 
    messages, 
    isLoading, 
    streamingContent, 
    error, 
    sendMessage, 
    clearMessages, 
    setMessages,
    setSavedSpec,
    setSavedDescription,
  } = useChat({});

  // Debounced messages for auto-save
  const debouncedMessages = useDebounce(messages, 2000);

  // ==========================================================================
  // Database Operations
  // ==========================================================================

  // Save chat to database
  const saveChat = useCallback(async (options?: { forceNew?: boolean }) => {
    if (messages.length === 0) return null;
    
    const chatId = options?.forceNew ? null : currentChatId;
    
    setIsSaving(true);
    try {
      const method = chatId ? 'PATCH' : 'POST';
      const url = chatId ? `/api/chats/${chatId}` : '/api/chats';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          projectId,
          appSpec: appSpec || undefined,
          appDescription: appDescription?.description || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newChatId = data.chat.id;
        
        // Update URL with chatId if it's new
        if (!chatId || chatId !== newChatId) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('chatId', newChatId);
          router.replace(newUrl.pathname + newUrl.search, { scroll: false });
          setCurrentChatId(newChatId);
        }
        
        // Update the saved hash
        lastSavedRef.current = JSON.stringify({ messages, appSpec });
        
        return newChatId;
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
    } finally {
      setIsSaving(false);
    }
    return null;
  }, [messages, appSpec, appDescription, currentChatId, projectId, router]);

  // Load chat from database
  const loadChat = useCallback(async (chatId: string) => {
    setLoadingChat(true);
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        throw new Error('Chat not found');
      }
      
      const data = await response.json();
      const chatMessages = data.chat.messages || [];
      
      // Set messages
      setMessages(chatMessages);
      setCurrentChatId(chatId);
      
      // Check if chat has a linked appSpec
      if (data.chat.appSpec?.content) {
        const specContent = data.chat.appSpec.content;
        setAppSpec(specContent);
        setSavedSpec(specContent);
        
        // Try to restore description from messages
        for (let i = chatMessages.length - 1; i >= 0; i--) {
          const msg = chatMessages[i];
          if (msg.role === 'assistant') {
            const description = extractAppDescription(msg.content);
            if (description) {
              setAppDescription(description);
              setSavedDescription(description);
              setComplexityTier(description.complexity);
              setTargetFeatureCount(description.targetFeatures);
              setComplexityReasoning(description.reasoning);
              break;
            }
          }
        }
        
        setStage('review');
        lastSavedRef.current = JSON.stringify({ messages: chatMessages, appSpec: specContent });
        return;
      }
      
      // Extract from messages if no linked appSpec
      let foundSpec = false;
      let foundDescription: ExtractedDescription | null = null;
      
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        const msg = chatMessages[i];
        if (msg.role !== 'assistant') continue;
        
        if (!foundSpec) {
          const spec = extractAppSpec(msg.content);
          if (spec) {
            setAppSpec(spec);
            setSavedSpec(spec);
            setStage('review');
            foundSpec = true;
          }
        }
        
        if (!foundDescription) {
          const description = extractAppDescription(msg.content);
          if (description) {
            foundDescription = description;
          }
        }
        
        if (foundSpec || foundDescription) break;
      }
      
      // Restore description and trigger expansion if needed
      if (foundDescription) {
        setAppDescription(foundDescription);
        setSavedDescription(foundDescription);
        setComplexityTier(foundDescription.complexity);
        setTargetFeatureCount(foundDescription.targetFeatures);
        setComplexityReasoning(foundDescription.reasoning);
        
        if (!foundSpec) {
          // Need to expand
          setStage('expansion');
          expandToFullSpec(foundDescription);
        }
      }
      
      lastSavedRef.current = JSON.stringify({ messages: chatMessages, appSpec: foundSpec ? appSpec : '' });
      
    } catch (error) {
      console.error('Failed to load chat:', error);
      // Remove invalid chatId from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('chatId');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      setCurrentChatId(null);
    } finally {
      setLoadingChat(false);
    }
  }, [setMessages, setSavedSpec, setSavedDescription, router, appSpec]);

  // ==========================================================================
  // Expansion
  // ==========================================================================

  const expandToFullSpec = useCallback(async (description: ExtractedDescription) => {
    console.log('[Expand] Starting expansion for:', description.name);
    setIsExpanding(true);
    setStage('expansion');
    
    try {
      const response = await fetch('/api/expand-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appDescription: description.description,
          complexityTier: description.complexity,
          targetFeatureCount: description.targetFeatures,
        }),
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
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (!(e instanceof SyntaxError)) {
                throw e;
              }
            }
          }
        }
      }

      // Extract the spec
      const extractedSpec = extractAppSpec(fullContent);
      const specToUse = extractedSpec || fullContent;
      
      setAppSpec(specToUse);
      setSavedSpec(specToUse);
      setStage('review');
      
      // Auto-save after expansion completes
      // We'll trigger this via effect
      
    } catch (err) {
      console.error('Expansion error:', err);
      setStage('review');
    } finally {
      setIsExpanding(false);
    }
  }, [setSavedSpec]);

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const url = projectId 
          ? `/api/chats?projectId=${projectId}&limit=50` 
          : '/api/chats?limit=50';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setChatHistory(data.chats || []);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [projectId]);

  // Load chat from URL on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    if (urlChatId) {
      loadChat(urlChatId);
    }
  }, [urlChatId, loadChat]);

  // Auto-save when messages change (debounced)
  useEffect(() => {
    if (debouncedMessages.length === 0) return;
    
    // Check if anything changed since last save
    const currentHash = JSON.stringify({ messages: debouncedMessages, appSpec });
    if (currentHash === lastSavedRef.current) return;
    
    // Auto-save
    saveChat();
  }, [debouncedMessages, appSpec, saveChat]);

  // Handle description extraction from chat hook
  useEffect(() => {
    // Listen for description in the last assistant message
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;
    
    const description = extractAppDescription(lastAssistantMsg.content);
    if (description) {
      // Check if this is a new or updated description
      const isNewDescription = !appDescription;
      const isUpdatedDescription = appDescription && (
        description.name !== appDescription.name ||
        description.description !== appDescription.description
      );
      
      if (isNewDescription || isUpdatedDescription) {
        setAppDescription(description);
        setSavedDescription(description);
        setComplexityTier(description.complexity);
        setTargetFeatureCount(description.targetFeatures);
        setComplexityReasoning(description.reasoning);
        setComplexityInferred(true);
        
        // Trigger expansion for new or updated descriptions
        expandToFullSpec(description);
      }
    }
  }, [messages, appDescription, setSavedDescription, expandToFullSpec]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleComplexityAdjust = (tier: ComplexityTier, features: number) => {
    setComplexityTier(tier);
    setTargetFeatureCount(features);
    setComplexityInferred(false);
    
    if (appDescription) {
      const updatedDescription = {
        ...appDescription,
        complexity: tier,
        targetFeatures: features,
      };
      expandToFullSpec(updatedDescription);
    }
  };

  const handleLoadChat = async (chatId: string) => {
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('chatId', chatId);
    router.push(newUrl.pathname + newUrl.search, { scroll: false });
    
    await loadChat(chatId);
  };

  const handleNewChat = () => {
    clearMessages();
    setAppSpec('');
    setAppDescription(null);
    setCurrentChatId(null);
    setStage('discovery');
    setComplexityTier('standard');
    setTargetFeatureCount(80);
    setComplexityReasoning('');
    setComplexityInferred(true);
    lastSavedRef.current = '';
    
    // Remove chatId from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('chatId');
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (response.ok) {
        setChatHistory(chatHistory.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleSpecChange = useCallback((newSpec: string) => {
    setAppSpec(newSpec);
  }, []);

  const handleSaveSpec = async () => {
    if (!appSpec) return;
    
    try {
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: appSpec,
          projectId,
          chatId: currentChatId,
          format: appSpec.includes('<project_specification>') ? 'xml' : 'markdown',
          appDescription: appDescription?.description,
        }),
      });

      if (response.ok) {
        // Refresh history
        const historyResponse = await fetch(
          projectId ? `/api/chats?projectId=${projectId}&limit=50` : '/api/chats?limit=50'
        );
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setChatHistory(historyData.chats || []);
        }
      }
    } catch (error) {
      console.error('Failed to save spec:', error);
    }
  };

  const handleBuild = async (useReviewGates?: boolean) => {
    if (!appSpec) return;

    setIsBuilding(true);

    try {
      // Ensure chat is saved first
      if (messages.length > 0) {
        await saveChat();
      }

      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appSpec,
          projectId,
          harnessId: 'coding',
          sandboxProvider: 'e2b',
          complexityTier,
          targetFeatureCount,
          complexityInferred,
          reviewGatesEnabled: useReviewGates ?? reviewGatesEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create build');
      }

      const data = await response.json();
      router.push(`/builds/${data.build.id}`);
    } catch (err) {
      console.error('Build error:', err);
      setIsBuilding(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleRegenerateSpec = () => {
    if (isLoading || isExpanding) return;
    
    if (appDescription) {
      expandToFullSpec(appDescription);
    } else {
      sendMessage('Please regenerate the complete app specification with all sections.');
    }
  };

  const handleManualSave = async () => {
    await saveChat();
    // Refresh history
    const historyResponse = await fetch(
      projectId ? `/api/chats?projectId=${projectId}&limit=50` : '/api/chats?limit=50'
    );
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      setChatHistory(historyData.chats || []);
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  const isSpecComplete = appSpec.length > 100;
  const showReviewPanel = stage === 'review' && appDescription;

  // Show loading state when loading chat from URL
  if (loadingChat) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4 overflow-hidden">
      {/* Chat History Sidebar */}
      <div 
        className={`${
          showHistory ? 'w-64' : 'w-0'
        } shrink-0 overflow-hidden transition-all duration-200`}
      >
        {showHistory && (
          <Card className="flex h-full flex-col">
            <CardHeader className="shrink-0 p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Chat History</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-7 w-7"
                  title="New Chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-2">
              <ScrollArea className="h-full">
                {loadingHistory ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                    ))}
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No chat history</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleLoadChat(chat.id)}
                        className={`group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent ${
                          currentChatId === chat.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Toggle sidebar button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowHistory(!showHistory)}
        className="absolute left-0 top-1/2 z-10 h-8 w-4 -translate-y-1/2 rounded-r-md rounded-l-none bg-muted"
      >
        {showHistory ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-3 flex shrink-0 items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat Builder</h1>
            <p className="text-muted-foreground">
              {stage === 'discovery' && 'Describe your app and I\'ll help you design it'}
              {stage === 'expansion' && 'Generating your app specification...'}
              {stage === 'review' && 'Review your specification and start building'}
            </p>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : currentChatId ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stage indicator */}
        {stage !== 'discovery' && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>
              {stage === 'expansion' && 'Stage 2: Expanding to full specification...'}
              {stage === 'review' && 'Ready for review'}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Card className="mb-3 shrink-0 border-destructive">
            <CardContent className="flex items-center gap-2 p-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-3">
          {/* Chat Window */}
          <Card className="flex min-h-0 flex-col overflow-hidden lg:col-span-2">
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <ChatWindow
                messages={messages}
                onSendMessage={sendMessage}
                isLoading={isLoading}
                streamingContent={streamingContent}
                examplePrompts={EXAMPLE_PROMPTS}
                onExampleClick={handleExampleClick}
              />
            </CardContent>
          </Card>

          {/* Right Panel - Spec Preview or Review Panel */}
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden lg:col-span-1">
            {showReviewPanel && appDescription ? (
              <SpecReviewPanel
                appName={appDescription.name}
                appDescription={appDescription.description}
                appSpec={appSpec || null}
                inferredComplexity={{
                  tier: appDescription.complexity,
                  features: appDescription.targetFeatures,
                  reasoning: complexityReasoning,
                }}
                isExpanding={isExpanding}
                onAdjustComplexity={handleComplexityAdjust}
                onViewSpec={() => {}}
                onStartBuild={handleBuild}
                onRegenerate={handleRegenerateSpec}
                isBuilding={isBuilding}
                reviewGatesEnabled={reviewGatesEnabled}
                onReviewGatesChange={setReviewGatesEnabled}
              />
            ) : (
              <>
                <SpecPreview
                  spec={appSpec}
                  onSpecChange={handleSpecChange}
                  onBuild={handleBuild}
                  isBuilding={isBuilding}
                  isComplete={isSpecComplete}
                />
                
                {/* Additional Actions */}
                {appSpec && (
                  <Card className="shrink-0">
                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveSpec}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save Spec
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRegenerateSpec}
                          disabled={isLoading || isExpanding}
                          className="gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${(isLoading || isExpanding) ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
