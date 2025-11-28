import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './components/themed-text';
import { ThemedView } from './components/themed-view';
import { 
  getFavorites, 
  getConversationFavorites,
  removeFromFavorites, 
  removeConversationFromFavorites,
  Translation, 
  ConversationSession 
} from './services/storage';

import * as Speech from 'expo-speech';
import { useThemeColor } from './hooks/use-theme-color';
import { useThemedAlert } from "./hooks/use-themed-alert";

type FavoriteSection = {
  title: string;
  data: (Translation | ConversationSession)[];
  type: 'text' | 'speech-single' | 'speech-conversation' | 'ocr';
};

import { Picker } from "@react-native-picker/picker";

export default function FavoritesScreen() {
  const [sections, setSections] = useState<FavoriteSection[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'speech' | 'ocr'>('all');

  const iconColor = useThemeColor({}, 'text');
  const sectionHeaderColor = useThemeColor({}, 'card');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const { showAlert, themedAlertElement } = useThemedAlert();

  const loadFavorites = async () => {
    const favoriteItems = await getFavorites();
    const conversationFavorites = await getConversationFavorites();

    const textItems = favoriteItems.filter(item => item.type === 'text');
    const speechSingleItems = favoriteItems.filter(item => item.type === 'speech');
    const ocrItems = favoriteItems.filter(item => item.type === 'ocr');

    const newSections: FavoriteSection[] = [
      { title: 'Text Translations', data: textItems, type: 'text' as const },
      { title: 'Speech (Single)', data: speechSingleItems, type: 'speech-single' as const },
      { title: 'Speech (Conversations)', data: conversationFavorites, type: 'speech-conversation' as const },
      { title: 'OCR Translations', data: ocrItems, type: 'ocr' as const },
    ].filter(section => section.data.length > 0);

    setSections(newSections);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const filteredSections = sections.filter(section => {
    if (filterType === 'all') return true;
    if (filterType === 'text') return section.type === 'text';
    if (filterType === 'speech') return section.type === 'speech-single' || section.type === 'speech-conversation';
    if (filterType === 'ocr') return section.type === 'ocr';
    return true;
  });

  const handleRemoveFavorite = (item: Translation | ConversationSession, type: string) => {
    showAlert(
      'Remove Favorite',
      'Are you sure you want to remove this from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          style: 'destructive',
          onPress: async () => {
            if (type === 'speech-conversation') {
              await removeConversationFromFavorites(item.id);
            } else {
              await removeFromFavorites(item.id);
            }
            loadFavorites();
          }
        },
      ]
    );
  };

  const handleReplay = (text: string, lang: string) => {
    Speech.speak(text, { language: lang });
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

  const renderItem = ({ item, section }: { item: Translation | ConversationSession, section: FavoriteSection }) => {
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
            <TouchableOpacity onPress={() => handleRemoveFavorite(item, section.type)} style={styles.actionButton}>
              <FontAwesome name="heart" size={24} color="#ff4c4c" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      );
    }

    const translation = item as Translation;
    return (
      <ThemedView style={styles.itemContainer}>
        <ThemedView style={styles.textContainer}>
          <ThemedText style={styles.itemText}>{translation.sourceText} {'->'} {translation.translatedText}</ThemedText>
          <ThemedText style={styles.itemLang}>{translation.sourceLang} {'->'} {translation.targetLang}</ThemedText>
          <ThemedText style={styles.timestamp}>{formatDate(translation.timestamp)}</ThemedText>
        </ThemedView>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => handleReplay(translation.translatedText, translation.targetLang)} style={styles.actionButton}>
            <FontAwesome name="volume-up" size={20} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRemoveFavorite(item, section.type)} style={styles.actionButton}>
            <FontAwesome name="heart" size={24} color="#ff4c4c" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {themedAlertElement}
      
      <View style={{ margin: 16, borderWidth: 1, borderRadius: 8, borderColor: borderColor, backgroundColor: backgroundColor }}>
        <Picker
          selectedValue={filterType}
          onValueChange={(itemValue) => setFilterType(itemValue)}
          style={{ color: textColor, backgroundColor: backgroundColor }}
          dropdownIconColor={textColor}
        >
          <Picker.Item label="All Favorites" value="all" color={textColor} style={{ backgroundColor: backgroundColor }} />
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
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No favorites yet.</ThemedText>}
        stickySectionHeadersEnabled={true}
      />
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
  textContainer: { flex: 1, backgroundColor: 'transparent' },
  itemText: { fontSize: 16 },
  itemLang: { fontSize: 12, marginTop: 5 },
  timestamp: { fontSize: 10, marginTop: 4, opacity: 0.5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 5 },
});
