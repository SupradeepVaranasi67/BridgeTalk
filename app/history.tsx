
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { getHistory, Translation } from './services/storage';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './components/themed-view';
import { ThemedText } from './components/themed-text';

export default function TranslationHistoryScreen() {
  const [history, setHistory] = useState<Translation[]>([]);

  const loadHistory = async () => {
    const hist = await getHistory();
    setHistory(hist);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const clearHistory = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to clear the translation history?');
      if (confirmed) {
        AsyncStorage.removeItem('translation_history').then(() => {
          setHistory([]);
        });
      }
    } else {
      Alert.alert(
        'Clear History',
        'Are you sure you want to clear the translation history?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: async () => {
            await AsyncStorage.removeItem('translation_history');
            setHistory([]);
          }},
        ],
        { cancelable: false }
      );
    }
  };

  const renderItem = ({ item }: { item: Translation }) => (
    <ThemedView style={styles.itemContainer}>
      <ThemedText style={styles.itemText}>{item.sourceText} -> {item.translatedText}</ThemedText>
      <ThemedText style={styles.itemLang}>{item.sourceLang} -> {item.targetLang}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No history yet.</ThemedText>}
      />
      {history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <ThemedText style={styles.clearButtonText}>Clear History</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  itemContainer: {
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  itemText: { fontSize: 16 },
  itemLang: { fontSize: 12, marginTop: 5 },
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
