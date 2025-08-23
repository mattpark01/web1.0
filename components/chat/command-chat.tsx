"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2, ArrowUp } from 'lucide-react';
import { useAgentAPI, AgentStreamUpdate } from '@/lib/agent-api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface CommandChatProps {
  userMessage: string;
  onClose: () => void;
}

export function CommandChat({ userMessage, onClose }: CommandChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agentAPI = useAgentAPI();

  useEffect(() => {
    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages([userMsg]);
    
    // Start streaming agent response
    startAgentResponse(userMessage);
  }, [userMessage]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

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
      
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      
      // Try to get a default agent or use a fallback
      let agentId = 'general-assistant'; // Default agent
      
      try {
        const agents = await agentAPI.getAgents();
        if (agents.length > 0) {
          agentId = agents[0].agentId || agents[0].id;
        }
      } catch (agentError) {
        console.warn('Could not fetch agents, using default:', agentError);
      }
      
      // Start streaming response
      const stream = await agentAPI.streamAgentExecution({
        agentId,
        goal: message,
        stream: true,
      });
      
      const reader = stream.getReader();
      let currentContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const update: AgentStreamUpdate = value;
          
          // Handle different types of updates
          switch (update.type) {
            case 'response':
            case 'step_complete':
            case 'completed':
              if (update.message) {
                currentContent = update.message;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, content: currentContent }
                    : msg
                ));
              }
              break;
              
            case 'error':
              currentContent = `Error: ${update.message}`;
              setMessages(prev => prev.map(msg => 
                msg.id === assistantId 
                  ? { ...msg, content: currentContent, isStreaming: false }
                  : msg
              ));
              return;
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error getting agent response:', error);
      
      // Fallback to mock response if agent-runtime is not available
      const mockResponse = "I understand you're asking about: " + message + ". Let me help you with that. (Note: Agent runtime not available, showing mock response)";
      
      const assistantId = (Date.now() + 1).toString();
      
      // Add mock response message
      const assistantMsg: ChatMessage = {
        id: assistantId,
        type: 'assistant',
        content: mockResponse,
        timestamp: new Date(),
        isStreaming: false,
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
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
    
    setMessages(prev => [...prev, userMsg]);
    
    // Get agent response
    await startAgentResponse(message);
    setIsSending(false);
  };

  const handleSendMessage = () => {
    sendNewMessage(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              {message.type === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted text-foreground'
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
        
        {isLoading && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t bg-background p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
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