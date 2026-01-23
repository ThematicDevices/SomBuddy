import { Wine } from '../types';

const WINE_STORAGE_KEY = 'sommelier_wine_catalog';
const API_KEY_STORAGE_KEY = 'sommelier_api_key';
const CHAT_HISTORY_KEY = 'sommelier_chat_history';

export const storage = {
  getWines: (): Wine[] => {
    try {
      const data = localStorage.getItem(WINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading wines from storage:', error);
      return [];
    }
  },

  saveWines: (wines: Wine[]): void => {
    try {
      localStorage.setItem(WINE_STORAGE_KEY, JSON.stringify(wines));
    } catch (error) {
      console.error('Error saving wines to storage:', error);
    }
  },

  addWine: (wine: Wine): Wine[] => {
    const wines = storage.getWines();
    wines.push(wine);
    storage.saveWines(wines);
    return wines;
  },

  updateWine: (updatedWine: Wine): Wine[] => {
    const wines = storage.getWines();
    const index = wines.findIndex(w => w.id === updatedWine.id);
    if (index !== -1) {
      wines[index] = { ...updatedWine, dateModified: new Date().toISOString() };
      storage.saveWines(wines);
    }
    return wines;
  },

  deleteWine: (wineId: string): Wine[] => {
    const wines = storage.getWines().filter(w => w.id !== wineId);
    storage.saveWines(wines);
    return wines;
  },

  getWineById: (wineId: string): Wine | undefined => {
    return storage.getWines().find(w => w.id === wineId);
  },

  getApiKey: (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  },

  setApiKey: (apiKey: string): void => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  },

  clearApiKey: (): void => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  },

  getChatHistory: (): { id: string; role: string; content: string; timestamp: string }[] => {
    try {
      const data = localStorage.getItem(CHAT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  },

  saveChatHistory: (messages: { id: string; role: string; content: string; timestamp: string }[]): void => {
    try {
      const recentMessages = messages.slice(-50);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(recentMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  },

  clearChatHistory: (): void => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  },

  exportData: (): string => {
    const data = {
      wines: storage.getWines(),
      chatHistory: storage.getChatHistory(),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (data.wines && Array.isArray(data.wines)) {
        storage.saveWines(data.wines);
      }
      if (data.chatHistory && Array.isArray(data.chatHistory)) {
        storage.saveChatHistory(data.chatHistory);
      }
      return { success: true, message: `Imported ${data.wines?.length || 0} wines successfully` };
    } catch (error) {
      return { success: false, message: 'Invalid import file format' };
    }
  },
};
