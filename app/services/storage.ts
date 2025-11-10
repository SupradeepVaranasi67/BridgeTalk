
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "translation_history";
const FAVORITES_KEY = "translation_favorites";

export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export const getHistory = async (): Promise<Translation[]> => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
};

export const addToHistory = async (translation: Translation): Promise<void> => {
  try {
    const history = await getHistory();
    const newHistory = [translation, ...history.filter(item => item.id !== translation.id)].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("Error adding to history:", error);
  }
};

export const getFavorites = async (): Promise<Translation[]> => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
};

export const addToFavorites = async (translation: Translation): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.find(item => item.id === translation.id)) {
      const newFavorites = [translation, ...favorites];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
  }
};

export const removeFromFavorites = async (translationId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const newFavorites = favorites.filter(item => item.id !== translationId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  } catch (error) {
    console.error("Error removing from favorites:", error);
  }
};
