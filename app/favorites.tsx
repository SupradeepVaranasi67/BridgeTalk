
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { getFavorites, Translation, removeFromFavorites } from './services/storage';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from "@expo/vector-icons";
import { ThemedView } from './components/themed-view';
import { ThemedText } from './components/themed-text';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Translation[]>([]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRemoveFavorite = (translationId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove this from favorites?');
      if (confirmed) {
        removeFromFavorites(translationId).then(() => {
          setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== translationId));
        });
      }
    } else {
      Alert.alert(
        'Remove Favorite',
        'Are you sure you want to remove this from favorites?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: async () => {
            await removeFromFavorites(translationId);
            setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== translationId));
          }},
        ],
        { cancelable: false }
      );
    }
  };

  const renderItem = ({ item }: { item: Translation }) => (
    <ThemedView style={styles.itemContainer}>
      <ThemedView style={styles.textContainer}>
        <ThemedText style={styles.itemText}>{item.sourceText} -> {item.translatedText}</ThemedText>
        <ThemedText style={styles.itemLang}>{item.sourceLang} -> {item.targetLang}</ThemedText>
      </ThemedView>
      <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)} style={styles.removeButton}>
        <FontAwesome name="trash" size={24} color="#ff4c4c" />
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No favorites yet.</ThemedText>}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: { flex: 1, backgroundColor: 'transparent' },
  itemText: { fontSize: 16 },
  itemLang: { fontSize: 12, marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  removeButton: { paddingLeft: 15 },
});
