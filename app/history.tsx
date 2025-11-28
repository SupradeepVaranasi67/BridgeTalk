import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Alert, SectionList, Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ThemedText } from './components/themed-text';
import { ThemedView } from './components/themed-view';
import { useThemeColor } from './hooks/use-theme-color';
import { 
  addToFavorites, 
  getFavorites, 
  getHistory, 
  getConversationHistory,
  removeFromFavorites, 
  removeFromHistory, 
  deleteConversationSession,
  addConversationToFavorites,
  removeConversationFromFavorites,
  Translation, 
  ConversationSession 
} from './services/storage';

type HistorySection = {
  title: string;
  data: (Translation | ConversationSession)[];
  type: 'text' | 'speech-single' | 'speech-conversation' | 'ocr';
};

import { Picker } from "@react-native-picker/picker";

export default function TranslationHistoryScreen() {
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'speech' | 'ocr'>('all');
  
  const iconColor = useThemeColor({}, 'text');
  const sectionHeaderColor = useThemeColor({}, 'card');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const loadData = async () => {
    const historyItems = await getHistory();
    const conversationItems = await getConversationHistory();
    const favs = await getFavorites();
    setFavorites(favs.map(f => f.id));

    const textItems = historyItems.filter(item => item.type === 'text');
    const speechSingleItems = historyItems.filter(item => item.type === 'speech');
    const ocrItems = historyItems.filter(item => item.type === 'ocr');

    const newSections: HistorySection[] = [
      { title: 'Text Translations', data: textItems, type: 'text' as const },
      { title: 'Speech (Single)', data: speechSingleItems, type: 'speech-single' as const },
      { title: 'Speech (Conversations)', data: conversationItems, type: 'speech-conversation' as const },
      { title: 'OCR Translations', data: ocrItems, type: 'ocr' as const },
    ].filter(section => section.data.length > 0);

    setSections(newSections);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredSections = sections.filter(section => {
    if (filterType === 'all') return true;
    if (filterType === 'text') return section.type === 'text';
    if (filterType === 'speech') return section.type === 'speech-single' || section.type === 'speech-conversation';
    if (filterType === 'ocr') return section.type === 'ocr';
    return true;
  });

  const clearHistory = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all history?')) {
        await AsyncStorage.removeItem('translation_history');
        await AsyncStorage.removeItem('conversation_history');
        loadData();
      }
    } else {
      Alert.alert(
        'Clear History',
        'Are you sure you want to clear all history?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: async () => {
            await AsyncStorage.removeItem('translation_history');
            await AsyncStorage.removeItem('conversation_history');
            loadData();
          }},
        ],
        { cancelable: false }
      );
    }
  };

  const handleDelete = async (item: Translation | ConversationSession, type: string) => {
    if (type === 'speech-conversation') {
      await deleteConversationSession(item.id);
    } else {
      await removeFromHistory(item.id);
    }
    loadData();
  };

  const handleReplay = (text: string, lang: string) => {
    Speech.speak(text, { language: lang });
  };

  const handleToggleFavorite = async (item: Translation | ConversationSession) => {
    const isFav = favorites.includes(item.id);
    
    if (isFav) {
      if ('turns' in item) {
        await removeConversationFromFavorites(item.id);
      } else {
        await removeFromFavorites(item.id);
      }
      setFavorites(prev => prev.filter(id => id !== item.id));
    } else {
      if ('turns' in item) {
        await addConversationToFavorites(item as ConversationSession);
      } else {
        await addToFavorites(item as Translation);
      }
      setFavorites(prev => [...prev, item.id]);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const renderItem = ({ item, section }: { item: Translation | ConversationSession, section: HistorySection }) => {
    if (section.type === 'speech-conversation') {
      const session = item as ConversationSession;
      return (
        <ThemedView style={styles.itemContainer}>
          <View style={styles.textContainer}>
            <ThemedText style={styles.itemText}>Conversation ({session.turns.length} turns)</ThemedText>
            <ThemedText style={styles.itemLang}>{session.sourceLang} {'<->'} {session.targetLang}</ThemedText>
            <ThemedText style={styles.timestamp}>{formatDate(session.timestamp)}</ThemedText>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={styles.actionButton}>
              <FontAwesome name={favorites.includes(item.id) ? "heart" : "heart-o"} size={20} color={favorites.includes(item.id) ? "#ff4c4c" : iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item, section.type)} style={styles.actionButton}>
              <FontAwesome name="trash" size={20} color="#ff4c4c" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      );
    }

    const translation = item as Translation;
    const isFavorite = favorites.includes(translation.id);

    return (
      <ThemedView style={styles.itemContainer}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.itemText}>{translation.sourceText} {'->'} {translation.translatedText}</ThemedText>
          <ThemedText style={styles.itemLang}>{translation.sourceLang} {'->'} {translation.targetLang}</ThemedText>
          <ThemedText style={styles.timestamp}>{formatDate(translation.timestamp)}</ThemedText>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => handleReplay(translation.translatedText, translation.targetLang)} style={styles.actionButton}>
            <FontAwesome name="volume-up" size={20} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleToggleFavorite(translation)} style={styles.actionButton}>
            <FontAwesome name={isFavorite ? "heart" : "heart-o"} size={20} color={isFavorite ? "#ff4c4c" : iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item, section.type)} style={styles.actionButton}>
            <FontAwesome name="trash" size={20} color="#ff4c4c" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ margin: 16, borderWidth: 1, borderRadius: 8, borderColor: borderColor, backgroundColor: backgroundColor }}>
        <Picker
          selectedValue={filterType}
          onValueChange={(itemValue) => setFilterType(itemValue)}
          style={{ color: textColor, backgroundColor: backgroundColor }}
          dropdownIconColor={textColor}
        >
          <Picker.Item label="All History" value="all" color={textColor} style={{ backgroundColor: backgroundColor }} />
          <Picker.Item label="Text Translations" value="text" color={textColor} style={{ backgroundColor: backgroundColor }} />
          <Picker.Item label="Speech Translations" value="speech" color={textColor} style={{ backgroundColor: backgroundColor }} />
          <Picker.Item label="OCR Translations" value="ocr" color={textColor} style={{ backgroundColor: backgroundColor }} />
        </Picker>
      </View>

      <SectionList
        sections={filteredSections}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.header, { backgroundColor: sectionHeaderColor }]}>
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          </View>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No history found.</ThemedText>}
        stickySectionHeadersEnabled={true}
      />
      {sections.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <ThemedText style={styles.clearButtonText}>Clear All History</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  header: {
    padding: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemContainer: {
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  textContainer: { flex: 1, marginRight: 10 },
  itemText: { fontSize: 16 },
  itemLang: { fontSize: 12, marginTop: 5, opacity: 0.7 },
  timestamp: { fontSize: 10, marginTop: 4, opacity: 0.5 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  clearButton: {
    backgroundColor: '#ff4c4c',
    padding: 15,
    margin: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
