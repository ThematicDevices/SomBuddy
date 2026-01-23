import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWines, useApiKey, useToast } from '../contexts';
import { ChatMessage } from '../types';
import { getSommelierRecommendation, storage } from '../utils';
import { Send, Wine, Loader2, Key, Trash2, Sparkles } from 'lucide-react';
import { Modal } from '../components';

const EXAMPLE_QUERIES = [
  "What should I drink with rack of lamb tonight?",
  "What wines are ready to drink now?",
  "I want something under $50 that pairs with seafood",
  "What's a good wine for a special occasion?",
  "Tell me about my Bordeaux wines",
];

export function Sommelier() {
  const { wines } = useWines();
  const { apiKey, setApiKey, isConfigured } = useApiKey();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const history = storage.getChatHistory();
    if (history.length > 0) {
      setMessages(history as ChatMessage[]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      storage.saveChatHistory(messages);
    }
  }, [messages]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setShowApiKeyModal(false);
      showToast('API key saved successfully', 'success');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await getSommelierRecommendation(
        apiKey,
        userMessage.content,
        wines,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Sommelier error:', error);
      showToast('Failed to get response. Please check your API key.', 'error');

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please check your API key in settings and try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setMessages([]);
    storage.clearChatHistory();
    showToast('Chat history cleared', 'info');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold-500" />
            Your Sommelier
          </h1>
          <p className="text-charcoal-500">
            Ask for wine recommendations from your collection
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-charcoal-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-wine-50 rounded-full flex items-center justify-center mb-4">
                <Wine className="w-8 h-8 text-wine-600" />
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900 mb-2">
                Welcome! How can I help you today?
              </h2>
              <p className="text-charcoal-500 max-w-md mb-6">
                I'm your personal sommelier. Ask me about wine pairings, what to drink tonight,
                or get recommendations from your {wines.length} bottle collection.
              </p>

              {!isConfigured && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                  <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                    <Key className="w-4 h-4" />
                    API Key Required
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    To use the sommelier, you need to configure your Claude API key.
                  </p>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                  >
                    Configure API Key
                  </button>
                </div>
              )}

              <div className="w-full max-w-lg">
                <p className="text-xs font-medium text-charcoal-400 uppercase tracking-wider mb-3">
                  Try asking
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_QUERIES.map((query, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(query)}
                      className="px-3 py-2 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-700 rounded-lg text-sm transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-wine-900 text-white'
                        : 'bg-charcoal-50 text-charcoal-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-wine-200' : 'text-charcoal-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-charcoal-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-wine-600 animate-spin" />
                    <span className="text-sm text-charcoal-600">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-charcoal-100">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about wine pairings, recommendations..."
              rows={1}
              className="flex-1 px-4 py-3 border border-charcoal-200 rounded-xl resize-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-wine-900 text-white rounded-xl hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {wines.length === 0 && (
            <p className="mt-2 text-xs text-charcoal-500 text-center">
              Your collection is empty.{' '}
              <Link to="/add" className="text-wine-700 hover:underline">
                Add some wines
              </Link>{' '}
              to get personalized recommendations.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Configure Claude API Key"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-charcoal-600">
            To use the sommelier, you need to provide your Claude API key.
            This key is stored locally in your browser and is never sent to any server except Anthropic's API.
          </p>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Claude API Key
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            />
          </div>

          <p className="text-xs text-charcoal-500">
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wine-700 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveApiKey}
              disabled={!tempApiKey.trim()}
              className="px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Save API Key
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
