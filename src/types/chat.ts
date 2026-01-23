export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  wineRecommendations?: string[];
}

export interface SommelierContext {
  messages: ChatMessage[];
  isLoading: boolean;
}
