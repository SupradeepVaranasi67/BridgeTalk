import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColor } from '../hooks/use-theme-color';
import { translateText } from '../services/engines/google';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

const STATES_DATA = [
  { name: 'Telangana', langCode: 'te', langName: 'Telugu' },
  { name: 'Tamil Nadu', langCode: 'ta', langName: 'Tamil' },
  { name: 'Andhra Pradesh', langCode: 'te', langName: 'Telugu' },
  { name: 'Karnataka', langCode: 'kn', langName: 'Kannada' },
  { name: 'Kerala', langCode: 'ml', langName: 'Malayalam' },
  { name: 'Gujarat', langCode: 'gu', langName: 'Gujarati' },
  { name: 'Maharashtra', langCode: 'mr', langName: 'Marathi' },
];

const TOURIST_QUESTIONS = [
  "Where is the nearest bus station?",
  "How much does this cost?",
  "Can you suggest a good restaurant nearby?",
  "Where can I find a hotel?",
  "Please take me to this address.",
  "I need help.",
];

export default function RecommendationSystem() {
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState<{ name: string; langCode: string; langName: string } | null>(null);
  const [suggestions, setSuggestions] = useState<typeof STATES_DATA>([]);
  const [translations, setTranslations] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const inputBg = useThemeColor({}, 'input');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'tabIconDefault'); 

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 0) {
      const filtered = STATES_DATA.filter(state => 
        state.name.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectState = async (state: typeof STATES_DATA[0]) => {
    setSelectedState(state);
    setQuery(state.name);
    setSuggestions([]);
    setLoading(true);
    setTranslations({});
    setExpandedQuestion(null);

    try {
      const newTranslations: { [key: string]: string } = {};
      // Translate all questions in parallel
      await Promise.all(TOURIST_QUESTIONS.map(async (q) => {
        const translated = await translateText(q, state.langCode);
        newTranslations[q] = translated;
      }));
      setTranslations(newTranslations);
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: string) => {
    Speech.speak(text, { language: lang });
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Travel Assistant</ThemedText>
      <ThemedText style={styles.subtitle}>Select your current state for quick help</ThemedText>

      <View style={{ zIndex: 2000 }}> 
        <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
          <Ionicons name="search" size={20} color={textColor} style={{ marginRight: 8, opacity: 0.5 }} />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter state (e.g. Karnataka)"
            placeholderTextColor={placeholderColor}
            value={query}
            onChangeText={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={() => { setQuery(''); setSuggestions([]); setSelectedState(null); }}
              style={{ padding: 8 }}
            >
              <Ionicons name="close-circle" size={24} color={textColor} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          )}
        </View>

        {suggestions.length > 0 && !selectedState && (
          <View style={[styles.suggestionsList, { backgroundColor: cardColor, borderColor: borderColor }]}>
            {suggestions.map((item) => (
              <TouchableOpacity 
                key={item.name} 
                style={styles.suggestionItem}
                onPress={() => handleSelectState(item)}
              >
                <ThemedText>{item.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading && <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />}

      {selectedState && !loading && (
        <View style={styles.resultsContainer}>
          <ThemedText style={styles.langInfo}>
            Language: <ThemedText style={{ fontWeight: 'bold' }}>{selectedState.langName}</ThemedText>
          </ThemedText>
          
          {TOURIST_QUESTIONS.map((question, index) => (
            <View key={index} style={[styles.questionCard, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.questionText}>{question}</ThemedText>
              
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: 'rgba(150,150,150,0.1)' }]}
                  onPress={() => setExpandedQuestion(expandedQuestion === question ? null : question)}
                >
                  <Ionicons name="text" size={20} color={primaryColor} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: 'rgba(150,150,150,0.1)' }]}
                  onPress={() => handleSpeak(translations[question] || '', selectedState.langCode)}
                >
                  <Ionicons name="volume-high" size={20} color={primaryColor} />
                </TouchableOpacity>
              </View>

              {expandedQuestion === question && (
                <View style={[styles.translationBox, { backgroundColor: inputBg }]}>
                  <ThemedText style={styles.translationText}>{translations[question] || "Translating..."}</ThemedText>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 5, // Reduced padding to push to edges
    marginBottom: 20,
    zIndex: 100, 
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 5,
    zIndex: 101, 
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  suggestionsList: {
    position: 'absolute',
    top: 55, 
    left: 0,
    right: 0,
    zIndex: 3000, 
    borderWidth: 1,
    borderRadius: 8,
    elevation: 100, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  resultsContainer: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  langInfo: {
    width: '100%',
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.8,
  },
  questionCard: {
    width: '32%', // 3 columns
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    minHeight: 120, // Ensure consistent height
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 14, 
    fontWeight: '500',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  actionButton: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontWeight: '600',
    fontSize: 10,
    marginTop: 2,
  },
  translationBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    width: '100%',
  },
  translationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
