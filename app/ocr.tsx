// app/ocr.tsx
import React, { useState } from "react";
import { View, Text, Button, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { recognizeTextFromImage } from "../utils/ocr";

export default function OcrTranslateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setText("");  
    }
  };

  const handleRecognizeText = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const resultText = await recognizeTextFromImage(imageUri);
      setText(resultText || "No text found.");
    } catch (err) {
      setText("OCR failed. Check logs.");
    }
    setLoading(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Pick Image" onPress={pickImage} />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: 300, resizeMode: "contain", marginTop: 20 }}
        />
      )}

      <Button
        title="Recognize Text"
        onPress={handleRecognizeText}
        disabled={!imageUri || loading}
      />

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {text !== "" && (
        <Text style={{ marginTop: 20, fontSize: 16 }}>{text}</Text>
      )}
    </View>
  );
}
