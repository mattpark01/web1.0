"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Loader2, ArrowUp } from 'lucide-react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface CommandChatProps {
  initialMessage?: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  onClose: () => void;
}

export function CommandChat({ initialMessage, messages, onMessagesChange, onClose }: CommandChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only process initial message once when component mounts
    if (initialMessage && !hasInitialized.current) {
      hasInitialized.current = true;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: initialMessage,
        timestamp: new Date(),
      };
      
      onMessagesChange(prev => [...prev, userMsg]);
      
      // Start streaming agent response
      startAgentResponse(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Global escape key handler
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Auto-focus the input when component mounts with a small delay to ensure rendering is complete
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Also select any existing text for easy replacement
        inputRef.current.select();
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const startAgentResponse = async (message: string) => {
    try {
      setIsLoading(true);
      
      const assistantId = (Date.now() + 1).toString();
      
      // Add empty assistant message
      const assistantMsg: ChatMessage = {
        id: assistantId,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      
      onMessagesChange(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      
      // Use the local API proxy route
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('spatio_api_key') : null;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          message: message,
          model: 'claude-3-5-sonnet-20241022',
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let currentContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onMessagesChange(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                return;
              }
              
              try {
                const chunk = JSON.parse(data);
                if (chunk.choices && chunk.choices[0]?.delta?.content) {
                  const content = chunk.choices[0].delta.content;
                  currentContent += content;
                  onMessagesChange(prev => prev.map(msg => 
                    msg.id === assistantId 
                      ? { ...msg, content: currentContent }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Mark streaming as complete
      onMessagesChange(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error getting agent response:', error);
      setIsLoading(false);
      
      // Show error message instead of mock
      const assistantId = (Date.now() + 1).toString();
      
      const assistantMsg: ChatMessage = {
        id: assistantId,
        type: 'assistant',
        content: `Failed to connect to agent service. Please try again later.`,
        timestamp: new Date(),
        isStreaming: false,
      };
      
      onMessagesChange(prev => {
        const hasAssistant = prev.find(m => m.id === assistantId);
        return hasAssistant
          ? prev.map(msg => 
              msg.id === assistantId 
                ? { ...msg, content: assistantMsg.content, isStreaming: false }
                : msg
            )
          : [...prev, assistantMsg];
      });
    }
  };

  const sendNewMessage = async (message: string) => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    setNewMessage('');
    
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    onMessagesChange(prev => [...prev, userMsg]);
    
    // Get agent response
    await startAgentResponse(message);
    setIsSending(false);
    
    // Re-focus the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = () => {
    sendNewMessage(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] text-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto rounded-lg px-3 py-2'
                    : 'text-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                  )}
                </div>
              </div>
              
              {message.type === 'user' && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
      </div>
      
      {/* Message Input */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-3 py-2 bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <ArrowUp className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}