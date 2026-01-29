import { useState, useRef, useEffect, useCallback } from 'react';
import { useWines, useToast, useChatHistory } from '../contexts';
import { getSommelierRecommendation } from '../utils';
import { ChatMessage } from '../types';
import { Send, Wine, Loader2, Trash2, User, Bot } from 'lucide-react';

export function Sommelier() {
  const { wines } = useWines();
  const { showToast } = useToast();
  const { messages, isLoading: isLoadingHistory, addMessage, clearHistory } = useChatHistory();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add message to context (persists to Supabase)
    await addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // Only include recent conversation history (last 10 messages) to reduce payload
      const recentMessages = messages.slice(-10);
      const conversationHistory = [
        ...recentMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: userMessage.role, content: userMessage.content },
      ];

      // Send only essential wine fields to reduce payload size
      const summarizedWines = wines.map(w => ({
        id: w.id,
        producer: w.producer,
        wineName: w.wineName,
        vintage: w.vintage,
        region: w.region,
        country: w.country,
        varietals: w.varietals?.slice(0, 3), // Limit varietals
        drinkingWindowStart: w.drinkingWindowStart,
        drinkingWindowEnd: w.drinkingWindowEnd,
        drinkingStatus: w.drinkingStatus,
        purchasePrice: w.purchasePrice,
        quantity: w.quantity,
      }));

      const response = await getSommelierRecommendation(
        userMessage.content,
        summarizedWines as typeof wines,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      // Add assistant message to context (persists to Supabase)
      await addMessage(assistantMessage);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to get response',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await clearHistory();
    showToast('Chat history cleared', 'info');
  };

  const quickQuestions = [
    "What wine should I open tonight?",
    "What's ready to drink from my cellar?",
    "Suggest a pairing for grilled steak",
    "What wines should I age longer?",
  ];

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-wine-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900">AI Sommelier</h1>
          <p className="text-charcoal-500">
            {wines.length > 0
              ? `Ask me about your ${wines.length} bottle collection`
              : 'Add some wines to get personalized recommendations'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-charcoal-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center mb-4">
                <Wine className="w-8 h-8 text-wine-700" />
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900 mb-2">
                Your Personal Sommelier
              </h2>
              <p className="text-charcoal-500 max-w-md mb-6">
                I know your entire wine collection. Ask me for recommendations,
                pairings, or advice on what to open tonight.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="text-left px-4 py-3 bg-charcoal-50 hover:bg-wine-50 rounded-lg text-sm text-charcoal-700 hover:text-wine-800 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-wine-100 text-wine-700'
                      : 'bg-charcoal-100 text-charcoal-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-wine-900 text-white rounded-br-md'
                      : 'bg-charcoal-100 text-charcoal-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-charcoal-600" />
              </div>
              <div className="px-4 py-3 bg-charcoal-100 rounded-2xl rounded-bl-md">
                <Loader2 className="w-5 h-5 text-charcoal-500 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-charcoal-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your wine collection..."
              className="flex-1 px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-wine-900 text-white rounded-xl hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
