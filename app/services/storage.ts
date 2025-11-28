import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "translation_history";
const FAVORITES_KEY = "translation_favorites";
const CONVERSATION_KEY = "conversation_history";
const CONVERSATION_FAVORITES_KEY = "conversation_favorites";

export type TranslationType = 'text' | 'speech' | 'ocr';

export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  type: TranslationType;
  audioUri?: string;
}

export interface ConversationTurn {
  id: string;
  text: string;
  translation: string;
  originalLang: string;
  translatedLang: string;
  speaker: 'ask' | 'answer';
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  timestamp: number;
  sourceLang: string;
  targetLang: string;
  turns: ConversationTurn[];
}

// --- Generic Helpers ---

async function getItems<T>(key: string): Promise<T[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error(`Failed to fetch items for key ${key}`, e);
    return [];
  }
}

async function saveItems<T>(key: string, items: T[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`Failed to save items for key ${key}`, e);
  }
}

// --- History (Translations) ---

export const getHistory = async (): Promise<Translation[]> => {
  return getItems<Translation>(HISTORY_KEY);
};

export const addToHistory = async (item: Translation) => {
  const history = await getHistory();
  // Avoid duplicates if needed, or just prepend
  const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 100); 
  await saveItems(HISTORY_KEY, newHistory);
};

export const removeFromHistory = async (id: string) => {
  const history = await getHistory();
  const newHistory = history.filter(item => item.id !== id);
  await saveItems(HISTORY_KEY, newHistory);
};

export const clearHistory = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
  await AsyncStorage.removeItem(CONVERSATION_KEY);
};

// --- History (Conversations) ---

export const getConversationHistory = async (): Promise<ConversationSession[]> => {
  return getItems<ConversationSession>(CONVERSATION_KEY);
};

export const saveConversationSession = async (session: ConversationSession) => {
  const history = await getConversationHistory();
  const newHistory = [session, ...history];
  await saveItems(CONVERSATION_KEY, newHistory);
};

export const deleteConversationSession = async (id: string) => {
  const history = await getConversationHistory();
  const newHistory = history.filter(s => s.id !== id);
  await saveItems(CONVERSATION_KEY, newHistory);
};

// --- Favorites (Translations) ---

export const getFavorites = async (): Promise<Translation[]> => {
  return getItems<Translation>(FAVORITES_KEY);
};

export const addToFavorites = async (item: Translation) => {
  const favorites = await getFavorites();
  if (!favorites.find(f => f.id === item.id)) {
    const newFavorites = [item, ...favorites];
    await saveItems(FAVORITES_KEY, newFavorites);
  }
};

export const removeFromFavorites = async (id: string) => {
  const favorites = await getFavorites();
  const newFavorites = favorites.filter(item => item.id !== id);
  await saveItems(FAVORITES_KEY, newFavorites);
};

// --- Favorites (Conversations) ---

export const getConversationFavorites = async (): Promise<ConversationSession[]> => {
  return getItems<ConversationSession>(CONVERSATION_FAVORITES_KEY);
};

export const addConversationToFavorites = async (session: ConversationSession) => {
  const favorites = await getConversationFavorites();
  if (!favorites.find(f => f.id === session.id)) {
    const newFavorites = [session, ...favorites];
    await saveItems(CONVERSATION_FAVORITES_KEY, newFavorites);
  }
};

export const removeConversationFromFavorites = async (id: string) => {
  const favorites = await getConversationFavorites();
  const newFavorites = favorites.filter(s => s.id !== id);
  await saveItems(CONVERSATION_FAVORITES_KEY, newFavorites);
};


