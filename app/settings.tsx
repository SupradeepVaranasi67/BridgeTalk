
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from './components/themed-view';
import { ThemedText } from './components/themed-text';
import { useTheme } from './context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

const THEME_OPTIONS = [
  { name: 'light', icon: 'sun-o' },
  { name: 'dark', icon: 'moon-o' },
  { name: 'system', icon: 'desktop' },
];

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Appearance</ThemedText>
      <ThemedText style={styles.subtitle}>Select your preferred theme</ThemedText>
      <View style={styles.optionsContainer}>
        {THEME_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.name}
            style={[
              styles.option,
              theme === option.name && styles.selectedOption,
            ]}
            onPress={() => setTheme(option.name as any)}
          >
            <FontAwesome
              name={option.icon as any}
              size={24}
              color={theme === option.name ? '#fff' : '#888'}
            />
            <ThemedText
              style={[
                styles.optionText,
                theme === option.name && styles.selectedOptionText,
              ]}
            >
              {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { marginBottom: 10 },
  subtitle: { marginBottom: 30, fontSize: 16, color: '#888' },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  option: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    width: 100,
  },
  selectedOption: { backgroundColor: '#6200ee', borderColor: '#6200ee' },
  optionText: { marginTop: 10, fontSize: 16 },
  selectedOptionText: { color: '#fff', fontWeight: 'bold' },
});
