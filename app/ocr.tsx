
import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { recognizeTextFromImage } from "./utils/ocr";
import { translateText } from "./services/engines/google";
import { addToHistory, addToFavorites, Translation } from "./services/storage";
import { FontAwesome } from "@expo/vector-icons";
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";
import { useThemeColor } from "./hooks/use-theme-color";

export default function OcrTranslateScreen() {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const [image, setImage] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');

  async function handlePickImage() {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
          return;
        }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setRecognizedText("");
      setCurrentTranslation(null);
      setIsFavorited(false);
    }
  }

  async function handleRecognizeText() {
    if (!image) return;
    setLoading(true);
    try {
      const text = await recognizeTextFromImage(image);
      setRecognizedText(text);
    } catch (error) {
      Alert.alert("Error", "Failed to recognize text from the image.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate() {
    if (!recognizedText) return;
    setLoading(true);
    setCurrentTranslation(null);
    setIsFavorited(false);
    try {
      const result = await translateText(recognizedText, "en", "auto");
      const newTranslation: Translation = {
        id: Date.now().toString(),
        sourceText: recognizedText,
        translatedText: result,
        sourceLang: "auto",
        targetLang: "en",
        timestamp: Date.now(),
      };
      setCurrentTranslation(newTranslation);
      await addToHistory(newTranslation);
    } catch (err) {
      Alert.alert("Error", "Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToFavorites() {
    if (!currentTranslation) return;
    await addToFavorites(currentTranslation);
    setIsFavorited(true);
    Alert.alert("Success", "Added to favorites!");
  }

  const inputSection = (
    <View style={styles.inputSection}>
      <TouchableOpacity onPress={handlePickImage}>
        <ThemedView colorName="input" style={styles.imagePicker}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <ThemedText>Select an Image</ThemedText>}
        </ThemedView>
      </TouchableOpacity>
      {image && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={handleRecognizeText} disabled={loading}>
          {loading && !recognizedText ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.actionButtonText}>Recognize Text</ThemedText>}
        </TouchableOpacity>
      )}
    </View>
  );

  const outputSection = (
    <View style={styles.outputSection}>
      {recognizedText ? (
        <ThemedView colorName="card" style={styles.recognizedContainer}>
          <ThemedText>{recognizedText}</ThemedText>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor, marginTop: 16 }]} onPress={handleTranslate} disabled={loading}>
            {loading && !currentTranslation ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.actionButtonText}>Translate</ThemedText>}
          </TouchableOpacity>
        </ThemedView>
      ) : null}
      {currentTranslation && (
        <ThemedView colorName="card" style={styles.outputContainer}>
          <ThemedText style={styles.output}>{currentTranslation.translatedText}</ThemedText>
          <TouchableOpacity onPress={handleAddToFavorites} style={styles.favoriteButton} disabled={isFavorited}>
            <FontAwesome name={isFavorited ? "heart" : "heart-o"} size={24} color={isFavorited ? "#ff4c4c" : textColor} />
          </TouchableOpacity>
        </ThemedView>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {isWideScreen ? (
        <View style={styles.horizontalContainer}>
          <View style={{ flex: 1 }}>{inputSection}</View>
          <View style={{ flex: 1, marginLeft: 20 }}>{outputSection}</View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {inputSection}
          {outputSection}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, alignItems: 'center' },
  horizontalContainer: { flexDirection: 'row', padding: 20 },
  inputSection: { flex: 1, width: '100%' },
  outputSection: { flex: 1, width: '100%' },
  imagePicker: { height: 200, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 16 },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  actionButton: { padding: 16, borderRadius: 8, alignItems: 'center', width: '100%' },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  recognizedContainer: { marginTop: 16, padding: 16, borderRadius: 8, width: '100%' },
  outputContainer: { marginTop: 16, padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  output: { fontSize: 20, flex: 1 },
  favoriteButton: { paddingLeft: 16 },
});
