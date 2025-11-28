
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { ThemedText } from "./components/themed-text";
import { ThemedView } from "./components/themed-view";
import { useThemeColor } from "./hooks/use-theme-color";
import { getSupportedLanguages, translateText } from "./services/engines/google";
import { addToFavorites, addToHistory, Translation } from "./services/storage";

import { useThemedAlert } from "./hooks/use-themed-alert";

export default function TextTranslateScreen() {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const [input, setInput] = useState("");
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(false);
  const [langLoading, setLangLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [languages, setLanguages] = useState<{ language: string; name: string }[]>([]);

  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const inputBackgroundColor = useThemeColor({}, 'input');
  const cardColor = useThemeColor({}, 'card');

  const { showAlert, themedAlertElement } = useThemedAlert();

  useEffect(() => {
    async function loadLanguages() {
      try {
        const langs = await getSupportedLanguages();
        setLanguages(langs);
      } catch (err) {
        console.error("Failed to load languages", err);
      } finally {
        setLangLoading(false);
      }
    }
    loadLanguages();
  }, []);

  async function handleTranslate() {
    if (!input.trim()) return;
    setLoading(true);
    setCurrentTranslation(null);
    setIsFavorited(false);
    try {
      const result = await translateText(input, targetLang, sourceLang);
      const newTranslation: Translation = {
        id: Date.now().toString(),
        sourceText: input,
        translatedText: result,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        type: 'text',
      };
      setCurrentTranslation(newTranslation);
      await addToHistory(newTranslation);
    } catch (err: any) {
      console.error(err);
      showAlert("Error", "Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToFavorites() {
    if (!currentTranslation) return;
    await addToFavorites(currentTranslation);
    setIsFavorited(true);
    showAlert("Success", "Added to favorites!");
  }

  if (langLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 10 }}>Loading languages...</ThemedText>
      </ThemedView>
    );
  }

  const inputSection = (
    <View style={styles.inputSection}>
      <View style={styles.pickerContainer}>
        <View style={[styles.pickerWrapper, { backgroundColor: inputBackgroundColor, overflow: 'hidden' }]}>
          <ThemedText style={styles.label}>From:</ThemedText>
          <Picker
            selectedValue={sourceLang}
            onValueChange={(val) => setSourceLang(val)}
            style={[styles.picker, { backgroundColor: 'transparent', color: textColor }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Auto Detect" value="auto" color={textColor} style={{ backgroundColor: inputBackgroundColor }} />
            {languages.map((lang) => (
              <Picker.Item key={lang.language} label={lang.name} value={lang.language} color={textColor} style={{ backgroundColor: inputBackgroundColor }} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerWrapper, { backgroundColor: inputBackgroundColor, overflow: 'hidden' }]}>
          <ThemedText style={styles.label}>To:</ThemedText>
          <Picker
            selectedValue={targetLang}
            onValueChange={(val) => setTargetLang(val)}
            style={[styles.picker, { backgroundColor: 'transparent', color: textColor }]}
            dropdownIconColor={textColor}
          >
            {languages.map((lang) => (
              <Picker.Item key={lang.language} label={lang.name} value={lang.language} color={textColor} style={{ backgroundColor: inputBackgroundColor }} />
            ))}
          </Picker>
        </View>
      </View>
      <TextInput style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor }]} placeholder="Enter text" placeholderTextColor="#888" value={input} onChangeText={setInput} multiline />
      <TouchableOpacity style={[styles.translateButton, { backgroundColor: primaryColor }]} onPress={handleTranslate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.translateButtonText}>Translate</ThemedText>}
      </TouchableOpacity>
    </View>
  );
  const outputSection = currentTranslation && (
    <ThemedView style={[styles.outputContainer, { backgroundColor: cardColor }]}>
      <ThemedText style={styles.output}>{currentTranslation.translatedText}</ThemedText>
      <TouchableOpacity onPress={handleAddToFavorites} style={styles.favoriteButton} disabled={isFavorited}>
        <FontAwesome name={isFavorited ? "heart" : "heart-o"} size={24} color={isFavorited ? "#ff4c4c" : textColor} />
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {themedAlertElement}
      {isWideScreen ? (
        <View style={styles.horizontalContainer}>
          <View style={styles.column}>{inputSection}</View>
          <View style={[styles.column, { marginLeft: 20 }]}>{outputSection}</View>
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
  container: { flex: 1}, // Center content for web
  centered: { alignItems: 'center', justifyContent: 'center' },
  contentContainer: { padding: 16, width: '100%', flexGrow: 1, justifyContent: 'center' },
  horizontalContainer: { flexDirection: 'row', padding: 20, width: '100%', maxWidth: 1200, justifyContent: 'center' },
  column: { flex: 1, maxWidth: 500 },
  inputSection: { width: '100%' },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  pickerWrapper: { flex: 1, marginHorizontal: 4 },
  label: { marginBottom: 8, fontSize: 16 },
  picker: { borderRadius: 8, height: 50, borderWidth: 0, paddingHorizontal: 10 },
  input: { borderRadius: 8, padding: 16, fontSize: 18, minHeight: 150, textAlignVertical: 'top' },
  translateButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  translateButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  outputContainer: { marginTop: 24, padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 200 },
  output: { fontSize: 20, flex: 1 },
  favoriteButton: { paddingLeft: 16 },
});
