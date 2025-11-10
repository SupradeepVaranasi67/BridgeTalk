
import { StyleSheet, FlatList, TouchableOpacity, Platform, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from '@expo/vector-icons';
import { ThemedView } from './components/themed-view';
import { ThemedText } from './components/themed-text';
import { useThemeColor } from './hooks/use-theme-color';

const features = [
  { name: "Text Translation", icon: "language", route: "/text" },
  { name: "OCR Translation", icon: "camera", route: "/ocr" },
  { name: "My Translations", icon: "history", route: "/translator" },
  { name: "Settings", icon: "cog", route: "/settings" },
];

export default function Index() {
  const { width } = useWindowDimensions();
  const iconColor = useThemeColor({}, 'text'); // Use main text color for high contrast

  const numColumns = width > 768 ? 4 : 2;
  const cardWidth = width > 768 ? 200 : (width / 2) - 30;

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => router.push(item.route)}>
      <ThemedView colorName="card" style={[styles.card, { width: cardWidth }]}>
        <FontAwesome5 name={item.icon as any} size={40} color={iconColor} />
        <ThemedText style={styles.cardText}>{item.name}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>BridgeTalk</ThemedText>
      <View style={styles.listContainer}>
        <FlatList
          data={features}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.list}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 50 },
  title: { marginBottom: 30 },
  listContainer: {
    width: '100%',
    maxWidth: 1000,
    alignItems: 'center',
  },
  list: { justifyContent: 'center' },
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
