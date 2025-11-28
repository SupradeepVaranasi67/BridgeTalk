import { FontAwesome5 } from '@expo/vector-icons';
import { router } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View, ScrollView } from "react-native";
import { ThemedText } from './components/themed-text';
import { ThemedView } from './components/themed-view';
import { useThemeColor } from './hooks/use-theme-color';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';


const features: { name: string; icon: string; route: "/text" | "/ocr" | "/settings" | "/speech" }[] = [
  { name: "Text Translation", icon: "language", route: "/text" },
  { name: "Speech Translation", icon: "microphone", route: "/speech" },
  { name: "OCR Translation", icon: "camera", route: "/ocr" },
];

import { useTheme } from './context/ThemeContext';

import RecommendationSystem from './components/RecommendationSystem';

export default function Index() {
  const { width } = useWindowDimensions();
  const iconColor = useThemeColor({}, 'text'); // Use main text color for high contrast
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const cardWidth = width > 768 ? 200 : (width / 2) - 30;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            {theme === 'dark' ? (
              <AntDesign name="sun" size={24} color={iconColor} />
            ) : (
              <Feather name="moon" size={24} color={iconColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/favorites")} style={styles.iconButton}>
            <FontAwesome5 name="heart" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/history")} style={styles.iconButton}>
            <FontAwesome5 name="history" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ width: '100%', maxWidth: 1000 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ zIndex: 1000, marginBottom: 20, width: '100%' }}>
          <RecommendationSystem />
        </View>

        <View style={styles.featuresGrid}>
          {features.map((item) => (
            <TouchableOpacity key={item.name} onPress={() => router.push(item.route)}>
              <ThemedView colorName="card" style={[styles.card, { width: cardWidth }]}> 
                <FontAwesome5 name={item.icon as any} size={40} color={iconColor} />
                <ThemedText style={styles.cardText}>{item.name}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 50 },
  header: {
    width: '100%',
    maxWidth: 1000,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 20,
    zIndex: 2000, // Ensure header is on top
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    marginLeft: 5,
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    zIndex: 1,
  },
  card: {
    height: 180,
    borderRadius: 15,
    padding: 20,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }, // Enhanced web shadow
    }),
  },
  cardText: { fontSize: 18, marginTop: 15, textAlign: 'center' },
});
