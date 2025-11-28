// app/ocr.tsx
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { recognizeTextFromImage } from "../utils/ocr";
import { ThemedText } from "./components/themed-text";
import { ThemedView } from "./components/themed-view";
import { useThemeColor } from "./hooks/use-theme-color";
import { getSupportedLanguages, translateText } from "./services/engines/google";
import { addToHistory, addToFavorites, removeFromFavorites, Translation } from "./services/storage";
import { Ionicons } from "@expo/vector-icons";

import { useThemedAlert } from "./hooks/use-themed-alert";

export default function OcrTranslateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  const [targetLang, setTargetLang] = useState("en");
  const [languages, setLanguages] = useState<{ language: string; name: string }[]>([]);

  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const inputBackgroundColor = useThemeColor({}, 'input');

  const [isFavorite, setIsFavorite] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const { showAlert, themedAlertElement } = useThemedAlert();

  useEffect(() => {
    async function loadLanguages() {
      try {
        const langs = await getSupportedLanguages();
        setLanguages(langs);
      } catch (err) {
        console.error("Failed to load languages", err);
      }
    }
    loadLanguages();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setRecognizedText("");
      setTranslatedText("");
      setIsFavorite(false);
      setCurrentId(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      showAlert("Permission Required", "Permission to access camera is required!");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setRecognizedText("");
      setTranslatedText("");
      setIsFavorite(false);
      setCurrentId(null);
    }
  };

  const handleRecognizeText = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const resultText = await recognizeTextFromImage(imageUri);
      setRecognizedText(resultText || "No text found.");
    } catch (err) {
      setRecognizedText("OCR failed. Check logs.");
    }
    setLoading(false);
  };

  const handleTranslate = async () => {
    if (!recognizedText || recognizedText === "No text found." || recognizedText === "OCR failed. Check logs.") return;

    setTranslating(true);
    try {
      const result = await translateText(recognizedText, targetLang);
      setTranslatedText(result);
      
      const newId = Date.now().toString();
      setCurrentId(newId);
      setIsFavorite(false);

      // Save to history
      const newItem: Translation = {
        id: newId,
        sourceText: recognizedText,
        translatedText: result,
        sourceLang: "auto", // OCR usually doesn't give source lang
        targetLang: targetLang,
        timestamp: Date.now(),
        type: 'ocr',
      };
      await addToHistory(newItem);

    } catch (err) {
      showAlert("Error", "Translation failed.");
    } finally {
      setTranslating(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!recognizedText || !translatedText || !currentId) return;
    
    if (isFavorite) {
      await removeFromFavorites(currentId);
      setIsFavorite(false);
    } else {
      const item: Translation = {
        id: currentId,
        sourceText: recognizedText,
        translatedText: translatedText,
        sourceLang: "auto",
        targetLang: targetLang,
        timestamp: Date.now(),
        type: 'ocr',
      };
      await addToFavorites(item);
      setIsFavorite(true);
      showAlert("Success", "Added to favorites!");
    }
  };

  return (
    <ThemedView style={styles.container}>
      {themedAlertElement}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: cardColor }]} 
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={32} color={primaryColor} />
            <ThemedText style={styles.actionText}>Pick Image</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: cardColor }]} 
            onPress={takePhoto}
          >
            <Ionicons name="camera-outline" size={32} color={primaryColor} />
            <ThemedText style={styles.actionText}>Take Photo</ThemedText>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
          />
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.recognizeButton, 
              { backgroundColor: !imageUri || loading ? '#ccc' : '#6200ee' } // Distinct color (Purple-ish)
            ]}
            onPress={handleRecognizeText}
            disabled={!imageUri || loading}
          >
             {loading ? (
                <ActivityIndicator color="#fff" />
             ) : (
                <ThemedText style={styles.recognizeButtonText}>Recognize Text</ThemedText>
             )}
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />}

        {recognizedText !== "" && (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText style={styles.label}>Recognized Text:</ThemedText>
            <ThemedText style={styles.text}>{recognizedText}</ThemedText>
            
            <View style={styles.separator} />
            
            <ThemedText style={styles.label}>Translate to:</ThemedText>
            <View style={[styles.pickerWrapper, { backgroundColor: inputBackgroundColor, overflow: 'hidden' }]}>
              <Picker
                selectedValue={targetLang}
                onValueChange={(val) => setTargetLang(val)}
                style={{ color: textColor, backgroundColor: 'transparent' }}
                dropdownIconColor={textColor}
              >
                {languages.map((lang) => (
                  <Picker.Item key={lang.language} label={lang.name} value={lang.language} color={textColor} style={{ backgroundColor: inputBackgroundColor }} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity 
              style={[styles.translateButton, { backgroundColor: primaryColor }]} 
              onPress={handleTranslate}
              disabled={translating}
            >
              {translating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.translateButtonText}>Translate</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {translatedText !== "" && (
          <View style={[styles.card, { backgroundColor: cardColor, marginTop: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText style={styles.label}>Translation:</ThemedText>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity onPress={() => Speech.speak(translatedText, { language: targetLang })}>
                  <Ionicons name="volume-high" size={24} color={primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleFavorite}>
                  <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#ff4c4c" : primaryColor} />
                </TouchableOpacity>
              </View>
            </View>
            <ThemedText style={styles.text}>{translatedText}</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  image: { width: "100%", height: 300, resizeMode: "contain", marginTop: 20, borderRadius: 10 },
  buttonContainer: { marginTop: 20 },
  card: { padding: 15, borderRadius: 10, marginTop: 20 },
  label: { fontSize: 14, opacity: 0.7, marginBottom: 5 },
  text: { fontSize: 16 },
  separator: { height: 1, backgroundColor: '#ccc', marginVertical: 15, opacity: 0.3 },
  pickerWrapper: { borderRadius: 8, overflow: 'hidden', marginBottom: 15 },
  translateButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  translateButtonText: { color: '#fff', fontWeight: 'bold' },
  imageActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 15 },
  actionCard: {
    flex: 1,
    padding: 30, // Increased padding
    minHeight: 180, // Fixed minimum height to match home screen cards
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionText: {
    marginTop: 12,
    fontWeight: '700',
    fontSize: 16,
  },
  recognizeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  recognizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
