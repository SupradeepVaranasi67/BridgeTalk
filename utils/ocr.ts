// utils/ocr.ts
import * as FileSystem from "expo-file-system/legacy";

const OCR_SPACE_API_KEY = "bc483a6f8188957"; 
const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

export async function recognizeTextFromImage(imageUri: string): Promise<string> {
  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare multipart form
    const formData = new FormData();
    formData.append("apikey", OCR_SPACE_API_KEY);
    formData.append("language", "eng");
    formData.append("base64Image", `data:image/jpg;base64,${base64}`);

    const response = await fetch(OCR_SPACE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const result = await response.json();

    if (!result || !result.ParsedResults || result.ParsedResults.length === 0) {
      return "";
    }

    return result.ParsedResults[0].ParsedText ?? "";
  } catch (error) {
    console.error("OCR.space error:", error);
    throw new Error("Failed to recognize text");
  }
}
