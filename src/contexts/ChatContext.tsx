import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatMessage } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: ChatMessage) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

const MAX_MESSAGES = 100;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatHistory = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(MAX_MESSAGES);

      if (error) {
        console.error('Error fetching chat history:', error);
      } else {
        const chatMessages: ChatMessage[] = (data || []).map((row: any) => ({
          id: row.id,
          role: row.role as 'user' | 'assistant',
          content: row.content,
          timestamp: row.created_at,
        }));
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const addMessage = useCallback(async (message: ChatMessage) => {
    if (!user) return;

    // Optimistically add to local state
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Keep only the last MAX_MESSAGES
      if (newMessages.length > MAX_MESSAGES) {
        return newMessages.slice(-MAX_MESSAGES);
      }
      return newMessages;
    });

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          id: message.id,
          user_id: user.id,
          role: message.role,
          content: message.content,
          created_at: message.timestamp,
        });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    // Optimistically clear local state
    setMessages([]);

    // Delete from Supabase
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing chat history:', error);
        // Refetch to restore state if delete failed
        fetchChatHistory();
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      fetchChatHistory();
    }
  }, [user, fetchChatHistory]);

  const refreshHistory = useCallback(async () => {
    return fetchChatHistory();
  }, [fetchChatHistory]);

  return (
    <ChatContext.Provider value={{ messages, isLoading, addMessage, clearHistory, refreshHistory }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatProvider');
  }
  return context;
}
